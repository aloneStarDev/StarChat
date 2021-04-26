const WebSocket = require("ws");
const events = require("events");
const repo = require("./repository");
port = 5001;
let wss = new WebSocket.Server({ noServer: true, port: port }, () => {
  console.log("websocket server is running in port " + port);
});

var online = {};

wss.on("connection", function (ws, req) {
  req.setEncoding("utf-8");
  ws.onclose = function () {
    if (ws.hasOwnProperty("username")) {
      console.log("offline ->" + ws.username);
      if (online.hasOwnProperty(ws.username)) delete online[ws.username];
    }
  };
  ws.onmessage = (e) => {
    MessageHandler(e, ws);
  };
});

function MessageHandler(e, ws) {
  try {
    let data = JSON.parse(e.data);
    if (!data.hasOwnProperty("method")) throw new Error("JSON");
    if (data.method === "login") wsLogin(ws, data);
    else {
      if (!ws.hasOwnProperty("username")) {
        var resp = { ok: false, err: ["unauthorize connection"] };
        sendResponse(ws, "basic", resp);
      } else
        switch (data.method) {
          case "logout":
            wsLogout(ws);
            break;
          case "contact.add":
            wsAddContact(ws, data);
            break;
          case "contacts.get":
            wsGetContacts(ws);
            break;
          case "contact.remove":
            wsDeleteContact(ws, data);
            break;
          case "message.send":
            wsSendMessage(ws, data);
            break;
          case "message.get":
            //wsSendMessage(ws, data);
            break;
          case "messages.seen":
            wsSeenMessages(ws, data);
            break;
          case "messages.get":
            wsGetMessages(ws, data);
            break;
          case "users.search":
            wsSearchUser(ws, data);
            break;
        }
    }
  } catch (err) {
    var res = { ok: false, err: [] };
    if (err.message.includes("JSON")) res.err.push("invalidJsonRequest");
    else {
      throw err;
      res.err.push("server error");
    }
    sendResponse(ws, "basic", res);
  }
}

function wsLogin(ws, data) {
  var Emiter = new events.EventEmitter();
  var res = { ok: true, err: [] };
  var addError = (msg) => {
    res.ok = false;
    res.err.push(msg);
  };
  if (!data.hasOwnProperty("uid")) addError("uid Required");
  if (!data.hasOwnProperty("sid")) addError("sid Required");
  if (res.ok) {
    if (data.uid.length != 24) addError("uid is 24 character");
    if (data.sid.length != 24) addError("sid is 24 character");
    if (res.ok) {
      Emiter.on("update", (result) => {
        update = {
          type: "messages",
          data: result,
        };
        sendResponse(ws, "update", update);
      });
      Emiter.on("send", (result) => {
        sendResponse(ws, "login", result);
        if (result.ok) {
          ws.username = result.username;
          ws.uid = data.uid;
          online[ws.uid] = { socket: ws };
          repo.getUnseenMessages(data.uid, Emiter);
        }
      });
      repo.wsauth(data.uid, data.sid, Emiter);
    } else sendResponse(ws, "login", res);
  } else sendResponse(ws, "login", res);
}
function wsLogout(ws, data) {
  var Emiter = new events.EventEmitter();
  Emiter.on("send", (resp) => {
    if (resp.ok) delete online[ws.uid];
    sendResponse(ws, "logout", resp);
    setTimeout(() => {
      ws.close();
    }, 1000);
  });
  repo.disconnect(ws.uid, Emiter);
}
function wsSearchUser(ws, data) {
  var Emiter = new events.EventEmitter();
  var res = { ok: true, err: [] };
  var addError = (msg) => {
    res.ok = false;
    res.err.push(msg);
  };
  if (!data.hasOwnProperty("username")) addError("usernameRequired");
  else if (data.username == "") addError("usernameRequired");
  if (res.ok) {
    Emiter.on("send", (resp) => {
      sendResponse(ws, "users.search", resp);
    });
    repo.searchUser(data.username, Emiter);
  } else sendResponse(ws, "users.search", res);
}
function wsAddContact(ws, data) {
  var Emiter = new events.EventEmitter();
  var res = { ok: true, err: [] };
  var addError = (msg) => {
    res.ok = false;
    res.err.push(msg);
  };
  if (!data.hasOwnProperty("uid")) addError("uid required");
  else if (data.uid.length != 24) addError("invalid uid");
  if (res.ok) {
    Emiter.on("send", (resp) => {
      sendResponse(ws, "contact.add", resp);
    });
    repo.addContact(ws.uid, data.uid, Emiter);
  } else sendResponse(ws, "contact.add", res);
}
function wsGetContacts(ws) {
  var Emiter = new events.EventEmitter();
  Emiter.on("send", (resp) => {
    sendResponse(ws, "contacts.get", resp);
  });
  repo.getContacts(ws.uid, Emiter);
}
function wsDeleteContact(ws, data) {
  var Emiter = new events.EventEmitter();
  var res = { ok: true, err: [] };
  var addError = (msg) => {
    res.ok = false;
    res.err.push(msg);
  };
  if (!data.hasOwnProperty("uid")) addError("uid required");
  else if (data.uid.length != 24) addError("invalid uid");
  Emiter.on("send", (resp) => {
    sendResponse(ws, "contact.remove", resp);
  });
  repo.deleteContact(ws.uid, data.uid, Emiter);
}
function wsSendMessage(ws, data) {
  var Emiter = new events.EventEmitter();
  var res = { ok: true, err: [] };
  var addError = (msg) => {
    res.ok = false;
    res.err.push(msg);
  };
  if (!data.hasOwnProperty("content")) addError("content required");
  if (!data.hasOwnProperty("type")) addError("type required");
  else {
    if (
      typeof data.type != "string" ||
      !["text", "image", "video", "audio"].includes(data.type)
    )
      addError("invalid type");
  }
  if (!data.hasOwnProperty("contact")) addError("contact required");
  else if (typeof data.contact != "string" || data.contact.length != 24)
    addError("invalid contact");
  if (data.hasOwnProperty("replay") && data.replay.length != 24)
    addError("invalid replay");
  if (data.hasOwnProperty("forward") && data.forward.length != 24)
    addError("invalid forward");
  if (res.ok) {
    var msg = {
      content: data.content,
      type: data.type,
      author: ws.uid,
      contact: data.contact,
      seen: false,
      date: new Date(),
      deleted: false,
      updated: false,
      check: true,
    };
    if (data.hasOwnProperty("replay")) msg.replay = data.replay;
    if (data.hasOwnProperty("forward")) msg.forward = data.forward;
    if (data.hasOwnProperty("caption")) msg.caption = data.caption;
    if (data.type != "text") msg.check = false;
    Emiter.on("send", (resp) => {
      if (resp.ok) {
        if (data.hasOwnProperty("token")) resp.data.token = data.token;
        if (
          online.hasOwnProperty(msg.contact) &&
          data.contact != ws.uid &&
          msg.check
        ) {
          msg._id = resp.data.id;
          update = {
            type: "message",
            data: msg,
          };
          sendResponse(online[msg.contact].socket, "update", update);
        }
      }
      sendResponse(ws, "message.send", resp);
    });
    Emiter.on("stranger", (contact) => {
      update = {
        type: "contact.add",
        data: contact,
      };
      if (online.hasOwnProperty(contact.user))
        sendResponse(online[contact.user].socket, "update", update);
    });
    repo.addMessage(msg, Emiter);
  } else sendResponse(ws, "message.send", res);
}

function wsSeenMessages(ws, data) {
  var Emiter = new events.EventEmitter();
  var res = { ok: true, err: [] };
  var addError = (msg) => {
    res.ok = false;
    res.err.push(msg);
  };
  if (!data.hasOwnProperty("msgs")) addError("msgs required");
  else if (!Array.isArray(data.msgs)) addError("msgs should be array");
  else {
    data.msgs.forEach((element) => {
      if (typeof element != "string" || element.length != 24) {
        addError("invalid msgs item");
      }
    });
  }
  if (res.ok) {
    Emiter.on("send", (resp) => {
      sendResponse(ws, "messages.seen", resp);
      if (resp.ok && online.hasOwnProperty(resp.data.author)) {
        var update = {
          type: "seen",
          data: resp.data,
        };
        sendResponse(online[resp.data.author].socket, "update", update);
      }
    });
    repo.seenMessages(data.msgs, ws.uid, Emiter);
  } else sendResponse(ws, "messages.seen", res);
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

function wsGetMessages(ws, data) {
  var Emiter = new events.EventEmitter();
  var res = { ok: true, err: [] };
  Emiter.on("send", (options) => {
    sendResponse(ws, "messages.get", options);
  });
  var addError = (msg) => {
    res.ok = false;
    res.err.push(msg);
  };
  if (!data.hasOwnProperty("uid")) addError("uid required");
  else if (data.uid.length != 24) addError("invalid uid");
  if (data.hasOwnProperty("mid") && data.mid.length != 24)
    addError("invalid mid");
  if (data.hasOwnProperty("count") && data.count <= 0)
    addError("invalid count");
  if (res.ok) {
    repo.getMessages(ws.uid, data, Emiter); //Changing Emiter Response Model to Uniqe Form of Response Should Be Complete Later
  } else sendResponse(ws, "messages.get", res);
}

function sendResponse(ws, method, options) {
  var resp = {};
  resp.method = method;
  if (options.data != undefined) resp.data = options.data;
  if (options.log != undefined) resp.log = options.log;
  if (options.ok != undefined) resp.ok = options.ok;
  if (options.type != undefined) resp.type = options.type;
  if (options.err != undefined) resp.err = options.err;
  ws.send(JSON.stringify(resp));
}
module.exports = { online, sendResponse };
