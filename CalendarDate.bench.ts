// deno-fmt-ignore-file
import { CalendarDate } from "./CalendarDate.ts";
import { CalendarDate as NpmCalendarDate } from "npm:calendar-date";
import dayjs from "npm:dayjs";
import { Temporal as TemporalPollyfill } from 'npm:@js-temporal/polyfill';

declare const Temporal: typeof TemporalPollyfill;

if (typeof Temporal === "undefined") {
    // The new Temporal API is behind a V8 feature flag.
    throw new Error(`Run this using: deno bench --v8-flags=--harmony-temporal`);
}

////////////////////////////////////////////////////////////////////////////////
////////////////////////////////////////////////////////////////////////////////

const initialDateStr = "2023-08-17";
const plusOneDateStr = "2023-08-18";

Deno.bench("Combined features - CalendarDate", { group: "combined", baseline: true }, () => {
    const d1 = CalendarDate.fromString(initialDateStr);
    const d2 = d1.addDays(1);
    if (d1.toString() !== initialDateStr) throw new Error("toString() failed.");
    if (d2.toString() !== plusOneDateStr) throw new Error("Adding a day failed.");
    if (d2.isBefore(d1)) throw new Error("Comparison test failed.");
});

Deno.bench("Combined features - NPM calendar-date", { group: "combined" }, () => {
    const d1 = new NpmCalendarDate(initialDateStr);
    const d2 = d1.addDays(1);
    if (d1.toString() !== initialDateStr) throw new Error("toString() failed.");
    if (d2.toString() !== plusOneDateStr) throw new Error("Adding a day failed.");
    if (d2.isBefore(d1)) throw new Error("Comparison test failed.");
});

Deno.bench("Combined features - Day.js", { group: "combined" }, () => {
    const d1 = dayjs(initialDateStr);
    const d2 = d1.add(1, "day");
    if (d1.toISOString().substring(0, 10) !== initialDateStr) throw new Error("toString() failed.");
    if (d2.toISOString().substring(0, 10) !== plusOneDateStr) throw new Error("Adding a day failed.");
    if (d2.isBefore(d1)) throw new Error("Comparison test failed.");
});

Deno.bench("Combined features - Native Date object", { group: "combined" }, () => {
    const d1 = new Date(Date.parse(initialDateStr));
    const d2 = new Date(Date.UTC(d1.getUTCFullYear(), d1.getUTCMonth(), d1.getUTCDate() + 1));
    if (d1.toISOString().substring(0, 10) !== initialDateStr) throw new Error("toString() failed.");
    if (d2.toISOString().substring(0, 10) !== plusOneDateStr) throw new Error("Adding a day failed.");
    if (d2 <= d1) throw new Error("Comparison test failed.");
});

Deno.bench("Combined features - Native Date object (alt add day method)", { group: "combined" }, () => {
    const d1 = new Date(Date.parse(initialDateStr));
    const d2 = new Date(d1); d2.setDate(d2.getDate() + 1);
    if (d1.toISOString().substring(0, 10) !== initialDateStr) throw new Error("toString() failed.");
    if (d2.toISOString().substring(0, 10) !== plusOneDateStr) throw new Error("Adding a day failed.");
    if (d2 <= d1) throw new Error("Comparison test failed.");
});

Deno.bench("Combined features - Native Temporal.PlainDate object", { group: "combined" }, () => {
    const d1 = Temporal.PlainDate.from(initialDateStr);
    const d2 = d1.add({days: 1});
    if (d1.toString() !== initialDateStr) throw new Error("toString() failed.");
    if (d2.toString() !== plusOneDateStr) throw new Error("Adding a day failed.");
    if (Temporal.PlainDate.compare(d1, d2) !== -1) throw new Error("Comparison test failed.");
});

Deno.bench("Combined features - Pollyfilled Temporal.PlainDate object", { group: "combined" }, () => {
    const d1 = TemporalPollyfill.PlainDate.from(initialDateStr);
    const d2 = d1.add({days: 1});
    if (d1.toString() !== initialDateStr) throw new Error("toString() failed.");
    if (d2.toString() !== plusOneDateStr) throw new Error("Adding a day failed.");
    if (TemporalPollyfill.PlainDate.compare(d1, d2) !== -1) throw new Error("Comparison test failed.");
});

////////////////////////////////////////////////////////////////////////////////
////////////////////////////////////////////////////////////////////////////////

const stringsToParse = [
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
];

Deno.bench("Parse - CalendarDate", { group: "parse", baseline: true }, () => {
    for (const str of stringsToParse) {
        CalendarDate.fromString(str);
    }
});

Deno.bench("Parse - NPM calendar-date", { group: "parse" }, () => {
    for (const str of stringsToParse) {
        new NpmCalendarDate(str);
    }
});

Deno.bench("Parse - Day.js", { group: "parse" }, () => {
    for (const str of stringsToParse) {
        dayjs(str);
    }
});

Deno.bench("Parse - Native Date object", { group: "parse" }, () => {
    for (const str of stringsToParse) {
        new Date(Date.parse(str));
    }
});

Deno.bench("Parse - Native Temporal.PlainDate object", { group: "parse" }, () => {
    for (const str of stringsToParse) {
        Temporal.PlainDate.from(str);
    }
});

Deno.bench("Parse - Pollyfilled Temporal.PlainDate object", { group: "parse" }, () => {
    for (const str of stringsToParse) {
        TemporalPollyfill.PlainDate.from(str);
    }
});

////////////////////////////////////////////////////////////////////////////////
////////////////////////////////////////////////////////////////////////////////

const year = 2023;

Deno.bench("Iterate through a year - CalendarDate", { group: "iterate", baseline: true }, () => {
    let d = CalendarDate.create(year, 1, 1);
    for (let i = 0; i < 365; i++) {
        d.toString();
        d = d.addDays(1);
    }
    if (d.toString() !== "2024-01-01") throw new Error(`Invalid end date, got ${d.toString()}`);
});

Deno.bench("Iterate through a year - NPM calendar-date", { group: "iterate" }, () => {
    let d = new NpmCalendarDate(year, 1, 1);
    for (let i = 0; i < 365; i++) {
        d.toString();
        d = d.addDays(1);
    }
    if (d.toString() !== "2024-01-01") throw new Error(`Invalid end date, got ${d.toString()}`);
});

Deno.bench("Iterate through a year - Day.js", { group: "iterate" }, () => {
    let d = dayjs(`${year}-01-01`);
    for (let i = 0; i < 365; i++) {
        d.toISOString().substring(0, 10);
        d = d.add(1, "day");
    }
    if (d.toISOString().substring(0, 10) !== "2024-01-01") throw new Error(`Invalid end date, got ${d.toString()}`);
});

Deno.bench("Iterate through a year - native JS Date object", { group: "iterate" }, () => {
    const d = new Date(Date.UTC(year, 0, 1));
    for (let i = 0; i < 365; i++) {
        d.toISOString().substring(0, 10);
        d.setUTCDate(d.getUTCDate() + 1);
    }
    if (d.toISOString().substring(0, 10) !== "2024-01-01") throw new Error(`Invalid end date, got ${d.toString()}`);
});

Deno.bench("Iterate through a year - native Temporal.PlainDate object", { group: "iterate" }, () => {
    let d = new Temporal.PlainDate(year, 1, 1);
    for (let i = 0; i < 365; i++) {
        d.toString();
        d = d.add({days: 1});
    }
    if (d.toString() !== "2024-01-01") throw new Error(`Invalid end date, got ${d.toString()}`);
});

Deno.bench("Iterate through a year - Pollyfilled Temporal.PlainDate object", { group: "iterate" }, () => {
    let d = new TemporalPollyfill.PlainDate(year, 1, 1);
    for (let i = 0; i < 365; i++) {
        d.toString();
        d = d.add({days: 1});
    }
    if (d.toString() !== "2024-01-01") throw new Error(`Invalid end date, got ${d.toString()}`);
});

////////////////////////////////////////////////////////////////////////////////
////////////////////////////////////////////////////////////////////////////////

const mediumEn = new Intl.DateTimeFormat("en", { timeZone: "UTC", dateStyle: "medium" });
const mediumRu = new Intl.DateTimeFormat("ru", { timeZone: "UTC", dateStyle: "medium" });

Deno.bench("Formatting", () => {
    let str = "";
    const d = CalendarDate.fromString("2023-01-01");
    for (let i = 0; i < 100; i++) {
        str += d.format(mediumEn) + d.format(mediumRu);
    }
    if (str.length !== 2500) throw new Error("formatting failed");
});
