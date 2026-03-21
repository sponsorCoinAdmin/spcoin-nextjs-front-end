"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.dateInMilliseconds = exports.dateInSeconds = exports.formatTimeSeconds = exports.bigIntToString = exports.bigIntToHexString = exports.bigIntToDecString = exports.getLocation = exports.bigIntToDateTimeString = exports.millennium = exports.month = exports.year = exports.week = exports.day = exports.hour = exports.minute = exports.second = void 0;
// @ts-nocheck
// File: /@sponsorcoin/spcoin-access-modules/utils/dateTime.js
exports.second = 1;
exports.minute = exports.second * 60;
exports.hour = exports.minute * 60;
exports.day = exports.hour * 24;
exports.week = exports.day * 7;
exports.year = exports.day * 365.242199; // Actual time in year considering leap year
exports.month = exports.year / 12;
exports.millennium = exports.year * 1000;
const bigIntToDateTimeString = (_value) => {
    let milliSecs = bigIntToDecMilliSecs(_value);
    const options = { month: "long",
        // era: 'long',
        day: "numeric",
        year: "numeric",
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
        timeZoneName: 'short' };
    const date = new Date(1683963292000);
    const dateString = new Intl.DateTimeFormat("en-US", options).format(milliSecs);
    return dateString;
};
exports.bigIntToDateTimeString = bigIntToDateTimeString;
const getLocation = () => {
    let location = Intl.DateTimeFormat().resolvedOptions().timeZone;
    return location;
};
exports.getLocation = getLocation;
const bigIntToDecMilliSecs = (_value) => { return (0, exports.bigIntToDecString)(_value) + "000"; };
const bigIntToDecString = (_value) => { return (0, exports.bigIntToString)(_value, 10); };
exports.bigIntToDecString = bigIntToDecString;
const bigIntToHexString = (_value) => { return (0, exports.bigIntToString)(_value, 16); };
exports.bigIntToHexString = bigIntToHexString;
const bigIntToString = (_value, _base) => { return BigInt(_value).toString(_base); };
exports.bigIntToString = bigIntToString;
const formatTimeSeconds = (timeInSeconds) => {
    let formattedTime = parseTimeSeconds(timeInSeconds);
    return formattedTime;
};
exports.formatTimeSeconds = formatTimeSeconds;
const parseTimeSeconds = (timeInSeconds) => {
    // let timeInSeconds = 340047;
    let seconds = timeInSeconds;
    const days = Math.floor(timeInSeconds / 86400);
    seconds -= days * 86400;
    const hours = Math.floor(seconds / 3600);
    seconds -= hours * 3600;
    const minutes = Math.floor(seconds / 60);
    seconds -= minutes * 60;
    // let remaining = timeInSeconds - (days*24*60*60 + hours*60*60);
    let formattedTime = 'Days:' + days + ' Hours:' + hours + ' Minutes:' + minutes + ' Seconds:' + seconds;
    console.log("formattedTime = ", formattedTime);
    return formattedTime;
};
const dateInSeconds = () => {
    let dateInMillisecs = Date.now();
    let dateInSeconds = Math.round(dateInMillisecs / 1000);
    return dateInSeconds;
};
exports.dateInSeconds = dateInSeconds;
const dateInMilliseconds = () => {
    let dateInMillisecs = Date.now();
    return dateInMillisecs;
};
exports.dateInMilliseconds = dateInMilliseconds;
