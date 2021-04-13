
var app = new Vue({
  el: "#app",
  data: {
    username: "",
    password: "",
    state: 0,
    click: false,
    log: [],
    logTitle:"Warning !"
  },
  methods: {
    login: function () {
      if (this.username == "") this.log.push("username is required");
      if (this.password == "") this.log.push("password is required");
      if (this.username != "" && this.password != "") {
        this.log = [];
        var secret = CryptoJS.SHA256(
          this.username + "" + this.password
        ).toString();
        var uid = localStorage.getItem("id");
        var loginCallback = (userid)=>{
          var payload = "";
          var auth = "";
          for (var i = 0; i < 10; i++) {
            var r = Number.parseInt(Math.random() * 100) % 64;
            payload += String.fromCharCode(r + 48);
            auth += secret[r];
          }
          fetch("/login", {
            method: "POST",
            body: JSON.stringify({
              token: userid + "." + payload + "." + auth,
              sessionName:"WebSession"
            }),
            headers: {
              "Content-Type": "application/json",
            },
          })
            .then(function (response) {
              return response.json();
            })
            .then(function (data) {
              if(data.success){
                console.log("login");
                localStorage.clear();
                localStorage.setItem("id",userid);
                localStorage.setItem("username",app.username);
                localStorage.setItem("name",app.username);
                localStorage.setItem("sessionId", data.sid);
                localStorage.setItem("login",true);
                app.correct();
                setTimeout(()=>{
                  window.location.replace("/home");
                },5000);
              }else{
                app.log.push("invalid username or password");
                app.wrong();
              }
            });
        };
        if (uid == null) {
          fetch("/forget", {
            method: "POST",
            body: JSON.stringify({
              username: this.username,
              secret: secret,
            }),
            headers: {
              "Content-Type": "application/json",
            },
          })
            .then(function (response) {
              return response.json();
            })
            .then(function (data) {
              if(data.success){
                localStorage.setItem("id",data.id);
                loginCallback(data.id);
              }else{
                app.log.push("invalid username or password");
                app.wrong();
              }
            });
        } else
        loginCallback(uid);
      } else {
        this.wrong();
      }
    },
    correct: function () {
      app.state = 2;
      var card = document.querySelector(".card");
      card.classList.toggle("is-flipped");
      app.logTitle = "Login Successfully";
      app.log = ["please wait to redirect home"];
      for (var i = 0; i < 300; i++) {
        setTimeout(function () {
          time += 0.001;
        }, 10 * i);
      }
    },
    wrong: function () {
      app.state = 1;
      var card = document.querySelector(".card");
      card.classList.toggle("is-flipped");
      for (var i = 0; i < 20; i++) {
        setTimeout(() => {
          time -= 0.01;
        }, 50 * i);
      }
      for (var i = 0; i < 20; i++) {
        setTimeout(function () {
          time += 0.01;
          app.state = 0;
        }, 20 * 50 + 100 * i);
      }
      setTimeout(() => {
        card.classList.toggle("is-flipped");
        setTimeout(() => {
          app.log = [];
        }, 1000);
      }, 2000);
    },
  },
});
