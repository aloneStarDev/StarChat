const http = require("http");
let fs = require("fs");
const httpServer = http.createServer((req,res)=>{
    res.writeHead(200,{"Content-Type":"text/html"})
    fs.readFile("../Client/")
    res.write(JSON.stringify());
    
    res.end();
});
httpServer.listen(8000,"localhost");
exports.Server = httpServer;