// @ts-nocheck
// @ts-nocheck
// File: /@sponsorcoin/spcoin-access-modules/utils/dateTime.js
export const bigIntToDateTimeString = (_value) => {
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
export const getLocation = () => {
    let location = Intl.DateTimeFormat().resolvedOptions().timeZone;
    return location;
};
export const bigIntToDecMilliSecs = (_value) => { return (0, bigIntToDecString)(_value) + "000"; };
export const bigIntToDecString = (_value) => { return (0, bigIntToString)(_value, 10); };
export const bigIntToHexString = (_value) => { return (0, bigIntToString)(_value, 16); };
export const bigIntToString = (_value, _base) => { return BigInt(_value).toString(_base); };
export const formatTimeSeconds = (timeInSeconds) => {
    let formattedTime = parseTimeSeconds(timeInSeconds);
    return formattedTime;
};
export const parseTimeSeconds = (timeInSeconds) => {
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
export const dateInSeconds = () => {
    let dateInMillisecs = Date.now();
    let dateInSeconds = Math.round(dateInMillisecs / 1000);
    return dateInSeconds;
};
export const dateInMilliseconds = () => {
    let dateInMillisecs = Date.now();
    return dateInMillisecs;
};
