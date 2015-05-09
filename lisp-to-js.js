import lispToArray from 'lisp-to-array'
import lispArrayToJs from 'lisp-array-to-js'

export default function (val) {
  return lispArrayToJs(lispToArray(String(val)))
}

export function transpile (val) {
  return lispArrayToJs.transpile(lispToArray(String(val)))
}

export function exec (val) {
  return lispArrayToJs.exec(lispToArray(String(val)))
}
