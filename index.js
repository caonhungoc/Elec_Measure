const express = require("express");
const bodyParser = require('body-parser')
const firebase = require('firebase')

// Init firebase
firebase.initializeApp({
  serviceAccount: "./pem/test-6e1b0-firebase-adminsdk-npsg0-0dfe027c10.json",
  databaseURL: "https://test-6e1b0.firebaseio.com"
});

const NUMBER_OF_SAMPLE_CHART = 30;

var power_records = [];
var power1_records = [];
var power2_records = [];
var power3_records = [];

var timestamps = [];


//Init web-app
var app = express();
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({
  extended: true
}));
app.use(express.static("public"));
app.set("view engine", 'ejs');
app.set("views", "./views");
app.engine("html", require("ejs").renderFile);

function databaseListener() {

  firebase.database().ref("/Power1").on("value", (snapshot) => {
    console.log(`power1 ${snapshot.val()}`);
    io.emit("respond-env-info", {
      "device" : 1,
      "value": snapshot.val()
    });
  });

  firebase.database().ref("/Power2").on("value", (snapshot) => {
    console.log(`power2 ${snapshot.val()}`);
    io.emit("respond-env-info", {
      "device" : 2,
      "value": snapshot.val()
    });
  });

  firebase.database().ref("/Power3").on("value", (snapshot) => {
    console.log(`power3 ${snapshot.val()}`);
    io.emit("respond-env-info", {
      "device" : 3,
      "value": snapshot.val()
    });
  });

  firebase.database().ref("/Power4").on("value", (snapshot) => {
    console.log(`power4 ${snapshot.val()}`);
    io.emit("respond-env-info", {
      "device" : 4,
      "value": snapshot.val()
    });
  });

  firebase.database().ref("/DEV1").on("value", (snapshot) => {
    console.log(`Dev1 ${snapshot.val()}`);
    io.emit("response-pin-info", {
      "device" : 1,
      "value": snapshot.val()
    });
  });

  firebase.database().ref("/DEV2").on("value", (snapshot) => {
    console.log(`Dev2 ${snapshot.val()}`);
    io.emit("response-pin-info", {
      "device" : 2,
      "value": snapshot.val()
    });
  });

  firebase.database().ref("/DEV3").on("value", (snapshot) => {
    console.log(`Dev3 ${snapshot.val()}`);
    io.emit("response-pin-info", {
      "device" : 3,
      "value": snapshot.val()
    });
  });

}

app.get("/", (req, res) => {
  res.render("index.html");
})

var server = require("http").Server(app);
var io = require("socket.io")(server);

server.listen(3000);

io.on("connection", (socket) => {

  io.on("disconnect", () => {});

  socket.on("pin-control", (data) => {
    var ref = firebase.database().ref(`${data.pin}`);
    ref.set(data.state);
  });

});

setInterval(() => {

  var time = new Date().toLocaleString("en-US", {
    timeZone: "Asia/Ho_Chi_Minh"
  });

  firebase.database().ref("Power1").once("value").then((snapshot)=> {
    power_records.push(snapshot.val());
    if (power_records.length > NUMBER_OF_SAMPLE_CHART)
      power_records.shift();
  });

  firebase.database().ref("Power2").once("value").then((snapshot)=> {
    power1_records.push(snapshot.val());
    if (power1_records.length > NUMBER_OF_SAMPLE_CHART)
      power1_records.shift();
  });

  firebase.database().ref("Power3").once("value").then((snapshot)=> {
    power2_records.push(snapshot.val());
    if (power2_records.length > NUMBER_OF_SAMPLE_CHART)
      power2_records.shift();
  });

  firebase.database().ref("Power4").once("value").then((snapshot)=> {
    power3_records.push(snapshot.val());
    if (power3_records.length > NUMBER_OF_SAMPLE_CHART)
      power3_records.shift();
  });

  time = new Date(time);
  timestamps.push(time.toLocaleTimeString());

  if (timestamps.length > NUMBER_OF_SAMPLE_CHART)
      timestamps.shift();
  io.emit("data-for-chart", {
    "power1": power_records,
    "power2": power1_records,
    "power3": power2_records,
    "power4": power3_records,
    "time": timestamps
  });
}, 3000);

databaseListener();