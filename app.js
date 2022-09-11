const express = require("express");
const bodyParser = require("body-parser");
const sql = require("mssql");
const cors = require('cors');
const app = express(); 

// import the dbConfig object from another file wehre we can hide it.
const dbConfig = require("./logins")

// Body Parser Middleware
app.use(bodyParser.json()); 
app.use(cors());

//Setting up server
 const server = app.listen(process.env.PORT || 8080, function () {
    const port = server.address().port;
    console.log("App now running on port", port);
 });

 // GET all records from students table 
 // url: http://localhost:8080/students
 app.get('/students', function (req, res) {
    // connect to your database
    sql.connect(dbConfig, function (err) {   

        if (err) console.log(err);

        // create Request object
        const request = new sql.Request();

        // query to the database and get the records
        request.query('select * from Students', function (err, recordset) {

            if (err) console.log(err)
            // send records as a response
            res.send(recordset);

        });
    });
});

 // This is to show how to insert one input INT value into SQL query. 
 // url: http://localhost:8080/students/1
app.get('/students/:studentid', function (req, res) {
// connect to your database
    sql.connect(dbConfig, function (err) {   

        if (err) console.log(err);

        const request = new sql.Request();
        
        request
        .input('studentid', sql.Int, req.params.studentid)
        .query('select * from Students where ID = @studentid', function (err, recordset) {
            
            if (err) console.log(err)
            // send records as a response
            res.send(recordset);
            
        });
    });
});

 // This is to show how to insert multiple inputs being INT and NVARCHAR. 
 // url is http://localhost:8080/students/3/Tuna => returns student id = 3 ALİ and Tuna
 app.get('/students/:studentid/:studentname', function (req, res) {
    // connect to your database
        sql.connect(dbConfig, function (err) {   
    
            if (err) console.log(err);
    
            const request = new sql.Request();
            
            request
            .input('studentid', sql.Int, req.params.studentid)
            .input('studentname', sql.NVarChar, req.params.studentname)
            .query('select * from Students where ID = @studentid or Name = @studentname', function (err, recordset) {
                
                if (err) console.log(err)
                // send records as a response
                res.send(recordset);
                
            })

    
        });
    });

// Empty route to GET the number of course requests.
app.get("/course_requests_number", function(req , res){
    console.log("Request Received: GET number of course requests");
    res.send("Course Request Number")
});

// Empty route to GET all the classes assigned to a tutor based on his/her Discord username.
app.get("/tutor_classes/:discord_username", function(req , res){
    console.log("Request Received: GET tutor classes whose status is unknown");
});

// Route to GET all the new course requests.
// url is http://localhost:8080/new_course_requests
app.get("/new_course_requests", function(req,res) {
    sql.connect(dbConfig, err => {

        //if db.courseRequest updated then 'select last row from courseRequest T'

        if (err) console.log(err);

        const request = new sql.Request();

        request
            .query('select * CourseRequests where status = unkown', function (err, recordset) {
                
                if (err) console.log(err)
                // send records as a response
                res.send(recordset);    
            })
            .query('update CourseRequests set status = pending where status = unkown', function (err, recordset) {
                
                console.log("New course request(s) have been updated.");
                
            });
        });
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