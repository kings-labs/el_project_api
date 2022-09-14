/**
 * This file holds the code of all queries related to the Classes table.
 *
 * @version 11/09/2022
 */

const helperFunctions = require("../helper_functions");

module.exports = {
  /**
   * Checks if a class with a given ID actually exists.
   *
   * If the test is successful, the callback function will be called.
   *
   * @param {*} sql The mssql instance connected to the database currently used by the API.
   * @param {*} res The object to send result to a given query sender.
   * @param {*} classID The ID to check the number of classes for.
   * @param {*} callback The callback function to be called if the test is successful.
   */
  checkIfClassExistsWithID: function (sql, res, classID, callback) {
    const request = new sql.Request();
    request
      .input("classId", sql.Int, classID)
      .query(
        "SELECT COUNT(ID) FROM CLASSES WHERE ID=@classId",
        function (err, recordset) {
          if (err) {
            console.log(err);
            res.status(400).json({ error: err });
            return null;
          } else {
            if (Object.values(recordset.recordset[0])[0] === 1) {
              callback();
            } else {
              console.log("Class does not exist or similar issue.");
              res
                .status(400)
                .json({ error: "There is not class with that ID." });
            }
          }
        }
      );
  },

  /**
   * Sends all the classes of a specific tutor that happened less than 10 days go or that will happen in the future.
   * The data is cleaned up to follow the following structure:
   * {
   *  name: <course level + course subject>
   *  student: <student first name + student last name>
   *  date: <class date>
   *  id: <class id>
   * }
   *
   * A successful request gives status 200 while an unsuccessful one gives status 400.
   *
   * @param {*} sql The mssql instance connected to the database currently used by the API.
   * @param {*} res The object to send result to a given query sender.
   * @param {*} tutorDiscordId The tutor's discord id.
   */
  getTutorClasses: function (sql, res, tutorDiscordId) {
    const request = new sql.Request();
    request
      .input("discordUsername", sql.NVarChar, tutorDiscordId)
      .query(
        "SELECT LEVELS.Name, COURSES.Level, CLASSES.Date, COURSES.Subject, STUDENTS.FirstName, STUDENTS.LastName, CLASSES.ID FROM CLASSES INNER JOIN COURSES on CLASSES.CourseID = COURSES.ID INNER JOIN STUDENTS on STUDENTS.ID = COURSES.StudentID INNER JOIN LEVELS on COURSES.LevelID = LEVELS.ID WHERE COURSES.TutorID = (SELECT ID FROM TUTORS WHERE DiscordID=@discordUsername)",
        function (err, recordset) {
          if (err) console.log(err);

          const classes = recordset.recordset;
          const returnValues = [];
          for (const aClass of classes) {
            console.log("date: " + aClass.Date);
            if (helperFunctions.isLessThanTenDaysAgo(aClass.Date)) {
              const returnValueForClass = {
                name: aClass.Level + " " + aClass.Subject,
                student: aClass.FirstName + ", " + aClass.LastName,
                date: aClass.Date,
                id: aClass.ID,
              };

              returnValues.push(returnValueForClass);
            }
          }

          res.send(returnValues);
        }
      );
  },
};
