/**
 * This file holds the code of all queries related to the Feedback table.
 *
 * @version 14/09/2022
 */

module.exports = {
  /**
   * Creates a new feedback and indicates result and status to the user.
   *
   * A status of 200 is given for successful requests. A status of 400 for unsuccessful ones.
   *
   * @param {*} sql The mssql instance connected to the database currently used by the API.
   * @param {*} res The object to send result to a given query sender.
   * @param {*} classId The ID of the class to create a Feedback for.
   * @param {*} feedback The feedback note.
   */
  createFeedback: function (sql, res, classId, feedback) {
    const request = new sql.Request();
    request
      .input("classId", sql.Int, classId)
      .input("feedback", sql.NVarChar, feedback)
      .query(
        "insert into feedbacks (ClassID,Note,Status) values (@classId,@feedback,null)",
        function (err, recordset) {
          if (err) {
            console.log(err);
            res.status(400).json({ error: err });
          } else {
            res.status(200).json({ message: "Feedback created." });
          }
        }
      );
  },

  /**
   * Checks if there are no currently pending feedback for the same class.
   * A currently pending feedback is a request that has not yet been either approved or disapproved and therefore that has status null.
   *
   * If the test is successful, the callback function will be called.
   *
   * @param {*} sql The mssql instance connected to the database currently used by the API.
   * @param {*} res The object to send result to a given query sender.
   * @param {*} classID The ID of the class to create a Feedback for.
   * @param {*} callback The callback function to be called if the test is successful.
   */
  checkIfNoPendingRequestForSameClass: function (sql, res, classID, callback) {
    const request = new sql.Request();
    request
      .input("classId", sql.Int, classID)
      .query(
        "SELECT COUNT(ID) FROM feedbacks WHERE ClassID=@classId AND Status IS NULL",
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
   * Gets all the feedback requests that have been approved or disapproved and that have not yet been sent to the tutors.
   * The returned value is a list of objects containing the DiscordID of the tutor to send a message to and a string made according to the models presented on
   * ClickUp and filled with the data relative to the feedback a message is to be sent about.
   *
   * @param {*} sql A connected mssql instance.
   * @param {*} res The object to use to send a response to the client.
   * @param {*} callback The function to call with the retrieved list of messages.
   */
  getMessages: async function (sql, res, callback) {
    const request = new sql.Request();
    await request.query(
      "SELECT Tutors.DiscordID, Feedbacks.Status, Feedbacks.Note, Classes.Date, Courses.Subject,Students.FirstName, Students.LastName FROM Feedbacks INNER JOIN Classes ON Classes.ID = Feedbacks.ClassID INNER JOIN Courses ON Courses.ID = Classes.CourseID INNER JOIN Students ON Students.ID = Courses.StudentID INNER JOIN Tutors on Tutors.ID = Courses.TutorID WHERE Feedbacks.Status IS NOT NULL AND Feedbacks.isSent=0",
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
      "UPDATE Feedbacks SET isSent = 1 WHERE Feedbacks.Status IS NOT NULL AND Feedbacks.isSent=0",
      function (err, recordset) {
        if (err) {
          res.status(400).json({ err: err });
        }
        console.log("Feedback messages updated.");
        callback();
      }
    );
  },
};

/**
 * Transorms a list of data relative to feedback request message into a list of objects containing the DiscordID to send the message to and the string to send.
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
        "We are sorry, your feedback request for your " +
        messageData.Subject +
        " class with " +
        messageData.FirstName +
        " " +
        messageData.LastName +
        " on " +
        messageData.Date +
        " has not been accepted. As additional information, the feedback you submitted was '" +
        messageData.Note +
        "'.Please make sure to discuss this issue with an administrator and/or to try again with a more precise feedback for this class to be registered as completed in our system. Thanks!";
    } else {
      messageContent =
        "Great news! Your feedback request for your " +
        messageData.Subject +
        " class with " +
        messageData.FirstName +
        " " +
        messageData.LastName +
        " on " +
        messageData.Date +
        " was accepted and well recorded! Thanks!";
    }
    message = {
      discordID: messageData.DiscordID,
      message: messageContent,
    };
    cleanedList.push(message);
  });
  return cleanedList;
}
