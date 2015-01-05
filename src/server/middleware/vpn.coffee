ips = require("../config/ips")
_ = require("lodash")

exports.isConnected = (ip, callback) ->
    if  _.indexOf(ips, ip) == -1
        callback false
    else
        callback true
