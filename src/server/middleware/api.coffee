secrets = require("../config/secrets")
restify = require("restify")
nodemailer = require("nodemailer")
mailgunApiTransport = require("nodemailer-mailgunapi-transport")

exports.activate = (customerId, plan, callback) ->
    User.findOne
        "stripe.customerId": customerId,
        (err, user) ->

            return callback(err, false) if err

            unless user
                # user does not exist, no need to process
                return callback(false, true)
            else

                # create our expiration
                if plan is "yearly"
                    t = moment().add(1, "years")
                else t = moment().add(1, "months")
                expiration = t.format("DD MMM YYYY HH:mm:ss")

                # build our api client
                client = restify.createStringClient(url: secrets.vpnht.url)
                client.basicAuth secrets.vpnht.key, secrets.vpnht.secret
                client.put "/activate/" + user.username,
                    expiration: expiration
                , (err, req2, res2, obj) ->
                    return callback(err, false) if err

                    # ok we can send the welcome email
                    transporter = nodemailer.createTransport(mailgunApiTransport(
                        apiKey: secrets.mailgun.password
                        domain: secrets.mailgun.user
                    ))

                    mailOptions =
                        to: user.email
                        from: "noreply@vpn.ht"
                        subject: "VPN Account enabled"
                        text: "You are receiving this email because your account has been activated till " + expiration + ".\n" +
                            "You can read the documentation how to get started on:\n\n" +
                            "https://vpn.ht/documentation\n\n" +
                            "If you need help, feel free to contact us at support@vpn.ht.\n"

                    transporter.sendMail mailOptions, (err) ->
                        return callback(err, false) if err

                        user.stripe.plan = plan
                        user.save (err) ->
                            return callback(err, false) if err
                            # ok alls good...
                            console.log "user: " + user.username + " subscription was successfully updated and expire on " + expiration
                            return callback(false, true)
