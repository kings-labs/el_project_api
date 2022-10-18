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

  getMessages: async function (sql, res, callback) {
    const request = new sql.Request();
    await request.query(
      "SELECT TutorDemands.ID,TutorDemands.Status,Tutors.DiscordID, Levels.Name, CourseRequests.Subject,CourseRequests.Frequency,CourseRequests.Duration,Levels.CostPerHour, Students.FirstName, Students.LastName, Tutors.FirstName as TutorFirstName, Parents.PhoneNumber, Parents.LastName as ParentLastName, Parents.FirstName as ParentFirstName ,Parents.Email FROM TutorDemands INNER JOIN Tutors on TutorDemands.TutorID = Tutors.ID INNER JOIN CourseRequests ON TutorDemands.CourseRequestID = CourseRequests.ID INNER JOIN Levels on CourseRequests.LevelID = Levels.ID INNER JOIN Students ON CourseRequests.StudentID = Students.ID INNER JOIN Parents ON Students.ParentID = Parents.ID WHERE TutorDemands.Status IS NOT NULL AND TutorDemands.isSent=0",
      async function (err, recordset) {
        if (err) {
          console.log("error getting tutordemand messages");
        } else {
          const resultElements = recordset.recordset;
          console.log("RESULT ELEMENTS");
          console.log(resultElements);
          const richElements = [];
          for (const element of resultElements) {
            const request = new sql.Request();
            await request
              .input("tutor_demand_id", sql.Int, element.ID)
              .query(
                "SELECT Day, Time FROM DateOptions WHERE ID IN (SELECT DateOptionsID FROM TutorDemandDateOptionsLink WHERE TutorDemandID=@tutor_demand_id)",
                async function (err, result) {
                  if (err) {
                    console.log(err);
                  }
                  element["dateOptions"] = result.recordset;
                  console.log(element);
                  richElements.push(element);
                  console.log("HERERERER");
                }
              );
          }
          cleanStuff = messageDataCleaner(richElements);
          callback(cleanStuff);
        }
      }
    );
  },
};

function messageDataCleaner(listOfMessages) {
  console.log(listOfMessages);
  cleanedList = [];
  listOfMessages.forEach((messageData) => {
    console.log("HELLLO");
    console.log(messageData);
    messageContent = "";
    timeString = "";
    console.log("First Name:" + messageData.FirstName);
    if (messageData.dateOptions.length > 0) {
      timeString =
        "the " +
        messageData.dateOptions[0].Day +
        " at " +
        messageData.dateOptions[0].Time;
      for (let i = 1; i < messageData.dateOptions.length - 1; i++) {
        timeString +=
          ", the " +
          messageData.dateOptions[i].Day +
          " at " +
          messageData.dateOptions[i].Time;
      }
      if (messageData.dateOptions.length > 1) {
        timeString =
          ", and the " +
          messageData.dateOptions[messageData.dateOptions.length - 1].Day +
          " at " +
          messageData.dateOptions[messageData.dateOptions.length - 1].Time;
      }
    }

    if (messageData.Status === 0) {
      messageContent =
        "We are sorry to let you know that the " +
        messageData.Name +
        " " +
        messageData.Subject +
        " class you applied to take on on " +
        timeString +
        " has been taken by another tutor. Thanks!";
    } else {
      console.log("un truc accepté");
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
        timeString +
        ". This is a " +
        messageData.Duration +
        " hours/class lesson at a " +
        messageData.Name +
        " level that will be compensated at a rate of " +
        messageData.Duration * messageData.CostPerHour +
        "/class. The first point of contact should be the student's parent. " +
        messageData.ParentFirstName +
        " " +
        messageData.ParentLastName +
        "can be contacted via email at " +
        messageData.Email +
        " or by phone at " +
        messageData.PhoneNumber +
        ". Thank you for applying to get this student!";
    }
    message = {
      discordID: messageData.DiscordID,
      message: messageContent,
    };
    cleanedList.push(message);
  });
  return cleanedList;
}
