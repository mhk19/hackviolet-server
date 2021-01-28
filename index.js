const admin = require('firebase-admin');
const express = require("express"); 
const bodyParser = require("body-parser") 
var accountSid = "AC9607a01188e9ea40161051a3679cf566";
var authToken = '8815f4dec383c641b70ce8f85fa9cd82';
var twilio = require('twilio');
var client = new twilio(accountSid, authToken);

const server = express();
server.use(bodyParser.json());
server.get('/', function (req, res) {
    res.send('GET request to the homepage');
})
server.post('/alert', function (req, res) {
    var uid = req.body.uid;
    var name = req.body.name;
    // sendAlert(uid, name);
    console.log(uid, name);
    res.send('POST request');
})

server.post('/safety-check', function (req, res) {
    var uid = req.body.uid;
    var name = req.body.name;
    console.log(uid, name);
    res.send('POST request');
})
  
const port = 3000
server.listen(port, () => {
    console.log(`Listening at http://localhost:${port}`);
})


async function sendSms(body, to){
    await client.messages
        .create({
            body: body,
            from: '+12062028257',
            to: to
        })
        .then((message) => console.log(message.sid));
}

var app = admin.initializeApp({databaseURL: 'https://hackvoilet-default-rtdb.firebaseio.com'})
var db = app.database();
var user_ref = db.ref("/users");

function getSaviours(uid){
    user_ref.once('value').then(snapshot => {
        var value = snapshot.val();
        for (var key in value){
            if (value[key]['uid'] == uid){
                user_ref.child(key + '/saviours').once('value').then(snapshot_saviour => {
                    var saviours = snapshot_saviour.val();
                    console.log(saviours);
                    return saviours;
                });
            }
        }
    });
}

function notify(token, data, title, body){
    var message = {
        notification: {
            title: title,
            body: body
        },
        data: data,
        token: token
      };
    admin.messaging().send(message)
    .then((response) => {
        // Response is a message ID string.
        console.log('Successfully sent message:', response);
    })
    .catch((error) => {
        console.log('Error sending message:', error);
    });
}

/* {
  type: 'safety-check' or 'protectee-danger',
  name:  
}*/

getFCMToken = (uid) => {
    user_ref.once('value').then(snapshot => {
        var value = snapshot.val();
        for (var key in value){
            if (value[key]['uid'] == uid){
                user_ref.child(key + '/fcmtoken').once('value').then(snapshot_saviour => {
                    var token = snapshot_saviour.val();
                    console.log(token);
                    return token;
                });
            }
        }
    });
}

function getLastLocation(uid){
    user_ref.once('value').then(snapshot => {
        var value = snapshot.val();
        for (var key in value){
            if (value[key]['uid'] == uid){
                user_ref.child(key + '/logs').once('value').then((snapshot_location) => {
                    var latestLocation = snapshot_location.val();
                    for (var l_key in latestLocation){
                        console.log(latestLocation[l_key]);
                        return latestLocation[l_key];   
                    }
                });
            }
        }
    });
}

function sendAlert(uid, name){
    var saviours = getSaviours(uid);
    var lastLocation = getLastLocation(uid);
    for (var key in saviours){
        sendSms('Hi there! Last location of '+ name + ' is ' + lastLocation, saviours[key]['s_mobile']);
        call(saviours[key]['s_mobile']);
    }
}

async function call(to){
    await client.calls
      .create({
         url: 'http://demo.twilio.com/docs/voice.xml',
         to: to,
         from: '+12062028257'
       })
      .then(call => console.log(call.sid));
}
