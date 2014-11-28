"use strict"
secrets = require("../config/secrets")
module.exports = (req, res, next) ->
    res.locals.path = req.path
    res.locals.googleAnalytics = secrets.googleAnalytics
    next()
