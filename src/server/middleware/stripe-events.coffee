"use strict"
User = require("../models/user")
secrets = require("../config/secrets")
restify = require("restify")
nodemailer = require("nodemailer")
mailgunApiTransport = require("nodemailer-mailgunapi-transport")
moment = require("moment")

knownEvents =
    "invoice.payment_succeeded": (req, res, next) ->
        console.log req.stripeEvent.type + ": event processed"
        if req.stripeEvent.data and req.stripeEvent.data.object and req.stripeEvent.data.object.customer

            # find user where stripeEvent.data.object.customer
            User.findOne
                "stripe.customerId": req.stripeEvent.data.object.customer,
                (err, user) ->
                    return next(err) if err
                    unless user
                        # user does not exist, no need to process
                        res.status(200).end()
                    else
                        t = moment(new Date(req.stripeEvent.data.object.lines.data[0].period.end * 1000))
                        expiration = t.format("DD MMM YYYY HH:mm:ss")
                        client = restify.createStringClient(url: secrets.vpnht.url)
                        client.basicAuth secrets.vpnht.key, secrets.vpnht.secret
                        client.put "/activate/" + user.username,
                            expiration: expiration,
                            (err, req2, res2, obj) ->
                                return next(err) if err
                                transporter = nodemailer.createTransport(mailgunApiTransport(
                                    apiKey: secrets.mailgun.password
                                    domain: secrets.mailgun.user
                                    ))
                                mailOptions =
                                    to: user.email
                                    from: "noreply@vpn.ht"
                                    subject: "VPN Account enabled"
                                    text: "You are receiving this email because your account has been activated till " + expiration + ".\n\n" +
                                        "You can read the documentation how to get started on:\n\n" +
                                        "https://vpn.ht/documentation\n\n" + "If you need help, feel free to contact us at support@vpn.ht.\n"

                                transporter.sendMail mailOptions, (err) ->
                                    return next(err) if err
                                    console.log "user: " + user.username + " subscription was successfully updated and expire on " + expiration
                                    res.status(200).end()



        else
            next new Error("stripeEvent.data.object.customer is undefined")

    "customer.subscription.deleted": (req, res, next) ->
        console.log req.stripeEvent.type + ": event processed"
        if req.stripeEvent.data and req.stripeEvent.data.object and req.stripeEvent.data.object.customer

            # find user where stripeEvent.data.object.customer
            User.findOne
                "stripe.customerId": req.stripeEvent.data.object.customer,
                (err, user) ->
                    return next(err) if err
                    unless user
                        # user does not exist, no need to process
                        res.status(200).end()
                    else
                        user.stripe.last4 = ""
                        user.stripe.plan = "free"
                        user.stripe.subscriptionId = ""
                        user.save (err) ->
                            return next(err) if err
                            console.log "user: " + user.email + " subscription was successfully cancelled."
                            res.status(200).end()

        else
            next new Error("stripeEvent.data.object.customer is undefined")


module.exports = (req, res, next) ->
  if req.stripeEvent and req.stripeEvent.type and knownEvents[req.stripeEvent.type]
    knownEvents[req.stripeEvent.type] req, res, next
  else
    next new Error("Stripe Event not found")
  return
