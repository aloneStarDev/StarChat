const { MongoClient, ObjectId } = require("mongodb");
const dbname = "star";
const mongoURL = "mongodb://127.0.0.1:27017";
const adaptor = require("./adaptor");

module.exports.seed = async function () {
  var client = new MongoClient(mongoURL, { useUnifiedTopology: true });
  await client.connect((err, cli) => {
    if (err) console.error(err);
    var dbo = cli.db(dbname);
    dbo.collection("users").findOne({ username: "support" }, (err, res) => {
      if (res == null) {
        dbo.collection("users").insertOne(
          {
            _id: new ObjectId("000000000000000000000001"),
            ip: "127.0.0.1",
            name: "support",
            username: "support",
            state: "online",
          },
          (err, res) => {
            if (err) console.log(err);
            else console.log("db seed done");
          }
        );
      }
    });
  });
};
module.exports.signup = async function (sessionName, ip, user, callback) {
  var client = new MongoClient(mongoURL, { useUnifiedTopology: true });
  if (typeof callback != "function")
    console.error("callback should be callable");
  await client.connect((err, cli) => {
    if (err) {
      console.error(err);
      callback(false);
    }
    var dbo = cli.db(dbname);
    dbo.collection("users").findOne({ username: user.username }, (err, res) => {
      if (res == null) {
        dbo.collection("users").insertOne(user, function (err, res) {
          if (err) {
            console.error(err);
            callback(false, "server error");
          } else {
            var uid = res.insertedId;
            dbo.collection("contacts").insertOne(
              {
                user: uid.toString(),
                peer: "000000000000000000000001",
                username: "support",
                name: "support",
                mute: false,
                stranger: false,
              },
              function (err, res) {
                if (err) {
                  console.err(err);
                  callback(false, "server error");
                }
              }
            );
            dbo
              .collection("sessions")
              .insertOne(
                { users_id: uid, date: Date.now(), ip: ip, name: sessionName },
                (err, res) => {
                  if (err) callback(false, "server error");
                  else {
                    callback(true, uid, res.insertedId);
                  }
                }
              );
          }
        });
      } else callback(false, "this username is already exist");
    });
  });
};
module.exports.login = async function (name, ip, id, paylod, secret, callback) {
  var client = new MongoClient(mongoURL, { useUnifiedTopology: true });
  if (typeof callback != "function")
    console.error("callback should be callable");
  await client.connect((err, cli) => {
    if (err) {
      console.error(err);
      callback(false, "server error");
    }
    var dbo = cli.db(dbname);
    dbo.collection("users").findOne({ _id: new ObjectId(id) }, (err, res) => {
      if (err) {
        callback(false, "server error");
      } else if (res == null) {
        callback(false, "invalid token");
      } else {
        var auth = res.secret;
        var indexs = [];
        for (var i in paylod) {
          var x = paylod[i].charCodeAt(0) - 48;
          if (x >= 64 || x < 0) {
            callback(false, "invalid token");
            return;
          } else {
            indexs.push(x);
          }
        }
        for (var j in indexs) {
          if (auth[indexs[j]] !== secret[j]) {
            callback(false, "invalid token");
            return;
          }
        }
        console.log(auth, paylod, secret);
        dbo
          .collection("sessions")
          .findOne({ ip: ip, name: name }, (err, res) => {
            if (err) callback(false, "server error");
            else if (res == null) {
              dbo
                .collection("sessions")
                .insertOne(
                  { users_id: id, date: Date.now(), ip: ip, name: name },
                  (err, res) => {
                    if (err) callback(false, "server error");
                    else callback(true, res.insertedId);
                  }
                );
            } else {
              callback(true, res._id);
            }
          });
      }
    });
  });
};
module.exports.forget = async function (args, callback) {
  var client = new MongoClient(mongoURL, { useUnifiedTopology: true });
  if (typeof callback != "function")
    console.error("callback should be callable");
  await client.connect((err, cli) => {
    if (err) {
      console.error(err);
      callback(false, "server error");
    }
    var dbo = cli.db(dbname);
    dbo
      .collection("users")
      .findOne({ username: args.username, secret: args.secret }, (err, res) => {
        if (err) {
          callback(false, "server error");
        } else if (res == null) {
          callback(false, "username or secret is invalid");
        } else {
          callback(true, res._id);
        }
      });
  });
};
module.exports.wsauth = async function (uid, sid, emiter) {
  var client = new MongoClient(mongoURL, { useUnifiedTopology: true });
  var resp = { ok: true, err: [] };
  var addError = (msg) => {
    resp.ok = false;
    resp.err.push(msg);
  };
  await client.connect((err, cli) => {
    if (err) {
      console.error(err);
      addError("server error");
      emiter.emit("send", resp);
    } else {
      var dbo = cli.db(dbname);
      dbo.collection("users").findOne({ _id: ObjectId(uid) }, (err, res) => {
        if (err) {
          console.error(err);
          addError("server error");
          emiter.emit("send", resp);
        } else if (res == null) {
          addError("invalid uid");
          emiter.emit("send", resp);
        } else {
          resp.username = res.username;
          dbo
            .collection("sessions")
            .findOne({ _id: ObjectId(sid) }, (err, res) => {
              if (err) {
                console.error(err);
                addError("server error");
                emiter.emit("send", resp);
              } else if (res == null) {
                addError("invalid sid");
                emiter.emit("send", resp);
              } else {
                dbo
                  .collection("users")
                  .updateOne(
                    { _id: ObjectId(uid) },
                    { $set: { state: "online" } },
                    (err, res) => {
                      if (err) {
                        delete resp.username;
                        console.error(err);
                        addError("server error");
                      } else {
                        delete resp.err;
                        resp.log = "connected";
                      }
                      emiter.emit("send", resp);
                    }
                  );
              }
            });
        }
      });
    }
  });
};

function logger(emiter, err, log, data) {
  resp = { ok: true, err: [] };

  if (err) emiter.emit();
}

module.exports.disconnect = async function (uid, emiter) {
  var client = new MongoClient(mongoURL, { useUnifiedTopology: true });
  var resp = { ok: true, err: [] };
  var addError = (msg) => {
    resp.ok = false;
    resp.err.push(msg);
  };
  await client.connect((err, cli) => {
    if (err) {
      console.error(err);
      addError("server error");
      emiter.emit("send", resp);
    } else {
      var dbo = cli.db(dbname);
      var now = new Date();
      dbo
        .collection("users")
        .updateOne(
          { _id: ObjectId(uid) },
          { $set: { state: "offline", lastSeen: now } },
          (err, res) => {
            if (err) {
              console.error(err);
              addError("server error");
            } else {
              delete resp.err;
              resp.log = "disconected";
            }
            emiter.emit("send", resp);
          }
        );
    }
  });
};
module.exports.addContact = async function (uid, pid, emiter, options = {}) {
  var resp = { ok: true, err: [] };
  var addError = (msg) => {
    resp.ok = false;
    resp.err.push(msg);
  };
  //find user of target contact to see if exist
  var user = await adaptor.getUser({ _id: new ObjectId(pid) });
  if (user == null) {
    addError("invalid uid");
    emiter.emit("send", resp);
  } else {
    var contact = await adaptor.getContact({ user: uid, peer: pid });
    if (contact == null) {
      if (options.stranger == undefined) options.stranger = false;
      var res = await adaptor.addContact({
        user: uid,
        peer: pid,
        username: user.username,
        name: user.name,
        mute: false,
        stranger: options.stranger,
      });
      if (res) {
        resp.data = {
          _id: res,
          user: uid,
          peer: pid,
          username: user.username,
          name: user.name,
          mute: false,
          stranger: options.stranger,
        };
        if (user.state == "offline") resp.data.lastseen = user.lastseen;
        emiter.emit("send", resp);
      } else {
        addError("server error");
        emiter.emit("send", resp);
      }
    } else {
      delete resp.err;
      resp.log = "already in your contacts";
      resp.data = contact;
      if (user.state == "offline") resp.data.lastseen = user.lastseen;
      emiter.emit("send", resp);
    }
  }
};
module.exports.getContacts = async function (uid, emiter) {
  var client = new MongoClient(mongoURL, { useUnifiedTopology: true });
  var resp = { ok: true, err: [] };
  var addError = (msg) => {
    resp.ok = false;
    resp.err.push(msg);
  };
  await client.connect((err, cli) => {
    if (err) {
      console.error(err);
      addError("server error");
      emiter.emit("send", resp);
    } else {
      var dbo = cli.db("star");
      //get contacts from contacts collection
      dbo
        .collection("contacts")
        .find({ user: uid })
        .toArray()
        .then((res) => {
          var n = 0;
          var contacts = [];
          res.forEach((c) => {
            dbo
              .collection("users")
              .findOne({ _id: new ObjectId(c.peer) }, (err, r) => {
                if (err) {
                  addError("server error");
                  emiter.emit("send", resp);
                } else {
                  n++;
                  if (r.state != undefined) {
                    c.state = r.state;
                    if (r.state == "offline" && r.lastseen != undefined)
                      c.lastseen = r.lastseen;
                  }
                  contacts.push(c);
                  if (n == res.length && resp.ok) {
                    delete resp.err;
                    resp.data = contacts;
                    emiter.emit("send", resp);
                  }
                }
              });
          });
        });
    }
  });
};
module.exports.deleteContact = async function (uid, pid, emiter) {
  var client = new MongoClient(mongoURL, { useUnifiedTopology: true });
  var resp = { ok: true, err: [] };
  var addError = (msg) => {
    resp.ok = false;
    resp.err.push(msg);
  };
  await client.connect((err, cli) => {
    if (err) {
      console.error(err);
      addError("server error");
      emiter.emit("send", resp);
    } else {
      var dbo = cli.db("star");
      dbo
        .collection("contacts")
        .deleteOne({ user: uid, peer: pid }, (err, res) => {
          if (err) addError("server error");
          else delete resp.err;
          emiter.emit("send", resp);
        });
    }
  });
};
module.exports.addMessage = async function (data, emiter) {
  // var client = new MongoClient(mongoURL, { useUnifiedTopology: true });
  var resp = { ok: true, err: [] };
  var addError = (msg) => {
    resp.ok = false;
    resp.err.push(msg);
  };
  var peer = await adaptor.getUser({ _id: new ObjectId(data.contact) });
  if (peer != null) {
    var contact = await adaptor.getContact({
      user: data.contact,
      peer: data.author,
    });
    if (contact == null) {
      var author = await adaptor.getUser({ _id: new ObjectId(data.author) });
      contact = {
        user: data.contact,
        peer: data.author,
        username: author.username,
        name: author.name,
        mute: false,
        stranger: true,
      };
      adaptor.addContact(contact).then((res) => {
        if (res) {
          contact._id = res;
          emiter.emit("stranger", contact);
        }
      });
    }
    adaptor.addMessage(data).then((res) => {
      if (res) {
        delete resp.err;
        resp.data = { id: res, contact: data.contact };
        emiter.emit("send", resp);
      }
    });
  } else {
    addError("invalid contact");
    emiter.emit("send", resp);
  }
};
module.exports.seenMessages = async function (msgs, contactId, emiter) {
  var resp = { ok: true, err: [] };
  var addError = (msg) => {
    resp.ok = false;
    resp.err.push(msg);
  };
  var count = 0;
  msgs.forEach(async (item) => {
    let msg = await adaptor.getMessage({
      _id: new ObjectId(item),
      contact: contactId,
    });
    if (msg != null) {
      let res = await adaptor.updateMessage(
        { _id: new ObjectId(item), contact: contactId },
        { $set: { seen: true } }
      );
      if (res) {
        count++;
        if (count == msgs.length) {
          delete resp.err;
          resp.data = {
            msgs: msgs,
            author: msg.author,
            contact: msg.contact,
          };
          emiter.emit("send", resp);
        }
      }
    } else {
      addError("invalid msgs item");
      emiter.emit("send", resp);
    }
  });
};

module.exports.getMessages = async function (uid, data, emiter) {
  var client = new MongoClient(mongoURL, { useUnifiedTopology: true });
  var resp = { ok: true, err: [] };
  var addError = (msg) => {
    resp.ok = false;
    resp.err.push(msg);
  };
  await client.connect((err, cli) => {
    if (err) {
      console.error(err);
      addError("server error");
      emiter.emit("send", resp);
    } else {
      var dbo = cli.db("star");
      var query = {};
      if (data.hasOwnProperty("mid")) {
        //find message with this offset to get time of message
        dbo.collection("messages").findOne(
          {
            _id: new ObjectId(data.mid),
            $or: [
              { contact: uid, author: data.uid },
              { contact: data.uid, author: uid },
            ],
          },
          (err, res) => {
            if (err) {
              addError("server error");
              emiter.emit("send", resp);
            } else if (res == null) {
              addError("invalid msgid");
              emiter.emit("send", resp);
            } else {
              // find all messages affter time of this message
              var cursor = dbo.collection("messages").find({
                date: { $gt: res.data },
                $or: [
                  { contact: uid, author: data.uid },
                  { contact: data.uid, author: uid },
                ],
              });
              if (data.hasOwnProperty("count")) {
                cursor
                  .limit(data.count)
                  .toArray()
                  .then((res) => {
                    resp.data = res;
                    delete resp.err;
                    emiter.emit("send", resp);
                  })
                  .catch((err) => {
                    console.err(err);
                    addError("server error");
                    emiter.emit("send", resp);
                  });
              } else
                cursor
                  .toArray()
                  .then((res) => {
                    resp.data = res;
                    delete resp.err;
                    emiter.emit("send", resp);
                  })
                  .catch((err) => {
                    console.err(err);
                    addError("server error");
                    emiter.emit("send", resp);
                  });
            }
          }
        );
      } else {
        var cursor = dbo.collection("messages").find({
          $or: [
            { contact: uid, author: data.uid },
            { contact: data.uid, author: uid },
          ],
        });
        if (data.hasOwnProperty("count")) {
          cursor
            .limit(data.count)
            .toArray()
            .then((res) => {
              resp.data = res;
              delete resp.err;
              emiter.emit("send", resp);
            })
            .catch((err) => {
              console.err(err);
              addError("server error");
              emiter.emit("send", resp);
            });
        } else
          cursor
            .toArray()
            .then((res) => {
              resp.data = res;
              delete resp.err;
              emiter.emit("send", resp);
            })
            .catch((err) => {
              console.err(err);
              addError("server error");
              emiter.emit("send", resp);
            });
      }
    }
  });
};
module.exports.searchUser = async function (username, emiter) {
  var client = new MongoClient(mongoURL, { useUnifiedTopology: true });
  var resp = { ok: true, err: [] };
  var addError = (msg) => {
    resp.ok = false;
    resp.err.push(msg);
  };
  await client.connect((err, cli) => {
    if (err) {
      console.error(err);
      addError("server error");
      emiter.emit("send", resp);
    } else {
      var dbo = cli.db("star");
      dbo
        .collection("users")
        .find({
          username: {
            $regex: `^${username}`,
          },
        })
        .toArray()
        .then(function (res) {
          delete resp.err;
          data = [];
          res.forEach((x) => {
            data.push({
              id: x._id,
              name: x.name,
              username: x.username,
              state: x.state,
            });
          });
          resp.data = data;
          emiter.emit("send", resp);
        })
        .catch((err) => {
          addError("server error");
          emiter.emit("send", resp);
        });
    }
  });
};
module.exports.getUnseenMessages = async function (uid, emiter) {
  var resp = { ok: true, err: [] };
  var addError = (msg) => {
    resp.ok = false;
    resp.err.push(msg);
  };
  adaptor
    .getMessages({ contact: uid, seen: false })
    .then((res) => {
      if (res.length != 0) {
        delete resp.err;
        resp.data = res;
        emiter.emit("update", res);
      }
    })
    .catch((err) => {
      console.log(err);
      addError("server error");
      emiter.emit("update", resp);
    });
};
module.exports.getMessage = async function (mid) {
  return await adaptor.getMessage({ _id: new ObjectId(mid) });
};
module.exports.addFile = async function (hash, type, name) {
  var f = await adaptor.getFile({ _id: hash });
  if (f == null) await adaptor.addFile({ _id: hash, type: type, name: name });
  return hash;
};
module.exports.getFile = async function (hash) {
  return await adaptor.getFile({ _id: hash });
};

module.exports.checkMessage = async function (mid) {
  return await adaptor.updateMessage(
    { _id: new ObjectId(mid) },
    { $set: { check: true } }
  );
};
