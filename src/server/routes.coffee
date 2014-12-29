"use strict"

# middleware
StripeWebhook = require("stripe-webhook-middleware")
isAuthenticated = require("./middleware/auth").isAuthenticated
isStaff = require("./middleware/auth").isStaff
isUnauthenticated = require("./middleware/auth").isUnauthenticated
setRender = require("middleware-responder").setRender
setRedirect = require("middleware-responder").setRedirect
stripeEvents = require("./middleware/stripe-events")
secrets = require("./config/secrets")
api = require("./middleware/api")
txn = require("./middleware/txn")

# controllers
users = require("./controllers/users-controller")
main = require("./controllers/main-controller")
dashboard = require("./controllers/dashboard-controller")
staff = require("./controllers/staff-controller")
passwords = require("./controllers/passwords-controller")
registrations = require("./controllers/registrations-controller")
sessions = require("./controllers/sessions-controller")
User = require("./models/user")
restify = require("restify")
nodemailer = require("nodemailer")
mailgunApiTransport = require("nodemailer-mailgunapi-transport")
moment = require("moment")
stripeWebhook = new StripeWebhook(
    stripeApiKey: secrets.stripeOptions.apiKey
    respond: true
)
paypalIpn = require('paypal-ipn')
request = require('request');

module.exports = (app, passport) ->

    # homepage and dashboard
    app.get "/",
        setRedirect
            auth: "/dashboard",
        isUnauthenticated,
        setRender("index"),
        main.getHome

    # terms
    app.get "/terms",
        setRender("terms"),
        main.getHome

    # sessions
    app.get "/login",
        setRedirect
            auth: "/dashboard",
        isUnauthenticated,
        setRender("login"),
        main.getHome

    app.post "/login",
        setRedirect
            auth: "/dashboard",
            success: "/dashboard",
            failure: "/login",
        isUnauthenticated,
        sessions.postLogin

    app.get "/logout",
        setRedirect
            auth: "/",
            success: "/",
        isAuthenticated,
        sessions.logout

    # open vpn
    app.get "/openvpn/config",
        setRedirect
            auth: "/",
            success: "/",
        isAuthenticated,
        dashboard.getOpenvpn

    # registrations
    app.get "/signup",
        setRedirect
            auth: "/dashboard",
        isUnauthenticated,
        setRender('signup'),
        registrations.getSignup

    # PT special registrations
    app.get "/popcorntime",
        setRedirect
            auth: "/dashboard",
        isUnauthenticated,
        setRender('signup-popcorntime'),
        registrations.getSignupPT

    app.post "/popcorntime",
        setRedirect
            auth: "/dashboard",
            success: "/dashboard",
            failure: "/popcorntime",
        isUnauthenticated,
        registrations.postSignupPT

    # registrations
    app.post "/signup",
        setRedirect
            auth: "/dashboard",
            success: "/dashboard",
            failure: "/signup",
        isUnauthenticated,
        registrations.postSignup

    # forgot password
    app.get "/forgot",
        setRedirect
            auth: "/dashboard",
        isUnauthenticated,
        setRender("forgot"),
        passwords.getForgotPassword

    app.post "/forgot",
        setRedirect
            auth: "/dashboard",
            success: "/forgot",
            failure: "/forgot",
        isUnauthenticated,
        passwords.postForgotPassword

    # reset tokens
    app.get "/reset/:token",
        setRedirect
            auth: "/dashboard",
            failure: "/forgot",
        isUnauthenticated,
        setRender("reset"),
        passwords.getToken

    app.post "/reset/:token",
        setRedirect
            auth: "/dashboard",
            success: "/dashboard",
            failure: "back",
        isUnauthenticated,
        passwords.postToken

    #dashboard
    app.get "/dashboard",
        setRender("dashboard/profile"),
        setRedirect(auth: "/"),
        isAuthenticated,
        dashboard.getProfile

    app.get "/billing",
        setRender("dashboard/billing"),
        setRedirect(auth: "/"),
        isAuthenticated,
        dashboard.getBilling


    # documentation list
    app.get "/documentation",
        setRedirect
            auth: "/documentation/all/popcorntime"
        dashboard.getRedirect

    # documentations handler
    app.get "/documentation/:os/:protocol",
        (req, res, next) ->
            req.render = "dashboard/documentation/" +
                req.params.os + "-" + req.params.protocol;
            next()
        setRedirect({auth: '/login'} ),
        isAuthenticated,
        dashboard.getDocumentation

    # user actions (POST)
    app.post "/user",
        setRedirect
            auth: "/",
            success: "/dashboard",
            failure: "/dashboard",
        isAuthenticated,
        users.postProfile

    app.post "/user/billing",
        setRedirect
            auth: "/",
            success: "/billing",
            failure: "/billing",
        isAuthenticated,
        users.postBilling

    app.post "/user/plan",
        setRedirect
            auth: "/",
            success: "/billing",
            failure: "/billing",
        isAuthenticated, users.postPlan

    app.post "/user/pay",
        setRedirect
            auth: "/",
            success: "/billing",
            failure: "/billing",
        isAuthenticated, users.postPayment

    app.post "/user/coupon",
        setRedirect
            auth: "/",
            success: "/billing",
            failure: "/billing",
        isAuthenticated,
        users.postCoupon

    app.post "/user/password",
        setRedirect
            auth: "/",
            success: "/dashboard",
            failure: "/dashboard",
        isAuthenticated,
        passwords.postNewPassword

    app.post "/user/delete",
        setRedirect
            auth: "/",
            success: "/",
        isAuthenticated,
        users.deleteAccount

    # stripe
    app.post "/stripe/events",
        stripeWebhook.middleware,
        stripeEvents

    # bitpay
    app.get "/bitpay/redirect",
        setRedirect
            auth: "/",
            success: "/dashboard",
        isAuthenticated,
        dashboard.getPaymentRedirect

    app.post "/bitpay/events", (req, res, next) ->
        txn.update req.body.posData, 'paid', req.body, (invoice) ->
            api.activate invoice.customerId, invoice.plan, 'bitpay', (err, success) ->
                # error?
                return next(err) if err
                # success
                res.status(200).end()

    # paypal
    app.get "/paypal/redirect",
        setRedirect
            auth: "/",
            success: "/dashboard",
        isAuthenticated,
        dashboard.getPaymentRedirect

    app.post "/paypal/events", (req, res, next) ->
        console.log(req.body)
        paypalIpn.verify req.body, callback = (err, msg) ->
        	if err
                res.status(200).end()
        	else
        		# Payment has been confirmed as completed
        		if req.param('payment_status') is 'Completed'
                    invoiceId = req.param('custom');
                    txn.update invoiceId, 'paid', req.body, (invoice) ->
                        api.activate invoice.customerId, invoice.plan, 'paypal', (err, success) ->
                            # error?
                            return next(err) if err
                            # success
                            res.status(200).end()

    # payza
    app.get "/payza/redirect",
        setRedirect
            auth: "/",
            success: "/dashboard",
        isAuthenticated,
        dashboard.getPaymentRedirect

    app.post "/payza/events", (req, res, next) ->
        request.post 'https://secure.payza.com/ipn2.ashx', req.body, callback = (err, response, body) ->
            if err
                res.status(200).end()
            else
                if body is 'INVALID TOKEN'
                    res.status(200).end()
                else
                    result = {}
                    query = unescape(query)
                    query.split("&").forEach (part) ->
                      item = part.split("=")
                      result[item[0]] = decodeURIComponent(item[1])

                    txn.update result.apc_1, 'paid', result, (invoice) ->
                        api.activate invoice.customerId, invoice.plan, 'payza', (err, success) ->
                            # error?
                            return next(err) if err
                            # success
                            res.status(200).end()

    # okpay
    app.get "/okpay/redirect",
        setRedirect
            auth: "/",
            success: "/dashboard",
        isAuthenticated,
        dashboard.getPaymentRedirect

    # todo add more security
    app.post "/okpay/events", (req, res, next) ->
        txn.update req.body.ok_invoice, 'paid', req.body, (invoice) ->
            api.activate invoice.customerId, invoice.plan, 'okpay', (err, success) ->
                # error?
                return next(err) if err
                # success
                res.status(200).end()

    # paymentwall
    app.get "/paymentwall/redirect",
        setRedirect
            auth: "/",
            success: "/dashboard",
        isAuthenticated,
        dashboard.getPaymentRedirect

    # todo add more security
    app.get "/paymentwall/events", (req, res, next) ->
        if req.query.type == '2'
            txn.update req.query.uid, 'cancelled', req.query, (invoice) ->
                api.remove invoice.customerId, (err, success) ->
                    # need to return "OK" string on both, pingback and negative pingback
                    res.status(200).send('OK')
        else
            txn.update req.query.uid, 'paid', req.query, (invoice) ->
                api.activate invoice.customerId, invoice.plan, 'paymentwall', (err, success) ->
                    # need to return "OK" string on both, pingback and negative pingback
                    res.status(200).send('OK')

    # staff
    app.get "/staff",
        setRender("staff/index"),
        setRedirect(auth: "/login"),
        isStaff,
        staff.getDefault

    app.get "/staff/servers",
        setRender("staff/servers"),
        setRedirect(auth: "/login"),
        isStaff,
        staff.getServers

    app.get "/staff/comptability",
        setRender("staff/comptability"),
        setRedirect(auth: "/login"),
        isStaff,
        staff.getComptability

    app.get "/staff/view/:customerId",
        setRender("staff/details"),
        setRedirect(auth: "/login"),
        isStaff,
        staff.getDetails

    app.get "/staff/markpaid/:invoiceId",
        setRedirect(auth: "/login"),
        isStaff,
        staff.markPaid
