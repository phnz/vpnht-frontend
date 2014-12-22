Txn = require("../models/txn")
User = require("../models/user")
module.exports =
    add: (customerId, plan, billingType, callback) ->
        transaction = new Txn(
            customerId: customerId
            plan: plan
            billingType: billingType
        )

        transaction.save (err, transaction) ->
            return callback err, false if err
            callback false, transaction

    update: (txnId, status, data, callback) ->
        Txn.findOne
            "_id": txnId,
            (err, txn) ->
                return callback err, false if err
                unless txn
                    callback false, false
                else
                    txn.status = status
                    txn.data = data
                    txn.save (err, txn) ->
                        return callback err, false if err
                        callback false, txn

    prepare: (txnId, callback) ->
        Txn.findOne
            "_id": txnId,
            (err, txn) ->
                return callback err, false if err
                unless txn
                    callback false
                else

                    if txn.billingType == 'monthly'

                        if txn.billingType == 'paypal'
                            callback 'payments/paypal_monthly_pt';

                        else if txn.billingType == 'bitpay'
                            callback 'payments/bitpay_monthly_pt';

                        else if txn.billingType == 'okpay'
                            callback 'payments/okpay_monthly_pt';

                    else

                        if txn.billingType == 'paypal'
                            callback 'payments/paypal_yearly';

                        else if txn.billingType == 'bitpay'
                            callback 'payments/bitpay_yearly';

                        else if txn.billingType == 'okpay'
                            callback 'payments/okpay_yearly';
