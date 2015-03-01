/* jshint node: true */

var lispToArray = require("lisp-to-array"),
    lispArrayToJs = require("lisp-array-to-js");

function transpileProgram(val) {
    return lispArrayToJs(lispToArray(String(val)));
}

module.exports = transpileProgram;
transpileProgram.transpile = function(val) {
    return lispArrayToJs.transpile(lispToArray(String(val)));
};
transpileProgram.exec = function(val) {
    return lispArrayToJs.exec(lispToArray(String(val)));
};
