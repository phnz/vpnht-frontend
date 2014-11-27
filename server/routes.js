'use strict';

// middleware
var StripeWebhook = require('stripe-webhook-middleware'),
isAuthenticated = require('./middleware/auth').isAuthenticated,
isUnauthenticated = require('./middleware/auth').isUnauthenticated,
setRender = require('middleware-responder').setRender,
setRedirect = require('middleware-responder').setRedirect,
stripeEvents = require('./middleware/stripe-events'),
secrets = require('./config/secrets');
// controllers
var users = require('./controllers/users-controller'),
main = require('./controllers/main-controller'),
dashboard = require('./controllers/dashboard-controller'),
passwords = require('./controllers/passwords-controller'),
registrations = require('./controllers/registrations-controller'),
sessions = require('./controllers/sessions-controller');

var User = require('./models/user');
var restify = require('restify');
var nodemailer = require('nodemailer');
var mailgunApiTransport = require('nodemailer-mailgunapi-transport');
var moment = require('moment');

var stripeWebhook = new StripeWebhook({
  stripeApiKey: secrets.stripeOptions.apiKey,
  respond: true
});

module.exports = function (app, passport) {

    app.all('*',function(req,res,next){
      if(req.headers['x-forwarded-proto'] !== 'https' && process.env.NODE_ENV === "production")
        res.redirect('https://vpn.ht'+req.url)
      else
        next()
    });

  // homepage and dashboard
  app.get('/',
    setRedirect({auth: '/dashboard'}),
    isUnauthenticated,
    setRender('index'),
    main.getHome);

app.get('/login',
  setRedirect({auth: '/dashboard'}),
  isUnauthenticated,
  setRender('login'),
  main.getHome);

  // sessions
  app.post('/login',
    setRedirect({auth: '/dashboard', success: '/dashboard', failure: '/login'}),
    isUnauthenticated,
    sessions.postLogin);
  app.get('/logout',
    setRedirect({auth: '/', success: '/'}),
    isAuthenticated,
    sessions.logout);

  // registrations
  app.get('/signup',
    setRedirect({auth: '/dashboard'}),
    isUnauthenticated,
    setRender('signup'),
    registrations.getSignup);
  app.post('/signup',
    setRedirect({auth: '/dashboard', success: '/dashboard', failure: '/signup'}),
    isUnauthenticated,
    registrations.postSignup);

  // forgot password
  app.get('/forgot',
    setRedirect({auth: '/dashboard'}),
    isUnauthenticated,
    setRender('forgot'),
    passwords.getForgotPassword);
  app.post('/forgot',
    setRedirect({auth: '/dashboard', success: '/forgot', failure: '/forgot'}),
    isUnauthenticated,
    passwords.postForgotPassword);

  // reset tokens
  app.get('/reset/:token',
    setRedirect({auth: '/dashboard', failure: '/forgot'}),
    isUnauthenticated,
    setRender('reset'),
    passwords.getToken);
  app.post('/reset/:token',
    setRedirect({auth: '/dashboard', success: '/dashboard', failure: 'back'}),
    isUnauthenticated,
    passwords.postToken);

  app.get('/dashboard',
    setRender('dashboard/index'),
    setRedirect({auth: '/'}),
    isAuthenticated,
    dashboard.getDefault);
  app.get('/billing',
    setRender('dashboard/billing'),
    setRedirect({auth: '/'}),
    isAuthenticated,
    dashboard.getBilling);
  app.get('/profile',
    setRender('dashboard/profile'),
    setRedirect({auth: '/'}),
    isAuthenticated,
    dashboard.getProfile);

app.get('/documentation',
  setRender('dashboard/documentation/list'),
  setRedirect({auth: '/'}),
  isAuthenticated,
  dashboard.getDocumentation);

app.get('/documentation/windows',
  setRender('dashboard/documentation/windows'),
  setRedirect({auth: '/'}),
  isAuthenticated,
  dashboard.getDocumentation);

app.get('/documentation/linux',
  setRender('dashboard/documentation/linux'),
  setRedirect({auth: '/'}),
  isAuthenticated,
  dashboard.getDocumentation);

app.get('/documentation/mac',
  setRender('dashboard/documentation/mac'),
  setRedirect({auth: '/'}),
  isAuthenticated,
  dashboard.getDocumentation);

app.get('/documentation/ios',
  setRender('dashboard/documentation/ios'),
  setRedirect({auth: '/'}),
  isAuthenticated,
  dashboard.getDocumentation);

  app.get('/documentation/android',
    setRender('dashboard/documentation/android'),
    setRedirect({auth: '/'}),
    isAuthenticated,
    dashboard.getDocumentation);

  // user api stuff
  app.post('/user',
    setRedirect({auth: '/', success: '/profile', failure: '/profile'}),
    isAuthenticated,
    users.postProfile);
  app.post('/user/billing',
    setRedirect({auth: '/', success: '/billing', failure: '/billing'}),
    isAuthenticated,
    users.postBilling);
app.post('/user/plan',
  setRedirect({auth: '/', success: '/billing', failure: '/billing'}),
  isAuthenticated,
  users.postPlan);
app.post('/user/coupon',
  setRedirect({auth: '/', success: '/billing', failure: '/billing'}),
  isAuthenticated,
  users.postCoupon);
  app.post('/user/password',
    setRedirect({auth: '/', success: '/profile', failure: '/profile'}),
    isAuthenticated,
    passwords.postNewPassword);
  app.post('/user/delete',
    setRedirect({auth: '/', success: '/'}),
    isAuthenticated,
    users.deleteAccount);

  // use this url to receive stripe webhook events
app.post('/stripe/events',
  stripeWebhook.middleware,
  stripeEvents
);

    app.post('/bitpay/events', function(req, res, next) {
        var obj = req.body;

        // 1 year access
        if (obj.status === 'complete' && obj.price === '39.99' && obj.posData.id) {

            User.findOne({
              'id': obj.posData
            }, function (err, user) {
              if (err) return next(err);
              if(!user){
                // user does not exist, no need to process
                return res.status(200).end();
              } else {

                  var t = moment().add(1, 'years');
                  var expiration = t.format("YYYY/MM/DD HH:mm:ss");
                  var client = restify.createStringClient({
                    url: secrets.vpnht.url,
                  });

                  client.basicAuth(secrets.vpnht.key, secrets.vpnht.secret);
                  client.put('/activate/' + user.username, { expiration: expiration }, function (err, req2, res2, obj) {

                      if (err) return next(err);

                      var transporter = nodemailer.createTransport(
                        mailgunApiTransport({
                          apiKey: secrets.mailgun.password,
                          domain: secrets.mailgun.user
                        }));

                      var mailOptions = {
                        to: user.email,
                        from: 'noreply@vpn.ht',
                        subject: 'VPN Account enabled',
                        text: 'You are receiving this email because your account has been activated till ' + expiration + '.\n\n' +
                          'You can read the documentation how to get started on:\n\n' +
                          'https://vpn.ht/documentation\n\n' +
                          'If you need help, feel free to contact us at support@vpn.ht.\n'
                      };
                      transporter.sendMail(mailOptions, function(err) {
                        if (err) return next(err);

                        user.stripe.plan = 'monthly';

                        user.save(function(err) {
                          if (err) return next(err);
                          console.log('user: ' + user.username + ' subscription was successfully updated and expire on ' + expiration);
                          return res.status(200).end();
                        });



                      });



                  });

              }
            });


        } else if (obj.status === 'complete' && obj.posData.id) {

            User.findOne({
              'id': obj.posData
            }, function (err, user) {
              if (err) return next(err);
              if(!user){
                // user does not exist, no need to process
                return res.status(200).end();
              } else {

                  var t = moment().add(1, 'months');
                  var expiration = t.format("YYYY/MM/DD HH:mm:ss");
                  var client = restify.createStringClient({
                    url: secrets.vpnht.url,
                  });

                  client.basicAuth(secrets.vpnht.key, secrets.vpnht.secret);
                  client.put('/activate/' + user.username, { expiration: expiration }, function (err, req2, res2, obj) {

                      if (err) return next(err);

                      var transporter = nodemailer.createTransport(
                        mailgunApiTransport({
                          apiKey: secrets.mailgun.password,
                          domain: secrets.mailgun.user
                        }));

                      var mailOptions = {
                        to: user.email,
                        from: 'noreply@vpn.ht',
                        subject: 'VPN Account enabled',
                        text: 'You are receiving this email because your account has been activated till ' + expiration + '.\n\n' +
                          'You can read the documentation how to get started on:\n\n' +
                          'https://vpn.ht/documentation\n\n' +
                          'If you need help, feel free to contact us at support@vpn.ht.\n'
                      };
                      transporter.sendMail(mailOptions, function(err) {
                        if (err) return next(err);

                        user.stripe.plan = 'monthly';

                        user.save(function(err) {
                          if (err) return next(err);
                          console.log('user: ' + user.username + ' subscription was successfully updated and expire on ' + expiration);
                          return res.status(200).end();
                        });



                      });



                  });

              }
            });

        } else {
            return res.status(200).end();
        }

    });

    // ovpn login
    app.post('/api/login', function(req, res, next) {

        var header=req.headers['authorization']||'',
        token=header.split(/\s+/).pop()||'',
        auth=new Buffer(token, 'base64').toString(),
        parts=auth.split(/:/),
        username=parts[0],
        password=parts[1];

        req.body.email = username;
        req.body.password = password;

        console.log(req.body);

        passport.authenticate('login', function(err, user, info) {

            if (err) { return next(err) }

            if (!user) {
                return res.send('FAIL');
            }

            req.logIn(user, function(err) {

                if (err) { return next(err); }

                // check if user is active
                if (user.stripe.plan != 'free') {
                    return res.send('OK');
                } else {
                    return res.send('FAIL');
                }
            });
        })(req, res, next);

    });
};
