module.exports =
    db: process.env.MONGODB or process.env.MONGOLAB_URI or process.env.MONGOHQ_URL or "mongodb://localhost:27017/membership"
    sessionSecret: process.env.SESSION_SECRET or "vpn"
    mailgun:
        user: process.env.MAILGUN_USER or "vpn.ht"
        password: process.env.MAILGUN_PASSWORD or ""
    vpnht:
        url: process.env.VPNHT_URL or ""
        key: process.env.VPNHT_APIKEY or ""
        secret: process.env.VPNHT_APISECRET or ""
    bitpayOptions: {}
    stripeOptions:
        apiKey: process.env.STRIPE_KEY or ""
        stripePubKey: process.env.STRIPE_PUB_KEY or ""
        defaultPlan: "free"
        plans: [
          "monthly"
          "yearly"
        ]
        planData:
            monthly:
                name: "Monthly"
                price: 4.99

            yearly:
                name: "Yearly"
                price: 39.99

    googleAnalytics: process.env.GOOGLE_ANALYTICS or ""
