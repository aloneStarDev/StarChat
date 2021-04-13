var app = new Vue({
  el: "#app",
  data: {
    name: "",
    username: "",
    password: "",
    log: [],
    state: 0,
    click: false,
    logTitle: "Warning !",
  },
  methods: {
    signup: function () {
      app.$data.log = [];
      if (this.username == "" || this.password == "") {
        if (this.username == "") {
          app.log.push("username required");
        }
        if (this.password == "") {
          app.log.push("password required");
        }
        app.wrong();
      } else {
        fetch("/signup", {
          method: "POST",
          body: JSON.stringify({
            name: app.name,
            username: app.username,
            secret: CryptoJS.SHA256(
              app.username + "" + app.password
            ).toString(),
            sessionName: "WebSession",
          }),
          headers: {
            "Content-Type": "application/json",
          },
        })
          .then(function (response) {
            return response.json();
          })
          .then(function (result) {
            if (result.success) {
              localStorage.clear();
              localStorage.setItem("id", result.id);
              localStorage.setItem("sessionId", result.sid);
              localStorage.setItem("username", app.username);
              localStorage.setItem("name", app.username);
              localStorage.setItem("signup", true);
              app.correct();
            } else {
              app.$data.log = result.err;
              app.wrong();
            }
          });
      }
    },
    correct: function () {
      app.state = 2;
      app.logTitle = "Signup Successfully";
      app.log = ["please wait to redirect home"];
      var card = document.querySelector(".card");
      card.classList.toggle("is-flipped");
      setTimeout(() => {
        window.location.replace("/home");
      }, 5000);
    },
    wrong: function () {
      app.state = 1;
      var card = document.querySelector(".card");
      card.classList.toggle("is-flipped");
      setTimeout(function () {
        var card = document.querySelector(".card");
        card.classList.toggle("is-flipped");
        app.state = 0;
      }, 5000);
    },
  },
});
