var LocalStrategy = require('passport-local').Strategy;
var User = require('../models/user');

module.exports = function(passport){

  passport.serializeUser(function(user, done) {
    done(null, user.id);
  });

  passport.deserializeUser(function(id, done) {
    User.findById(id, function(err, user) {
      done(err, user);
    });
  });

  // login
  passport.use('login', new LocalStrategy({
      usernameField: 'username',
      passReqToCallback : true
    },
    function(req, username, password, done) {
      User.findOne({ 'username' :  username },
        function(err, user) {
          if (err) return done(err);
          if (!user){
            return done(null, false, req.flash('error', 'User not found'));
          }
          user.comparePassword(password, function(err, isMatch) {
            if (isMatch) {
              var time = 14 * 24 * 3600000;
              req.session.cookie.maxAge = time; //2 weeks
              req.session.cookie.expires = new Date(Date.now() + time);
              req.session.touch();
              return done(null, user, req.flash('success', 'Successfully logged in.'));
            } else {
              return done(null, false, req.flash('error', 'Invalid Password'));
            }
          });
        }
      );
    })
  );

  passport.use('signup', new LocalStrategy({
      usernameField: 'username',
      passReqToCallback : true
    },
    function(req, username, password, done) {
      var findOrCreateUser = function(){
        User.findOne({ username: req.body.username }, function(err, existingUser) {
          if (existingUser) {
            req.flash('form', {
              email: req.body.email
            });
            return done(null, false, req.flash('error', 'An account with that username already exists.'));
          }

          User.findOne({ email: req.body.email }, function(err, existingUser) {
            if (existingUser) {
              req.flash('form', {
                email: req.body.email
              });
              return done(null, false, req.flash('error', 'An account with that email address already exists.'));
            }

            var user = new User({
                email: req.body.email,
                username: req.body.username,
                password: req.body.password
            });

            user.save(function(err) {
                 if (err) return done(err, false, req.flash('error', 'Error... please contact us at support@vpn.ht'));
                var time = 14 * 24 * 3600000;
                req.session.cookie.maxAge = time; //2 weeks
                req.session.cookie.expires = new Date(Date.now() + time);
                req.session.touch();
                
                return done(null, user, req.flash('success', 'Thanks for signing up. Please select your package !'));
            });

          });
        });
      };

      process.nextTick(findOrCreateUser);

    })
  );
};
