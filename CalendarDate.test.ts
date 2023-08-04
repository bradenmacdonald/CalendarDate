import { CalendarDate, D } from "./CalendarDate.ts";
import { assertEquals } from "https://deno.land/std@0.196.0/assert/assert_equals.ts";
import { assertThrows } from "https://deno.land/std@0.196.0/assert/assert_throws.ts";

/** test that the given CalendarDate seems "sane" (within expected ranges and self-consistent) */
function assertSane(calDate: CalendarDate) {
  // Optimized version:
  if (
    (calDate.year < 1 || calDate.year > 9999) ||
    (calDate.month < 1 || calDate.month > 12) ||
    (calDate.day < 1 || calDate.day > 31)
  ) {
    throw new Error(
      "CalendarDate is not sane. Property is outside of valid range.",
    );
  }
  if (
    (calDate.value !== new CalendarDate(calDate.value).value) ||
    (calDate.value !==
      CalendarDate.create(calDate.year, calDate.month, calDate.day).value)
  ) {
    throw new Error("CalendarDate is not sane. Re-creation failed.");
  }
}

Deno.test("daysInMonth()", () => {
  assertEquals(CalendarDate.daysInMonth(2023, CalendarDate.MONTHS.JAN), 31);
  assertEquals(CalendarDate.daysInMonth(2023, CalendarDate.MONTHS.FEB), 28); // non-leap
  assertEquals(CalendarDate.daysInMonth(2023, CalendarDate.MONTHS.MAR), 31);
  assertEquals(CalendarDate.daysInMonth(2023, CalendarDate.MONTHS.APR), 30);
  assertEquals(CalendarDate.daysInMonth(2023, CalendarDate.MONTHS.MAY), 31);
  assertEquals(CalendarDate.daysInMonth(2023, CalendarDate.MONTHS.JUN), 30);
  assertEquals(CalendarDate.daysInMonth(2023, CalendarDate.MONTHS.JUL), 31);
  assertEquals(CalendarDate.daysInMonth(2023, CalendarDate.MONTHS.AUG), 31);
  assertEquals(CalendarDate.daysInMonth(2023, CalendarDate.MONTHS.SEP), 30);
  assertEquals(CalendarDate.daysInMonth(2023, CalendarDate.MONTHS.OCT), 31);
  assertEquals(CalendarDate.daysInMonth(2023, CalendarDate.MONTHS.NOV), 30);
  assertEquals(CalendarDate.daysInMonth(2023, CalendarDate.MONTHS.DEC), 31);
  assertEquals(CalendarDate.daysInMonth(2020, CalendarDate.MONTHS.FEB), 29); // leap
});

Deno.test(".create()", async (t) => {
  const Y2K = 730485; // days between January 1, 2000 and January 1, year "0" (1 BCE)
  // deno-fmt-ignore
  const specificDates: {args: [y: number, m: number, d: number], str: string, value: number, dayOfWeek: number, dayOfYear: number}[] = [
        {args: [2000, CalendarDate.MONTHS.JAN, 1], str: "2000-01-01", value: 0 + Y2K, dayOfWeek: CalendarDate.DAYS.SAT, dayOfYear: 0},
        {args: [2000, CalendarDate.MONTHS.JAN, 31], str: "2000-01-31", value: 30 + Y2K, dayOfWeek: CalendarDate.DAYS.MON, dayOfYear: 30},
        {args: [2000, CalendarDate.MONTHS.FEB, 1], str: "2000-02-01", value: 31 + Y2K, dayOfWeek: CalendarDate.DAYS.TUE, dayOfYear: 31},
        {args: [2025, CalendarDate.MONTHS.NOV, 30], str: "2025-11-30", value: 9465 + Y2K, dayOfWeek: CalendarDate.DAYS.SUN, dayOfYear: 365-32},
        {args: [2025, CalendarDate.MONTHS.DEC, 1], str: "2025-12-01", value: 9466 + Y2K, dayOfWeek: CalendarDate.DAYS.MON, dayOfYear: 365-31},
        {args: [2789, CalendarDate.MONTHS.FEB, 28], str: "2789-02-28", value: 288235 + Y2K, dayOfWeek: CalendarDate.DAYS.TUE, dayOfYear: 58},
        {args: [2789, CalendarDate.MONTHS.MAR, 1], str: "2789-03-01", value: 288236 + Y2K, dayOfWeek: CalendarDate.DAYS.WED, dayOfYear: 59},
        {args: [9876, CalendarDate.MONTHS.MAY, 4], str: "9876-05-04", value: 3607259, dayOfWeek: CalendarDate.DAYS.THU, dayOfYear: 124},
        {args: [1999, CalendarDate.MONTHS.DEC, 31], str: "1999-12-31", value: -1 + Y2K, dayOfWeek: CalendarDate.DAYS.FRI, dayOfYear: 364},
        {args: [1997, CalendarDate.MONTHS.JAN, 1], str: "1997-01-01", value: -1095 + Y2K, dayOfWeek: CalendarDate.DAYS.WED, dayOfYear: 0},
        {args: [1996, CalendarDate.MONTHS.DEC, 31], str: "1996-12-31", value: -1096 + Y2K, dayOfWeek: CalendarDate.DAYS.TUE, dayOfYear: 365}, // 1996 was a leap year
        {args: [1996, CalendarDate.MONTHS.JAN, 1], str: "1996-01-01", value: -1461 + Y2K, dayOfWeek: CalendarDate.DAYS.MON, dayOfYear: 0},
        {args: [1794, CalendarDate.MONTHS.AUG, 15], str: "1794-08-15", value: -75013 + Y2K, dayOfWeek: CalendarDate.DAYS.FRI, dayOfYear: 226},
        {args: [1583, CalendarDate.MONTHS.JAN, 1], str: "1583-01-01", value: -152306 + Y2K, dayOfWeek: CalendarDate.DAYS.SAT, dayOfYear: 0},
        {args: [400, CalendarDate.MONTHS.MAR, 1], str: "0400-03-01", value: 146157, dayOfWeek: CalendarDate.DAYS.WED, dayOfYear: 60},  // March 1, 400 CE in back-projected Gregorian calendar
        {args: [123, CalendarDate.MONTHS.APR, 5], str: "0123-04-05", value: 45019, dayOfWeek: CalendarDate.DAYS.MON, dayOfYear: 94},  // April 5, 123 CE in back-projected Gregorian calendar
        {args: [1, CalendarDate.MONTHS.JAN, 1], str: "0001-01-01", value: 366, dayOfWeek: CalendarDate.DAYS.MON, dayOfYear: 0},  // Jan 1, 1 CE in back-projected Gregorian calendar
    ];
  for (const d of specificDates) {
    await t.step(
      `can construct a valid date from the triplet (${d.args}) (which is ${d.str})`,
      () => {
        const calDate = CalendarDate.create(...d.args);
        assertSane(calDate);
        assertEquals(calDate.value, d.value);
        assertEquals(calDate.toString(), d.str);
        assertEquals(
          calDate.dayOfWeek,
          d.dayOfWeek,
          `${d.str} day of week should be ${d.dayOfWeek} not ${calDate.dayOfWeek}`,
        );
        assertEquals(calDate.dayOfYear, d.dayOfYear);
      },
    );
  }

  await t.step("Can handle tricky dates", () => {
    for (let year = 1; year <= 3000; year++) {
      const j1 = CalendarDate.create(year, CalendarDate.MONTHS.JAN, 1);
      assertEquals(
        j1.year,
        year,
        `.year for Jan 1, ${year} should yield ${year}`,
      );
      assertEquals(
        j1.month,
        CalendarDate.MONTHS.JAN,
        `.month for Jan 1, ${year} should yield 0.`,
      );
      assertEquals(j1.day, 1, `.day for Jan 1, ${year} should yield 1.`);
      assertEquals(
        j1.dayOfYear,
        0,
        `.dayOfYear for Jan 1, ${year} should yield 0.`,
      );
      assertSane(j1);

      const d31 = CalendarDate.create(year, CalendarDate.MONTHS.DEC, 31);
      assertEquals(
        d31.year,
        year,
        `.year for Dec. 31, ${year} should yield ${year}`,
      );
      assertEquals(
        d31.month,
        CalendarDate.MONTHS.DEC,
        `.month for Dec. 31, ${year} should yield 11.`,
      );
      assertEquals(d31.day, 31, `.day for Dec. 31, ${year} should yield 31.`);
      assertEquals(d31.dayOfYear, CalendarDate.isLeapYear(year) ? 365 : 364);
      assertSane(d31);

      if (CalendarDate.isLeapYear(year)) {
        const f29 = CalendarDate.create(year, CalendarDate.MONTHS.FEB, 29);
        assertEquals(f29.year, year);
      } else {
        const mar1 = CalendarDate.create(year, CalendarDate.MONTHS.MAR, 1);
        const feb28 = CalendarDate.create(year, CalendarDate.MONTHS.FEB, 28);
        assertEquals(mar1.value - feb28.value, 1);
      }
    }
  });
});

Deno.test("fromString()", async (t) => {
  const dateStrings = [
    "2000-01-01", // Y2K
    "2000-12-31",
    "2007-01-09", // Announcement of the iPhone
    "2010-10-10",
    "2016-02-29",
    "2222-10-01",
    "1583-01-01",
    "1643-01-04", // Birth of Isaac Newton
    "1794-08-15",
    "1867-07-01", // Founding of Canada
    "0123-04-05",
    "5555-06-07", // Far future date
    "9999-12-31", // Max date
  ];
  for (const d of dateStrings) {
    await t.step(`parses "${d}" correctly`, () => {
      assertEquals(CalendarDate.fromString(d).toString(), d);
    });
    const dWithoutHyphens = d.split("-").join("");
    await t.step(`parses "${dWithoutHyphens}" correctly`, () => {
      assertEquals(CalendarDate.fromString(dWithoutHyphens).toString(), d);
    });
  }

  const badStrings = [
    "hello",
    "2016,01,01",
    "05/05/05",
    "2016-o1-o1",
  ];

  for (const bad of badStrings) {
    await t.step(`throws when asked to parse "${bad}"`, () => {
      assertThrows(() => {
        CalendarDate.fromString(bad);
      }, "Date string not in YYYY-MM-DD or YYYYMMDD format");
    });
  }
});

Deno.test("D can be used to create a date string literal", () => {
  const month = "01";
  const obj = D`${2000 + 16}-${month}-31`;
  assertEquals(obj.year, 2016);
  assertEquals(obj.toString(), "2016-01-31");
});

Deno.test("D`YYYY-MM-DD` can be used to create a date string literal", () => {
  assertEquals(
    D`${2000 + 16}-${"01"}-31`,
    CalendarDate.fromString("2016-01-31"),
  );
  assertEquals(D`1584-10-03`, CalendarDate.fromString("1584-10-03"));
  assertEquals(D`2000-01-01`, CalendarDate.fromString("2000-01-01"));
  assertEquals(D`2023-08-17`, CalendarDate.fromString("2023-08-17"));
});

Deno.test("today() can give the current date", () => {
  const jsDate = new Date();
  const calDate = CalendarDate.today();
  assertEquals(calDate.year, jsDate.getFullYear());
  assertEquals(calDate.month, jsDate.getMonth() + 1);
  assertEquals(calDate.day, jsDate.getDate());
});

Deno.test("constructor() constructs a sane CalendarDate for all valid values", () => {
  for (let i = 366; i <= 1096092; i++) { // 1096092 is 3000-12-31, the max supported value.
    const d = new CalendarDate(i);
    d.toString();
    assertSane(d);
  }
});

Deno.test("toJSON() serializes CalendarDate objects to JSON as strings", () => {
  const d = new CalendarDate(5000 + 730485);
  assertEquals(JSON.stringify({ date: d }), '{"date":"2013-09-09"}');
});

Deno.test(".isLeapYear() matches known leap/not-leap year dates", () => {
  assertEquals(CalendarDate.isLeapYear(2000), true);
  assertEquals(CalendarDate.isLeapYear(2001), false);
  assertEquals(CalendarDate.isLeapYear(2002), false);
  assertEquals(CalendarDate.isLeapYear(2003), false);
  assertEquals(CalendarDate.isLeapYear(2004), true);
  assertEquals(CalendarDate.isLeapYear(2005), false);

  assertEquals(CalendarDate.isLeapYear(2015), false);
  assertEquals(CalendarDate.isLeapYear(2016), true);
  assertEquals(CalendarDate.isLeapYear(2017), false);
  assertEquals(CalendarDate.isLeapYear(2018), false);
  assertEquals(CalendarDate.isLeapYear(2019), false);
  assertEquals(CalendarDate.isLeapYear(2020), true);

  assertEquals(CalendarDate.isLeapYear(2100), false);
  assertEquals(CalendarDate.isLeapYear(2200), false);
  assertEquals(CalendarDate.isLeapYear(2300), false);
  assertEquals(CalendarDate.isLeapYear(2400), true);
  assertEquals(CalendarDate.isLeapYear(2500), false);
  assertEquals(CalendarDate.isLeapYear(2600), false);
  assertEquals(CalendarDate.isLeapYear(2700), false);
  assertEquals(CalendarDate.isLeapYear(2800), true);
  assertEquals(CalendarDate.isLeapYear(2900), false);
  assertEquals(CalendarDate.isLeapYear(3000), false);
});

Deno.test("comparison", async (t) => {
  await t.step("works correctly when sorted", () => {
    const dates = [
      CalendarDate.create(2010, 3, 3),
      CalendarDate.create(2020, 4, 4),
      CalendarDate.create(2007, 9, 9),
    ];
    dates.sort();
    assertEquals(
      dates.map((d) => d.toString()).join(","),
      "2007-09-09,2010-03-03,2020-04-04",
    );
  });

  await t.step("checking equal dates", () => {
    const firstDate = D`2010-01-01`, secondDate = D`2010-01-01`;
    assertEquals(firstDate < secondDate, false);
    assertEquals(firstDate.isBefore(secondDate), false);
    assertEquals(firstDate > secondDate, false);
    assertEquals(firstDate.isAfter(secondDate), false);
    assertEquals(firstDate.equals(secondDate), true);
    // Unfortunately, equality checking with === won't work unless we coerce values
    assertEquals(+firstDate === +secondDate, true);
  });

  // Check dates where first date is after the second:
  for (
    const [firstDate, secondDate] of [
      [D`2010-01-02`, D`2010-01-01`],
      [D`2023-08-15`, D`2020-09-25`],
    ]
  ) {
    await t.step(
      `comparing ${firstDate.toString()} with ${secondDate.toString()}`,
      () => {
        assertEquals(firstDate < secondDate, false);
        assertEquals(firstDate.isBefore(secondDate), false);
        assertEquals(firstDate > secondDate, true);
        assertEquals(firstDate.isAfter(secondDate), true);
        assertEquals(firstDate.equals(secondDate), false);
        // Unfortunately, equality checking with === won't work unless we coerce values
        assertEquals(+firstDate === +secondDate, false);
      },
    );
  }

  // Check dates where first date is before the second:
  for (
    const [firstDate, secondDate] of [
      [D`2010-01-01`, D`2010-01-02`],
      [D`2013-09-15`, D`2020-03-15`],
    ]
  ) {
    await t.step(
      `comparing ${firstDate.toString()} with ${secondDate.toString()}`,
      () => {
        assertEquals(firstDate < secondDate, true);
        assertEquals(firstDate.isBefore(secondDate), true);
        assertEquals(firstDate > secondDate, false);
        assertEquals(firstDate.isAfter(secondDate), false);
        assertEquals(firstDate.equals(secondDate), false);
        // Unfortunately, equality checking with === won't work unless we coerce values
        assertEquals(+firstDate === +secondDate, false);
      },
    );
  }
});

Deno.test("toEpochMs", () => {
  assertEquals(D`1970-01-01`.toEpochMs(), 0);
  assertEquals(D`1970-01-02`.toEpochMs(), 86400 * 1000);
  assertEquals(D`1969-12-31`.toEpochMs(), -86400 * 1000);
});

Deno.test("toEpochSeconds", () => {
  assertEquals(D`1970-01-01`.toEpochSeconds(), 0);
  assertEquals(D`1970-01-02`.toEpochSeconds(), 86400);
  assertEquals(D`1969-12-31`.toEpochSeconds(), -86400);
});

Deno.test("toDate()", async (t) => {
  for (
    const dateStr of [
      "2000-01-01",
      "2000-01-31",
      "2000-02-01",
      "2025-11-30",
      "2025-12-01",
      "2789-02-28",
      "2789-03-01",
      "1999-12-31",
      "1997-01-01",
      "1996-12-31",
      "1996-01-01",
      "1794-08-15",
      "1583-01-01",
      "0400-03-01",
      "0123-04-05",
      "0001-01-01",
    ]
  ) {
    await t.step(dateStr, () => {
      assertEquals(
        CalendarDate.fromString(dateStr).toDate().toISOString().substring(
          0,
          10,
        ),
        dateStr,
      );
    });
  }
});

Deno.test("fromDate()", async (t) => {
  for (
    const dateStr of [
      "2000-01-01",
      "2000-01-31",
      "2000-02-01",
      "2025-11-30",
      "2025-12-01",
      "2789-02-28",
      "2789-03-01",
      "1999-12-31",
      "1997-01-01",
      "1996-12-31",
      "1996-01-01",
      "1794-08-15",
      "1583-01-01",
      "0400-03-01",
      "0123-04-05",
      "0001-01-01",
    ]
  ) {
    await t.step(dateStr, () => {
      const jsDate = CalendarDate.fromString(dateStr).toDate();
      assertEquals(CalendarDate.fromDate(jsDate).toString(), dateStr);
    });
  }
});

Deno.test(".add()", async (t) => {
  await t.step("add years", () => {
    // January 1, 2020:
    assertEquals(D`2020-01-01`.addYears(-9), D`2011-01-01`);
    assertEquals(D`2020-01-01`.addYears(-1), D`2019-01-01`);
    assertEquals(D`2020-01-01`.addYears(0), D`2020-01-01`);
    assertEquals(D`2020-01-01`.addYears(1), D`2021-01-01`);
    assertEquals(D`2020-01-01`.addYears(9), D`2029-01-01`);
    // February 29 from a leap year:
    assertEquals(D`2000-02-29`.addYears(0), D`2000-02-29`);
    assertEquals(D`2000-02-29`.addYears(1), D`2001-03-01`); // non-leap year -> jumps to March 1
    assertEquals(D`2000-02-29`.addYears(2), D`2002-03-01`); // non-leap year -> jumps to March 1
    assertEquals(D`2000-02-29`.addYears(3), D`2003-03-01`); // non-leap year -> jumps to March 1
    assertEquals(D`2000-02-29`.addYears(4), D`2004-02-29`);
    assertEquals(D`2000-02-29`.addYears(-4), D`1996-02-29`);
    assertEquals(D`2000-02-29`.addYears(-100), D`1900-03-01`); // non-leap year -> jumps to March 1
    // random dates:
    assertEquals(D`2023-08-15`.addYears(13), D`2036-08-15`);
    assertEquals(D`2002-03-01`.addYears(13), D`2015-03-01`);
    assertEquals(D`2002-02-28`.addYears(-1300), D`0702-02-28`);
  });

  await t.step("add months", () => {
    // January 1, 2020:
    assertEquals(D`2020-01-01`.addMonths(0), D`2020-01-01`);
    assertEquals(D`2020-01-01`.addMonths(1), D`2020-02-01`);
    assertEquals(D`2020-01-01`.addMonths(12), D`2021-01-01`);
    assertEquals(D`2020-01-01`.addMonths(13), D`2021-02-01`);
    assertEquals(D`2020-01-01`.addMonths(48), D`2024-01-01`);
    assertEquals(D`2020-01-01`.addMonths(-1), D`2019-12-01`);
    assertEquals(D`2020-01-01`.addMonths(-12), D`2019-01-01`);
    // December 31, 2000 -> some months won't have a matching day
    assertEquals(D`2000-12-31`.addMonths(-1), D`2000-11-30`);
    assertEquals(D`2000-12-31`.addMonths(0), D`2000-12-31`);
    assertEquals(D`2000-12-31`.addMonths(1), D`2001-01-31`);
    assertEquals(D`2000-12-31`.addMonths(2), D`2001-02-28`); // Notice this becomes Feb 28, not March 3, for consistency - the MM part of YYYY-MM-DD is always changing by exactly 1 here
    assertEquals(D`2000-12-31`.addMonths(3), D`2001-03-31`);
    assertEquals(D`2000-12-31`.addMonths(4), D`2001-04-30`); // Notice this becomes April 30, not May 1, for consistency - the MM part of YYYY-MM-DD is always changing by exactly 1 here
    // More....
    assertEquals(D`2000-12-31`.addMonths(-12), D`1999-12-31`);
    assertEquals(D`2000-12-31`.addMonths(-25), D`1998-11-30`);
  });

  await t.step("add days", () => {
    // December 31, 2020:
    assertEquals(D`2020-12-31`.addDays(0), D`2020-12-31`);
    assertEquals(D`2020-12-31`.addDays(1), D`2021-01-01`);
    assertEquals(D`2020-12-31`.addDays(2), D`2021-01-02`);
    assertEquals(D`2020-12-31`.addDays(17), D`2021-01-17`);
    assertEquals(D`2020-12-31`.addDays(31), D`2021-01-31`);
    assertEquals(D`2020-12-31`.addDays(32), D`2021-02-01`);
    assertEquals(D`2020-12-31`.addDays(365), D`2021-12-31`);
    assertEquals(D`2020-12-31`.addDays(365 * 2), D`2022-12-31`);
    assertEquals(D`2020-12-31`.addDays(365 * 3), D`2023-12-31`);
    assertEquals(D`2020-12-31`.addDays(365 * 4), D`2024-12-30`); // because 2024 is a leap year, this is Dec 30 not Dec 31
    assertEquals(D`2020-12-31`.addDays(-31), D`2020-11-30`);
    assertEquals(D`2020-12-31`.addDays(-300), D`2020-03-06`);
    assertEquals(D`2020-12-31`.addDays(-305), D`2020-03-01`);
    assertEquals(D`2020-12-31`.addDays(-306), D`2020-02-29`);
    assertEquals(D`2020-12-31`.addDays(-307), D`2020-02-28`);
  });
});

Deno.test("formatting dates", () => {
  const mediumEn = new Intl.DateTimeFormat("en", {
    timeZone: "UTC",
    dateStyle: "medium",
  });
  const mediumRu = new Intl.DateTimeFormat("ru", {
    timeZone: "UTC",
    dateStyle: "medium",
  });
  const fullEn = new Intl.DateTimeFormat("en", {
    timeZone: "UTC",
    dateStyle: "full",
  });
  // Medium English:
  assertEquals(D`2023-08-01`.format(mediumEn), "Aug 1, 2023");
  assertEquals(D`1969-07-20`.format(mediumEn), "Jul 20, 1969");
  assertEquals(D`0853-06-12`.format(mediumEn), "Jun 12, 853");
  // Medium Russian:
  assertEquals(D`2023-08-01`.format(mediumRu), "1 авг. 2023 г.");
  assertEquals(D`1969-07-20`.format(mediumRu), "20 июл. 1969 г.");
  assertEquals(D`0853-06-12`.format(mediumRu), "12 июн. 853 г.");
  // Full English:
  assertEquals(D`2023-08-01`.format(fullEn), "Tuesday, August 1, 2023");
  assertEquals(D`1969-07-20`.format(fullEn), "Sunday, July 20, 1969");
  assertEquals(D`0853-06-12`.format(fullEn), "Thursday, June 12, 853");
});

Deno.test("formatting dates - gives error with non-UTC formatter", () => {
  const pacificTime = new Intl.DateTimeFormat("en", {
    timeZone: "America/Vancouver",
    dateStyle: "medium",
  });
  assertThrows(
    () => D`2023-08-01`.format(pacificTime),
    Error,
    "DateTimeFormat must use UTC timezone.",
  );
});

Deno.test("computing age", async (t) => {
  const age = (birthDate: CalendarDate, today: CalendarDate) =>
    today.fullYearsSince(birthDate);

  await t.step("basic", () => {
    // A person born on August 10, 1990 would be these ages on these dates:
    const birthDate = D`1990-08-10`;
    assertEquals(age(birthDate, D`2020-05-12`), 29); // Way before their 30th birthday
    assertEquals(age(birthDate, D`2020-08-09`), 29); // A day before their birthday, they're 29
    assertEquals(age(birthDate, D`2020-08-10`), 30); // Day of their 30th birthday
    assertEquals(age(birthDate, D`2020-08-11`), 30); // Day after their 30th birthday
    assertEquals(age(birthDate, D`2020-11-09`), 30); // Way after their 30th birthday
  });

  await t.step("leap", () => {
    assertEquals(age(D`1992-02-29`, D`2012-02-28`), 19);
    assertEquals(age(D`1992-02-29`, D`2012-02-29`), 20);
    assertEquals(age(D`1992-02-29`, D`2012-03-01`), 20);

    assertEquals(age(D`1992-02-29`, D`2011-02-28`), 18);
    assertEquals(age(D`1992-02-29`, D`2011-03-01`), 19);
  });

  await t.step("zero age", () => {
    assertEquals(age(D`2023-05-07`, D`2023-05-07`), 0);
    assertEquals(age(D`2023-05-01`, D`2023-05-07`), 0);
    assertEquals(age(D`2023-05-01`, D`2024-04-28`), 0);
  });
});
