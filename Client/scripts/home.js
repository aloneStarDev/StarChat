var ConnectionManager = new Manager();
var me = {
  name: localStorage.getItem("name"),
  username: localStorage.getItem("username"),
  sid: localStorage.getItem("sessionId"),
  uid: localStorage.getItem("id"),
};
var contacts = {};
var route = [];
var contactsId = [];
var peer = "";
if (localStorage.getItem("signup")) {
  console.log("from signup");
} else if (localStorage.getItem("login")) {
  console.log("from login");
} else {
  if (localStorage.getItem("route")) route = localStorage.getItem("route");
  if (localStorage.getItem("contacts"))
    contactsId = JSON.parse(localStorage.getItem("contacts"));
  if (localStorage.getItem("peer")) peer = localStorage.getItem("peer");
  contactsId.forEach((e) => {
    contacts[e] = JSON.parse(localStorage.getItem(e));
    let msgsid = Object.keys(contacts[e].msgs);
    msgsid.forEach((z) => {
      contacts[e].msgs[z].date = new Date(contacts[e].msgs[z].date);
    });
  });
}

var mainPage;
var contactsPage;
var settingPage;
var msgContainer;

var settingItems = <div>this is {me.username}</div>;
var sideManager = { content: settingItems };
var searchResult = [];

function setpeer(p) {
  peer = p;
  localStorage.setItem("peer", p);
}

var SaveState = () => {
  let contactsId = Object.keys(contacts);
  contactsId.forEach((e) => {
    localStorage.setItem(e, JSON.stringify(contacts[e]));
  });
  localStorage.setItem("contacts", JSON.stringify(contactsId));
};

function init() {
  if (document.readyState == "complete") {
    console.log("inited");
    refresh();
    mainPage = document.getElementsByClassName("main")[0];
    contactsPage = document.getElementsByClassName("sidebar")[0];
    settingPage = document.getElementsByClassName("setting")[0];
    msgContainer = document.getElementsByClassName("message-container")[0];
    msgContainer.onscroll = (e) => {
      scrollHandler();
    };
    window.onresize = (e) => {
      resizeHandler();
    };
    if (route != "contacts") navigator(route);
  } else {
    document.onreadystatechange = (e) => {
      init();
    };
  }
}

function resizeHandler() {
  if (window.innerWidth > 740) {
    settingPage.removeAttribute("style");
    contactsPage.removeAttribute("style");
    mainPage.removeAttribute("style");
    if (route == "setting") {
      settingPage.style.left = "0%";
    }
    scrollHandler();
  } else {
    switch (route) {
      case "contacts":
        contactsPage.style.left = "0%";
        settingPage.style.left = "-100%";
        mainPage.style.left = "100%";
        break;
      case "main":
        mainPage.style.left = "0%";
        settingPage.style.left = "-100%";
        contactsPage.style.left = "-100%";
        break;
      case "setting":
        settingPage.style.left = "0%";
        mainPage.style.left = "100%";
        contactsPage.style.left = "100%";
        break;
    }
  }
}

function scrollHandler() {
  if (contacts.hasOwnProperty(peer)) {
    var seened = [];
    var author = "";
    if (contacts[peer].hasOwnProperty("msgs"))
      Object.keys(contacts[peer].msgs).forEach((key, i) => {
        let msg = contacts[peer].msgs[key];
        if (!msg.seen && msg.author != me.uid) {
          var padTop = document.getElementsByClassName("navtopr")[0]
            .offsetHeight;
          var el = document.getElementById(msg._id);
          var elcenter = el.offsetTop - padTop + el.offsetHeight / 2;
          if (
            elcenter < msgContainer.offsetHeight + msgContainer.scrollTop &&
            elcenter > msgContainer.scrollTop
          ) {
            seened.push(msg._id);
            author = msg.author;
          }
        }
      });
    ConnectionManager.seenMessage(seened, author);
  }
}

ConnectionManager.ws.onopen = () => {
  ConnectionManager.login(me.uid, me.sid);
};

ConnectionManager.ws.onmessage = (message) => {
  var data = JSON.parse(message.data);
  console.log(data);
  switch (data.method) {
    case "login":
      if (data.ok) {
        if (localStorage.getItem("signup")) {
          localStorage.removeItem("signup");
          ConnectionManager.getContacts();
        } else if (localStorage.getItem("login")) {
          contactsId = [];
          localStorage.setItem("contacts", JSON.stringify(contactsId));
          localStorage.removeItem("login");
          ConnectionManager.getContacts();
        }
      } else if (
        data.hasOwnProperty("err") &&
        (data.err.includes("invalid uid") || data.err.includes("invalid sid"))
      ) {
        localStorage.removeItem("id");
        localStorage.removeItem("sessionId");
        localStorage.removeItem("username");
        window.location.replace("/login");
      }
      break;
    case "contacts.get":
      data.data.forEach((x) => {
        if (!contacts.hasOwnProperty(x.peer)) {
          x.unseens = 0;
          x.msgs = {};
          contacts[x.peer] = x;
        } else {
          let msgs = contacts[x.peer].msgs;
          let unseens = contacts[x.peer].unseens;
          contacts[x.peer] = x;
          contacts[x.peer].msgs = msgs;
          contacts[x.peer].unseens = unseens;
        }
      });
      refresh();
      break;
    case "contacts.update":
      break;
    case "messages.get":
      if (data.ok) {
        var index = me.uid;
        if (data.data.length != 0) {
          index =
            index == data.data[0].author
              ? data.data[0].contact
              : data.data[0].author;
          contacts[index].msgs = {};
          contacts[index].unseens = 0;
          data.data.forEach((x) => {
            contacts[index].msgs[x._id] = x;
            if (!x.seen && x.author != me.uid) contacts[index].unseens++;
          });
        }
      }
      refresh();
      break;
    case "message.send":
      if (data.ok) {
        contacts[data.data.contact].msgs[data.data.id] =
          contacts[data.data.contact].msgs[data.data.token];
        delete contacts[data.data.contact].msgs[data.data.token];
        contacts[data.data.contact].msgs[data.data.id]._id = data.data.id;
        if (contacts[data.data.contact].msgs[data.data.id].type != "text")
          ConnectionManager.uploadFiles(data.data.id);
        refresh();
      }
      break;
    case "messages.seen":
      if (data.ok) {
        data.data.msgs.forEach((e) => {
          contacts[data.data.author].msgs[e].seen = true;
          if (data.data.author != me.uid) contacts[data.data.author].unseens--;
        });
        refresh();
      }
      break;
    case "contact.add":
      if (data.ok) {
        setpeer(data.data.peer);
        if (!contacts.hasOwnProperty(data.data.peer)) {
          contacts[peer] = data.data;
          contacts[peer].msgs = {};
          contacts[peer].unseens = 0;
          refresh();
        }
        setTimeout(() => {
          navigator("contacts", "setting");
          sideManager.content = settingItems;
        }, 1000);
      }
      break;
    case "users.search":
      searchResult = data.data;
      sideManager.content = (
        <div>
          <input className="search-input" onChange={search} />
          <ul className="contact-items">
            {searchResult.map((x, index) => {
              return (
                <li
                  key={index}
                  onClick={() => {
                    ConnectionManager.addContact(x.id);
                  }}
                >
                  {x.name}
                </li>
              );
            })}
          </ul>
        </div>
      );
      refresh();
      break;
    case "basic":
      break;
    case "update":
      switch (data.type) {
        case "message":
          var index = data.data.author;
          if (!contacts.hasOwnProperty(index)) {
            contacts[index] = { _id: index };
            contacts[index].msgs = {};
            contacts[index].unseens = 1;
            contacts[index].msgs[data.data._id] = data.data;
          } else {
            if (contacts[index].hasOwnProperty("msgs"))
              contacts[index].msgs[data.data._id] = data.data;
            contacts[index].unseens++;
            refresh();
            if (peer == index && (route == "main" || window.innerWidth > 740))
              scrollHandler();
          }
          break;
        case "messages":
          data.data.forEach((e) => {
            let index = e.author;
            if (!contacts.hasOwnProperty(index)) {
              contacts[index] = { _id: index };
              contacts[index].msgs = {};
              contacts[index].unseens = 1;
              ConnectionManager.getContacts();
            } else if (!contacts[index].msgs.hasOwnProperty(e._id))
              contacts[index].unseens++;
            contacts[index].msgs[e._id] = e;
          });
          break;
        case "contact.add":
          let msgs = {};
          let unseens = 0;
          if (contacts.hasOwnProperty(data.data.peer)) {
            msgs = contacts[data.data.peer].msgs;
            unseens = contacts[data.data.peer].unseens;
            delete contacts[data.data.peer];
          }
          contacts[data.data.peer] = data.data;
          contacts[data.data.peer].msgs = msgs;
          contacts[data.data.peer].unseens = unseens;
          refresh();
          break;
        case "seen":
          if (contacts.hasOwnProperty(data.data.contact)) {
            data.data.msgs.forEach((e) => {
              contacts[data.data.contact].msgs[e].seen = true;
            });
            refresh();
          }
          break;
      }
      break;
  }
};

function navigator(r, f) {
  route = r;
  localStorage.setItem("route", route);
  if (route == "main") {
    setTimeout(scrollHandler, 1000);
  }
  if (window.innerWidth > 740) {
    if (r === "setting") {
      settingPage.classList.add("swip_left_show");
      setTimeout(() => {
        settingPage.classList.remove("swip_left_show");
        settingPage.style.left = "0%";
      }, 1000);
    }
    if (r === "contacts") {
      settingPage.classList.add("swip_left_hide");
      setTimeout(() => {
        settingPage.classList.remove("swip_left_hide");
        settingPage.style.left = "-30%";
      }, 1000);
    }
  } else {
    switch (route) {
      case "contacts":
        if (f === "setting") {
          contactsPage.style.left = "0%";
          settingPage.classList.add("swip_left_hide");
          setTimeout(() => {
            settingPage.style.left = "-100%";
            settingPage.classList.remove("swip_left_hide");
          }, 1000);
        } else {
          contactsPage.style.left = "0%";
          mainPage.classList.add("swip_right_hide");
          setTimeout(() => {
            mainPage.classList.remove("swip_right_hide");
            mainPage.style.left = "100%";
          }, 1000);
        }
        break;
      case "main":
        mainPage.classList.add("swip_right_show");
        setTimeout(() => {
          mainPage.classList.remove("swip_right_show");
          mainPage.style.left = "0%";
        }, 1000);
        break;
      case "setting":
        settingPage.classList.add("swip_left_show");
        setTimeout(() => {
          settingPage.classList.remove("swip_left_show");
          settingPage.style.left = "0%";
        }, 1000);
        break;
    }
  }
}

function search(e) {
  if (e.target.value != "") ConnectionManager.searchUser(e.target.value);
}
class Alert extends React.Component {
  render() {
    return <div className="alert-green">{this.props.msg}</div>;
  }
}
class Side extends React.Component {
  render() {
    var icon = <i className="fas fa-bars"></i>;
    var redirect = (index) => {
      // ConnectionManager.getMessages(index);
      setpeer(index);
      navigator("main");
      refresh();
    };
    var items = Object.keys(contacts).map((x, index) => (
      <li key={index} onClick={() => redirect(x)}>
        {contacts[x].name}
        {contacts[x].unseens != (undefined || null || 0) ? (
          <div className="unseen-count">{contacts[x].unseens}</div>
        ) : (
          ""
        )}
      </li>
    ));
    var addContact = () => {
      sideManager.content = (
        <div>
          <input className="search-input" onChange={search} />
        </div>
      );
      refresh();
      navigator("setting");
    };
    return (
      <div className="sidebar">
        <SideNav icon={icon} title="Star-Chat"></SideNav>
        <ul className="contact-items">{items}</ul>
        <div className="addContactBtn" onClick={addContact}>
          <i className="fa fa-plus-circle" aria-hidden="true"></i>
        </div>
      </div>
    );
  }
}
class Setting extends React.Component {
  showSetting() {
    navigator("contacts", "setting");
  }
  render() {
    return (
      <div className="setting">
        <div className="icons" onClick={this.showSetting}>
          <i className="fas fa-arrow-left"></i>
        </div>
        <div className="sideManager">{sideManager.content}</div>
      </div>
    );
  }
}
class Media extends React.Component {
  render() {
    switch (this.props.msgtype) {
      case "video":
        return <video src={"/storage/" + this.props.source} controls></video>;
      case "image":
        return <img src={"/storage/" + this.props.source} />;
    }
    return "";
  }
}
class Message extends React.Component {
  constructor(props) {
    super(props);
  }
  render() {
    var z;
    if (this.props.msgtype == "text")
      z = this.props.msg.split("\n").map((item, i) => {
        return <p key={i}>{item}</p>;
      });
    else {
      if (this.props.hasOwnProperty("hashes")) {
        if (Array.isArray(this.props.msg))
          z = this.props.msg.map((item, i) => {
            return <Media key={i} msgtype={this.props.msgtype} source={item} />;
          });
        else z = <Media msgtype={this.props.msgtype} source={this.props.msg} />;
      }
    }
    var msgstate;
    if (this.props.seen == null)
      msgstate = <i className="fas fa-spinner fa-pulse"></i>;
    else if (this.props.seen)
      msgstate = <i className="fas fa-check-double"></i>;
    else msgstate = <i className="fas fa-check"></i>;
    var time = null;
    if (this.props.date != null) {
      var t = new Date(this.props.date);
      time = `${t.getHours()}:${t.getMinutes()}`;
    }
    if (this.props.author == me.uid) {
      return (
        <div className="message" id={this.props.id}>
          <div className="rightMessage">
            <div className="msg-content">{z}</div>
            <div className="time">{time}</div>
            <div
              className="msg-state"
              style={{ color: this.props.seen ? "green" : "" }}
            >
              {msgstate}
            </div>
          </div>
        </div>
      );
    } else
      return (
        <div className="message" id={this.props.id}>
          <div className="leftMessage">
            <div className="msg-content">{z}</div>
            <div className="time">{time}</div>
          </div>
        </div>
      );
  }
}
class Input extends React.Component {
  constructor(props) {
    super(props);
    this.state = { value: "", btnMode: "upload" };
    this.handleChange = this.handleChange.bind(this);
    this.uploadFile = this.uploadFile.bind(this);
    this.sendMessage = this.sendMessage.bind(this);
  }
  handleChange(e) {
    var text = e.target.innerText;
    if (text == "") {
      this.setState({ value: text, btnMode: "upload" });
    } else {
      this.setState({ value: text, btnMode: "send" });
    }
    refresh();
  }
  uploadFile() {
    var uploadInput = document.getElementById("uploadfile");
    if (uploadInput != null) {
      uploadInput.onchange = (e) => {
        let t = "";
        let same = true;
        for (let i = 0; i < uploadInput.files.length; i++) {
          let z = uploadInput.files[i].type.split("/")[0];
          if (t == "") t = z;
          else if (z != t) {
            same = false;
          }
        }
        if (same) {
          let date = new Date();
          let token = date.getTime() + "";
          contacts[peer].msgs[token] = {
            author: me.uid,
            contact: peer,
            date: date,
            deleted: false,
            seen: false,
            type: t,
            updated: false,
            _id: token,
          };
          ConnectionManager.sendMessage([], t, peer, {
            token: token,
          });
        } else {
          alert(
            "you should choose a same type of file to upload togeder \n if you persist in\n send files seprately"
          );
        }
      };
      uploadInput.click();
    } else {
      setTimeout(this.uploadFile, 1000);
    }
  }
  sendMessage() {
    var date = new Date();
    var token = date.getTime() + "";
    if (this.state.value != "") {
      contacts[peer].msgs[token] = {
        author: me.uid,
        contact: peer,
        content: this.state.value,
        date: date,
        deleted: false,
        seen: false,
        type: "text",
        updated: false,
        _id: token,
      };
      document.getElementsByClassName("input-wrap")[0].firstChild.innerText =
        "";
      this.setState({ value: "", btnMode: "upload" });
      ConnectionManager.sendMessage(this.state.value, "text", peer, {
        token: token,
      });
    }
  }
  render() {
    return (
      <div className="textInput">
        <div className="input-wrap">
          <div onInput={this.handleChange} contentEditable={true}></div>
        </div>
        <div className="send-icon-wrap">
          <i
            className={
              this.state.btnMode == "upload"
                ? "fas fa-paperclip"
                : "fas fa-location-arrow"
            }
            onClick={
              this.state.btnMode == "upload"
                ? this.uploadFile
                : this.sendMessage
            }
          ></i>
          <input
            type="file"
            id="uploadfile"
            style={{ display: "none" }}
            multiple={true}
          />
        </div>
      </div>
    );
  }
}
class Main extends React.Component {
  render() {
    var options = [
      { id: 0, name: "mute" },
      { id: 1, name: "delete" },
      { id: 2, name: "clear history" },
      { id: 4, name: "another options" },
    ];

    var msgEl;
    if (contacts.hasOwnProperty(peer) && contacts[peer].hasOwnProperty("msgs"))
      msgEl = Object.keys(contacts[peer].msgs).map((x) => {
        x = contacts[peer].msgs[x];
        return (
          <Message
            key={x._id}
            id={x._id}
            author={x.author}
            seen={x.seen}
            msg={x.content}
            date={x.date}
            msgtype={x.type}
            hashes={x.hashes}
          />
        );
      });
    var msgCotainer = <div className="message-container">{msgEl}</div>;
    if (Object.keys(contacts).length > 0 && peer != "") {
      return (
        <div className="main">
          <MainNav title={contacts[peer].name}></MainNav>
          <Options options={options}></Options>
          <div className="chatContainer">
            {msgCotainer}
            <div id="progressbar"></div>
            <Input />
          </div>
        </div>
      );
    } else {
      return (
        <div className="main">
          <MainNav></MainNav>
          <Options options={options}></Options>
          <div className="chatContainer" style={{ height: "90%" }}>
            <div className="message-container">
              welcome to my web application
            </div>
          </div>
        </div>
      );
    }
  }
}
class Options extends React.Component {
  render() {
    var options = this.props.options.map((x) => (
      <li key={x.id} className="optionItem">
        {x.name}
      </li>
    ));
    return (
      <div className="options">
        <ul>{options}</ul>
      </div>
    );
  }
}
class MainNav extends React.Component {
  constructor(props) {
    super(props);
    this.togglePage = () => {
      navigator("contacts", "main");
    };

    var hidelistener = (e) => {
      if (!e.target.classList.contains("optionItem")) {
        this.hideOptions();
      }
    };

    this.hideOptions = () => {
      var o = document.getElementsByClassName("options")[0];
      o.classList.add("hideOptions");
      var ot = document.getElementById("showOption");
      ot.style.display = "block";
      var ot = document.getElementById("hideOption");
      ot.style.display = "none";
      setTimeout(() => {
        o.style.right = "-30%";
        o.style.display = "none";
        o.classList.remove("hideOptions");
      }, 1000);

      document.removeEventListener("click", hidelistener);
    };
    this.showOptions = () => {
      var o = document.getElementsByClassName("options")[0];
      o.style.display = "block";
      o.classList.add("showOptions");
      var ot = document.getElementById("showOption");
      ot.style.display = "none";
      var ot = document.getElementById("hideOption");
      ot.style.display = "block";
      setTimeout(() => {
        o.classList.remove("showOptions");
        o.style.right = 0;
        document.addEventListener("click", hidelistener);
      }, 1000);
    };
  }
  render() {
    return (
      <div className="navtopr">
        <div className="icons wide_hide" onClick={this.togglePage}>
          <i className="fas fa-arrow-left"></i>
        </div>
        <div className="title">{this.props.title}</div>
        <div id="showOption" className="icons" onClick={this.showOptions}>
          <i className="fa fa-ellipsis-v"></i>
        </div>
        <div id="hideOption" className="icons" onClick={this.hideOptions}>
          <i className="fa fa-times"></i>
        </div>
      </div>
    );
  }
}
class SideNav extends React.Component {
  toggleSetting() {
    sideManager.content = settingItems;
    refresh();
    navigator("setting");
  }
  render() {
    return (
      <div className="navtopl">
        <div className="icons" onClick={this.toggleSetting}>
          {this.props.icon}
        </div>
        <div className="connection-state">{this.props.title}</div>
      </div>
    );
  }
}
class App extends React.Component {
  constructor(props) {
    super(props);
  }
  render() {
    return (
      <div className="container">
        <Setting></Setting>
        <Side></Side>
        <Main></Main>
      </div>
    );
  }
}
function refresh() {
  setTimeout(() => {
    SaveState();
  }, 1000);
  ReactDOM.render(<App />, document.getElementById("app"));
}
setTimeout(() => {
  init();
}, 1000);
refresh();
