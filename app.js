var express = require("express");
var bodyParser = require("body-parser");
var sql = require("mssql");
var cors = require('cors');
var app = express(); 
var dbConfig = require("./databaseLogins")

// Body Parser Middleware
app.use(bodyParser.json()); 
app.use(cors());

//Setting up server
 var server = app.listen(process.env.PORT || 8080, function () {
    var port = server.address().port;
    console.log("App now running on port", port);
 });

app.get("/course_requests_number", function(req , res){
    console.log("Request Received: GET number of course requests");
});

app.get("/tutor_classes/:discord_username", function(req , res){
    console.log("Request Received: GET tutor classes whose status is unknown");
});

app.get("/new_course_requests", function(req,res){
    console.log("Request Received: GET new course requests");
});

app.post("/tutor_demand_creation", function(req,res){
    console.log("Request Received: POST a tutor demand request");
})

app.post("/cancellation_request_creation", function(req,res){
    console.log("Request Received: POST a cancellation request");
})

app.post("/rescheduling_request_creation", function(req,res){
    console.log("Request Received: POST a reschedulling request");
})

app.post("/feedback_creation", function(req,res){
    console.log("Request Received: POST a feedback request");
})
