"use strict";
/*
 * ATTENTION: An "eval-source-map" devtool has been used.
 * This devtool is neither made for production nor for readable output files.
 * It uses "eval()" calls to create a separate source file with attached SourceMaps in the browser devtools.
 * If you are trying to read the output file, select a different devtool (https://webpack.js.org/configuration/devtool/)
 * or disable the default devtool with "devtool: false".
 * If you are looking for production-ready output files, see mode: "production" (https://webpack.js.org/configuration/mode/).
 */
exports.id = "vendor-chunks/destr";
exports.ids = ["vendor-chunks/destr"];
exports.modules = {

/***/ "(ssr)/./node_modules/destr/dist/index.mjs":
/*!*******************************************!*\
  !*** ./node_modules/destr/dist/index.mjs ***!
  \*******************************************/
/***/ ((__unused_webpack___webpack_module__, __webpack_exports__, __webpack_require__) => {

eval("__webpack_require__.r(__webpack_exports__);\n/* harmony export */ __webpack_require__.d(__webpack_exports__, {\n/* harmony export */   \"default\": () => (/* binding */ destr),\n/* harmony export */   destr: () => (/* binding */ destr),\n/* harmony export */   safeDestr: () => (/* binding */ safeDestr)\n/* harmony export */ });\nconst suspectProtoRx = /\"(?:_|\\\\u0{2}5[Ff]){2}(?:p|\\\\u0{2}70)(?:r|\\\\u0{2}72)(?:o|\\\\u0{2}6[Ff])(?:t|\\\\u0{2}74)(?:o|\\\\u0{2}6[Ff])(?:_|\\\\u0{2}5[Ff]){2}\"\\s*:/;\nconst suspectConstructorRx = /\"(?:c|\\\\u0063)(?:o|\\\\u006[Ff])(?:n|\\\\u006[Ee])(?:s|\\\\u0073)(?:t|\\\\u0074)(?:r|\\\\u0072)(?:u|\\\\u0075)(?:c|\\\\u0063)(?:t|\\\\u0074)(?:o|\\\\u006[Ff])(?:r|\\\\u0072)\"\\s*:/;\nconst JsonSigRx = /^\\s*[\"[{]|^\\s*-?\\d{1,16}(\\.\\d{1,17})?([Ee][+-]?\\d+)?\\s*$/;\nfunction jsonParseTransform(key, value) {\n  if (key === \"__proto__\" || key === \"constructor\" && value && typeof value === \"object\" && \"prototype\" in value) {\n    warnKeyDropped(key);\n    return;\n  }\n  return value;\n}\nfunction warnKeyDropped(key) {\n  console.warn(`[destr] Dropping \"${key}\" key to prevent prototype pollution.`);\n}\nfunction destr(value, options = {}) {\n  if (typeof value !== \"string\") {\n    return value;\n  }\n  const _value = value.trim();\n  if (\n    // eslint-disable-next-line unicorn/prefer-at\n    value[0] === '\"' && value.endsWith('\"') && !value.includes(\"\\\\\")\n  ) {\n    return _value.slice(1, -1);\n  }\n  if (_value.length <= 9) {\n    const _lval = _value.toLowerCase();\n    if (_lval === \"true\") {\n      return true;\n    }\n    if (_lval === \"false\") {\n      return false;\n    }\n    if (_lval === \"undefined\") {\n      return void 0;\n    }\n    if (_lval === \"null\") {\n      return null;\n    }\n    if (_lval === \"nan\") {\n      return Number.NaN;\n    }\n    if (_lval === \"infinity\") {\n      return Number.POSITIVE_INFINITY;\n    }\n    if (_lval === \"-infinity\") {\n      return Number.NEGATIVE_INFINITY;\n    }\n  }\n  if (!JsonSigRx.test(value)) {\n    if (options.strict) {\n      throw new SyntaxError(\"[destr] Invalid JSON\");\n    }\n    return value;\n  }\n  try {\n    if (suspectProtoRx.test(value) || suspectConstructorRx.test(value)) {\n      if (options.strict) {\n        throw new Error(\"[destr] Possible prototype pollution\");\n      }\n      return JSON.parse(value, jsonParseTransform);\n    }\n    return JSON.parse(value);\n  } catch (error) {\n    if (options.strict) {\n      throw error;\n    }\n    return value;\n  }\n}\nfunction safeDestr(value, options = {}) {\n  return destr(value, { ...options, strict: true });\n}\n\n\n//# sourceURL=[module]\n//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiKHNzcikvLi9ub2RlX21vZHVsZXMvZGVzdHIvZGlzdC9pbmRleC5tanMiLCJtYXBwaW5ncyI6Ijs7Ozs7O0FBQUEsbUNBQW1DLEVBQUUsT0FBTyxFQUFFLFVBQVUsRUFBRSxhQUFhLEVBQUUsYUFBYSxFQUFFLGdCQUFnQixFQUFFLGFBQWEsRUFBRSxnQkFBZ0IsRUFBRSxPQUFPLEVBQUU7QUFDcEo7QUFDQSwyQkFBMkIsV0FBVyxLQUFLLE1BQU0sS0FBSztBQUN0RDtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0Esb0NBQW9DLElBQUk7QUFDeEM7QUFDQSxrQ0FBa0M7QUFDbEM7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0EsSUFBSTtBQUNKO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBLHNDQUFzQztBQUN0Qyx3QkFBd0IsMEJBQTBCO0FBQ2xEOztBQUU4QyIsInNvdXJjZXMiOlsid2VicGFjazovL25leHRqcy1jb25uZWN0a2l0Ly4vbm9kZV9tb2R1bGVzL2Rlc3RyL2Rpc3QvaW5kZXgubWpzPzA5ZjciXSwic291cmNlc0NvbnRlbnQiOlsiY29uc3Qgc3VzcGVjdFByb3RvUnggPSAvXCIoPzpffFxcXFx1MHsyfTVbRmZdKXsyfSg/OnB8XFxcXHUwezJ9NzApKD86cnxcXFxcdTB7Mn03MikoPzpvfFxcXFx1MHsyfTZbRmZdKSg/OnR8XFxcXHUwezJ9NzQpKD86b3xcXFxcdTB7Mn02W0ZmXSkoPzpffFxcXFx1MHsyfTVbRmZdKXsyfVwiXFxzKjovO1xuY29uc3Qgc3VzcGVjdENvbnN0cnVjdG9yUnggPSAvXCIoPzpjfFxcXFx1MDA2MykoPzpvfFxcXFx1MDA2W0ZmXSkoPzpufFxcXFx1MDA2W0VlXSkoPzpzfFxcXFx1MDA3MykoPzp0fFxcXFx1MDA3NCkoPzpyfFxcXFx1MDA3MikoPzp1fFxcXFx1MDA3NSkoPzpjfFxcXFx1MDA2MykoPzp0fFxcXFx1MDA3NCkoPzpvfFxcXFx1MDA2W0ZmXSkoPzpyfFxcXFx1MDA3MilcIlxccyo6LztcbmNvbnN0IEpzb25TaWdSeCA9IC9eXFxzKltcIlt7XXxeXFxzKi0/XFxkezEsMTZ9KFxcLlxcZHsxLDE3fSk/KFtFZV1bKy1dP1xcZCspP1xccyokLztcbmZ1bmN0aW9uIGpzb25QYXJzZVRyYW5zZm9ybShrZXksIHZhbHVlKSB7XG4gIGlmIChrZXkgPT09IFwiX19wcm90b19fXCIgfHwga2V5ID09PSBcImNvbnN0cnVjdG9yXCIgJiYgdmFsdWUgJiYgdHlwZW9mIHZhbHVlID09PSBcIm9iamVjdFwiICYmIFwicHJvdG90eXBlXCIgaW4gdmFsdWUpIHtcbiAgICB3YXJuS2V5RHJvcHBlZChrZXkpO1xuICAgIHJldHVybjtcbiAgfVxuICByZXR1cm4gdmFsdWU7XG59XG5mdW5jdGlvbiB3YXJuS2V5RHJvcHBlZChrZXkpIHtcbiAgY29uc29sZS53YXJuKGBbZGVzdHJdIERyb3BwaW5nIFwiJHtrZXl9XCIga2V5IHRvIHByZXZlbnQgcHJvdG90eXBlIHBvbGx1dGlvbi5gKTtcbn1cbmZ1bmN0aW9uIGRlc3RyKHZhbHVlLCBvcHRpb25zID0ge30pIHtcbiAgaWYgKHR5cGVvZiB2YWx1ZSAhPT0gXCJzdHJpbmdcIikge1xuICAgIHJldHVybiB2YWx1ZTtcbiAgfVxuICBjb25zdCBfdmFsdWUgPSB2YWx1ZS50cmltKCk7XG4gIGlmIChcbiAgICAvLyBlc2xpbnQtZGlzYWJsZS1uZXh0LWxpbmUgdW5pY29ybi9wcmVmZXItYXRcbiAgICB2YWx1ZVswXSA9PT0gJ1wiJyAmJiB2YWx1ZS5lbmRzV2l0aCgnXCInKSAmJiAhdmFsdWUuaW5jbHVkZXMoXCJcXFxcXCIpXG4gICkge1xuICAgIHJldHVybiBfdmFsdWUuc2xpY2UoMSwgLTEpO1xuICB9XG4gIGlmIChfdmFsdWUubGVuZ3RoIDw9IDkpIHtcbiAgICBjb25zdCBfbHZhbCA9IF92YWx1ZS50b0xvd2VyQ2FzZSgpO1xuICAgIGlmIChfbHZhbCA9PT0gXCJ0cnVlXCIpIHtcbiAgICAgIHJldHVybiB0cnVlO1xuICAgIH1cbiAgICBpZiAoX2x2YWwgPT09IFwiZmFsc2VcIikge1xuICAgICAgcmV0dXJuIGZhbHNlO1xuICAgIH1cbiAgICBpZiAoX2x2YWwgPT09IFwidW5kZWZpbmVkXCIpIHtcbiAgICAgIHJldHVybiB2b2lkIDA7XG4gICAgfVxuICAgIGlmIChfbHZhbCA9PT0gXCJudWxsXCIpIHtcbiAgICAgIHJldHVybiBudWxsO1xuICAgIH1cbiAgICBpZiAoX2x2YWwgPT09IFwibmFuXCIpIHtcbiAgICAgIHJldHVybiBOdW1iZXIuTmFOO1xuICAgIH1cbiAgICBpZiAoX2x2YWwgPT09IFwiaW5maW5pdHlcIikge1xuICAgICAgcmV0dXJuIE51bWJlci5QT1NJVElWRV9JTkZJTklUWTtcbiAgICB9XG4gICAgaWYgKF9sdmFsID09PSBcIi1pbmZpbml0eVwiKSB7XG4gICAgICByZXR1cm4gTnVtYmVyLk5FR0FUSVZFX0lORklOSVRZO1xuICAgIH1cbiAgfVxuICBpZiAoIUpzb25TaWdSeC50ZXN0KHZhbHVlKSkge1xuICAgIGlmIChvcHRpb25zLnN0cmljdCkge1xuICAgICAgdGhyb3cgbmV3IFN5bnRheEVycm9yKFwiW2Rlc3RyXSBJbnZhbGlkIEpTT05cIik7XG4gICAgfVxuICAgIHJldHVybiB2YWx1ZTtcbiAgfVxuICB0cnkge1xuICAgIGlmIChzdXNwZWN0UHJvdG9SeC50ZXN0KHZhbHVlKSB8fCBzdXNwZWN0Q29uc3RydWN0b3JSeC50ZXN0KHZhbHVlKSkge1xuICAgICAgaWYgKG9wdGlvbnMuc3RyaWN0KSB7XG4gICAgICAgIHRocm93IG5ldyBFcnJvcihcIltkZXN0cl0gUG9zc2libGUgcHJvdG90eXBlIHBvbGx1dGlvblwiKTtcbiAgICAgIH1cbiAgICAgIHJldHVybiBKU09OLnBhcnNlKHZhbHVlLCBqc29uUGFyc2VUcmFuc2Zvcm0pO1xuICAgIH1cbiAgICByZXR1cm4gSlNPTi5wYXJzZSh2YWx1ZSk7XG4gIH0gY2F0Y2ggKGVycm9yKSB7XG4gICAgaWYgKG9wdGlvbnMuc3RyaWN0KSB7XG4gICAgICB0aHJvdyBlcnJvcjtcbiAgICB9XG4gICAgcmV0dXJuIHZhbHVlO1xuICB9XG59XG5mdW5jdGlvbiBzYWZlRGVzdHIodmFsdWUsIG9wdGlvbnMgPSB7fSkge1xuICByZXR1cm4gZGVzdHIodmFsdWUsIHsgLi4ub3B0aW9ucywgc3RyaWN0OiB0cnVlIH0pO1xufVxuXG5leHBvcnQgeyBkZXN0ciBhcyBkZWZhdWx0LCBkZXN0ciwgc2FmZURlc3RyIH07XG4iXSwibmFtZXMiOltdLCJzb3VyY2VSb290IjoiIn0=\n//# sourceURL=webpack-internal:///(ssr)/./node_modules/destr/dist/index.mjs\n");

/***/ })

};
;