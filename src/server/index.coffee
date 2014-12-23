"use strict"
express = require("express")
swig = require("swig")
subdomainOffset = process.env.SUBDOMAIN_OFFSET or 0
secrets = require("./config/secrets")
path = require("path")
favicon = require("serve-favicon")
logger = require("morgan")
cookieParser = require("cookie-parser")
session = require("express-session")
MongoStore = require("connect-mongo") (session: session)
mongoose = require("mongoose")
passport = require("passport")
bodyParser = require("body-parser")
compress = require("compression")
lodash = require("lodash")
compress = compress()

# var Authentication = require('./authentication');
expressValidator = require("express-validator")
errorHandler = require("./middleware/error")
viewHelper = require("./middleware/view-helper")
flash = require("express-flash")
cors = require("cors")
corsOptions = origin: "*"
staticDir = undefined

console.log(secrets)

# setup db
mongoose.connect secrets.db
mongoose.connection.on "error", ->
    console.error "MongoDB Connection Error. Make sure MongoDB is running."
    return

corsOptions = origin: "*"

# express setup
app = express()
if app.get("env") is "production"
    app.locals.production = true
    swig.setDefaults cache: "memory"
    staticDir = path.join(__dirname + "/../public")
else
    app.locals.production = false
    swig.setDefaults cache: false
    staticDir = path.join(__dirname + "/../public")

# This is where all the magic happens!
app.engine "html", swig.renderFile
app.set "views", path.join(__dirname, "views")
app.set "view engine", "html"
app.locals._ = lodash
app.locals.stripePubKey = secrets.stripeOptions.stripePubKey
app.use favicon(path.join(__dirname + "/../public/favicon.ico"))
app.use logger("dev")
app.use compress
app.use bodyParser()
app.use expressValidator()
app.use cookieParser()
app.use express.static(staticDir)
app.use "/styles", express.static(__dirname + "/../.tmp/styles")  if app.get("env") isnt "production"
app.disable('etag')

# app.use('/', routes.styleguide);
app.use session(
    resave: true
    saveUninitialized: true
    cookie:
        maxAge: 60 * 1000 # 1 minute

    secret: secrets.sessionSecret
    store: new MongoStore(
        url: secrets.db
        auto_reconnect: true
    )
)

# setup passport authentication
app.use passport.initialize()
app.use passport.session()

# other
app.use flash()
app.use cors(corsOptions)
passportMiddleware = require("./middleware/passport")
passportMiddleware passport

# setup view helper
app.use viewHelper

# setup routes
routes = require("./routes")
routes app, passport

#/ catch 404 and forwarding to error handler
app.use errorHandler.notFound

#/ error handlers
if app.get("env") is "development"
    app.use errorHandler.development
else
    app.use errorHandler.production

module.exports = app
