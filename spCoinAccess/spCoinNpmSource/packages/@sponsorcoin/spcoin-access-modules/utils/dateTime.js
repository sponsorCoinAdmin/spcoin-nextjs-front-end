const second = 1;
const minute = second * 60;
const hour = minute * 60;
const day = hour * 24;
const week = day * 7;
const year = day * 365.242199; // Actual time in year considering leap year
const month = year/12;
const millennium = year * 1000;

const bigIntToDateTimeString = ( _value ) => { 
    let milliSecs = bigIntToDecMilliSecs(_value);
  
    const options = { month: "long", 
    // era: 'long',
    day: "numeric", 
    year: "numeric",
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    timeZoneName: 'short'};
    const date = new Date(1683963292000);
    const dateString = new Intl.DateTimeFormat("en-US", options).format(milliSecs);
    
  return dateString;
};

const getLocation = () => {
  let location = Intl.DateTimeFormat().resolvedOptions().timeZone;
  return location;
}
  
const bigIntToDecMilliSecs = ( _value ) => { return bigIntToDecString(_value) + "000"; };
const bigIntToDecString = ( _value ) => { return bigIntToString(_value, 10); };
const bigIntToHexString = ( _value ) => { return bigIntToString(_value, 16); };
const bigIntToString = ( _value, _base ) => { return BigInt(_value).toString(_base); };

const formatTimeSeconds = (timeInSeconds) => {
  let formattedTime = parseTimeSeconds(timeInSeconds);
  return formattedTime;
}

const parseTimeSeconds = (timeInSeconds) => {
  // let timeInSeconds = 340047;
  let seconds = timeInSeconds;
  const days = Math.floor(timeInSeconds / 86400);
  seconds -= days * 86400 ;
  const hours = Math.floor(seconds / 3600);
  seconds -= hours * 3600;
  const minutes = Math.floor(seconds/60);
  seconds -= minutes * 60;

  // let remaining = timeInSeconds - (days*24*60*60 + hours*60*60);
  let formattedTime = 'Days:'+ days+ ' Hours:'+ hours+ ' Minutes:'+ minutes+ ' Seconds:'+ seconds;
  console.log("formattedTime = ",formattedTime);
  return formattedTime;
}

const dateInSeconds = () => {
  let dateInMillisecs = Date.now();
  let dateInSeconds = Math.round( dateInMillisecs / 1000 );
  return dateInSeconds;
}

const dateInMilliseconds = () => {
  let dateInMillisecs = Date.now();
  return dateInMillisecs;
}
  
module.exports = {
  second,
  minute,
  hour,
  day,
  week,
  year,
  month,
  millennium,
  bigIntToDateTimeString,
  bigIntToDecString,
  bigIntToHexString,
  bigIntToString,
  dateInMilliseconds,
  dateInSeconds,
  formatTimeSeconds,
  getLocation,
};