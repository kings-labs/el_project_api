const helperFunctions = require("../helper_functions");
const timeReferenceQueries = require("../queries/time_reference_queries");

module.exports = {
  /**
   * Creates a new rescheduling request and indicates result and status to the user.
   * It calls another function in that file as some calculations to properly create a rescheduling request
   * depend on proper retrieval of time reference data and must therefore be able to be presented as a callback.
   *
   * A status of 200 is given for successful requests. A status of 400 for unsuccessful ones.
   *
   * @param {*} sql The mssql instance connected to the database currently used by the API.
   * @param {*} res The object to send result to a given query sender.
   * @param {*} classID The ID of the class to create a ReschedulingRequest for.
   * @param {*} reason The reason tutor gives for rescheduling that class.
   * @param {*} newDate The date the class should be rescheduled to.
   */
  createReschedulingRequest: function (sql, res, classID, reason, newDate) {
    timeReferenceQueries.getCurrentWeekDetails(
      sql,
      (lastRecordedWeekObject) => {
        createAReschedulingRequestWithOriginalDate(
          sql,
          res,
          classID,
          reason,
          newDate,
          lastRecordedWeekObject
        );
      }
    );
  },

  /**
   * Checks if there are no currently pending rescheduling requests for the same class.
   * A currently pending rescheduling request is a request that has not yet been either approved or disapproved and therefore that has status null.
   *
   * If the test is successful, the callback function will be called.
   *
   * @param {*} sql The mssql instance connected to the database currently used by the API.
   * @param {*} res The object to send result to a given query sender.
   * @param {*} classID The ID of the class to create a ReschedulingRequest for.
   * @param {*} callback The callback function to be called if the test is successful.
   */
  checkIfNoPendingRequestForSameClass: function (sql, res, classID, callback) {
    const request = new sql.Request();
    request
      .input("classId", sql.Int, classID)
      .query(
        "SELECT COUNT(ID) FROM ReschedulingRequests WHERE ClassID=@classId AND Status IS NULL",
        function (err, recordset) {
          if (err) {
            console.log(err);
            res.status(400).json({ error: err });
            return null;
          } else {
            if (Object.values(recordset.recordset[0])[0] === 0) {
              callback();
            } else {
              res.status(406).json({
                error: "A request is currently opened for the same class.",
              });
            }
          }
        }
      );
  },

  /**
   * Gets all the rescheduling requests that have been approved or disapproved and that have not yet been sent to the tutors.
   * The returned value is a list of objects containing the DiscordID of the tutor to send a message to and a string made according to the models presented on
   * ClickUp and filled with the data relative to the rescheduling request a message is to be sent about.
   *
   * @param {*} sql A connected mssql instance.
   * @param {*} res The object to use to send a response to the client.
   * @param {*} callback The function to call with the retrieved list of messages.
   */
  getMessages: async function (sql, res, callback) {
    const request = new sql.Request();
    await request.query(
      "SELECT Tutors.DiscordID, ReschedulingRequests.Status, ReschedulingRequests.Reason,ReschedulingRequests.Date as NewDate, Classes.Date, Courses.Subject,Students.FirstName, Students.LastName FROM ReschedulingRequests INNER JOIN Classes ON Classes.ID = ReschedulingRequests.ClassID INNER JOIN Courses ON Courses.ID = Classes.CourseID INNER JOIN Students ON Students.ID = Courses.StudentID INNER JOIN Tutors on Tutors.ID = Courses.TutorID WHERE ReschedulingRequests.Status IS NOT NULL AND ReschedulingRequests.isSent=0",
      async function (err, recordset) {
        if (err) {
          res.status(400).json({ err: err });
        }
        cleanList = await messageDataCleaner(recordset.recordset);
        callback(cleanList);
      }
    );
  },

  /**
   * Updates all the records that could be selected to be sent to the status of 'sent'. Effectively, once messages are retrieved to be sent, this function unables
   * to switch the value of their 'isSent' field from 0 to 1 to make sure they are sent only once.
   *
   * @param {*} sql A connected mssql instance.
   * @param {*} res The object to send a response with.
   * @param {*} callback The function to call once the request is completed.
   */
  updateMessagesToSent: async function (sql, res, callback) {
    const request = new sql.Request();
    await request.query(
      "UPDATE ReschedulingRequests SET isSent = 1 WHERE ReschedulingRequests.Status IS NOT NULL AND ReschedulingRequests.isSent=0",
      function (err, recordset) {
        if (err) {
          res.status(400).json({ err: err });
        }
        console.log("Rescheduling requests messages updated.");
        callback();
      }
    );
  },
};

/**
 * Transorms a list of data relative to rescheduling request message into a list of objects containing the DiscordID to send the message to and the string to send.
 * This string is made according to the schema that can be found on ClickUp and is filled with the appropriate data.
 *
 * @param {*} listOfMessages list of the data that must be included in each message.
 * @returns the list of message objects (discordID of the message's recipient and message string).
 */
async function messageDataCleaner(listOfMessages) {
  cleanedList = [];
  listOfMessages.forEach((messageData) => {
    if (messageData.Status === 0) {
      messageContent =
        "We are sorry, your request to reschedule your " +
        messageData.Subject +
        " class with " +
        messageData.FirstName +
        " " +
        messageData.LastName +
        " from " +
        messageData.Date +
        " to " +
        messageData.NewDate +
        " has not been accepted. As additional information, the reason you gave for that request was '" +
        messageData.Reason +
        "'. If you still want to reschedule this class, please contact an administrator and/or try again. Thanks!";
    } else {
      messageContent =
        "Great news! Your request to reschedule your " +
        messageData.Subject +
        " class with " +
        messageData.FirstName +
        " " +
        messageData.LastName +
        " from " +
        messageData.Date +
        " to " +
        messageData.NewDate +
        " was accepted and well recorded! Please make note of the new date! Thanks!";
    }
    message = {
      discordID: messageData.DiscordID,
      message: messageContent,
    };
    cleanedList.push(message);
  });
  return cleanedList;
}

/**
 * This function actually handles the calculations and requests needed to create a rescheduling request.
 * It was created as a separate function to enable a callback construct.
 *
 * @param {*} sql The mssql instance connected to the database currently used by the API.
 * @param {*} res The object to send result to a given query sender.
 * @param {*} classID The ID of the class to create a ReschedulingRequest for.
 * @param {*} reason The reason tutor gives for rescheduling that class.
 * @param {*} newDate The date the class should be rescheduled to.
 * @param {*} lastRecordedWeek The object containing data about a pre-recorded week.
 */
function createAReschedulingRequestWithOriginalDate(
  sql,
  res,
  classID,
  reason,
  newDate,
  lastRecordedWeek
) {
  const request = new sql.Request();
  const newDay = helperFunctions.getWeekDayFromDate(newDate);
  const newWeek = helperFunctions.getWeekNumberForDate(
    newDate,
    lastRecordedWeek.WeekStartDate,
    lastRecordedWeek.WeekNumber
  );
  request
    .input("classId", sql.Int, classID)
    .input("reason", sql.NVarChar, reason)
    .input("newDay", sql.NVarChar, newDay)
    .input("newWeek", sql.Int, newWeek)
    .input("newDate", sql.NVarChar, newDate)
    .query(
      "insert into ReschedulingRequests (ClassID,Reason,NewDay,NewWeek,Date,Status) values (@classId,@reason,@newDay,@newWeek,@newDate,null)",
      function (err, recordset) {
        if (err) {
          console.log(err);
          res.status(400).json({ error: err });
        } else {
          res.status(200).json({ message: "Rescheduling request created." });
        }
      }
    );
}
