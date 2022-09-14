module.exports = {
  /**
   * Algorithm taken from: https://www.geeksforgeeks.org/find-number-of-days-between-two-given-dates/
   *
   * @returns true if the class date started within 10 days or less, false if later
   */
  isLessThanTenDaysAgo: function (date) {
    // Split the date parameter into day, month and year
    const splittedDate = date.split("/");
    const passedDay = splittedDate[1];
    const passedMonth = splittedDate[0];
    const passedYear = splittedDate[2];
    // Split today's date into day, month and year
    const today = new Date();
    const currentDay = today.getDate();
    const currentMonth = today.getMonth() + 1; // +1 because the format is 0-11
    const currentYear = today.getFullYear();
    // To store number of days in all months from January to Dec.
    const monthDays = [31, 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];

    // A function for leap year checking
    function countLeapYears(year, month) {
      // used for leap years checking
      let years = year;

      // Check if the current year needs to be considered
      // for the count of leap years or not
      if (month <= 2) {
        years--;
      }

      // A year is a leap year if it is a multiple of 4, multiple of 400 and not a multiple of 100.
      return (
        Math.floor(years / 4) -
        Math.floor(years / 100) +
        Math.floor(years / 400)
      );
    }

    // This function returns number of days between two given dates
    function getDifference(pD, pM, pY, cD, cM, cY) {
      // COUNT TOTAL NUMBER OF DAYS BEFORE THE PASSED DATE
      // initialize count using years and day
      let passedCount = Number(pY) * 365 + Number(pD);

      // Add days for months in given date
      for (let i = 0; i < pM - 1; i++) {
        passedCount = Number(passedCount) + monthDays[i];
      }
      // Since every leap year is of 366 days, add a day for every leap year
      passedCount = Number(passedCount) + countLeapYears(pY, pM);

      // SIMILARLY, COUNT TOTAL NUMBER OF DAYS BEFORE TODAY
      let currentCount = Number(cY) * 365 + Number(cD);
      for (let i = 0; i < cM - 1; i++) {
        currentCount = Number(currentCount) + monthDays[i];
      }
      currentCount = Number(currentCount) + countLeapYears(cY, cM);

      // return difference between two counts
      return currentCount - passedCount;
    }

    // The days difference between the given date and today
    const difference = getDifference(
      passedDay,
      passedMonth,
      passedYear,
      currentDay,
      currentMonth,
      currentYear
    );
    return difference <= 10;
  },
};
