const getURLParams = (url:string) => {
  const urlPart = url.split("?");
  const params = urlPart.length < 2 ? "" :  urlPart[1];
  return params;
}

  export { getURLParams
  }