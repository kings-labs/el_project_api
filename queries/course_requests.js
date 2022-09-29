/**
 * This file holds the code of all queries related to the courseRequests table.
 *
 * @version 13/09/2022
 */
module.exports = {
  /**
   * Retrieves all the new course requests and update their status to 1 (= pending) if the retrieval is successful.
   *
   * @param {*} sql The mssql instance connected to the database currently used by the API.
   * @param {*} res The object to send result to a given query sender.
   */
  getNewCourseRequests: function (sql, res) {
    const request = new sql.Request();

    request.query(
      "SELECT CourseRequests.ID AS ID, Subject, Frequency, Levels.Name AS LevelName, Levels.CostPerHour*CourseRequests.Duration AS Money, Duration, DateOptions.ID AS DateOptionsID, Day, Time FROM CourseRequests JOIN DateOptions ON CourseRequests.ID = DateOptions.CourseRequestID JOIN Levels ON CourseRequests.LevelID = Levels.ID where Status = 0 And CourseRequests.Frequency <= (Select count(ID) from DateOptions Where CourseRequestID = CourseRequests.ID)",
      function (err, recordset) {
        if (err) {
          console.log(err);
          res.status(400).json({
            error: err,
          });
        } else {
          let idListAsString = "";
          if (recordset.recordset.length > 0) {
            idListAsString = "(" + recordset.recordset[0].ID;
            for (let i = 1; i < recordset.recordset.length; i++) {
              idListAsString = idListAsString + "," + recordset.recordset[i].ID;
            }
            idListAsString = idListAsString + ")";
          }

          res.status(200).json({
            result: formatResult(recordset.recordset),
          });

          updateCourseRequests(sql, idListAsString);
        }
      }
    );
  },

  /**
   * Get the total number of course requests in the database.
   *
   * A status of 200 is given for successful requests. A status of 400 for unsuccessful ones.
   *
   * @param {*} sql The mssql instance connected to the database currently used by the API.
   * @param {*} res The object to send result to a given query sender.
   */
  getNumberOfCourseRequests: function (sql, res) {
    const request = new sql.Request();

    request.query(
      "SELECT COUNT(ID) FROM CourseRequests WHERE Status=0",
      function (err, recordset) {
        if (err) {
          res.status(400).json({
            error: err,
          });
        }

        res.status(200).json({
          number: Object.values(recordset.recordset[0])[0],
        });
      }
    );
  },

  /**
   * Checks if a CourseRequest record with a given ID exists in the DB.
   *
   * @param {*} sql A connected mssql instance.
   * @param {*} res The object to send a response back to the caller.
   * @param {*} courseReqId The ID to check for.
   * @param {*} callback The callback function to be called if check is successful.
   */
  checkIfCourseReqExistsWithID: function (sql, res, courseReqId, callback) {
    const request = new sql.Request();
    request
      .input("courseReqID", sql.Int, courseReqId)
      .query(
        "SELECT COUNT(ID) FROM CourseRequests WHERE ID=@courseReqID",
        function (err, recordset) {
          if (err) {
            console.log(err);
            res.status(400).json({ error: err });
            return null;
          } else {
            if (Object.values(recordset.recordset[0])[0] === 1) {
              callback();
            } else {
              console.log("Course does not exist or similar issue.");
              res
                .status(412)
                .json({ error: "There is no course with that ID." });
            }
          }
        }
      );
  },

  /**
   * Checks if the number of date options provided when creating a TutorDemand for a given course request is right.
   * The number is right when it is equal to that course request's frequency.
   *
   * @param {*} sql A connected mssql instance.
   * @param {*} res An object to send a reponse to the user.
   * @param {*} courseReqID The ID of the course request record to check for.
   * @param {*} dateOptionsNumber The number of date options specified.
   * @param {*} callback The callback to be called if check is successul.
   */
  checkIfDateOptionsNumberIsRight: async function (
    sql,
    res,
    courseReqID,
    dateOptionsNumber,
    callback
  ) {
    const request = new sql.Request();
    request
      .input("courseReqID", sql.Int, courseReqID)
      .query(
        "SELECT Frequency FROM CourseRequests WHERE ID=@courseReqID",
        function (err, recordset) {
          if (err) {
            console.log(err);
            res.status(400).json({ error: err });
            return null;
          } else {
            if (recordset.recordset[0].Frequency === dateOptionsNumber) {
              console.log("yep");
              callback();
            } else {
              console.log("nope");
              res
                .status(400)
                .json({ error: "Incorrect number of date options specified." });
            }
          }
        }
      );
  },

  /**
   * Checks if the status of a given course requests is 2. If it is, it means that the course request already
   * was given to a tutor and will throw a special error message.
   *
   * @param {*} sql A connected sql server.
   * @param {*} res The object to send a reply.
   * @param {*} courseReqId The ID of the CourseRequest to check for.
   * @param {*} callback The function to call if status is not 2.
   */
  checkIfStatusIsTwo: async function (sql, res, courseReqId, callback) {
    const request = new sql.Request();
    await request
      .input("courseReqId", sql.Int, courseReqId)
      .query(
        "SELECT Status FROM CourseRequests WHERE ID = @courseReqId",
        function (err, recordset) {
          if (err) {
            console.log(err);
            res.status(400).json({ error: err });
            return null;
          } else {
            if (recordset.recordset[0].Status === 2) {
              res.status(410).json({ err: "Course request was taken" });
            } else {
              callback();
            }
          }
        }
      );
  },
};

/**
 * Updates the status of the new course requests to pending (= 1).
 *
 * @param {*} sql The mssql instance connected to the database currently used by the API.
 */
function updateCourseRequests(sql, idListAsString) {
  const request = new sql.Request();

  request.query(
    "update CourseRequests set status = 1 where status = 0 and ID IN" +
      idListAsString,
    function (err) {
      if (err) {
        console.log(err);
      } else {
        console.log("New course request(s) have been updated.");
      }
    }
  );
}

/**
 * The method allows to get a well formatted result for the new course request route.
 * Each course request record now has a property dateOptions that gathers all the date options in a list.
 *
 * @param {*} courseRequests This is the list of all the new course requests.
 * @returns The arranged list of all the new course requests having a property date options.
 */
function formatResult(courseRequests) {
  let processedCourseReqIDs = [];
  let resultWanted = [];

  for (const courseReq of courseRequests) {
    let informationToRetrieve = {};

    if (!processedCourseReqIDs.includes(courseReq.ID)) {
      informationToRetrieve = {
        ID: courseReq.ID,
        Subject: courseReq.Subject,
        Frequency: courseReq.Frequency,
        LevelName: courseReq.LevelName,
        Money: courseReq.Money,
        Duration: courseReq.Duration,
        dateOptions: [],
      };

      for (courseRequestWithDateOptions of courseRequests) {
        if (courseRequestWithDateOptions.ID === courseReq.ID) {
          informationToRetrieve.dateOptions.push({
            ID: courseRequestWithDateOptions.DateOptionsID,
            String:
              courseRequestWithDateOptions.Day +
              " " +
              courseRequestWithDateOptions.Time,
          });
        }
      }

      resultWanted.push(informationToRetrieve);
    }

    processedCourseReqIDs.push(courseReq.ID);
  }

  return resultWanted;
}
