'use strict';

var nodemailer = require('nodemailer');
var async = require('async');
var crypto = require('crypto');
var passport = require('passport');
var User = require('../models/user');
var secrets = require('../config/secrets');
var restify = require('restify');
var nthash = require('smbhash').nthash;

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
			successRedirect: '/dashboard',
			failureRedirect: '/signup',
			failureFlash: true
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
	res.render('signup-popcorntime', {
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
			successRedirect: '/dashboard',
			failureRedirect: '/popcorntime',
			failureFlash: true
		})(req, res, next);

	});

};
