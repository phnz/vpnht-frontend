"use strict"

exports.isAuthenticated = (req, res, next) ->
    return next() if req.isAuthenticated()
    res.redirect req.redirect.auth

exports.isStaff = (req, res, next) ->
    if req.isAuthenticated()
        if req.user.isStaff == 'true'
            return next()

    res.redirect req.redirect.auth

exports.isUnauthenticated = (req, res, next) ->
    return next() unless req.isAuthenticated()
    res.redirect req.redirect.auth
