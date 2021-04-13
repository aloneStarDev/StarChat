const { MongoClient, ObjectId, Db } = require("mongodb");
const dbname = "star";
const mongoURL = "mongodb://localhost:27017";
const client = new MongoClient(mongoURL, { useUnifiedTopology: true });
async function connect() {
  let p = new Promise((resolve, reject) => {
    client.connect((err, cli) => {
      let db = cli.db(dbname);
      if (err) reject(err);
      else resolve(db);
    });
  });
  return p;
}
let db;
connect().then((dbInstance) => {
  db = dbInstance;
});

async function addMessage(message) {
  // var db = await connect();
  var res = await db.collection("messages").insertOne(message);
  return res.result.ok ? res.insertedId : false;
}

async function addUser(user) {
  // var db = await connect();
  var res = await db.collection("users").insertOne(user);
  return res.result.ok ? res.insertedId : false;
}

async function addContact(contact) {
  // var db = await connect();
  var res = await db.collection("contacts").insertOne(contact);
  return res.result.ok ? res.insertedId : false;
}

async function addSession(session) {
  // var db = await connect();
  var res = await db.collection("sessions").insertOne(session);
  return res.result.ok ? res.insertedId : false;
}

async function addFile(file) {
  // var db = await connect();
  var res = await db.collection("files").insertOne(file);
  return res.result.ok ? res.insertedId : false;
}

async function getMessage(query) {
  // var db = await connect();
  var res = await db.collection("messages").findOne(query);
  return res;
}

async function getMessages(query) {
  // var db = await connect();
  var res = await db.collection("messages").find(query).toArray();
  return res;
}

async function getUser(query) {
  // var db = await connect();
  var res = await db.collection("users").findOne(query);
  return res;
}

async function getUsers(query) {
  // var db = await connect();
  var res = await db.collection("users").find(query).toArray();
  return res;
}

async function getContact(query) {
  // var db = await connect();
  var res = await db.collection("contacts").findOne(query);
  return res;
}

async function getContacts(query) {
  // var db = await connect();
  var res = await db.collection("contacts").find(query).toArray();
  return res;
}

async function getSession(query) {
  // var db = await connect();
  var res = await db.collection("sessions").findOne(query);
  return res;
}

async function getSessions(query) {
  // var db = await connect();
  var res = await db.collection("sessions").find(query).toArray();
  return res;
}

async function getFile(query) {
  // var db = await connect();
  var res = await db.collection("files").findOne(query);
  return res;
}

async function getFiles(query) {
  // var db = await connect();
  var res = await db.collection("files").find(query).toArray();
  return res;
}

async function updateMessage(query, data) {
  // var db = await connect();
  var res = await db.collection("messages").updateOne(query, data);
  return res.result.ok;
}
async function updateMessages(query, data) {
  // var db = await connect();
  var res = await db.collection("messages").updateMany(query, data);
  return res.result.ok;
}

async function updateUser(query, data) {
  // var db = await connect();
  var res = await db.collection("users").updateOne(query, data);
  return res.result.ok;
}
async function updateUsers(query, data) {
  // var db = await connect();
  var res = await db.collection("users").updateMany(query, data);
  return res.result.ok;
}

async function updateContact(query, data) {
  // var db = await connect();
  var res = await db.collection("contact").updateOne(query, data);
  return res.result.ok;
}
async function updateContacts(query, data) {
  // var db = await connect();
  var res = await db.collection("contact").updateMany(query, data);
  return res.result.ok;
}

async function updateSession(query, data) {
  // var db = await connect();
  var res = await db.collection("session").updateOne(query, data);
  return res.result.ok;
}
async function updateSessions(query, data) {
  // var db = await connect();
  var res = await db.collection("session").updateMany(query, data);
  return res.result.ok;
}

module.exports = {
  addMessage,
  addUser,
  addContact,
  addSession,
  addFile,
  getMessage,
  getUser,
  getContact,
  getSession,
  getFile,
  getMessages,
  getUsers,
  getContacts,
  getSessions,
  getFiles,
  updateMessage,
  updateUser,
  updateContact,
  updateSession,
  updateMessages,
  updateUsers,
  updateContacts,
  updateSessions,
};
