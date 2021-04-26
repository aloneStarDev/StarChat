var repo = require("./repository");
var connector = require("./WebSocketServer");
var { app } = require("./HttpServer");
app.connector = connector;
repo.seed();
