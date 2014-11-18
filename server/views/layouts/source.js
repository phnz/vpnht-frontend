'use strict';

var _ = require('lodash'),
    helpers = require('../helpers'),
    app = require('../app'),
    memoize = require('memoizee'),
    Q = require('q'),
    URI = require('URIjs'),
    tls = require('tls'),
    request = require('request'),
    Source;

Source = function () {
    return;
};

// extend provider with app.js
Source = app.extend({});

Source.prototype.type = "movie";
Source.prototype.fetch = function () { return; };
Source.prototype.detail = function () { return; };

Source.prototype.initialize = function () {
    var memopts = {
        maxAge: 10 * 60 * 1000,
        /* 10 minutes */
        preFetch: 0.5,
        /* recache every 5 minutes */
        primitive: true
    };

    this.memfetch = memoize(this.fetch.bind(this), memopts);
    this.fetch = this._fetch.bind(this);

    this.detail = memoize(this.detail.bind(this), _.extend(memopts, {
        async: true
    }));
};

Source.prototype._fetch = function (filters) {
    filters.toString = this.toString;
    return this.memfetch(filters);
};

Source.prototype.toString = function (arg) {
    arg = arg || false;
    return JSON.stringify(this);
};

Source.prototype._activate = function () {
    var self = this;

    self.app.api.providers.set(self.metadata.name, self);

};

Source.prototype.call = function (url) {
    var self = this;
    return Q.Promise(function(resolve, reject) {
        request({
            url: url,
            json: true
        }, function(error, response, data) {
            if (error || response.statusCode >= 400) {
                console.log('Error');
                reject(error);
            } else if (!data) {
                console.log('No data returned');
                reject(error);
            } else {
                resolve(data);
            }
        });
    });
};

Source.prototype.checkSSL = function (url, fingerprint) {
  return Q.Promise(function(resolve, reject) {
      var hostname = URI(url).hostname();
      tls.connect(443, hostname, {
          servername: hostname,
          rejectUnauthorized: false
      }, function() {
          if (!this.authorized || this.authorizationError || this.getPeerCertificate().fingerprint !== fingerprint) {
              // "These are not the certificates you're looking for..."
              // Seems like they even got a certificate signed for us :O
              reject('Cannot validate the certificate');
          }

          // looks the SSL is ok :)
          this.end();
          resolve(true);

      }).on('error', function() {

          this.end();
          reject('No SSL support');
      }).on('timeout', function() {

          this.end();
          reject('Connection timed out');
      }).setTimeout(10000); // Set 10 second timeout
  });
};

// offer an easy to use extend method.
Source.extend = helpers.extend;

module.exports = Source;
