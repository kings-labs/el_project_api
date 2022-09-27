module.exports = {
  /**
   * @param {*} date The date to check for.
   * @returns True if the date is more than a week ago, false if not.
   */
  isMoreThanAWeekAgo: function (date) {
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

    // The days difference between the given date and today
    const difference = getDifference(
      passedDay,
      passedMonth,
      passedYear,
      currentDay,
      currentMonth,
      currentYear
    );
    console.log("diff" + difference);
    console.log(difference > 7);
    return difference >= 7;
  },

  /**
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

  /**
   * Gets the number of the week a certain date is in. The calculations are done from an original week, a week
   * that our system knows both the start date and week number of.
   *
   * @param {*} date the date to get the week number of.
   * @param {*} originalWeekStartDate the start date of the original week.
   * @param {*} originalWeekNumber the number of the original week.
   * @returns the number of the week this date is in.
   */
  getWeekNumberForDate: function (
    date,
    originalWeekStartDate,
    originalWeekNumber
  ) {
    // Split the originalWeekStartDate parameter into day, month and year
    const splittedoriginalWeekStartDate = originalWeekStartDate.split("/");
    const originalDay = splittedoriginalWeekStartDate[1];
    const originalMonth = splittedoriginalWeekStartDate[0];
    const originalYear = splittedoriginalWeekStartDate[2];
    // Split the date parameter into day, month and year
    const splittedDate = date.split("/");
    const requestedDay = splittedDate[1];
    const requestedMonth = splittedDate[0];
    const requestedYear = splittedDate[2];

    // The days difference between the given date and today
    const difference = getDifference(
      originalDay,
      originalMonth,
      originalYear,
      requestedDay,
      requestedMonth,
      requestedYear
    );

    const numberOfWeeksElapsed = difference / 7;
    return originalWeekNumber + numberOfWeeksElapsed;
  },

  /**
   * @param {*} date the date under MM/DD/YYY format.
   * @returns the week day it corresponds to.
   */
  getWeekDayFromDate: function (dateString) {
    const weekdays = [
      "Sunday",
      "Monday",
      "Tuesday",
      "Wednesday",
      "Thursday",
      "Friday",
      "Saturday",
    ];
    const [month, day, year] = dateString.split("/");
    const date = new Date(+year, month - 1, +day);
    return weekdays[date.getDay()];
  },

  /**
   * Checks if date is in the MM/DD/YYYY format.
   *
   * @param {*} date the date to test.
   * @returns if it's in the specified format.
   */
  isValidDateFormat: function (date) {
    if (!date.includes("/")) {
      return false;
    }
    const splittedDate = date.split("/");
    if (!splittedDate.length === 3) {
      return false;
    } else {
      const numericalDay = parseInt(splittedDate[1]);
      const numericalMonth = parseInt(splittedDate[0]);
      return (
        splittedDate[0].length == 2 &&
        splittedDate[1].length == 2 &&
        splittedDate[2].length == 4 &&
        numericalDay < 32 &&
        numericalMonth < 13
      );
    }
  },

  /**
   * Get the date of a given day of the week for the current week (if we are Thursday 09/22/2022 and pass Friday as a parameter it will return 09/23/2022).
   * Crucial Note: our week starts on the Saturday morning and ends on the Friday.
   *
   * @param {*} day The day to get the date of.
   * @returns This day's date.
   */
  getDateForDayOfWeek: function (day) {
    const weekdays = [
      "Saturday",
      "Sunday",
      "Monday",
      "Tuesday",
      "Wednesday",
      "Thursday",
      "Friday",
    ];
    const dayNumber = weekdays.indexOf(
      day.charAt(0).toUpperCase() + day.slice(1)
    );
    const today = new Date();
    const todayDayNumber = today.getDay();
    const dateOfThatDay = new Date();
    dateOfThatDay.setDate(today.getDate() + (dayNumber - todayDayNumber - 1));
    let monthNumber = dateOfThatDay.getMonth() + 1;
    if (monthNumber < 10) {
      monthNumber = "0" + monthNumber;
    }
    console.log(
      "test function: " +
        day +
        monthNumber +
        "/" +
        dateOfThatDay.getDate() +
        "/" +
        dateOfThatDay.getFullYear()
    );
    return (
      monthNumber +
      "/" +
      dateOfThatDay.getDate() +
      "/" +
      dateOfThatDay.getFullYear()
    );
  },

  /**
   * Checks if date is in the future.
   *
   * @param {*} date the date to test.
   * @returns if it's in the future.
   */
  isInTheFuture: function (date) {
    const today = new Date();
    const todayDay = today.getDate();
    const todayMonth = today.getMonth() + 1; // +1 because the format is 0-11
    const todayYear = today.getFullYear();

    const splittedDate = date.split("/");
    const toTestDay = Number(splittedDate[1]);
    const toTestMonth = Number(splittedDate[0]);
    const toTestYear = Number(splittedDate[2]);

    if (toTestYear < todayYear) {
      return false;
    } else if (toTestYear > todayYear) {
      return true;
    } else {
      if (toTestMonth < todayMonth) {
        return false;
      } else if (toTestMonth > toTestMonth) {
        return true;
      } else {
        return toTestDay > todayDay;
      }
    }
  },
};

/**
 * Algorithm taken from: https://www.geeksforgeeks.org/find-number-of-days-between-two-given-dates/
 *
 * @returns if the current year is a leap year.
 */
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
    Math.floor(years / 4) - Math.floor(years / 100) + Math.floor(years / 400)
  );
}

/**
 * Algorithm taken from: https://www.geeksforgeeks.org/find-number-of-days-between-two-given-dates/
 *
 * @returns the number of days between two dates.
 */
function getDifference(pD, pM, pY, cD, cM, cY) {
  // To store number of days in all months from January to Dec.
  const monthDays = [31, 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];
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
