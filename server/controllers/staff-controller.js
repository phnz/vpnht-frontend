'use strict';

var User = require('../models/user');
var Txn = require('../models/txn');

var api = require("../middleware/api")
var txn = require("../middleware/txn")
var secrets = require("../config/secrets")
var restify = require("restify")
var nthash = require('smbhash').nthash;
var passport = require('passport');

exports.getHome = function (req, res, next) {
	var form = {},
		error = null,
		formFlash = req.flash('form'),
		errorFlash = req.flash('error');

	if (formFlash.length) {
		form.email = formFlash[0].email;
	}
	if (errorFlash.length) {
		error = errorFlash[0];
	}
	res.render(req.render, {
		form: form,
		error: error
	});
};

exports.getDefault = function (req, res, next) {
	var form = {},
		error = null,
		formFlash = req.flash('form'),
		errorFlash = req.flash('error');

	if (formFlash.length) {
		form.email = formFlash[0].email;
	}
	if (errorFlash.length) {
		error = errorFlash[0];
	}

    // we'll get our user list
    var page = req.param('p');
    var per_page = 50;

    if (page == null) { page = 0; }

    var search = {};
    var searchValue = req.param('searchValue');
    if (searchValue && searchValue.length > 0) {
        search = { $or:[ {'username': searchValue}, {'email': searchValue} ] };
    }


    User.count({}, function(err, count) {
        User
        .find(search)
        .skip(page*per_page)
        .limit(per_page)
        .exec(function(err, users) {
            res.render(req.render, {
            		user: req.user,
        		form: form,
        		error: error,
                users: users,
                total: count,
                searchValue: searchValue
        	});
        });

    });

};

exports.getDetails = function (req, res, next) {

    // we'll get our user list
    var page = req.param('p');
    var per_page = 50;

	User.findOne({'stripe.customerId': req.params.customerId}, function(err, user) {

		Txn
		.find({'customerId' : req.params.customerId})
		.exec(function(err, txns) {

			user.createdAtFormat = user.createdAt.toDateString();
			if (user.expiration) {
				user.expirationFormat = user.expiration.toDateString();
			}
			res.render(req.render, {
				user: user,
				txns: txns
			});
		});

	})
};

exports.getServers = function (req, res, next) {

	console.log(secrets);
	var client = restify.createStringClient({url: secrets.vpnht.url})
	client.basicAuth(secrets.vpnht.key, secrets.vpnht.secret);
	client.get('/stats', function(err, req2, res2, obj) {

		obj = JSON.parse(obj);

		res.render(req.render, {
			stats: obj
		});

	})

};

exports.getComptability = function (req, res, next) {

	Txn.count({'status' : 'paid'}, function(err, txnsPaid) {

		Txn.count({'status' : 'paid', 'plan': 'monthly'}, function(err, monthlyPaid) {

			Txn.count({'status' : 'paid', 'plan': 'yearly'}, function(err, yearlyPaid) {

				Txn.count({'status' : 'paid', 'plan': 'monthly', 'billingType': 'cc'}, function(err, monthlyCC) {

					Txn.count({'status' : 'paid', 'plan': 'monthly', 'billingType': 'paypal'}, function(err, monthlyPP) {

						Txn.count({'status' : 'paid', 'plan': 'monthly', 'billingType': 'bitpay'}, function(err, monthlyBP) {

							Txn.count({'status' : 'paid', 'plan': 'monthly', 'billingType': 'paymentwall'}, function(err, monthlyPW) {

								Txn.count({'status' : 'paid', 'plan': 'monthly', 'billingType': 'okpay'}, function(err, monthlyOP) {

									Txn.count({'status' : 'paid', 'plan': 'yearly', 'billingType': 'cc'}, function(err, yearlyCC) {

										Txn.count({'status' : 'paid', 'plan': 'yearly', 'billingType': 'paypal'}, function(err, yearlyPP) {

											Txn.count({'status' : 'paid', 'plan': 'yearly', 'billingType': 'bitpay'}, function(err, yearlyBP) {

												Txn.count({'status' : 'paid', 'plan': 'yearly', 'billingType': 'paymentwall'}, function(err, yearlyPW) {

													Txn.count({'status' : 'paid', 'plan': 'yearly', 'billingType': 'okpay'}, function(err, yearlyOP) {

														Txn.count({}, function(err, totalTxns) {

															res.render(req.render, {
																totalTxns: totalTxns,
																txnsPaid: txnsPaid,
																monthlyPaid: monthlyPaid,
																yearlyPaid: yearlyPaid,
																monthlyCC: monthlyCC,
																monthlyPP: monthlyPP,
																monthlyBP: monthlyBP,
																monthlyPW: monthlyPW,
																monthlyOP: monthlyOP,
																yearlyCC: yearlyCC,
																yearlyPP: yearlyPP,
																yearlyBP: yearlyBP,
																yearlyPW: yearlyPW,
																yearlyOP: yearlyOP
															});

														})

													})

												})

											})

										})

									})

								})

							})

						})

					})

				})

			})

		})

	})

};

exports.markPaid = function (req, res, next) {
	return txn.update(req.params.invoiceId, 'paid', '', function(invoice) {
		return api.activate(invoice.customerId, invoice.plan, 'staff', function(err, success) {
			return res.redirect('/staff/view/' + invoice.customerId);
		});
	});
};

exports.createUser = function (req, res, next) {
	req.assert('email', 'Please sign up with a valid email.').isEmail();
	req.assert('password', 'Password must be at least 6 characters long').len(6);

	var errors = req.validationErrors();

	if (errors) {
		req.flash('errors', errors);
		req.flash('form', {
			username: req.body.username,
			email: req.body.email
		});
		return res.redirect('/staff/adduser');
	}

	// we can create our VPN user
	var client = restify.createStringClient({
		url: secrets.vpnht.url,
	});
	client.basicAuth(secrets.vpnht.key, secrets.vpnht.secret);
	client.post('/user', {
		username: req.body.username,
		password: nthash(req.body.password),
		expiration: '01 Jan 2000'
	}, function (err, req2, res2, obj) {

		// calls next middleware to authenticate with passport
		passport.authenticate('signup', {
			successRedirect: '/staff/adduser',
			failureRedirect: '/staff/adduser',
			failureFlash: true
		}, function(err, user, info) {

			// something wrong
			if (err) { return next(err); }
			// something wrong
			if (!user) { return res.redirect('/staff/adduser'); }

			if (err) { return next(err); }

			// ok the user is created,
			// we can process the payment...
			console.log(req.body);
			txn.add(user.stripe.customerId, req.body.plan, 'manual', req, function(err, invoice) {

				if (err) {
					return next(err);
				}
				// we mark our invoice as paid
				txn.update(invoice._id, 'paid', 'added manually by USERNAME', function(invoice) {
					api.activate(invoice.customerId, invoice.plan, 'stripe', function (err, success) {
						// ok plan has been charged successfully!
						req.flash("success", 'Congrats ! Your account is now active !');
						return res.redirect('/staff/view/' + user.stripe.customerId);
					});

				});

			});


		})(req, res, next);

	});
};
