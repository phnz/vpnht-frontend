LocalStrategy = require("passport-local").Strategy
User = require("../models/user")

module.exports = (passport) ->

    # some helpers
    passport.serializeUser (user, done) ->
        done null, user.id

    passport.deserializeUser (id, done) ->
        User.findById id, (err, user) ->
            done err, user

    # login
    passport.use "login",
        new LocalStrategy
            usernameField: "username",
            passReqToCallback: true,
            (req, username, password, done) ->
                User.findOne
                    username: username,
                    (err, user) ->
                        return done(err) if err
                        return done(null, false, req.flash("error", "User not found")) unless user

                        # compare password
                        user.comparePassword password, (err, isMatch) ->
                            if isMatch
                                time = 14 * 24 * 3600000
                                req.session.cookie.maxAge = time #2 weeks
                                req.session.cookie.expires = new Date(Date.now() + time)
                                req.session.touch()
                                done null, user, req.flash("success", "Successfully logged in.")
                            else
                                done null, false, req.flash("error", "Invalid Password")

        passport.use "signup", new LocalStrategy(
            usernameField: "username",
            passReqToCallback: true,
            (req, username, password, done) ->
                findOrCreateUser = ->

                    # try to find a user by username
                    User.findOne
                        username: req.body.username,
                        (err, existingUser) ->
                            if existingUser
                                req.flash "form",
                                email: req.body.email
                                return done(null, false, req.flash("error", "An account with that username already exists."))

                            # try to find a user by mail
                            User.findOne
                                email: req.body.email,
                                (err, existingUser) ->
                                    if existingUser
                                        req.flash "form",
                                        email: req.body.email
                                        return done(null, false, req.flash("error", "An account with that email address already exists."))

                                    # ok we can create and save our user
                                    user = new User
                                        email: req.body.email,
                                        username: req.body.username,
                                        password: req.body.password,

                                    user.save (err) ->
                                        return done(err, false, req.flash("error", "Error... please contact us at support@vpn.ht")) if err

                                        time = 14 * 24 * 3600000
                                        req.session.cookie.maxAge = time #2 weeks
                                        req.session.cookie.expires = new Date(Date.now() + time)
                                        req.session.touch()
                                        done null, user, req.flash("success", "Thanks for signing up. Please select your package !")

                process.nextTick findOrCreateUser
        )
