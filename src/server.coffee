#debug
debug = require("debug")("app")

# include our app
app = require("./server/index")

# set the port
app.set "port", process.env.PORT or 3000

# start the app
server = app.listen app.get("port"), ->
    console.log "Express server listening on port " + server.address().port
