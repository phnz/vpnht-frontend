'use strict';

var User = require('../models/user');
var Txn = require('../models/txn');

var api = require("../middleware/api")
var txn = require("../middleware/txn")

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

exports.markPaid = function (req, res, next) {
	return txn.update(req.params.invoiceId, 'paid', '', function(invoice) {
		return api.activate(invoice.customerId, invoice.plan, 'staff', function(err, success) {
			return res.redirect('/staff/view/' + invoice.customerId);
		});
	});
};
