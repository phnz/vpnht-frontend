Txn = require("../models/txn")

exports.add = (customerId, plan, billingType, data, callback) ->
    transaction = new Txn(
        customerId: customerId,
        plan: plan,
        billingType: billingType,
        data: JSON.stringify(data)
    )

    transaction.save (err, transaction) ->
        return callback(err) if err
        return callback(transaction)
