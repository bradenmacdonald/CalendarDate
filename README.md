# Calendar Date Type for JavaScript/TypeScript

## What is it?

A JavaScript calendar date class, that can represent any calendar date from
January 1, 1 CE to December 31, 9999. For dates prior to October 1582, it
assumes a "back-projected" Gregorian calendar, as if that were always the
calendar in use at the time.

Dates are internally represented as a single `Number` for performance and memory
efficiency.

## Why do you want this?

A **calendar date** like "August 5, 2023" is a very different thing from a
**timestamp** (an exact moment in time). But many APIs conflate the two.

Python very correctly distinguishes between them with its `date` and `datetime`
classes. But many JavaScript APIs (including the core JavaScript language spec)
conflate these two concepts into a single `Date` class, which can create a lot
of potential for bugs to creep into your application.

In my opinion, you should avoid using JavaScript's built-in `Date()` type for
representing calendar dates, because it only works if you are extremely careful
to always use UTC, both when constructing the `Date` and when displaying it.

e.g. on my system, `new Date("2021-03-01").toString()` gives `Feb 28 2021...` -
the date "March 1" has been accidentally changed to "Feb 28" through code that
looks perfectly reasonable. In this case, the `Date` is correctly constructed
using UTC, but is formatted using local time. Likewise, in some timezones you
can see `new Date(2021, 2, 1).toISOString().substring(0,10)` (March 1) will be
printed as `"2021-02-28"` (Feb 28) through the opposite problem - the date is
constructed using local time but printed using UTC.

The benefits of using `CalendarDate` are:

- It allows you to be explicit in your API design (in your TypeScript types)
  about whether you're using a calendar date or a timestamp.
- It lets you avoid all kinds of subtle bugs related to timezones and daylight
  savings time (this is the voice of experience talking!).
- This implementation is very optimized and is typically 3-10x faster than using
  the native `Date` class. It represents all dates as a single `Number` so it is
  also very memory efficient.
- Unlike `Date`, it is immutable, which makes your code more predictable.

## Usage by example

Instantiation:

```typescript
import { CalendarDate, D } from "./CalendarDate.ts";

// You can construct CalendarDate instances using the included D literal helper:
const someDate = D`2023-08-15`;
// Or using CalendarDate.create()
const otherDate = CalendarDate.create(2023, 9, 27); // Sept. 27, 2023
// Or using CalendarDate.fromString()
const thirdDate = CalendarDate.fromString("2023-10-02"); // ISO 8601 format
// Or from a JavaScript Date
const convertedDate = CalendarDate.fromDate(new Date("2023-11-12"));
// Or get the current date
const today = CalendarDate.today();
```

Printing/conversion:

```typescript
// You can print dates using ISO 8601 format:
someDate.toString(); // "2023-08-15"
// Or get various properties:
[someDate.year, someDate.month, someDate.day]; // [ 2023, 8, 15 ]
// Or convert back to a JavaScript date:
someDate.toDate(); // Date [2023-08-15T00:00:00.000Z]
// Or format using any locale you want (see FAQ):
someDate.format(myLocaleFormat); // "Aug 15, 2023", "15 авг. 2023 г.", etc.
```

Manipulation:

```typescript
// You can add days (this returns a new instance; CalendarDates are immutable)
const nextDay = someDate.addDays(1);
// Or add months
const nextMonth = someDate.addMonths(1);
// Or add years
const nextYear = someDate.addYears(1);
```

For more usage details and examples, just check out the code or the test cases.
It's very readable.

## Benchmarks

See the included [`CalendarDate.bench.ts`](CalendarDate.bench.ts) file for
details. You can run these benchmarks using
[`deno bench`](https://deno.land/manual/tools/benchmarker).

### Combined features

This test uses `fromString()` to construct a calendar date, then `addDays()` to
construct a second date, then uses `toString()` to print both dates in ISO 8601
format.

On this test, `CalendarDate` is:

- **5x faster** than the native `Date` object
- **7x faster** than
  [`calendar-date` on NPM](https://www.npmjs.com/package/calendar-date)
- **17x faster** than [Day.js](https://day.js.org/)

### Parsing

This test parses 16 ISO 8601 date strings, as you might do when consuming a JSON
API response.

On this test, `CalendarDate` is:

- Slightly (1.13x) slower than the native `Date` object
- **4x faster** than
  [`calendar-date` on NPM](https://www.npmjs.com/package/calendar-date)
- **4x faster** than [Day.js](https://day.js.org/)

### Iterate throught a year

This test starts with a January 1 date then iterates through every date in the
year, converting each date to an ISO 8601 string.

On this test, `CalendarDate` is:

- **8x faster** than the native `Date` object
- **18x faster** than
  [`calendar-date` on NPM](https://www.npmjs.com/package/calendar-date)
- **32x faster** than [Day.js](https://day.js.org/)

## FAQ

### Q: How do I compute the age of something/someone?

A: Using `fullYearsSince()`.

```typescript
const today = CalendarDate.today();
today.fullYearsSince(birthDate); // This will print the person's age in years
```

### Q: How do I format a date as a nice string in the user's locale?

A: First, declare a formatter that specifies the user's locale and the "style"
of date that you want to use (e.g. `medium`). Then use `CalendarDate`'s
`.format()` method.

```typescript
const format = new Intl.DateTimeFormat("en", {
  timeZone: "UTC", // Using UTC is required
  dateStyle: "medium", // "full" | "long" | "medium" | "short"
});

const dateValue = D`2023-08-15`; // a CalendarDate
dateValue.format(format);
// "Aug 15, 2023"
```

To help you avoid bugs, the `.format()` method will throw an error if your
`DateTimeFormat` is not using UTC timezone.

In a React application, you can achieve the same effect using
[`react-intl`'s `<FormattedDate>`](https://formatjs.io/docs/react-intl/components/#formatteddate).

### Q: How do I format a date range in the user's locale?

A: You'll have to use the formatter yourself to format a range:

```typescript
const formatter = new Intl.DateTimeFormat("en", {
  timeZone: "UTC", // Using UTC is required
  dateStyle: "long", // "full" | "long" | "medium" | "short"
});

const start = D`2023-07-13`; // a CalendarDate
const end = D`2023-07-27`; // a CalendarDate
formatter.formatRange(start.toDate(), end.toDate());
// "July 13 – 27, 2023"
```

In a React application, you can achieve the same effect using
[`react-intl`'s `<FormattedDateTimeRange>`](https://formatjs.io/docs/react-intl/components/#formatteddatetimerange).

## History

This is based on my own
[PDate](https://github.com/bradenmacdonald/prophecy/blob/master/source/pdate.ts)
and later
[VDate](https://github.com/neolace-dev/vertex-framework/blob/main/vertex/lib/types/vdate.ts)
code. If you happen to need Neo4j compatibility, check out VDate instead.

## License

MIT
