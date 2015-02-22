secrets = require("../config/secrets")
restify = require("restify")
nodemailer = require("nodemailer")
mailgunApiTransport = require("nodemailer-mailgunapi-transport")
User = require("../models/user")
moment = require("moment")
request = require("request")

exports.remove = (customerId, callback) ->
    User.findOne
        "stripe.customerId": customerId,
        (err, user) ->

            return callback(err, false) if err

            unless user
                # user does not exist, no need to process
                return callback(false, true)
            else
                user.stripe.plan = 'free'
                user.expiration = new Date()

                user.save (err) ->
                    return callback(err, false) if err
                    # ok alls good...
                    console.log "user: " + user.username + " subscription was successfully cancelled"
                    return callback(false, true)

exports.activate = (customerId, txnId, billingType, callback) ->
    User.findOne
        "stripe.customerId": customerId,
        (err, user) ->

            return callback(err, false) if err

            unless user
                # user does not exist, no need to process
                return callback(false, true)
            else
                request.get
                    url: "https://billing.vpn.ht/pt_ipn.php?email="+user.email+"&txn="+txnId
                , (error, response, body) ->
                    return callback(false, true);
