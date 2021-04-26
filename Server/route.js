var fs = require("fs");
var bodyParser = require("body-parser");
var repository = require("./repository");
var formidable = require("formidable");
let crypto = require("crypto");
var mime = require("mime-types");
module.exports = function (app) {
  app.use(bodyParser.json());
  app.use("/scripts", scripts, notFound);
  app.use("/styles", styles, notFound);
  app.use("/storage", storage, notFound);
  app.all("/signup", signup);
  app.all("/login", login);
  app.all("/forget", forget);
  app.all("/home", home);
  app.all("/uploadMessage", (req, res) => {
    uploadMessage(req, res, app.connector);
  });
};

function login(req, res) {
  if (req.method === "GET") {
    fs.readFile("../Client/login.html", (err, data) => {
      res.writeHeader(200, { "Content-Type": "text/html" });
      res.write(data);
      res.end();
    });
  } else if (req.method === "POST") {
    res.writeHeader(200, { "Content-Type": "application/json" });
    var response = { success: true, err: [] };
    var token = "";
    if (!req.body.hasOwnProperty("sessionName")) {
      response.success = false;
      response.err.push("sessionName required");
    } else if (!req.body.hasOwnProperty("token")) {
      response.success = false;
      response.err.push("token required");
    } else {
      token = req.body.token;
      token = token.split(".");
      if (token.length != 3) {
        response.err.push("invalid token");
        response.success = false;
      }
    }
    if (response.success) {
      id = token[0];
      if (id.length != 24) {
        response.err.push("invalid token");
        response.success = false;
        res.write(JSON.stringify(response));
        res.end();
        return;
      }
      paylod = token[1]; //( 0-64 )+ 48 // SHA256
      secret = token[2];
      var sessionName = req.body.sessionName;
      var ip = req.connection.remoteAddress;
      repository.login(sessionName, ip, id, paylod, secret, (result, log) => {
        response.success = result;
        if (result) {
          delete response.err;
          response.sid = log;
        } else response.err.push(log);
        res.write(JSON.stringify(response));
        res.end();
      });
    } else {
      res.write(JSON.stringify(response));
      res.end();
    }
  }
}
function signup(req, res) {
  if (req.method === "GET") {
    fs.readFile("../Client/signup.html", (err, data) => {
      res.writeHeader(200, { "Content-Type": "text/html" });
      res.write(data);
      res.end();
    });
  } else if (req.method === "POST") {
    var err = [];
    res.writeHeader(200, { "Content-Type": "application/json" });
    if (!req.body.hasOwnProperty("username")) err.push("user name is required");
    if (!req.body.hasOwnProperty("name")) err.push("name is required");
    if (!req.body.hasOwnProperty("secret")) err.push("password is required");
    if (!req.body.hasOwnProperty("sessionName"))
      err.push("sessionName is required");
    if (err.length != 0)
      res.write(JSON.stringify({ success: false, err: err }));
    else {
      var sname = req.body.sessionName;
      delete req.body.sessionName;
      repository.signup(
        sname,
        req.connection.remoteAddress,
        req.body,
        (saved, ...log) => {
          if (saved) {
            res.write(
              JSON.stringify({ success: true, id: log[0], sid: log[1] })
            );
          } else {
            if (log == undefined) log = "server error";
            else res.write(JSON.stringify({ success: false, err: log }));
          }
          res.end();
        }
      );
    }
  }
}
function forget(req, res) {
  if (req.method === "GET") {
    res.writeHeader(200, { "Content-Type": "text/html" });
    res.write("please contact to admin");
    res.end();
  } else if (req.method === "POST") {
    var err = [];
    res.writeHeader(200, { "Content-Type": "application/json" });
    if (!req.body.hasOwnProperty("username")) err.push("user name is required");
    if (!req.body.hasOwnProperty("secret")) err.push("secret is required");
    if (err.length != 0)
      res.write(JSON.stringify({ success: false, err: err }));
    else {
      repository.forget(req.body, (success, log) => {
        if (success) {
          res.write(JSON.stringify({ success: true, id: log }));
        } else
          res.write(
            JSON.stringify({
              success: false,
              err: [log],
            })
          );
        res.end();
      });
    }
  }
}

function checkhash(path, callback) {
  let hash = crypto.createHash("sha256");
  let stream = fs.createReadStream(path);
  stream.on("data", function (data) {
    hash.update(data);
  });
  stream.on("end", function () {
    const sha256sum = hash.digest("hex");
    stream.destroy();
    callback(sha256sum);
  });
}
function uploadMessage(req, res, connector) {
  const storage = "D:\\workspace\\StarChat\\Client\\storage\\";
  if (req.method === "POST") {
    var form = new formidable({ maxFileSize: 1000 * 1024 * 1024 }); // 1GB upload limit
    form.parse(req, function (err, field, files) {
      res.writeHeader(200, { "Content-Type": "application/json" });
      if (err) {
        console.error(err);
        res.write(JSON.stringify({ ok: false }));
        res.end();
      } else {
        var fks = Object.keys(files);
        var saveFiles = (msg) => {
          let cnt = 0;
          fks.forEach((fid) => {
            if (files[fid].hasOwnProperty("sha")) {
              fs.copyFile(files[fid].path, storage + files[fid].sha, (err) => {
                if (!err) {
                  fs.rm(files[fid].path, (err) => {
                    if (err) console.error(err);
                  });
                  cnt++;
                } else console.error(err);
                if (cnt == fks.length) {
                  res.write(JSON.stringify({ ok: true }));
                  if (connector.online.hasOwnProperty(msg.contact)) {
                    update = {
                      type: "message",
                      data: msg,
                    };
                    connector.sendResponse(
                      connector.online[msg.contact].socket,
                      "update",
                      update
                    );
                  }
                }
              });
              repository.addFile(
                files[fid].sha,
                files[fid].type,
                files[fid].name
              );
              repository.checkMessage(msg._id.toString());
            } else fs.unlink(files[fid].path);
          });
        };
        var removeFiles = () => {
          let cnt = 0;
          fks.forEach((fid) => {
            fs.unlink(files[fid].path, () => {
              cnt++;
              if (cnt == fks.length) res.write(JSON.stringify({ ok: false }));
            });
          });
        };
        if (field.hasOwnProperty("mid")) {
          //save message media
          repository
            .getMessage(field.mid)
            .then((msg) => {
              if (msg) {
                let hashes = [];
                if (Array.isArray(msg.content)) hashes = msg.content;
                else hashes.push(msg.content);
                let n = 0;
                fks.forEach((fid) => {
                  checkhash(files[fid].path, (hash) => {
                    if (!hashes.includes(hash)) {
                      removeFiles();
                      return;
                    }
                    files[fid].sha = hash;
                    n++;
                    if (n == fks.length) saveFiles(msg);
                  });
                });
              } else throw new Error();
            })
            .catch((err) => {
              removeFiles();
            });
        }
      }
    });
  }
}
function storage(req, res, next) {
  fs.readFile("../Client/storage" + req.path, function (err, data) {
    if (!err) {
      repository.getFile(req.path.slice(1)).then((f) => {
        if (f) {
          let ex = mime.extension(f.type);
          res.writeHeader(200, { "Content-Type": f.type });
          res.write(data);
          res.end();
        } else {
          next();
        }
      });
    } else {
      next();
    }
  });
}
function scripts(req, res, next) {
  fs.readFile("../Client/scripts" + req.path, function (err, data) {
    if (!err) {
      res.writeHeader(200, { "Content-Type": "application/javascript" });
      res.write(data);
      res.end();
    } else {
      next();
    }
  });
}
function styles(req, res) {
  fs.readFile("../Client/styles" + req.path, function (err, data) {
    if (!err) {
      res.write(data);
      res.end();
    } else {
      next();
    }
  });
}
function notFound(req, res) {
  res.writeHeader(404, { "Content-Type": "text/html" });
  res.write("file not found");
  res.end();
}
function home(req, res) {
  fs.readFile("../Client/home.html", function (err, data) {
    if (!err) {
      res.write(data);
      res.end();
    } else {
      console.error(err);
      res.write("server error");
      res.end();
    }
  });
}
