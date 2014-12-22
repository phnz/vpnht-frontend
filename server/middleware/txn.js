// Generated by CoffeeScript 1.8.0
(function() {
  var Txn, User;

  Txn = require("../models/txn");

  User = require("../models/user");

  module.exports = {
    add: function(customerId, plan, billingType, callback) {
      var transaction;
      transaction = new Txn({
        customerId: customerId,
        plan: plan,
        billingType: billingType
      });
      return transaction.save(function(err, transaction) {
        if (err) {
          return callback(err, false);
        }
        return callback(false, transaction);
      });
    },
    update: function(txnId, status, data, callback) {
      return Txn.findOne({
        "_id": txnId
      }, function(err, txn) {
        if (err) {
          return callback(false);
        }
        if (!txn) {
          return callback(false);
        } else {
          txn.status = status;
          txn.data = data;
          return txn.save(function(err, txn) {
            if (err) {
              return callback(false);
            }
            return callback(txn);
          });
        }
      });
    },
    prepare: function(txnId, callback) {
      return Txn.findOne({
        "_id": txnId
      }, function(err, txn) {
        if (err) {
          return callback(err, false);
        }
        if (!txn) {
          return callback(false);
        } else {
          if (txn.plan === 'monthly') {
            if (txn.billingType === 'paypal') {
              return callback('payments/paypal_monthly_pt');
            } else if (txn.billingType === 'bitpay') {
              return callback('payments/bitpay_monthly_pt');
            } else if (txn.billingType === 'okpay') {
              return callback('payments/okpay_monthly_pt');
            } else if (txn.billingType === 'paymentwall') {
              return callback('payments/paymentwall_monthly_pt');
            } else if (txn.billingType === 'payza') {
              return callback('payments/payza_monthly_pt');
            }
          } else {
            if (txn.billingType === 'paypal') {
              return callback('payments/paypal_yearly');
            } else if (txn.billingType === 'bitpay') {
              return callback('payments/bitpay_yearly');
            } else if (txn.billingType === 'okpay') {
              return callback('payments/okpay_yearly');
            } else if (txn.billingType === 'paymentwall') {
              return callback('payments/paymentwall_yearly');
            } else if (txn.billingType === 'payza') {
              return callback('payments/payza_yearly');
            }
          }
        }
      });
    }
  };

}).call(this);
