const WebSocket = require('ws');
const { MongoClient, ObjectId } = require('mongodb');
const events = require('events');
const mongo = MongoClient;

const mongoURL = "mongodb://localhost:27017/star";
let wss = new WebSocket.Server({port:8000,host:"localhost"});
var online = new Set();
wss.on("connection",function(ws,req){
  req.setEncoding("utf-8");
  ws.on("ping",function(data){
    console.log("this is ping ->"+data);
  });
  switch(req.url){
    case "/login":
      ws.on("message",wsLogin(ws));
      break;
    case "/register":
      ws.on("message",wsRegister(ws));
      break;
    default:
      ws.on("message",function(message){
        let emiter = new events.EventEmitter();
        let res = {ok:true,err:0,msg:[]};
        try{
          let data = JSON.parse(message);
          identity(ws,data,emiter,res);
          emiter.on("authenticated",function(){
            ws.on("close",offline(ws.user));
            switch(req.url.toLowerCase()){
              case "/contact/add":
                wsAddContact(ws,data,res,emiter);
              break;
              case "/getupdate":
                wsGetUpdate(ws,data,res,emiter);
              break;
            }
          });
          
        }catch(err){
          if(err.message.includes("JSON"))
            chgRes(res,"invalidJsonRequest",5,true);
          else{
            console.log(err.message);
            chgRes(res,"500 server Error",-1,true);
          }
          ws.send(JSON.stringify(res));
        }
      });
      break;
  }
});
function offline(username){
  return function(code, reason){
    let active = false;
    wss.clients.forEach(client => { 
      if(client.user && client.user === username)
        active = true;
    });
    if(!active){
      online.delete(username);
    }
  }
}
function identity(ws,data,emiter,res){
  emiter.on("authRequired",function(){
    ws.send(JSON.stringify(res));
  });
  if(!data.hasOwnProperty('id'))
  {
    chgRes(res,"idRequired",1,true);
    emiter.emit("authRequired")
  }
  else if(typeof data.id == "string" && data.id.length != 24)
  {
    chgRes(res,"malformId:str should be 24 hex string",0xB,true);
    emiter.emit("authRequired");
  }
  else
    new mongo(mongoURL).connect(function(err,db){
      let dbo = db.db("star");
      dbo.collection("users").findOne({_id : new ObjectId(data.id)},function (err,user){
        if(user){
          online.add(user.username);
          ws.user = user.username;
          emiter.emit("authenticated");
        }
        else{
          chgRes(res,"userNotFound",6,true);
          emiter.emit("authRequired");
        }
      });
      db.close();
    });
}
function chgRes(res,msg="NotImplemented",code=0,err=false){
  if(res.hasOwnProperty("err") && err){
    res.err++;
    if(res.hasOwnProperty("ok"))
      res.ok=false;
  }
  if(res.hasOwnProperty("msg") && Array.isArray(res.msg))
    res.msg.push({code:code,message:msg});
}
/*

res = {
  ok:boolean, true for success - false for fail
  err:numeric, count of Validation error
  msg:array<message> , message response {
    message:string
    code:numeric
  }
  ____: msg => each code has message {
   -1 => unknone
    0 => okey
    1 => usernameRequired
    2 => passwordRequired
    3 => nameRequired
    4 => usernameAlreadyExist
    5 => invalidJsonRequest
    6 => loginFail
    7 => tokenRequired
    8 => usernameNotFound
    9 => invalidId
    A => contactAlreadyAdded
    B => malformId
  }
}

*/
function wsLogin(ws){
  let Emiter = new events.EventEmitter();
  return function(message){
    let res = {ok:true,err:0,msg:[]};
    try{
      let data = JSON.parse(message);
      if(!data.hasOwnProperty('username'))
        chgRes(res,"usernameRequired",1,true);
      if(!data.hasOwnProperty('password'))
        chgRes(res,"passwordRequired",2,true);

      Emiter.on("ok",function(){
        new mongo(mongoURL).connect(function(err,db){
          let dbo = db.db("star");
          dbo.collection("users").findOne({username:data.username},function(err,result){
             res.userId = result._id.toString();
             res.token = result.token;
          });
          db.close();
        });
      });
      new mongo(mongoURL).connect(function(err,db){
        let dbo = db.db("star");
        dbo.collection("users").find({username:data.username,password:data.password}).count(function (err,size){
          if(size === 1){
            Emiter.emit("ok");
            chgRes(res,"loginSuccessfully");
          }
          else
            chgRes(res,"loginFailed",6,true);
        });
        db.close();
      });
      
    }catch(err){
      chgRes(res,"invalidJsonRequest",5,true);
      console.error(err);
    }
    setTimeout(function(){
      ws.send(JSON.stringify(res))
    },2000);
  }
}
function wsRegister(ws){
  let responseEmiter = new events.EventEmitter();
  return function(message){
    let res = {ok:true,err:0,msg:[]};
    try{
      let data = JSON.parse(message);
      if(!data.hasOwnProperty('username'))
        chgRes(res,"usernameRequired",1,true);
      else if(data.username.length == 0)
        chgRes(res,"usernameRequired",1,true);
      if(!data.hasOwnProperty('password'))
        chgRes(res,"passwordRequired",2,true);
      else if(data.password.length == 0)
        chgRes(res,"passwordRequired",2,true);
      if(!data.hasOwnProperty('name'))
        chgRes(res,"nameRequired",3,true);
      else if(data.name.length == 0)
        chgRes(res,"nameRequired",3,true);
      responseEmiter.on("change",function(){
        if(res.ok)
          new mongo(mongoURL).connect(function(err,db){
            let dbo = db.db("star");
            data.token = generateKey();
            res.token = data.token;
            data.contact = [];
            dbo.collection("users").insertOne(data,function(err,result){
              res.userId = result.insertedId.toString();
            });
            db.close();
          });
      });
      if(res.ok)
        new mongo(mongoURL).connect(function(err,db){
          let dbo = db.db("star");
          dbo.collection("users").find({username:data.username}).count(function (err,size){
            if(size !== 0)
              chgRes(res,"usernameAlreadyExist",4,true);
            else{
              responseEmiter.emit("change");
              chgRes(res,"registerdSuccessfully",0);
            }
          });
          db.close();
        });
      
    }catch(err){
      chgRes(res,"invalidJsonRequest",5,true);
    }
    setTimeout(function(){
      ws.send(JSON.stringify(res))
    },2000);
  }
}
function wsAddContact(ws,data,res,emiter){
  let user = null;
  let contact = null;
  if(!data.hasOwnProperty('username'))
    chgRes(res,"usernameRequired",3,true);
  if(res.ok){
    new mongo(mongoURL).connect(function(err,db){
      let dbo = db.db("star");
      dbo.collection("users").findOne({_id:new ObjectId(data.id)},function(err,result){
        user = result;
      });
      
      dbo.collection("users").find({username:data.username}).toArray(function(err,result){
        if(result.length == 0)
          chgRes(res,"usernameNotFound",8,true);
        else if(user != null && result.length == 1 )
          if(user.contact.includes(data.username))
            chgRes(res,"contactAlreadyAdded",0xA,true);
          else
            contact = result[0];
        else if(result.length>1)
          chgRes(res,"500 multipleUsername",-1,true);
          emiter.emit("change");
      });
      db.close();
    })
  }
  emiter.on("change",function(){
    if(res.ok && user != null && contact != null)
      new mongo(mongoURL).connect(function(err,db){
        let dbo = db.db("star");
        dbo.collection("users").updateOne({_id:new ObjectId(data.id)},{$push:{contact:contact.username}},function(err,result){
          if(result.result.n === 1)
            chgRes(res,"contactAddesSuccessfully",0);
          else
            chgRes(res,"500 ServerError",-1,true);
        });
        db.close();
      });
  });
  setTimeout(function(){
    ws.send(JSON.stringify(res))
  },2000);
  
}
function wsRemoveContact(ws,data,res,emiter){
  
}
function wsGetUpdate(ws,data,res,emiter){
  if(res.ok)
  {
    new mongo(mongoURL).connect(function(err,db){
      let dbo = db.db("star");
      dbo.collection("users").findOne({_id:new ObjectId(data.id)},function(err,result){
      });
      db.close();
    });
  }
}
function generateKey(){
  let key = "v$";
  function random(min,max) {
    return String.fromCharCode(Math.floor(Math.random() * (max - min) + min));
  } 
  for(let i=0;i<10;i++){
    let seed = Math.floor(Math.random()*100)%3;
    switch(seed){
      case 0:
        key+=random(48,57);
        break;
      case 1:
        key+=random(97,122);
        break;
      case 2:
        key+=random(65,90);
        break;
    }
  }
  return key;
}
