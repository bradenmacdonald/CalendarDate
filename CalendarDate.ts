/** Array that represents the cumulative number of days in a non-leap year up to the start of a given month */
const MONTH_SUMS_NORMAL_YEAR = Object.freeze([
  NaN, // we use 1-indexed months, so there's no entry at the zero index.
  0,
  31,
  59,
  90,
  120,
  151,
  181,
  212,
  243,
  273,
  304,
  334,
]);

/**
 * Helper method. Given a month (1-12 EXCLUDING 2 for February), return how many days it has.
 * It uses a neat bitwise trick for performance. Again, this works for every month except February.
 */
const optimizedDaysInMonth = (month: number): 30 | 31 =>
  (month & 1) === (month >> 3) ? 30 : 31;

/** Helper to get an int from a substring of a string, defaulting to two digits long. */
const extractInt = (someString: string, start: number, len = 2) =>
  Number(someString.substring(start, start + len));

/** Character code of the letter A, used for the cached strings below */
const MONTHS_CHAR_OFFSET = "A".charCodeAt(0) - 1;

// The following maps convert from day of the year (e.g. 0 for Jan. 1) to month ('A' = Jan, 'B' = Feb, ...)
// These maps are precomputed to make the date class more efficient.
// const NORMAL_YEAR =
//   "AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAABBBBBBBBBBBBBBBBBBBBBBBBBBBBCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCC" +
//   "DDDDDDDDDDDDDDDDDDDDDDDDDDDDDDEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEFFFFFFFFFFFFFFFFFFFFFFFFFFFFFF" +
//   "GGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGHHHHHHHHHHHHHHHHHHHHHHHHHHHHHHHIIIIIIIIIIIIIIIIIIIIIIIIIIIIII" +
//   "JJJJJJJJJJJJJJJJJJJJJJJJJJJJJJJKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKLLLLLLLLLLLLLLLLLLLLLLLLLLLLLLL";
// Instead of hard-coding as seen above, we construct these in the following way to improve minification size.
const pre = "A".repeat(31) + "B".repeat(28);
const end = "CDEFGHIJKL".split("").map((x, i) =>
  x.repeat(optimizedDaysInMonth(i + 3))
).join("");
const NORMAL_YEAR = pre + end;
const LEAP_YEAR = pre + "B" + end;

/**
 * Internal helper method.
 * Given a year, month, and day triplet, return
 * the number of days between January 1, year "0" (1 BCE) and the given date.
 *
 * @param year Year (e.g. 2012)
 * @param month Month (1 for January, 12 for December)
 * @param day Day (1-31)
 */
const tripletToDaysValue = (
  year: number,
  month: number,
  day: number,
): number => {
  if (day <= 0 || day > CalendarDate.daysInMonth(year, month)) {
    throw new Error(`Day out of range.`);
  }
  let daysValue = (year * 365) + ((year + 3) / 4 | 0) -
    ((year + 99) / 100 | 0) + ((year + 399) / 400 | 0)
    + MONTH_SUMS_NORMAL_YEAR[month] + day - 1;
  if (CalendarDate.isLeapYear(year) && month > 2) {
    daysValue++;
  }
  return daysValue;
};

/**
 * A calendar date, using the Gregorian calendar. Does not have any time component.
 */
class CalendarDate {
  /** The internal date value (days since 0000-01-01) */
  readonly #value: number;

  /**
   * Construct a CalendarDate from a triple of year (1-9999), month (1-12), day (1-31)
   * @param year Year (e.g. 2012)
   * @param month Month (1 for January, 12 for December)
   * @param day Day (1-31)
   */
  public static create(year: number, month: number, day: number): CalendarDate {
    return new CalendarDate(tripletToDaysValue(year, month, day));
  }

  public static fromPlainDate(pd: Temporal.PlainDate): CalendarDate {
    return new CalendarDate(tripletToDaysValue(pd.year, pd.month, pd.day));
  }

  /**
   * Construct a CalendarDate from an ISO 8601 date string "YYYY-MM-DD" or "YYYYMMDD"
   * @param str An ISO 8601 date string
   */
  public static fromString(str: string): CalendarDate {
    const year = extractInt(str, 0, 4);
    let month = NaN;
    let day = NaN;
    if (str.length === 10 && str.charAt(4) === "-" && str.charAt(7) === "-") {
      // YYYY-MM-DD format, presumably:
      month = extractInt(str, 5);
      day = extractInt(str, 8);
    } else if (str.length === 8) {
      // YYYYMMDD format, presumably.
      month = extractInt(str, 4);
      day = extractInt(str, 6);
    }
    if (isNaN(year) || isNaN(month) || isNaN(day)) {
      throw new Error("Date string not in YYYY-MM-DD or YYYYMMDD format");
    }
    return new CalendarDate(tripletToDaysValue(year, month, day));
  }

  /**
   * Get the current date, according to the system's local time
   */
  public static today(): CalendarDate {
    const jsDate = new Date();
    return new CalendarDate(
      tripletToDaysValue(
        jsDate.getFullYear(),
        jsDate.getMonth() + 1,
        jsDate.getDate(),
      ),
    );
  }

  /**
   * Construct a CalendarDate instance using its internal int representation (# of days since the millenium)
   * @param daysValue how many days since the dawn of the year "0" (1 BCE)
   */
  constructor(daysValue: number) {
    if (
      daysValue < 366 || // 366 represents January 1, in the year 1 CE
      daysValue > 3652424 // 3652424 is Dec. 31, 9999
    ) {
      throw new Error(`Date value (${daysValue}) out of range.`);
    } else if (!Number.isInteger(daysValue)) {
      throw new Error(`Non-integer date value.`);
    }
    this.#value = daysValue;
  }

  /**
   * JSON serialization - as an ISO 8601 string
   */
  public toJSON(): string {
    return this.toString();
  }

  /** Get the year */
  public get year(): number {
    const centuries = (this.#value / 36525) | 0;
    return (this.#value + centuries - (centuries / 4 | 0)) / 365.25 | 0;
  }

  /** Get the month (1-12) */
  public get month(): number {
    const year = this.year;
    // Compute the number of days between January 1, year 0 and the first day of the given year:
    const d = (year * 365) + ((year + 3) / 4 | 0) - ((year + 99) / 100 | 0) +
      ((year + 399) / 400 | 0);
    if (CalendarDate.isLeapYear(year)) {
      return LEAP_YEAR.charCodeAt(this.#value - d) - MONTHS_CHAR_OFFSET;
    } else {
      return NORMAL_YEAR.charCodeAt(this.#value - d) - MONTHS_CHAR_OFFSET;
    }
  }

  /** Get the day of the month (1-31) */
  get day(): number {
    return this.#value - tripletToDaysValue(this.year, this.month, 1) + 1;
  }

  /** Get the day of the week (0 = Monday, 6 = Sunday) */
  get dayOfWeek(): number {
    return (this.#value + 5) % 7;
  }

  /** Get the day of the year (0-365) */
  get dayOfYear(): number {
    return this.#value - tripletToDaysValue(this.year, 1, 1);
  }

  /**
   * Get the date as an ISO 8601 string (e.g. "2015-01-25")
   */
  public toString(): string {
    const month = this.month, day = this.day;
    return (
      String(this.year).padStart(4, "0") +
      (month < 10 ? "-0" : "-") + month +
      (day < 10 ? "-0" : "-") + day
    );
  }

  /**
   * Get the primitive value (enables correct sorting and comparison)
   * Except note that equality checking won't work unless you coerce values
   * e.g. CalendarDate.create(2010, 1, 1) == CalendarDate.create(2010, 1, 1) : false
   * e.g. CalendarDate.create(2010, 1, 1) == +CalendarDate.create(2010, 1, 1) : true
   */
  public valueOf(): number {
    return this.#value;
  }

  /** Get the internal value of this CalendarDate (days since January 1, 1 BCE) */
  public get value(): number {
    return this.#value;
  }

  /**
   * Helper method: how many days are in the specified month of the specified year?
   * @param year Year
   * @param month Month (1-12)
   */
  public static daysInMonth(year: number, month: number): number {
    if (month === 2) { // Special case for February:
      return CalendarDate.isLeapYear(year) ? 29 : 28;
    }
    return optimizedDaysInMonth(month);
  }

  /**
   * Is 'year' a leap year?
   * @param year The year in question, e.g. 2000
   */
  public static isLeapYear(year: number): boolean {
    return (year % 4 === 0) && (year % 100 !== 0 || year % 400 === 0);
  }

  /** Get this calendar date as a regular JavaScript Date object, with UTC timezone. */
  public toDate(): Date {
    return new Date(this.toEpochMs());
  }

  public toPlainDate(): Temporal.PlainDate {
    return new Temporal.PlainDate(this.year, this.month, this.day);
  }

  /** Get the number of milliseconds since the Unix epoch (Jan 1, 1970 UTC) */
  public toEpochMs(): number {
    return (this.#value - 719528) * 86400_000; // 719528 is the unix epoch, CalendarDate.fromString("1970-01-01").value
  }

  public static fromDate(d: Date): CalendarDate {
    const isoString = d.toISOString();
    if (!isoString.endsWith("00:00:00.000Z")) {
      throw new Error(`Non-UTC Date. Use UTC for calendar dates.`);
    }
    return new CalendarDate(
      tripletToDaysValue(
        d.getUTCFullYear(),
        d.getUTCMonth() + 1,
        d.getUTCDate(),
      ),
    );
  }

  public addYears(delta: number): CalendarDate {
    const newYear = this.year + delta;
    // Special case handling for February in leap years:
    if (
      this.month === 2 && this.day === 29 &&
      !CalendarDate.isLeapYear(newYear)
    ) {
      return CalendarDate.create(newYear, this.month + 1, 1);
    } else {
      // Just change the year value - easy
      return CalendarDate.create(newYear, this.month, this.day);
    }
  }

  public addMonths(delta: number): CalendarDate {
    const currentMonths = this.year * 12 + this.month - 1;
    const newYear = (currentMonths + delta) / 12 | 0;
    const newMonth = (currentMonths + delta) % 12 + 1;
    const maxDay = CalendarDate.daysInMonth(newYear, newMonth);
    const overflow = Math.max(0, this.day - maxDay); // Handle Dec 31 plus two months becoming Feb 28, not Feb 31
    return CalendarDate.create(newYear, newMonth, this.day - overflow);
  }

  public addDays(delta: number): CalendarDate {
    return new CalendarDate(this.#value + delta);
  }

  public format(formatter: Intl.DateTimeFormat): string {
    if (formatter.resolvedOptions().timeZone !== "UTC") {
      throw new Error("DateTimeFormat must use UTC timezone.");
    }
    return formatter.format(this.toEpochMs()); // This is _slightly_ faster than using formatter .format(this.toDate())
  }

  // Comparison helpers:

  public equals(other: CalendarDate): boolean {
    return this.#value === other.#value;
  }

  public isBefore(other: CalendarDate): boolean {
    return this.#value < other.#value;
  }

  public isAfter(other: CalendarDate): boolean {
    return this.#value > other.#value;
  }

  /**
   * Calculate how many full years have been between the given date and this date.
   * Useful for computing age.
   */
  public fullYearsSince(earlierDate: CalendarDate): number {
    const needOffset = this.month > earlierDate.month ||
      (this.month === earlierDate.month && this.day >= earlierDate.day);
    return (this.year - earlierDate.year) - (needOffset ? 0 : 1);
  }

  // Pretty print in Deno
  [Symbol.for("Deno.customInspect")](): string {
    return `CalendarDate {${this.toString()}}`;
  }
}

/**
 * Parse a template string literal as an ISO 8601 calendar date.
 * e.g. const date = D`2016-01-01`;
 *
 * @param strings Well-formed template call site object
 * @param keys substitution values
 */
const D = (
  strings: TemplateStringsArray,
  ...keys: unknown[]
): CalendarDate => {
  return CalendarDate.fromString(String.raw(strings, ...keys));
};

export { CalendarDate, D };
