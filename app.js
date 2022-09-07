var express = require("express");
var bodyParser = require("body-parser");
var sql = require("mssql");
var cors = require('cors');
var app = express(); 

// import the dbConfig object from another file wehre we can hide it.
var dbConfig = require("./logins")

// Body Parser Middleware
app.use(bodyParser.json()); 
app.use(cors());

//Setting up server
 var server = app.listen(process.env.PORT || 8080, function () {
    var port = server.address().port;
    console.log("App now running on port", port);
 });

 app.get('/students', function (req, res) {
    // connect to your database
    sql.connect(dbConfig, function (err) {   

        if (err) console.log(err);

        // create Request object
        var request = new sql.Request();
           
        // query to the database and get the records
        request.query('select * from Students', function (err, recordset) {
            
            if (err) console.log(err)
            // send records as a response
            res.send(recordset);
            
        });
    });
});

// Empty route to GET the number of course requests.
app.get("/course_requests_number", function(req , res){
    console.log("Request Received: GET number of course requests");
});

// Empty route to GET all the classes assigned to a tutor based on his/her Discord username.
app.get("/tutor_classes/:discord_username", function(req , res){
    console.log("Request Received: GET tutor classes whose status is unknown");
});

// Empty route to GET all the new course requests.
app.get("/new_course_requests", function(req,res){
    console.log("Request Received: GET new course requests");
});

// Empty route to POST new tutor demands.
app.post("/tutor_demand_creation", function(req,res){
    console.log("Request Received: POST a tutor demand request");
})

// Empty route to POST cancellation requests.
app.post("/cancellation_request_creation", function(req,res){
    console.log("Request Received: POST a cancellation request");
})

// Empty route to POST reschedulling requests.
app.post("/rescheduling_request_creation", function(req,res){
    console.log("Request Received: POST a reschedulling request");
})

// Empty route to POST feedback requests.
app.post("/feedback_creation", function(req,res){
    console.log("Request Received: POST a feedback request");
})

