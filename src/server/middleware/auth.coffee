"use strict"

exports.isAuthenticated = (req, res, next) ->
    return next() if req.isAuthenticated()
    res.redirect req.redirect.auth

exports.isUnauthenticated = (req, res, next) ->
    return next() unless req.isAuthenticated()
    res.redirect req.redirect.auth
