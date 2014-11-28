"use strict"
exports.setRender = (view) ->
    (req, res, next) ->
        req.render = view if view
        next()

exports.setRedirect = (options) ->
    (req, res, next) ->
        req.redirect = options if options
        next()
