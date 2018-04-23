var Themeparks = require("themeparks");
var express = require('express');
var bodyParser = require('body-parser')
var mysql = require('mysql');
var router = express.Router()

var app = express();
var http = require('http').Server(app);
var io = require('socket.io')(http);
var moment = require('moment')

// SQL Connection
var con = mysql.createConnection({
  host: "localhost",
  user: "dpwt",
  password: "2XJw$!G&Lsup5fG",
  database: "disneyparkswaitingtimes"
  // user: "root",
  // password: "",
  // database: "themepark"
});

con.connect(function (err) {
  if (err) throw err;
  console.log("Connected!");
});

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));
app.locals.moment = require('moment')
app.set('views', './views')
app.set('view engine', 'pug');

var something = function () {
  // var executed = false;
  // return function () {
  //   if (!executed) {
  console.log("1")
  var now = moment().format("YYYY/MM/DD")
  executed = true;
  // Update data
  var query = "SELECT * FROM tbl_park WHERE park_name LIKE '%Disney%'";
  con.query(query, (err, result) => {
    if (err) return console.log(err);
    if (result.length > 0) {
      var r = []
      var all = [];

      for (var park in Themeparks.Parks) {
        if (result.findIndex(x => x.park_apiname == park) > -1) {
          var data = new Themeparks.Parks[park]();
          var replacestring = data.Name.replace("'", "");
          r.push(data)
        }
      }

      r.forEach((re) => {
        var o = '';
        var c = '';
        re.GetOpeningTimes().then(function (open) {
          var index = result.findIndex(x => x.park_name == re.Name)
          if (index > -1) {
            if (open[0].openingTime > result[index].park_opening_time) {
              if (open[0].openingTime < new Date) {
                var up = "UPDATE tbl_park SET park_opening_time = '" + open[1].openingTime + "',park_closing_time = '" + open[1].closingTime + "', park_type = '" + open[1].type + "' WHERE park_name = '" + re.Name.replace("'", "") + "'";
                con.query(up, function (err, result) {
                  if (err) throw err;
                  // console.log("1 updated")
                  io.sockets.emit('updatePark');
                });
              } else {
                var up = "UPDATE tbl_park SET park_opening_time = '" + open[0].openingTime + "',park_closing_time = '" + open[0].closingTime + "', park_type = '" + open[0].type + "' WHERE park_name = '" + re.Name.replace("'", "") + "'";
                con.query(up, function (err, result) {
                  if (err) throw err;
                  // console.log("1 updatedd")
                  io.sockets.emit('updatePark');
                });
              }
            } else {
              // console.log("All up to date")
              io.sockets.emit('updatePark');
            }
          }
        }, (err) => {
          // console.log("Error updating parks :: " + err)
          io.sockets.emit('updatePark');
        }).then(function () {
          con.query('SELECT * FROM tbl_ride', (err, rideData) => {
            if (err) return err;
            if (rideData.length > 0) {
              re.GetWaitTimes().then((rides) => {
                for (var j = 0, ride; ride = rides[j++];) {
                  var index = rideData.findIndex(x => x.ride_name.replace(/[^\w\s]/gi, '') == ride.name.replace(/[^\w\s]/gi, ''))
                  if (index < 0) {
                    var sql = "INSERT INTO tbl_ride(park_id,ride_name,ride_wait_time) VALUES ('" + element.park_id + "','" + ride.name.replace(/[^\w\s]/gi, '') + "','" + ride.waitTime + "')";
                    con.query(sql, function (err, result) {
                      if (err) throw err;
                      // console.log(result.affectedRows + " rides(s) added");
                      io.sockets.emit('updatePark');
                    });
                  } else {
                    if (rideData[index].ride_wait_time != ride.waitTime) {
                      var que = "UPDATE tbl_ride SET ride_wait_time = " + (isNaN(ride.waitTime) ? 0 : ride.waitTime) + " WHERE ride_id =" + rideData[index].ride_id;
                      // console.log(que)
                      con.query(que, function (err, rideResult) {
                        if (err) throw err;
                        // console.log(rideResult.affectedRows + " ride wait-time updated");
                        io.sockets.emit('updateTime');
                      });
                    }
                  }
                }
              }, (err) => {
                // console.log("No ride to add")
              })
              // });
            } else {
              // result.forEach(element => {
              re.GetWaitTimes().then((rides) => {
                for (var j = 0, ride; ride = rides[j++];) {
                  var sql = "INSERT INTO tbl_ride(park_id,ride_name,ride_wait_time) VALUES ('" + element.park_id + "','" + ride.name.replace(/[^\w\s]/gi, '') + "','" + ride.waitTime + "')";
                  con.query(sql, function (err, result) {
                    if (err) throw err;
                    // console.log(result.affectedRows + " record(s) inserted");
                  });
                }
              }, (err) => {
                // console.log("No ride found")
              })
              // });
            }
          })
        })
      })
    } else {
      console.log("No Data found")
    }
  })
}

app.get('/', function (req, res) {
  var all = []
  var query = "SELECT * FROM tbl_park WHERE park_name LIKE '%Disney%'";
  con.query(query, function (err, result) {
    if (err) return console.log("Error fetching rides");
    con.query("SELECT park_id from tbl_ride", function (err, rides) {
      if (err) return err
      rides.forEach(element => {
        if (all.indexOf(element.park_id) === -1) {
          all.push(element.park_id);
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

var callParks = function () {
  console.log("MATER")
  // io.sockets.emit('updatePark');
  con.query("SELECT * FROM tbl_park", function (err, result, fields) {
    if (err) return console.log("1st :: " + err);
    if (result.length > 0) {
      con.query('SELECT * FROM tbl_ride', (err, rideData) => {
        if (err) return err;
        if (rideData.length > 0) {
          result.forEach(element => {
            var disneyMagicKingdom = new Themeparks.Parks[element.park_apiname]();
            disneyMagicKingdom.GetWaitTimes().then((rides) => {
              for (var j = 0, ride; ride = rides[j++];) {
                var index = rideData.findIndex(x => x.ride_name.replace(/[^\w\s]/gi, '') == ride.name.replace(/[^\w\s]/gi, ''))
                if (index < 0) {
                  var sql = "INSERT INTO tbl_ride(park_id,ride_name,ride_wait_time) VALUES ('" + element.park_id + "','" + ride.name.replace(/[^\w\s]/gi, '') + "','" + ride.waitTime + "')";
                  con.query(sql, function (err, result) {
                    if (err) throw err;
                    // console.log(result.affectedRows + " rides(s) added");
                    io.sockets.emit('updatePark');
                  });
                } else {
                  if (rideData[index].ride_wait_time != ride.waitTime) {
                    var que = "UPDATE tbl_ride SET ride_wait_time = " + (isNaN(ride.waitTime) ? 0 : ride.waitTime) + " WHERE ride_id =" + rideData[index].ride_id;
                    // console.log(que)
                    con.query(que, function (err, rideResult) {
                      if (err) throw err;
                      // console.log(rideResult.affectedRows + " ride wait-time updated");
                      io.sockets.emit('updateTime');
                    });
                  }
                }
              }
            }, (err) => {

              // console.log("No ride to add")
            })
          });
        } else {
          result.forEach(element => {
            var disneyMagicKingdom = new Themeparks.Parks[element.park_apiname]();
            disneyMagicKingdom.GetWaitTimes().then((rides) => {
              for (var j = 0, ride; ride = rides[j++];) {
                var sql = "INSERT INTO tbl_ride(park_id,ride_name,ride_wait_time) VALUES ('" + element.park_id + "','" + ride.name.replace(/[^\w\s]/gi, '') + "','" + ride.waitTime + "')";
                con.query(sql, function (err, result) {
                  if (err) throw err;
                  // console.log(result.affectedRows + " record(s) inserted");
                });
              }
            }, (err) => {
              // console.log("No ride found")
            })
          });
        }
      })
    }
    io.sockets.emit('updatePark');
  });
}

something();
// callParks();
setInterval(something, 300000)
// setInterval(function () {
//   callParks();
//   // io.sockets.emit('updatePark');
// }, 100000);

http.listen(3000, () => {
  console.log('Listening on *:3000')
})