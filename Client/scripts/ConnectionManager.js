class Manager {
  constructor() {
    this.ws = new WebSocket(`ws://${window.location.hostname}:5001`);
  }
  login(uid, sid) {
    var req = { method: "login" };
    req.uid = uid;
    req.sid = sid;
    this.ws.send(JSON.stringify(req));
  }

  logout() {
    var req = { method: "logout" };
    this.ws.send(JSON.stringify(req));
  }

  addContact(uid) {
    var req = { method: "contact.add" };
    req.uid = uid;
    this.ws.send(JSON.stringify(req));
  }

  removeContact(uid) {
    var req = { method: "contact.remove" };
    req.uid = uid;
    this.ws.send(JSON.stringify(req));
  }
  uploadFiles(mid, uid) {
    var xhr = new XMLHttpRequest();
    var progressbar = document.getElementById("progressbar");
    xhr.upload.onprogress = (upEvent) => {
      if (upEvent.lengthComputable) {
        progressbar.style.width =
          Math.round((upEvent.loaded / upEvent.total) * 100) + "%";
      }
    };
    xhr.onreadystatechange = (e) => {
      if (xhr.readyState === 3) {
        var result = JSON.parse(xhr.response);
        if (result.ok) refresh();
        else alert("error in upload");
      }
    };
    xhr.open("POST", "/upload");
    let fd = new FormData();
    let n = document.getElementById("uploadfile").files.length;
    let files = document.getElementById("uploadfile").files;
    fd.append("mid", mid);
    for (let i = 0; i < n; i++) {
      fd.append("file" + i, files[i]);
    }
    xhr.send(fd);
  }
  sendMessage(content, type, contact, options = {}) {
    //type contact reply forward caption
    var req = { method: "message.send" };
    req.type = type;
    req.contact = contact;
    if (options.hasOwnProperty("reply")) req.reply = options.reply;
    if (options.hasOwnProperty("forward")) req.forward = options.forward;
    if (options.hasOwnProperty("caption")) req.caption = options.caption;
    if (options.hasOwnProperty("token")) req.token = options.token;
    if (req.type != "text") {
      req.content = [];
      var files = document.getElementById("uploadfile").files;
      var fr = new FileReader();
      let counter = 0;
      fr.onload = (e) => {
        var binary = e.target.result;
        var hash = CryptoJS.SHA256(CryptoJS.enc.Latin1.parse(binary));
        req.content.push(hash.toString(CryptoJS.enc.Hex));
        if (counter == files.length - 1) {
          if (counter == 0) req.content = req.content[0];
          if (options.hasOwnProperty("token")) {
            contacts[peer].msgs[options.token].content = req.content;
            SaveState();
          }
          ConnectionManager.ws.send(JSON.stringify(req));
        } else {
          counter++;
          fr.readAsBinaryString(files[counter]);
        }
      };
      fr.onerror = (e) => {
        console.error(e);
      };
      fr.readAsBinaryString(files[0]);
    } else {
      req.content = content;
      this.ws.send(JSON.stringify(req));
    }
  }
  getMessages(uid, mid, count) {
    var req = { method: "messages.get" };
    req.uid = uid;
    if (mid != undefined) req.mid = mid;
    if (count != undefined) req.count = count;
    this.ws.send(JSON.stringify(req));
  }
  getContacts() {
    var req = { method: "contacts.get" };
    this.ws.send(JSON.stringify(req));
  }
  searchUser(username) {
    var req = { method: "users.search" };
    req.username = username;
    this.ws.send(JSON.stringify(req));
  }
  seenMessage(msgs) {
    var req = { method: "messages.seen" };
    req.msgs = msgs;
    this.ws.send(JSON.stringify(req));
  }
}
//f122bd5d1bc65b844289a3f3f1e5c017c739e937df8e364d69a1e1a476c85964
