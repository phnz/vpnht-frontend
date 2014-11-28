"use strict"
module.exports =
    notFound: (req, res, next) ->
        err = new Error("Not Found")
        err.status = 404
        next err

    development: (err, req, res, next) ->
        customError =
            message: err.message
            error: err

        res.status err.status or 500
        res.format
            json: ->
                res.json customError

            html: ->
                res.render "error",
                err: customError

    production: (err, req, res, next) ->
        customError =
            message: err.message or "Not Found"
            error: false

        res.status err.status or 500
        res.format
            json: ->
                res.json customError

            html: ->
                res.render "error", customError
