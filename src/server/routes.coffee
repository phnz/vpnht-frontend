"use strict"

# middleware
StripeWebhook = require("stripe-webhook-middleware")
isAuthenticated = require("./middleware/auth").isAuthenticated
isUnauthenticated = require("./middleware/auth").isUnauthenticated
setRender = require("middleware-responder").setRender
setRedirect = require("middleware-responder").setRedirect
stripeEvents = require("./middleware/stripe-events")
secrets = require("./config/secrets")
api = require("./middleware/api")

# controllers
users = require("./controllers/users-controller")
main = require("./controllers/main-controller")
dashboard = require("./controllers/dashboard-controller")
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

    # force SSL
    app.all "*", (req, res, next) ->
        if req.headers["x-forwarded-proto"] isnt "https" and process.env.NODE_ENV is "production"
          res.redirect "https://vpn.ht" + req.url
        else
          next()

    # homepage and dashboard
    app.get "/",
        setRedirect
            auth: "/dashboard",
        isUnauthenticated,
        setRender("index"),
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
        setRender("dashboard/index"),
        setRedirect(auth: "/"),
        isAuthenticated,
        dashboard.getDefault

    app.get "/billing",
        setRender("dashboard/billing"),
        setRedirect(auth: "/"),
        isAuthenticated,
        dashboard.getBilling

    app.get "/profile",
        setRender("dashboard/profile"),
        setRedirect(auth: "/"),
        isAuthenticated,
        dashboard.getProfile

    # documentation list
    app.get "/documentation",
        setRender("dashboard/documentation/list"),
        setRedirect(auth: "/"),
        isAuthenticated,
        dashboard.getDocumentation

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
            success: "/profile",
            failure: "/profile",
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
            success: "/profile",
            failure: "/profile",
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
        obj = req.body

        # 1 year access
        if obj.status is "complete" and obj.amount is "39.99" and obj.posData

            api.activate obj.posData, 'yearly', 'bitpay', (err, success) ->
                # error?
                return next(err) if err
                # success
                res.status(200).end()

        else if obj.status is "complete" and obj.posData

            api.activate obj.posData, 'monthly', 'bitpay', (err, success) ->
                # error?
                return next(err) if err
                # success
                res.status(200).end()

        else
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
                    params = req.param('custom').split('||')
                    api.activate params[0], params[1], 'paypal', (err, success) ->
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
        console.log(req.body)
        request.post 'https://secure.payza.com/ipn2.ashx', req.body, callback = (err, param) ->
            if err
                res.status(200).end()
            else
                param = unescape(param).split("&")
                console.log(param)
                if param is 'INVALID TOKEN'
                    res.status(200).end()
                else
                    api.activate param.apc_1, param.ap_itemcode, 'payza', (err, success) ->
                        # error?
                        return next(err) if err
                        # success
                        res.status(200).end()
