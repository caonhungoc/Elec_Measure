const express = require("express");
const bodyParser = require('body-parser')
const firebase = require('firebase')
const {google} = require("googleapis");
var nodemailer = require('nodemailer');

const OAuth2 = google.auth.OAuth2;
const OAuth2Credential = require("./pem/client_secret_157340596620-n6bk79echn2dgb52upq2ipgks020jbor.apps.googleusercontent.com.json");

//Cap quyen gui mail 
const oauth2client = new OAuth2(
  `${OAuth2Credential.web.client_id}`,
  `${OAuth2Credential.web.client_secret}`,
  `${OAuth2Credential.web.redirect_uris}`
)

oauth2client.setCredentials({
  refresh_token: OAuth2Credential.web.refresh_token
});
const accessToken = oauth2client.getAccessToken();

//Creater a transporter
var transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    type: "OAuth2",
    user: OAuth2Credential.user,
    clientId: OAuth2Credential.web.client_id,
    clientSecret: OAuth2Credential.web.client_secret,
    refreshToken: OAuth2Credential.web.refresh_token,
    accessToken: accessToken
  }
});

// Init firebase
firebase.initializeApp({
  serviceAccount: "./pem/test-6e1b0-firebase-adminsdk-npsg0-0dfe027c10.json",
  databaseURL: "https://test-6e1b0.firebaseio.com"
});

const NUMBER_OF_SAMPLE_CHART = 30;
const RECEIVERS = ["baoanh2309.97@gmail.com","15141099@student.hcmute.edu.vn"];
const TIMER_INTERVAL = 180000;

var intervalTimer;

var power_records = [];
var power1_records = [];
var power2_records = [];
var power3_records = [];
var water_records = [];
var timestamps = [];
var power_threshold = 0;
var water_threshold = 0;
var intervalTimerStarted = false;
var mailSent = false;

var mailOptions = {
  from: "Firebase <anhngo1333@gmail.com>",
  to: RECEIVERS,
  subject: "Cảnh báo",
  text: "Thiết bị của bạn chưa được tắt."
}

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

function timerCallback() {
  transporter.sendMail(mailOptions, function (error, info) {
    if (error)
      console.log(error);
  });
}

function databaseListener() {

  firebase.database().ref("/settings").on("value", (snapshot) => {
    power_threshold = snapshot.child("power_threshold").val();
    water_threshold = snapshot.child("water_threshold").val();
  });

  firebase.database().ref("/sensor_values").on("value", (snapshot) => {
    if (snapshot.hasChild("power") && snapshot.hasChild("water_flow_rate")) {
      var _current_power_record = snapshot.child("power").val();
      var _current_water_record = snapshot.child("water_flow_rate").val();
      var _door_locked = snapshot.child("door_locked").val();
      power_records.push(_current_power_record);
      water_records.push(_current_water_record);
      var time = new Date().toLocaleString("en-US", {
        timeZone: "Asia/Ho_Chi_Minh"
      });
      time = new Date(time);
      timestamps.push(time.toLocaleTimeString());

      if (power_records.length > NUMBER_OF_SAMPLE_CHART)
        power_records.shift();
      if (water_records.length > NUMBER_OF_SAMPLE_CHART)
        water_records.shift();
      if (timestamps.length > NUMBER_OF_SAMPLE_CHART)
        timestamps.shift();
      io.emit("data-available", {
        "timestamp": timestamps,
        "power": power_records,
        "water_flow": water_records
      });

      if (_door_locked) {
        if (_current_power_record >= power_threshold || _current_water_record >= water_threshold) {
          if (!mailSent) {
            transporter.sendMail(mailOptions, (error, info) => {
              if (error)
                console.log(error);
              else {
                mailSent = true;
                if (!intervalTimerStarted) {
                  intervalTimer = setInterval(timerCallback, TIMER_INTERVAL);
                  intervalTimerStarted = true;
                }
              }
            });
          }
        }
      }
      if (_current_power_record < power_threshold && _current_water_record < water_threshold && intervalTimerStarted || !_door_locked) {
        intervalTimerStarted = false;
        clearInterval(intervalTimer);
        mailSent = false;
      }
    }
  });

  firebase.database().ref("/feedback/ssr_pin_feedback").on("value", (snapshot) => {
    var ssr_pin_value = snapshot.val();
    io.emit("ssr_pin_state_change", {
      "ssr_pin_value": ssr_pin_value
    });
  });

  firebase.database().ref("/feedback/valve_pin_feedback").on("value", (snapshot) => {
    var valve_pin_value = snapshot.val();
    io.emit("valve_pin_state_change", {
      "valve_pin_value": valve_pin_value
    });
  });

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