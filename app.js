/**
 * This is the main file of the application that routes and connections to the database.
 * Note about the status returned by the various routes:
 * 200: general success
 * 400: general failure
 * 412: failure because the classID passed to the request does not exist
 * 406: failure because the class a request was made for already received a request of the same type (Cancel, Rescheduling or Feedback)
 */
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
const reschedulingRequestsQueries = require("./queries/rescheduling_requests");
const feedbacksQueries = require("./queries/feedbacks");
const tutorsQueries = require("./queries/tutors");
const tutorDemandsQueries = require("./queries/tutor_demands");
const TutorDemandDateOptionsLinkQueries = require("./queries/tutor_demand_date_options_link");

// import the dbConfig object from another file where we can hide it.
const dbConfig = require("./logins");
const helper_functions = require("./helper_functions");

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
 * If the class already received a feedback request, it will give out a status of 406.
 * If the class does not exist it will give out a status of 412.
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
 * The GET request to this endpoint should hold 1 parameter: the tutor's discord ID.
 *
 * If successful, the request will return a status of 200, if not it will return the error as well as a status of 400.
 */
app.get("/tutor_classes/:discord_id", function (req, res) {
  sql.connect(dbConfig, function (err) {
    if (err) console.log(err);

    const discordID = req.params.discord_id;

    if (discordID === null) {
      res.status(400).json({ error: "Discord id can not be null" });
      return;
    }

    classesQueries.getTutorClasses(sql, res, discordID);
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

/**
 * {
 * "CourseID"
 * "TutorDiscordID"
 * [dateOptionsID]
 * }
 */

// Empty route to POST new tutor demands.
app.post("/tutor_demand", function (req, res) {
  sql.connect(dbConfig, function (err) {
    if (err) console.log(err);
    const tutorDiscordID = req.body.discordID;
    const courseReqID = req.body.courseRequestID;
    const dateOptions = req.body.dateOptions;
    if (tutorDiscordID === null) {
      res
        .status(400)
        .json({ error: "The tutor's discord ID can not be null." });
      return;
    }
    if (courseReqID === null) {
      res.status(400).json({ error: "The course request ID can not be null." });
      return;
    }
    if (dateOptions === null || dateOptions.length === 0) {
      res
        .status(400)
        .json({ error: "The date options can not be null or empty." });
      return;
    }
    const tutorID = tutorsQueries.getTutorForDiscordID(
      sql,
      res,
      tutorDiscordID
    );
    const createdTutorDemandID = tutorDemandsQueries.createATutorDemand(
      sql,
      res,
      tutorID,
      courseReqID
    );

    let createdDateOptionsLinks = 0;
    for (const dateOptionID of dateOptions) {
      if (
        TutorDemandDateOptionsLinkQueries.createTutorDemandDateOptionsLinkQueries(
          sql,
          createdTutorDemandID,
          dateOptionID
        )
      ) {
        createdDateOptionsLinks += 1;
      }
    }
    if (createdDateOptionsLinks === dateOptions.length) {
      res.send(200).json({ message: "Tutor demand created successfuly" });
    } else {
      res.send(400).json({ error: "Error creating tutor demand" });
    }

    // create as many dateOptionsLink thnigs as they are dateOptions
  });
});

/**
 * Creates a new Rescheduling Request.
 *
 * The POST request to this endpoint should hold 3 parameters:
 * class_ID: the ID of the class that is requested to be rescheduled
 * reason: the reason for rescheduling as indicated by the tutor
 * new_date: the date at which the class should be rescheduled (format MM/DD/YYYY)
 *
 * If successful, the request will return a status of 200, if not it will return the error as well as a status of 400.
 * If the class already received a feedback request, it will give out a status of 406.
 * If the class does not exist it will give out a status of 412.
 */
app.post("/rescheduling_request", function (req, res) {
  sql.connect(dbConfig, function (err) {
    if (err) console.log(err);

    const classID = req.body.class_ID;
    const reason = req.body.reason;
    const newDate = req.body.new_date;

    if (reason === null) {
      res.status(400).json({ error: "The reason can not be null." });
      return;
    }
    if (classID === null) {
      res.status(400).json({ error: "The classID can not be null." });
      return;
    }
    if (newDate === null) {
      res.status(400).json({ error: "The newDate can not be null." });
      return;
    }

    if (helper_functions.isValidDateFormat(newDate)) {
      if (helper_functions.isInTheFuture(newDate)) {
        // Two checks are run prior to actually creating the record. Those checks are imbricated using callbacks. If both are successful, the final request will be run.
        classesQueries.checkIfClassExistsWithID(sql, res, classID, () => {
          reschedulingRequestsQueries.checkIfNoPendingRequestForSameClass(
            sql,
            res,
            classID,
            () => {
              reschedulingRequestsQueries.createReschedulingRequest(
                sql,
                res,
                classID,
                reason,
                newDate
              );
            }
          );
        });
      } else {
        res.status(402).json({ error: "NewDate is not in the future." });
      }
    } else {
      res.status(408).json({ error: "Unvalid date format." });
    }
  });
});

/**
 * Creates a new Feedback record.
 *
 * The POST request to this endpoint should hold 2 parameters:
 * class_ID: the ID of the class for which a feedback should be created
 * feedback: the feedback note the tutor wants to leave
 *
 * If successful, the request will return a status of 200, if not it will return the error as well as a status of 400.
 * If the class already received a feedback request, it will give out a status of 406.
 * If the class does not exist it will give out a status of 412.
 */
app.post("/feedback_creation", function (req, res) {
  // Connecting to the database.
  sql.connect(dbConfig, function (err) {
    if (err) console.log(err);

    const classID = req.body.class_ID;
    const feedback = req.body.feedback;
    if (feedback === null) {
      res.status(400).json({ error: "The feedback note can not be null." });
      return;
    }
    if (classID === null) {
      res.status(400).json({ error: "The classID can not be null." });
      return;
    }

    // Two checks are run prior to actually creating the record. Those checks are imbricated using callbacks. If both are successful, the final request will be run.
    classesQueries.checkIfClassExistsWithID(sql, res, classID, () => {
      feedbacksQueries.checkIfNoPendingRequestForSameClass(
        sql,
        res,
        classID,
        () => {
          feedbacksQueries.createFeedback(sql, res, classID, feedback);
        }
      );
    });
  });
});

/**
 * TEST (This is a test route that needs to be removed before merging ticket T18 in)
 *
 * It will return all the Feedbacks records in the databse so you can check the Feedbacks are created properly by the previous endpoint.
 */
app.get("/feedback_request_test", function (req, res) {
  // connect to your database
  sql.connect(dbConfig, function (err) {
    if (err) console.log(err);

    // create Request object
    const request = new sql.Request();

    // query to the database and get the records
    request.query("select * from Feedbacks", function (err, recordset) {
      if (err) console.log(err);
      // send records as a response
      res.send(recordset);
    });
  });
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

app.get("/reschedule_test", function (req, res) {
  sql.connect(dbConfig, function (err) {
    if (err) console.log(err);

    const request = new sql.Request();

    request.query(
      "select * from reschedulingrequests",
      function (err, recordset) {
        if (err) console.log(err);
        // send records as a response
        res.send(recordset);
      }
    );
  });
});

app.get("/courseRequestTest", function (req, res) {
  sql.connect(dbConfig, function (err) {
    if (err) console.log(err);

    const request = new sql.Request();

    request.query("select * from CourseRequests", function (err, recordset) {
      if (err) console.log(err);
      // send records as a response
      res.send(recordset);
    });
  });
});

app.get("/tutorDemandTest", function (req, res) {
  sql.connect(dbConfig, function (err) {
    if (err) console.log(err);

    const request = new sql.Request();

    request.query("select * from TutorDemands", function (err, recordset) {
      if (err) console.log(err);
      // send records as a response
      res.send(recordset);
    });
  });
});
