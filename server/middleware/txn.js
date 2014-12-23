// Generated by CoffeeScript 1.8.0
(function() {
  var Txn, User, Xero, secrets, xero;

  Txn = require("../models/txn");

  User = require("../models/user");

  secrets = require("../config/secrets");

  Xero = require("xero-extended");

  xero = new Xero(secrets.xero.key, secrets.xero.secret, secrets.xero.rsa);

  module.exports = {
    add: function(customerId, plan, billingType, req, callback) {
      var transaction;
      transaction = new Txn({
        customerId: customerId,
        plan: plan,
        billingType: billingType
      });
      return User.findOne({
        "stripe.customerId": customerId
      }, function(err, user) {
        var price;
        if (err) {
          return callback(err, false);
        }
        if (!user) {
          return callback(false, false);
        } else {
          if (req.body.coupon === 'POPCORNTIME' && (plan = 'monthly')) {
            price = 1;
          } else if (plan === 'monthly') {
            price = 4.99;
          } else {
            price = 39.99;
          }
          transaction.amount = price;
          return transaction.save(function(err, transaction) {
            if (err) {
              return callback(err, false);
            }
            return callback(false, transaction);
          });
        }
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
            return User.findOne({
              "stripe.customerId": txn.customerId
            }, function(err, user) {
              var invoiceData;
              if (err) {
                return callback(err, false);
              }
              if (!user) {
                return callback(false, false);
              } else {
                invoiceData = {
                  Type: xero.Invoices.SALE,
                  Status: 'AUTHORISED',
                  Contact: {
                    Name: user.username,
                    AccountNumber: txn.customerId
                  },
                  Date: new Date(),
                  DueDate: new Date(),
                  LineAmountTypes: xero.Invoices.EXCLUSIVE,
                  LineItems: [
                    {
                      Description: txn.plan,
                      Quantity: 1,
                      UnitAmount: txn.amount,
                      DiscountRate: 0,
                      AccountCode: txn.billingType
                    }
                  ]
                };
                return xero.Invoices.create(invoiceData, function(err, invoice) {
                  var paymentData;
                  paymentData = {
                    Payments: {
                      Payment: {
                        Invoice: {
                          InvoiceID: invoice.InvoiceID
                        },
                        Account: {
                          Code: txn.billingType
                        },
                        Amount: txn.amount
                      }
                    }
                  };
                  return xero.put('/Payments', paymentData, function(err, payment) {
                    console.log(err);
                    console.log(payment);
                    if (err) {
                      return callback(false);
                    }
                    return callback(txn);
                  });
                });
              }
            });
          });
        }
      });
    },
    prepare: function(txnId, special, callback) {
      return Txn.findOne({
        "_id": txnId
      }, function(err, txn) {
        if (err) {
          return callback(err, false);
        }
        if (!txn) {
          return callback(false);
        } else {
          if (txn.plan === 'monthly' && special) {
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
          } else if (txn.plan === 'monthly') {
            if (txn.billingType === 'paypal') {
              return callback('payments/paypal_monthly');
            } else if (txn.billingType === 'bitpay') {
              return callback('payments/bitpay_monthly');
            } else if (txn.billingType === 'okpay') {
              return callback('payments/okpay_monthly');
            } else if (txn.billingType === 'paymentwall') {
              return callback('payments/paymentwall_monthly');
            } else if (txn.billingType === 'payza') {
              return callback('payments/payza_monthly');
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
