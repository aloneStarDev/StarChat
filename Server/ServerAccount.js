var repo = require("./repository");
var events = require("events");
var emiter = new events.EventEmitter();
emiter.on("send", (res) => console.log(res));
repo.getContacts("6059db2ba2db2e160360cc02", emiter);
