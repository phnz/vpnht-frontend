"use strict"
Stripe = require("stripe")
stripe = undefined
module.exports = exports = stripeCustomer = (schema, options) ->

    stripe = Stripe options.apiKey

    schema.add stripe:
        customerId: String
        subscriptionId: String
        last4: String
        plan:
            type: String
            default: options.defaultPlan

    schema.pre "save", (next) ->
        user = this
        return next() if not user.isNew or user.stripe.customerId
        user.createCustomer (err) ->
            return next(err) if err
            next()

    schema.statics.getPlans = ->
        options.planData

    schema.methods.createCustomer = (cb) ->
        user = this
        stripe.customers.create
            email: user.email,
            (err, customer) ->
                return cb(err) if err
                user.stripe.customerId = customer.id
                user.save (err) ->
                    return cb(err) if err
                    cb null

    schema.methods.setCard = (stripe_token, cb) ->
        user = this
        cardHandler = (err, customer) ->
            return cb(err) if err
            user.stripe.customerId = customer.id unless user.stripe.customerId
            card = customer.cards.data[0]
            user.stripe.last4 = card.last4
            user.save (err) ->
                return cb(err) if err
                cb null

        if user.stripe.customerId
            stripe.customers.update(
                user.stripe.customerId,
                card: stripe_token,
                cardHandler
            )
        else
            stripe.customers.create(
                email: user.email,
                card: stripe_token,
                cardHandler
            )

    schema.methods.setPlan = (plan, stripe_token, cb) ->
        user = this
        customerData = plan: plan
        subscriptionHandler = (err, subscription) ->
            return cb(err) if err
            user.stripe.plan = plan
            user.stripe.subscriptionId = subscription.id
            user.save (err) ->
                return cb(err) if err
                cb null

        createSubscription = ->
            stripe.customers.createSubscription(
                user.stripe.customerId,
                plan: plan,
                subscriptionHandler,
            )
        if stripe_token
            user.setCard stripe_token, (err) ->
                return cb(err) if err
                createSubscription()

        else
            if user.stripe.subscriptionId
                stripe.customers.updateSubscription(
                    user.stripe.customerId,
                    user.stripe.subscriptionId,
                    plan: plan,
                    subscriptionHandler
                )
            else
                createSubscription()

    schema.methods.updateStripeEmail = (cb) ->
        user = this
        return cb unless user.stripe.customerId
        stripe.customers.update(
            user.stripe.customerId,
            email: user.email,
            (err, customer) ->
                cb err
        )

    schema.methods.setCoupon = (coupon, cb) ->
        user = this
        return cb unless user.stripe.customerId
        stripe.customers.update(
            user.stripe.customerId,
            coupon: coupon,
            (err, customer) ->
                if err
                    # make sure we dont store any coupon
                    delete user.coupon
                else
                    user.coupon = coupon
                    user.save (err2) ->
                        return cb err if err
                        return cb err2 if err2
                        cb null
        )

    schema.methods.cancelStripe = (cb) ->
        user = this
        if user.stripe.customerId
            stripe.customers.del(user.stripe.customerId).then ((confirmation) ->
                cb
            ), (err) ->
                cb err
        else
            cb
