Txn = require("../models/txn")
User = require("../models/user")
secrets = require("../config/secrets")
Xero = require("xero-extended")
xero = new Xero(secrets.xero.key, secrets.xero.secret, secrets.xero.rsa)

module.exports =
    add: (customerId, plan, billingType, req, callback) ->
        transaction = new Txn(
            customerId: customerId
            plan: plan
            billingType: billingType
        )
        User.findOne
            "stripe.customerId": customerId,
            (err, user) ->
                return callback err, false if err
                unless user
                    callback false, false
                else

                    if req.body.coupon == 'POPCORNTIME' and plan = 'monthly'
                        price = 1
                    else if plan is 'monthly'
                        price = 4.99
                    else
                        price = 39.99

                    # create xero invoice
                    invoiceData =
                        Type: xero.Invoices.SALE
                        Status: 'AUTHORISED'
                        Contact:
                            Name: user.username
                            AccountNumber: customerId

                        Date: new Date()
                        DueDate: new Date()
                        LineAmountTypes: xero.Invoices.EXCLUSIVE
                        LineItems: [
                            Description: plan
                            Quantity: 1
                            UnitAmount: price
                            DiscountRate: 0
                            AccountCode: billingType
                        ]
                    xero.Invoices.create invoiceData,
                        (err, invoice) ->
                            return callback err, false if err
                            transaction.xeroId = invoice.InvoiceID
                            transaction.amount = price

                            transaction.save (err, transaction) ->
                                return callback err, false if err
                                callback false, transaction

    update: (txnId, status, data, callback) ->
        Txn.findOne
            "_id": txnId,
            (err, txn) ->
                return callback false if err
                unless txn
                    callback false
                else
                    txn.status = status
                    txn.data = data
                    txn.save (err, txn) ->
                        return callback false if err
                        paymentData =
                            Payment:
                                Invoice:
                                    InvoiceID: txn.xeroId
                                Account:
                                    Code: txn.billingType
                                Amount: txn.amount

                        # we add our txn on xero
                        xero.Payments.create paymentData,
                            (err, payment) ->
                                return callback false if err
                                callback txn

    prepare: (txnId, special, callback) ->
        Txn.findOne
            "_id": txnId,
            (err, txn) ->
                return callback err, false if err
                unless txn
                    callback false
                else

                    if txn.plan == 'monthly' and special

                        if txn.billingType == 'paypal'
                            callback 'payments/paypal_monthly_pt';

                        else if txn.billingType == 'bitpay'
                            callback 'payments/bitpay_monthly_pt';

                        else if txn.billingType == 'okpay'
                            callback 'payments/okpay_monthly_pt';

                        else if txn.billingType == 'paymentwall'
                            callback 'payments/paymentwall_monthly_pt';

                        else if txn.billingType == 'payza'
                            callback 'payments/payza_monthly_pt';

                    else if txn.plan == 'monthly'

                        if txn.billingType == 'paypal'
                            callback 'payments/paypal_monthly';

                        else if txn.billingType == 'bitpay'
                            callback 'payments/bitpay_monthly';

                        else if txn.billingType == 'okpay'
                            callback 'payments/okpay_monthly';

                        else if txn.billingType == 'paymentwall'
                            callback 'payments/paymentwall_monthly';

                        else if txn.billingType == 'payza'
                            callback 'payments/payza_monthly';

                    else

                        if txn.billingType == 'paypal'
                            callback 'payments/paypal_yearly';

                        else if txn.billingType == 'bitpay'
                            callback 'payments/bitpay_yearly';

                        else if txn.billingType == 'okpay'
                            callback 'payments/okpay_yearly';

                        else if txn.billingType == 'paymentwall'
                            callback 'payments/paymentwall_yearly';

                        else if txn.billingType == 'payza'
                            callback 'payments/payza_yearly';
