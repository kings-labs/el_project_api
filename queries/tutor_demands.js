const { NVarChar } = require("mssql");

module.exports = {
  /**
   * Creates a TutorDemand record.
   *
   * @param {*} sql A connected mssql instance.
   * @param {*} res An object to send a response to the caller.
   * @param {*} tutorID The ID of the tutor submitting a tutor demand.
   * @param {*} courseRequestID The ID of the courseRequest a tutor demand is submitted for.
   * @param {*} callback The callback function to be called if all happened properly.
   */
  createATutorDemand: function (sql, res, tutorID, courseRequestID, callback) {
    const request = new sql.Request();
    request
      .input("tutorID", sql.Int, tutorID)
      .input("courseRequestID", sql.Int, courseRequestID)
      .output("lastID", sql.Int)
      .query(
        "INSERT INTO TutorDemands (TutorID,CourseRequestID,Status) VALUES (@tutorID,@courseRequestID,null) SET @LASTID = SCOPE_IDENTITY()",
        function (err, recordset) {
          if (err) {
            res.status(400).json({ err: err });
            return null;
          } else {
            callback(recordset.output.lastID);
          }
        }
      );
  },

  /**
   * Gets all the tutor demand requests that have been approved or disapproved and that have not yet been sent to the tutors.
   * The returned value is a list of objects containing the DiscordID of the tutor to send a message to and a string made according to the models presented on
   * ClickUp and filled with the data relative to the tutor demand a message is to be sent about.
   *
   * @param {*} sql A connected mssql instance.
   * @param {*} res The object to use to send a response to the client.
   * @param {*} callback The function to call with the retrieved list of messages.
   */
  getMessages: async function (sql, res, callback) {
    const request = new sql.Request();
    await request.query(
      "SELECT Day, Time, TutorDemands.ID,TutorDemands.Status,Tutors.DiscordID, Levels.Name, CourseRequests.Subject,CourseRequests.Frequency,CourseRequests.Duration,Levels.CostPerHour, Students.FirstName, Students.LastName, Tutors.FirstName as TutorFirstName, Parents.PhoneNumber, Parents.LastName as ParentLastName, Parents.FirstName as ParentFirstName ,Parents.Email FROM TutorDemands INNER JOIN Tutors on TutorDemands.TutorID = Tutors.ID INNER JOIN CourseRequests ON TutorDemands.CourseRequestID = CourseRequests.ID INNER JOIN Levels on CourseRequests.LevelID = Levels.ID INNER JOIN Students ON CourseRequests.StudentID = Students.ID INNER JOIN Parents ON Students.ParentID = Parents.ID INNER JOIN TutorDemandDateOptionsLink ON TutorDemandDateOptionsLink.TutorDemandID = TutorDemands.ID INNER JOIN DateOptions ON DateOptions.ID = TutorDemandDateOptionsLink.DateOptionsID WHERE TutorDemands.Status IS NOT NULL AND TutorDemands.isSent=0",
      async function (err, recordset) {
        if (err) {
          res.status(400).json({ err: err });
        } else {
          const resultElements = recordset.recordset;
          resultElements.forEach((data) => {
            timeString = "";
            if (data.hasOwnProperty("Day")) {
              if (data.Day instanceof Array) {
                timeString = "the " + data.Day[0] + " at " + data.Time[0];
                for (let i = 1; i < messageData.dateOptions.length - 1; i++) {
                  timeString += ", the " + data.Day[0] + " at " + data.Time[0];
                }
                timeString =
                  ", and the " +
                  data.Day[messageData.dateOptions.length - 1] +
                  " at " +
                  data.Time[messageData.dateOptions.length - 1];
              } else {
                timeString = "the " + data.Day + " at " + data.Time;
              }
            }
            data["timeString"] = timeString;
          });
          cleanList = await messageDataCleaner(resultElements);
          callback(cleanList);
        }
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
      "UPDATE TutorDemands SET isSent = 1 WHERE TutorDemands.Status IS NOT NULL AND TutorDemands.isSent=0",
      function (err, recordset) {
        if (err) {
          res.status(400).json({ err: err });
        }
        console.log("Tutor demands messages updated.");
        callback();
      }
    );
  },
};

/**
 * Transorms a list of data relative to tutor demand request message into a list of objects containing the DiscordID to send the message to and the string to send.
 * This string is made according to the schema that can be found on ClickUp and is filled with the appropriate data.
 *
 * @param {*} listOfMessages list of the data that must be included in each message.
 * @returns the list of message objects (discordID of the message's recipient and message string).
 */
async function messageDataCleaner(listOfMessages) {
  cleanedList = [];
  listOfMessages.forEach((messageData) => {
    messageContent = "";
    timeString = "";
    if (messageData.Status === 0) {
      messageContent =
        "We are sorry to let you know that the " +
        messageData.Name +
        " " +
        messageData.Subject +
        " class you applied to take on, on " +
        messageData.timeString +
        " has been unsuccessful. Thanks!";
    } else {
      messageContent =
        "Hi " +
        messageData.TutorFirstName +
        ", you have a new student! " +
        messageData.FirstName +
        " " +
        messageData.LastName +
        " is happy to study " +
        messageData.Subject +
        " with you on the " +
        messageData.timeString +
        ". This is a " +
        messageData.Duration +
        " hours/class lesson at a " +
        messageData.Name +
        " level that will be compensated at a rate of £" +
        messageData.Duration * messageData.CostPerHour +
        "/class. The first point of contact should be the student's parent. " +
        messageData.ParentFirstName +
        " " +
        messageData.ParentLastName +
        " can be contacted via email at " +
        messageData.Email +
        " or by phone at " +
        messageData.PhoneNumber +
        ". Thank you for applying to teach this course!";
    }
    message = {
      discordID: messageData.DiscordID,
      message: messageContent,
    };
    cleanedList.push(message);
  });
  return cleanedList;
}
