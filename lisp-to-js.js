/* jshint node: true */

var lispToJson = require("lisp-to-json"),
    lispArrayToJs = require("lisp-array-to-js");

function transpileProgram(val) {
    return lispArrayToJs(lispToJson(String(val)));
}

module.exports = transpileProgram;
transpileProgram.transpile = function(val) {
    return lispArrayToJs.transpile(lispToJson(String(val)));
};
transpileProgram.exec = function(val) {
    return lispArrayToJs.exec(lispToJson(String(val)));
};
