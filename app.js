// process.env.NODE_TLS_REJECT_UNAUTHORIZED = "0";

var Themeparks = require("themeparks");
var mysql = require('mysql')
var probe = require('console-probe').apply()

con = mysql.createConnection({
    host: 'localhost',
    user: 'root',
    password: '',
    database: 'themepark'
})

con.connect(function (err) {
    if (err) console.log(err);
    console.log('Connected')
})

for (var park in Themeparks.Parks) {
    // console.log("* " + new Themeparks.Parks[park]().Name + " (DisneyAPI." + park + ")");
}

var disneyMagicKingdom = new Themeparks.Parks.AsterixPark();

disneyMagicKingdom.GetWaitTimes().then(function (rides) {
    console.log(rides)
    for (var i = 0, ride; ride = rides[i++];) {
        // console.log(ride.name.replace(/[^\w\s]/gi, ''))
        // ShanghaiDisneyResortMagicKingdom
        var sql = "INSERT INTO tbl_ride(park_id,ride_name,ride_wait_time) VALUES ('" + 1 + "','" + (ride.name.replace(/[^\w\s]/gi, '')) + "','" + ride.waitTime + "')";
        // con.query(sql, function (err, result) {
        //     if (err) throw err;
        //     console.log(result.affectedRows + " record(s) updated");
        // });
        // console.log(ride)
        // console.log(ride.name + ": " + ride.waitTime + " minutes wait");
    }
}, console.error);

disneyMagicKingdom.GetOpeningTimes().then(function (times) {
    for (var i = 0, time; time = times[i++];) {
        if (time.type == "Operating") {
            // console.log("[" + time.date + "] Open from " + time.openingTime + " until " + time.closingTime);
        }
    }
}, console.error);