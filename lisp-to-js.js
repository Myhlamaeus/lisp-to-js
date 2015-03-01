/* jshint node: true */

var lispToJson = require("lisp-to-json"),
    lispJsonToJs = require("lisp-json-to-js");

function transpileProgram(val) {
    return lispJsonToJs(lispToJson.parse(String(val)));
}

module.exports = transpileProgram;
transpileProgram.transpile = function(val) {
    return lispJsonToJs.transpile(lispToJson.parse(String(val)));
};
transpileProgram.exec = function(val) {
    return lispJsonToJs.exec(lispToJson.parse(String(val)));
};
