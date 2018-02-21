// process.env.NODE_TLS_REJECT_UNAUTHORIZED = "0";

var Themeparks = require("themeparks");
var express = require('express');
var bodyParser = require('body-parser')
var Themeparks = require("themeparks");
var mysql = require('mysql');
var dateTime = require('node-datetime');
var dt = dateTime.create();
var formatted = dt.format('Y-m-d');
var router = express.Router()

// SQL Connection
var con = mysql.createConnection({
  host: "localhost",
  user: "root",
  // password: "",
  password: "Sdzc@123sd",
  database: "themepark"
});

con.connect(function (err) {
  if (err) throw err;
  console.log("Connected!");
});

var app = express();
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));
app.locals.moment = require('moment')
app.set('views', './views')
app.set('view engine', 'pug')

// Testing
// app.get('/reed', (req, res) => {
//   var disneyMagicKingdom = new Themeparks.Parks.TokyoDisneyResortMagicKingdom();
//   disneyMagicKingdom.GetWaitTimes().then(function (rides) {
//     res.send(rides)
//     for (var i = 0, ride; ride = rides[i++];) {
//       console.log(ride.name + ": " + ride.waitTime + " minutes wait");
//     }
//   }, (err) => {
//     res.send(err)
//   });
// })

app.get('/', function (req, res) {
  var all = []
  var query = "SELECT * FROM tbl_park WHERE park_name LIKE '%Disney%'";
  con.query(query, function (err, result) {
    if (err) return console.log("Error fetching rides");
    con.query("SELECT park_id from tbl_ride", function (err, rides) {
      if (err) return console.log('No rides')
      rides.forEach(element => {
        if (all.indexOf(element.park_id) === -1) {
          all.push(element.park_id)
        }
      });
      res.render('parks', {
        docs: result,
        rides: all
      })
    })
  })
});

app.get('/ride/:id', function (req, res) {
  var query = "SELECT tbl_ride.ride_id, tbl_ride.ride_name, tbl_ride.ride_wait_time, tbl_park.park_name FROM tbl_ride INNER JOIN tbl_park ON tbl_ride.park_id = tbl_park.park_id where tbl_ride.park_id =" + req.params.id
  con.query(query, function (err, result) {
    if (err) return res.send(err);
    res.render('rides', {
      docs: result
    })
  })
})

app.post('/insertRide', function (req, res) {
  con.query("SELECT * FROM tbl_park", function (err, result, fields) {
    if (err) throw err;
    var parkapiname = [];
    var parkid = [];
    var k = 0;
    result.forEach(element => {
      var disneyMagicKingdom = new Themeparks.Parks[element.park_apiname]();
      disneyMagicKingdom.GetWaitTimes().then((rides) => {
        for (var j = 0, ride; ride = rides[j++];) {
          var sql = "INSERT INTO tbl_ride(park_id,ride_name,ride_wait_time) VALUES ('" + element.park_id + "','" + ride.name.replace(/[^\w\s]/gi, '') + "','" + ride.waitTime + "')";
          con.query(sql, function (err, result) {
            if (err) throw err;
            console.log(result.affectedRows + " record(s) updated");
          });
        }
      }, (err) => {
        console.log("No ride found")
      })
    });
  });
})

app.listen(3000);
console.log("Express server listening on port 3000");
