const express = require("express");
const bodyParser = require("body-parser");
const sql = require("mssql");
const cors = require('cors');
const app = express();

// the classesQueries will hold all the functions handling SQL requests to the Classes table.
const classesQueries = require("./queries/classes");
// the cancellationRequestsQueries will hold all the functions handling SQL requests to the CancellationRequests table.
const cancellationRequestsQueries = require("./queries/cancellation_requests");

// import the dbConfig object from another file where we can hide it.
const dbConfig = require("./logins")

// Body Parser Middleware
app.use(bodyParser.json());
app.use(cors());

//Setting up server
const server = app.listen(process.env.PORT || 8080, function () {
    const port = server.address().port;
    console.log("App now running on port", port);
});

/**
 * Creates a new Cancellation Request.
 * 
 * The POST request to this endpoint should hold 2 parameters:
 * class_ID: the ID of the class that is requested to be cancelled
 * reason: the reason of the cancellation as indicated by the tutor
 * 
 * If successful, the request will return a status of 200, if not it will return the error as well as a status of 400.
 */
app.post("/cancellation_request", function (req, res) {
    // Connecting to the database.
    sql.connect(dbConfig, function (err) {
        if (err) console.log(err);

        const classID = req.body.class_ID;
        const reason = req.body.reason;
        if (reason === null) {
            res.status(400).json({
                error: "The reason can not be null."
            })
            return;
        }
        if (classID === null) {
            res.status(400).json({
                error: "The classID can not be null."
            })
            return;
        }

        // Two checks are run prior to actually creating the record. Those checks are imbricated using callbacks. If both are successful, the final request will be run.
        classesQueries.checkIfClassExistsWithID(sql, res, classID, () => {
            cancellationRequestsQueries.checkIfNoPendingRequestForSameClass(sql, res, classID, () => {
                cancellationRequestsQueries.createCancellationRequest(sql, res, classID, reason)
            })
        });
    });

});

/**
 * TEST (This is a test route that needs to be removed before merging ticket T15 in)
 * 
 * It will return all the CancellationRequests records in the databse so you can check the CancellationRequests are created properly by the previous endpoint.
 */
app.get("/cancellation_request_test", function (req, res) {
    // connect to your database
    sql.connect(dbConfig, function (err) {

        if (err) console.log(err);

        // create Request object
        const request = new sql.Request();

        // query to the database and get the records
        request.query('select * from CancellationRequests', function (err, recordset) {

            if (err) console.log(err)
            // send records as a response
            res.send(recordset);
        });
    });
})

// Empty route to GET the number of course requests.
app.get("/course_requests_number", function (req, res) {
    console.log("Request Received: GET number of course requests");
    res.send("Course Request Number")
});

// Empty route to GET all the classes assigned to a tutor based on his/her Discord username.
app.get("/tutor_classes/:discord_username", function (req, res) {
    console.log("Request Received: GET tutor classes whose status is unknown");
});

// Empty route to POST new tutor demands.
app.post("/tutor_demand", function (req, res) {
    console.log("Request Received: POST a tutor demand request");
})

// Empty route to POST reschedulling requests.
app.post("/rescheduling_request", function (req, res) {
    console.log("Request Received: POST a reschedulling request");
})

// Empty route to POST feedback requests.
app.post("/feedback_creation", function (req, res) {
    console.log("Request Received: POST a feedback request");
})

/**
 * DEMO FUNCTION (this function only serves demonstration purposes and is to be deleted before delivering the API)
 * 
 * GET all records from students table.
 * Test URL: http://localhost:8080/students
 */
app.get('/students', function (req, res) {
    // Connecting to the database.
    sql.connect(dbConfig, function (err) {

        if (err) console.log(err);

        // Creating a request object.
        const request = new sql.Request();

        // Running the query. 
        request.query('select * from Students', function (err, recordset) {

            if (err) console.log(err)
            // Sending the records as a response.
            res.send(recordset);
        });
    });
});

/**
 * DEMO FUNCTION (this function only serves demonstration purposes and is to be deleted before delivering the API)
 * 
 * This is to show how to insert one input INT value into SQL query. 
 * Test URL: http://localhost:8080/students/1
 */
app.get('/students/:studentid', function (req, res) {
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

/**
 * DEMO FUNCTION (this function only serves demonstration purposes and is to be deleted before delivering the API)
 * 
 * TThis is to show how to insert multiple inputs being INT and NVARCHAR. 
 * Test URL: http://localhost:8080/students/3/Tuna (returns student id = 3 ALİ and Tuna)
 */
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

// Route to GET all the new course requests.
// url is http://localhost:8080/new_course_requests
app.get("/new_course_requests", function (req, res) {
    sql.connect(dbConfig, err => {

        //if db.courseRequest updated then 'select last row from courseRequest T'

        if (err) console.log(err);

        const request = new sql.Request();

        request
            .query('select * from CourseRequests where status = 0', function (err, recordset) {

                if (err) console.log(err)
                // send records as a response
                res.send(recordset);
            })
            .query('update CourseRequests set status = 1 where status = 0', function (err, recordset) {
                if (err) console.log(err)
                console.log("New course request(s) have been updated.");
            });
    });
});

