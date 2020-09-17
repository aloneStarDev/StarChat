
const WebSocket = require('ws');
const { MongoClient, ObjectId } = require('mongodb');
const events = require('events');
const { Server } = require('./HttpServer');
const mongo = MongoClient;

const mongoURL = "mongodb://localhost:27017/star";
let wss = new WebSocket.Server({server:Server},()=>console.log("Websocket Server Started"));

var online = new Set();

wss.on("connection", function (ws, req) {

  req.setEncoding("utf-8");
  switch (req.url) {
    case "/login":
      ws.on("message", wsLogin(ws));
      break;
    case "/register":
      ws.on("message", wsRegister(ws));
      break;
    default:
      ws.on("message", function (message) {
        let emiter = new events.EventEmitter();
        let res = { ok: true, err: 0, msg: [] };
        try {
          let data = JSON.parse(message);
          identity(ws, data, emiter, res);
          emiter.on("authenticated", function () {
            sendInterupt();
            ws.on("close", offline(ws.user.username));
            switch (req.url.toLowerCase()) {
              case "/contact/add":
                wsAddContact(ws, data, res, emiter);
                break;
              case "/":
                wsLogout(ws, data, res, emiter);
                break;
            }
          });

        } catch (err) {
          console.log(err);
          if (err.message.includes("JSON"))
            chgRes(res, "invalidJsonRequest", 5, true);
          else {
            console.log(err.message);
            chgRes(res, "500 server Error", -1, true);
          }
          ws.send(JSON.stringify(res));
        }
      });
      break;
  }
});
function offline(username) {
  return function (code, reason) {
    let active = false;
    wss.clients.forEach(client => {
      if (client.user && client.user === username)
        active = true;
    });
    if (!active) {
      online.delete(username);
      sendInterupt();
    }
  }
}
function identity(ws, data, emiter, res) {
  emiter.on("authRequired", function () {
    ws.send(JSON.stringify(res));
  });
  if (!data.hasOwnProperty('id')) {
    chgRes(res, "idRequired", 1, true);
    emiter.emit("authRequired")
  }
  else if (typeof data.id == "string" && data.id.length != 30) {
    chgRes(res, "malformId:str should be 30 hex string", 0xB, true);
    emiter.emit("authRequired");
  }
  else
    new mongo(mongoURL).connect(function (err, db) {
      let dbo = db.db("star");
      dbo.collection("users").findOne({ _id: new ObjectId(data.id.substr(6)) }, function (err, user) {
        if (user) {
          console.log(user.username);
          online.add(user.username);
          ws.user = user;
          emiter.emit("authenticated");
        }
        else {
          chgRes(res, "userNotFound", 6, true);
          emiter.emit("authRequired");
        }
      });
      db.close();
    });
}
function prepareUser(user) {
  let u = Object.assign({}, user);
  delete u._id;
  delete u.password;
  delete u.token;
  return u;
}
function sendInterupt() {
  wss.clients.forEach(client => {
    let onlineContactForEachClient = [];
    if (client.user != null) {
      online.forEach(x => {
        if (client.user.contact.includes(x))
          onlineContactForEachClient.push(x);
      });
      let user = prepareUser(client.user);
      let res = { online: onlineContactForEachClient, user: user };
      client.send(JSON.stringify(res));
    }
  });
}
function chgRes(res, msg = "NotImplemented", code = 0, err = false) {
  if (res.hasOwnProperty("err") && err) {
    res.err++;
    if (res.hasOwnProperty("ok"))
      res.ok = false;
  }
  if (res.hasOwnProperty("msg") && Array.isArray(res.msg))
    res.msg.push({ code: code, message: msg });
}
/*
 
res = {
  ok:boolean, true for success - false for fail
  err:numeric, count of Validation error
  msg:array<message> , message response {
    message:string
    code:numeric
  }
  ____: msg => each code has message {
   -1 => unknone
    0 => okey
    1 => usernameRequired
    2 => passwordRequired
    3 => nameRequired
    4 => usernameAlreadyExist
    5 => invalidJsonRequest
    6 => loginFail
    7 => tokenRequired
    8 => usernameNotFound
    9 => invalidId
    A => contactAlreadyAdded
    B => malformId
  }
}
 
*/
function wsLogin(ws) {
  let Emiter = new events.EventEmitter();
  return function (message) {
    let res = { ok: true, err: 0, msg: [] };
    try {
      let data = JSON.parse(message);
      if (!data.hasOwnProperty('username'))
        chgRes(res, "usernameRequired", 1, true);
      if (!data.hasOwnProperty('password'))
        chgRes(res, "passwordRequired", 2, true);
      Emiter.on("updateToken", function (id) {
        let token = generateKey();
        new mongo(mongoURL).connect(function (err, db) {
          let dbo = db.db("star");
          dbo.collection("users").updateOne({ $and: [{ username: data.username }, { password: data.password }] }, { $set: { token: token } }, function (err, result) {
            if (err) throw err;
            res.token = token.concat(id);
          });
          db.close();
        });
      });
      Emiter.on("ok", function () {
        new mongo(mongoURL).connect(function (err, db) {
          let dbo = db.db("star");
          dbo.collection("users").findOne({ $and: [{ username: data.username }, { password: data.password }] }, function (err, result) {
            if (result.token != null) {
              res.token = result.token.toString() + result._id.toString();
            } else
              Emiter.emit("updateToken", result._id.toString());
          });
          db.close();
        });
      });
      new mongo(mongoURL).connect(function (err, db) {
        let dbo = db.db("star");
        dbo.collection("users").find({ username: data.username, password: data.password }).count(function (err, size) {
          if (size === 1) {
            Emiter.emit("ok");
            chgRes(res, "loginSuccessfully");
          }
          else
            chgRes(res, "loginFailed", 6, true);
        });
        db.close();
      });

    } catch (err) {
      chgRes(res, "invalidJsonRequest", 5, true);
      console.error(err);
    }
    setTimeout(function () {
      ws.send(JSON.stringify(res))
    }, 2000);
  }
}
function wsRegister(ws) {
  let responseEmiter = new events.EventEmitter();
  return function (message) {
    let res = { ok: true, err: 0, msg: [] };
    try {
      let data = JSON.parse(message);
      if (!data.hasOwnProperty('username'))
        chgRes(res, "usernameRequired", 1, true);
      else if (data.username.length == 0)
        chgRes(res, "usernameRequired", 1, true);
      if (!data.hasOwnProperty('password'))
        chgRes(res, "passwordRequired", 2, true);
      else if (data.password.length == 0)
        chgRes(res, "passwordRequired", 2, true);
      if (!data.hasOwnProperty('name'))
        chgRes(res, "nameRequired", 3, true);
      else if (data.name.length == 0)
        chgRes(res, "nameRequired", 3, true);
      responseEmiter.on("change", function () {
        if (res.ok)
          new mongo(mongoURL).connect(function (err, db) {
            let dbo = db.db("star");
            data.contact = [];
            let token = generateKey();
            data.token = token;
            dbo.collection("users").insertOne(data, function (err, result) {
              res.token = token.concat(result.insertedId.toString());
            });
            db.close();
          });
      });
      if (res.ok)
        new mongo(mongoURL).connect(function (err, db) {
          let dbo = db.db("star");
          dbo.collection("users").find({ username: data.username }).count(function (err, size) {
            if (size !== 0)
              chgRes(res, "usernameAlreadyExist", 4, true);
            else {
              responseEmiter.emit("change");
              chgRes(res, "registerdSuccessfully", 0);
            }
          });
          db.close();
        });

    } catch (err) {
      chgRes(res, "invalidJsonRequest", 5, true);
    }
    setTimeout(function () {
      ws.send(JSON.stringify(res))
    }, 2000);
  }
}
function wsAddContact(ws, data, res, emiter) {
  let user = null;
  let contact = null;
  var contactChangeEmiter = emiter;
  if (!data.hasOwnProperty('username'))
    chgRes(res, "usernameRequired", 3, true);
  else if (ws.user.username === data.username)
    chgRes(res, "can't Add your Self as Contact", 4, true);
  if (res.ok) {
    new mongo(mongoURL).connect(function (err, db) {
      let dbo = db.db("star");
      dbo.collection("users").findOne({ _id: new ObjectId(data.id.substr(6)) }, function (err, result) {
        if (result)
          user = result;
        contactChangeEmiter.emit("userFind");
      });
      db.close();
    });
  }
  contactChangeEmiter.on("userFind", function () {
    new mongo(mongoURL).connect(function (err, db) {
      let dbo = db.db("star");
      dbo.collection("users").find({ username: data.username }).toArray(function (err, result) {
        if (result.length == 0)
          chgRes(res, "usernameNotFound", 8, true);
        else if (user != null && result.length == 1) {
          if (user.contact.includes(data.username))
            chgRes(res, "contactAlreadyAdded", 0xA, true);
          else {
            contact = result[0];
            contactChangeEmiter.emit("change");
          }
        }
        else if (result.length > 1)
          chgRes(res, "500 multipleUsername", -1, true);
      });
      db.close();
    });
  });
  contactChangeEmiter.on("change", function () {
    if (res.ok && user != null && contact != null)
      new mongo(mongoURL).connect(function (err, db) {
        let dbo = db.db("star");
        dbo.collection("users").updateOne({ _id: new ObjectId(data.id.substr(6)) }, { $push: { contact: contact.username } }, function (err, result) {
          if (result.result.n === 1)
            chgRes(res, "contactAddedSuccessfully", 0);
          else
            chgRes(res, "500 ServerError", -1, true);
        });
        db.close();
      });
  });

  setTimeout(function () {
    ws.send(JSON.stringify(res))
  }, 2000);

}
function wsLogout() {

}
function generateKey() {
  let key = "";
  function random(min, max) {
    return String.fromCharCode(Math.floor(Math.random() * (max - min) + min));
  }
  for (let i = 0; i < 5; i++) {
    let seed = Math.floor(Math.random() * 100) % 3;
    switch (seed) {
      case 0:
        key += random(48, 57);
        break;
      case 1:
        key += random(97, 122);
        break;
      case 2:
        key += random(65, 90);
        break;
    }
  }
  key += "0";
  return key;
}
