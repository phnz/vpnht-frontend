'use strict';

var User = require('../models/user'),
	plans = User.getPlans();

var fs = require('fs');

var thisBilling = function (req) {

	if (req.user.stripe.plan === 'free') {
		req.render = 'dashboard/billing'
	}

	return req;
}

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

	req = thisBilling(req);

	res.render(req.render, {
		user: req.user,
		form: form,
		error: error,
		plans: plans
	});

};

exports.getOpenvpn = function (req, res, next) {

	res.setHeader('Content-Type', 'application/octet-stream');
	res.setHeader('Content-disposition', 'attachment; filename=' + req.user.username + '.ovpn');
	res.send(fs.readFileSync(__dirname + '/../../openvpn/template.ovpn'));
	res.end();

};

exports.getPaymentRedirect = function (req, res, next) {

	req.flash('info', {
		msg: 'Thanks for your payment, your account is beein provisioned and you should get an email within 1 hour.'
	});
	res.redirect(req.redirect.success);

};

exports.getBilling = function (req, res, next) {
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
		user: req.user,
		form: form,
		error: error,
		plans: plans
	});
};

exports.getProfile = function (req, res, next) {
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

	req = thisBilling(req);

	res.render(req.render, {
		user: req.user,
		form: form,
		error: error,
		plans: plans
	});
};

exports.getDocumentation = function (req, res, next) {
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

	req = thisBilling(req);

	res.render(req.render, {
		user: req.user,
		form: form,
		error: error,
		plans: plans
	});
};
