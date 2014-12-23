#debug
debug = require("debug")("app")

# include our app
app = require("./server/index")
cluster = require("cluster");

# set the port
app.set "port", process.env.PORT or 3000

if cluster.isMaster
    # fork a new cluster for each cpu
    for cpu in require('os').cpus()
        cluster.fork()

else
    # start the app
    server = app.listen app.get("port"), ->
        console.log "Cluster listening on port " + server.address().port
