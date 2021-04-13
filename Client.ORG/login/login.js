// be name khoda
function sign_mousedown(){
    document.getElementById("sign-in-button").style.backgroundColor ="#252628";
}
function sign_mouseup(){
    document.getElementById("sign-in-button").style.backgroundColor = "#3F79B9";
}

function rantext(length) {
    var result = '';
    var characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    var charactersLength = characters.length;
    for (var i = 0; i < length; i++) {
        result += characters.charAt(Math.floor(Math.random() * charactersLength));
    }
    return result;
}
function logoRandomizer(){
    var dest="ُRyan-Shahsavari";
    var txt=rantext(dest.length);
    var i =0;
    var randomInterval=setInterval(function(){
        txt=dest.slice(0,i)+rantext(dest.length-i);
        document.getElementById("logo").innerHTML=txt;
    },20);
    var timeInterval= setInterval(() => {
        i=i+1;
    },250);
    setTimeout(function(){
        clearInterval(randomInterval);
        clearInterval(timeInterval);
    },8000);
}

// var ws = new WebSocket("ws:http://15246c9dc402.ngrok.io.0.0.1:8000/");
var ws = null;
function connect() {
    let url = "wss://7ee42bc34ee6.ngrok.io/login";
    ws = new WebSocket(url);
    ws.onmessage = message;
    ws.onclose = close;
    ws.onerror = error;
    ws.onopen = open;
}
let timer = 0;
function open() {
    setInterval(() => timer++, 1000);
    console.log("opend");
    var username=document.getElementById("username").value;
    var pass=document.getElementById("pass").value;
    // var data={"username":username,"password":pass};
    var data={};
    data.username=username;
    data.password=pass;
    data=JSON.stringify(data);
    console.log(data);
    ws.send(data);
}
function message(res) {
    // console.log(res.data);
    var result=JSON.parse(res.data);
    if(result.ok){
        alert("user logged in :D");
        localStorage.setItem("token",result.token);
    }

}
function error(err) {
    console.error(err);
}
function close() {
    console.log("closed :" + timer);
}
function login() {
    connect();
    
}