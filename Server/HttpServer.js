var express = require("express");
var route = require("./route");

var app = express();
var port = 5000;

route(app);

app.listen(port, () => {
  console.log("http server is running in port " + port);
});
module.exports = { app };
/*
    
    */
