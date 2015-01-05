'use strict';

var User = require('../models/user'),
	VPN = require('../middleware/vpn'),
	request = require('request'),
	plans = User.getPlans();

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
		error: error,
		plans: plans
	});
};

exports.getStatus = function (req, res, next) {
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

	request('http://ipinfo.io/json', function (error, response, body) {
		if (!error && response.statusCode === 200) {
			body = JSON.parse(body);
			VPN.isConnected(body.ip, function(connected) {
				if (req.query.json === '') {
					res.json({"connected": connected,"ipinfo": body});
				} else {
					res.render(req.render, {
						status: connected,
						ipInfo: body,
						form: form,
						error: error,
						plans: plans
					});
				}


			})

		} else {

		}
	});




};
