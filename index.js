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
    user_ref.once('value').then(async snapshot => {
        var value = snapshot.val();
        for (var key in value){
            if (value[key]['uid'] == uid){
                await user_ref.child(key + '/saviours').once('value').then(snapshot_saviour => {
                    var saviours = snapshot_saviour.val();
                    console.log(saviours);
                    return saviours;
                });
            }
        }
    });
}

getSaviours('test-user-1');

function getLastLocation(uid){
    user_ref.once('value').then(async snapshot => {
        var value = snapshot.val();
        for (var key in value){
            if (value[key]['uid'] == uid){
                await user_ref.child(key + '/logs').once('value').then((snapshot_location) => {
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

getLastLocation('test-user-1');

function sendAlert(uid, name){
    var saviours = getSaviours(uid);
    var lastLocation = getLastLocation(uid);
    for (var key in saviours){
        sendSms('Hi there! Last location of '+ name + ' is ' + lastLocation, saviours[key]['s_mobile']);
    }
}
async function call(){
    await client.calls
      .create({
         url: 'http://demo.twilio.com/docs/voice.xml',
         to: '+919580683998',
         from: '+12062028257'
       })
      .then(call => console.log(call.sid));
}
call();