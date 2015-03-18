'use strict';

var nodemailer = require('nodemailer');
var async = require('async');
var crypto = require('crypto');
var passport = require('passport');
var User = require('../models/user');
var secrets = require('../config/secrets');
var restify = require('restify');
var nthash = require('smbhash').nthash;

var txn = require("../middleware/txn");

// Show Registration Page

exports.getSignup = function (req, res) {
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
	res.render('signup', {
		form: form,
		error: error
	});
};

exports.postSignup = function (req, res, next) {

		req.assert('email', 'Please sign up with a valid email.').isEmail();
		req.assert('password', 'Password must be at least 6 characters long').len(6);

		var errors = req.validationErrors();

		if (errors) {
			req.flash('errors', errors);
			req.flash('form', {
				username: req.body.username,
				email: req.body.email
			});
			return res.redirect('/signup');
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
				successRedirect: '/billing',
				failureRedirect: '/billing',
				failureFlash: true
			}, function(err, user, info) {

				// something wrong
	    		if (err) { return next(err); }
				// something wrong
			    if (!user) { return res.redirect('/login'); }

				// we log our user
				req.logIn(user, function(err) {

	      			if (err) { return next(err); }


					// ok the user is created,
					// we can process the payment...
					txn.add(user.stripe.customerId, req.body.plan, req.body.payment_method, req, function(err, invoice) {
						if (err) {
							return next(err);
						}
						// we have our invoice._id
						// so we can generate our link with the good payment platform

						if (invoice.billingType === 'cc') {
							// process stripe subscription...

							var card = {
								number: req.body.cc_no,
								exp_month: req.body.cc_expiry_month,
								exp_year: req.body.cc_expiry_year,
								cvc: req.body.cc_ccv,
								name: req.body.cc_first_name + ' ' + req.body.cc_last_name,
								address_zip: req.body.cc_zip
							};

							user.createCard(card, function(err) {
								if (err) {
									console.log(err);
									req.flash("error", err.message);
									return res.redirect('/billing');
								}

								// ok our new customer have adefault card on his account !
								// we can set the plan and charge it =)
								user.setPlan(invoice._id, req.body.plan, false, function(err) {

									// ok we try to charge the card....
									if (err) {
										console.log(err);
										req.flash("error", err.message);
										return res.redirect('/billing');
									}

									// we mark our invoice as paid
									txn.update(invoice._id, 'paid', 'approved by stripe', function(user) {
										// ok plan has been charged successfully!
										req.flash("success", 'Congrats ! Your account is now active !');
										return res.redirect(req.redirect.success);
									});
								})

							})


						} else {

							// if its another payment method, we need to send to another
							// link to process the payment
							txn.prepare(invoice._id, false, function(template) {
								// fix can't use _id as it print object
								invoice.id = invoice._id.toString();
								console.log(template);
								// render our hidden form and submot to process
								// payment on the external payment processor
								res.render(template, {invoice: invoice});
							});
						}

					});

				});

	  		})(req, res, next);

		});

};

exports.getSignupPT = function (req, res) {
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
	res.render('signup-popcorntime2', {
		form: form,
		error: error
	});
};

exports.getSignupYTS = function (req, res) {
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
	res.render('signup-yts', {
		form: form,
		error: error
	});
};

exports.getSignupPT2 = function (req, res) {
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
	res.render('signup-popcorntime2', {
		form: form,
		error: error
	});
};

exports.postSignupPT = function (req, res, next) {
	req.assert('email', 'Please sign up with a valid email.').isEmail();
	req.assert('password', 'Password must be at least 6 characters long').len(6);

	var errors = req.validationErrors();

	if (errors) {
		req.flash('errors', errors);
		req.flash('form', {
			username: req.body.username,
			email: req.body.email
		});
		return res.redirect('/popcorntime');
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
			successRedirect: '/billing',
			failureRedirect: '/billing',
			failureFlash: true
		}, function(err, user, info) {

			// something wrong
    		if (err) { return next(err); }
			// something wrong
		    if (!user) { return res.redirect('/login'); }

			// we log our user
			req.logIn(user, function(err) {

      			if (err) { return next(err); }


				// ok the user is created,
				// we can process the payment...
				txn.add(user.stripe.customerId, req.body.plan, req.body.payment_method, req, function(err, invoice) {
					if (err) {
						return next(err);
					}
					// we have our invoice._id
					// so we can generate our link with the good payment platform

					if (invoice.billingType === 'cc') {
						// process stripe subscription...

						var card = {
							number: req.body.cc_no,
							exp_month: req.body.cc_expiry_month,
							exp_year: req.body.cc_expiry_year,
							cvc: req.body.cc_ccv,
							name: req.body.cc_first_name + ' ' + req.body.cc_last_name,
							address_zip: req.body.cc_zip
						};

						user.createCard(card, function(err) {
							if (err) {
								console.log(err);
								req.flash("error", err.message);
								return res.redirect('/billing');
							}

							// ok our new customer have adefault card on his account !
							// we can set the plan and charge it =)
							user.setPlan(invoice._id, req.body.plan, false, function(err) {

								// ok we try to charge the card....
								if (err) {
									console.log(err);
									req.flash("error", err.message);
									return res.redirect('/billing');
								}

								// we mark our invoice as paid
								txn.update(invoice._id, 'paid', 'approved by stripe', function(user) {
									// ok plan has been charged successfully!
									req.flash("success", 'Congrats ! Your account is now active !');
									return res.redirect(req.redirect.success);
								});
							})

						})


					} else {

						// if its another payment method, we need to send to another
						// link to process the payment
						txn.prepare(invoice._id, true, function(template) {
							// fix can't use _id as it print object
							invoice.id = invoice._id.toString();
							console.log(template);
							// render our hidden form and submot to process
							// payment on the external payment processor
							res.render(template, {invoice: invoice});
						});
					}

				});

			});

  		})(req, res, next);

	});

};
