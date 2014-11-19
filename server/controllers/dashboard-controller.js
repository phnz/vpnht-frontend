'use strict';

var User = require('../models/user'),
plans = User.getPlans();

var thisBilling = function(req) {

  if (req.user.stripe.plan === 'free') {
      req.render = 'dashboard/billing'
  }

  return req;
}

exports.getDefault = function(req, res, next){
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

  res.render(req.render, {user: req.user, form: form, error: error, plans: plans});

};

exports.getBilling = function(req, res, next){
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

  res.render(req.render, {user: req.user, form: form, error: error, plans: plans});
};

exports.getProfile = function(req, res, next){
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

  res.render(req.render, {user: req.user, form: form, error: error, plans: plans});
};


exports.getDocumentation = function(req, res, next){
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

  res.render(req.render, {user: req.user, form: form, error: error, plans: plans});
};
