const express = require("express");
const bodyParser = require("body-parser");
const sql = require("mssql");
const cors = require("cors");
const app = express();

// the classesQueries will hold all the functions handling SQL requests to the Classes table.
const classesQueries = require("./queries/classes");
// the cancellationRequestsQueries will hold all the functions handling SQL requests to the CancellationRequests table.
const cancellationRequestsQueries = require("./queries/cancellation_requests");
const courseRequestsQueries = require("./queries/course_requests");

// import the dbConfig object from another file where we can hide it.
const dbConfig = require("./logins");

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
      res.status(400).json({ error: "The reason can not be null." });
      return;
    }
    if (classID === null) {
      res.status(400).json({ error: "The classID can not be null." });
      return;
    }

    // Two checks are run prior to actually creating the record. Those checks are imbricated using callbacks. If both are successful, the final request will be run.
    classesQueries.checkIfClassExistsWithID(sql, res, classID, () => {
      cancellationRequestsQueries.checkIfNoPendingRequestForSameClass(
        sql,
        res,
        classID,
        () => {
          cancellationRequestsQueries.createCancellationRequest(
            sql,
            res,
            classID,
            reason
          );
        }
      );
    });
  });
});

/**
 * Gets all the classes assigned to a tutor that happened less than 10 days ago or that will happen in the future.
 *
 * The GET request to this endpoint should hold 1 parameter: the tutor's discord ID
 *
 * If successful, the request will return a status of 200, if not it will return the error as well as a status of 400.
 */
app.get("/tutor_classes/:discord_username", function (req, res) {
  sql.connect(dbConfig, function (err) {
    if (err) console.log(err);

    const discordUsername = req.params.discord_username;

    if (discordUsername === null) {
      res.status(400).json({ error: "Discord username can not be null" });
      return;
    }

    classesQueries.getTutorClasses(sql, res, discordUsername);
  });
});

/**
 * Get the total number of course requests in the database.
 *
 * If successful, the request will return a status of 200, if not it will return the error as well as a status of 400.
 */
app.get("/course_requests_number", function (req, res) {
  sql.connect(dbConfig, function (err) {
    if (err) console.log(err);
    courseRequestsQueries.getNumberOfCourseRequests(sql, res);
  });
});

// Empty route to GET all the new course requests.
app.get("/new_course_requests", function (req, res) {
  console.log("Request Received: GET new course requests");
});

// Empty route to POST new tutor demands.
app.post("/tutor_demand", function (req, res) {
  console.log("Request Received: POST a tutor demand request");
});

// Empty route to POST reschedulling requests.
app.post("/rescheduling_request", function (req, res) {
  console.log("Request Received: POST a reschedulling request");
});

// Empty route to POST feedback requests.
app.post("/feedback_creation", function (req, res) {
  console.log("Request Received: POST a feedback request");
});

/**
 * DEMO FUNCTION (this function only serves demonstration purposes and is to be deleted before delivering the API)
 *
 * GET all records from students table.
 * Test URL: http://localhost:8080/students
 */
app.get("/students", function (req, res) {
  // Connecting to the database.
  sql.connect(dbConfig, function (err) {
    if (err) console.log(err);

    // Creating a request object.
    const request = new sql.Request();

    // Running the query.
    request.query("select * from Students", function (err, recordset) {
      if (err) console.log(err);
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
app.get("/students/:studentid", function (req, res) {
  sql.connect(dbConfig, function (err) {
    if (err) console.log(err);

    const request = new sql.Request();

    request
      .input("studentid", sql.Int, req.params.studentid)
      .query(
        "select * from Students where ID = @studentid",
        function (err, recordset) {
          if (err) console.log(err);
          // send records as a response
          res.send(recordset);
        }
      );
  });
});

/**
 * DEMO FUNCTION (this function only serves demonstration purposes and is to be deleted before delivering the API)
 *
 * TThis is to show how to insert multiple inputs being INT and NVARCHAR.
 * Test URL: http://localhost:8080/students/3/Tuna (returns student id = 3 ALİ and Tuna)
 */
app.get("/students/:studentid/:studentname", function (req, res) {
  // connect to your database
  sql.connect(dbConfig, function (err) {
    if (err) console.log(err);

    const request = new sql.Request();

    request
      .input("studentid", sql.Int, req.params.studentid)
      .input("studentname", sql.NVarChar, req.params.studentname)
      .query(
        "select * from Students where ID = @studentid or Name = @studentname",
        function (err, recordset) {
          if (err) console.log(err);
          // send records as a response
          res.send(recordset);
        }
      );
  });
});

app.get("/tutors_test", function (req, res) {
  sql.connect(dbConfig, function (err) {
    if (err) console.log(err);

    const request = new sql.Request();

    request.query("select * from TUTORS", function (err, recordset) {
      if (err) console.log(err);
      // send records as a response
      res.send(recordset);
    });
  });
});

app.get("/courses_test", function (req, res) {
  sql.connect(dbConfig, function (err) {
    if (err) console.log(err);

    const request = new sql.Request();

    request.query("select * from COURSES", function (err, recordset) {
      if (err) console.log(err);
      // send records as a response
      res.send(recordset);
    });
  });
});

app.get("/classes_test", function (req, res) {
  sql.connect(dbConfig, function (err) {
    if (err) console.log(err);

    const request = new sql.Request();

    request.query("select * from Classes", function (err, recordset) {
      if (err) console.log(err);
      // send records as a response
      res.send(recordset);
    });
  });
});

app.get("/tutors_test", function (req, res) {
  sql.connect(dbConfig, function (err) {
    if (err) console.log(err);

    const request = new sql.Request();

    request.query("select * from tutors", function (err, recordset) {
      if (err) console.log(err);
      // send records as a response
      res.send(recordset);
    });
  });
});
