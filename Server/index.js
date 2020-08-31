const WebSocket = require('ws');
const wss = new WebSocket.Server({ port: 8080 });

wss.on('connection', function connection(ws,req) {
    console.log("connection->ip:"+req.socket.remoteAddress);
    ws.on('message', function incoming(message) {
    console.log('received: %s', message);
    ws.send("hi "+message);
  });
  
});
