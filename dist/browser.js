(function(f){if(typeof exports==="object"&&typeof module!=="undefined"){module.exports=f()}else if(typeof define==="function"&&define.amd){define([],f)}else{var g;if(typeof window!=="undefined"){g=window}else if(typeof global!=="undefined"){g=global}else if(typeof self!=="undefined"){g=self}else{g=this}g.lispToArray = f()}})(function(){var define,module,exports;return (function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);var f=new Error("Cannot find module '"+o+"'");throw f.code="MODULE_NOT_FOUND",f}var l=n[o]={exports:{}};t[o][0].call(l.exports,function(e){var n=t[o][1][e];return s(n?n:e)},l,l.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({1:[function(require,module,exports){
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

},{"lisp-array-to-js":24,"lisp-to-array":25}],2:[function(require,module,exports){
var prefixToInfix = require("./tools/prefix-to-infix");

module.exports = {
    js: require("./functions/js"),
    def: require("./functions/def"),
    let: require("./functions/let"),
    "`": require("./functions/`"),
    try: require("./functions/try"),
    catch: require("./functions/catch"),
    ".-": require("./functions/.-"),
    ".": require("./functions/..js"),
    do: require("./functions/do"),
    if: require("./functions/if"),
    fn: require("./functions/fn"),
    "=": require("./functions/=")
};

function defPrefixToInfix(operand, maxArgs) {
    module.exports[operand] = prefixToInfix(operand, maxArgs);
}

["<", "+", "-", "*", "/", "%"].forEach(function(symbol) {
    defPrefixToInfix(symbol);
});

},{"./functions/.-":3,"./functions/..js":4,"./functions/=":5,"./functions/`":6,"./functions/catch":7,"./functions/def":8,"./functions/do":9,"./functions/fn":10,"./functions/if":11,"./functions/js":12,"./functions/let":13,"./functions/try":14,"./tools/prefix-to-infix":19}],3:[function(require,module,exports){
var quote = require("../tools/quote"),
    transpile = require("../transpile");

module.exports = function(obj, name, val) {
    var ret = "env[" + quote(obj) + "][" + quote(transpile(name)) + "]";
    if(arguments.length > 2) {
        ret += " = " + transpile(val);
    }
    return ret;
};

},{"../tools/quote":20,"../transpile":23}],4:[function(require,module,exports){
var transpile = require("../transpile");

module.exports = function(obj, name) {
    return this[".-"](obj, name) + "(" + [].slice.call(arguments, 2).map(transpile).join(", ") + ")";
};

},{"../transpile":23}],5:[function(require,module,exports){
var Expression = require("../tools/expression"),
    transpile = require("../transpile");

module.exports = function(a, b) {
    return new Expression(transpile(a) + " === " + transpile(b));
};

},{"../tools/expression":15,"../transpile":23}],6:[function(require,module,exports){
var quote = require("../tools/quote");

module.exports = function(val) {
    if(typeof(val) === "string") {
        return quote(val);
    }
    return JSON.stringify(val);
};

},{"../tools/quote":20}],7:[function(require,module,exports){
var wrap = require("../tools/wrap"),
    _let = require("./let");

module.exports = function(varName, content) {
    return wrap("catch(__e) {",
            _let([varName, "__e"], content),
        "}");
};

},{"../tools/wrap":22,"./let":13}],8:[function(require,module,exports){
var quote = require("../tools/quote"),
    transpile = require("../transpile");

module.exports = function(name, val) {
    return "env[" + quote(name) + "] = " + transpile(val);
};

},{"../tools/quote":20,"../transpile":23}],9:[function(require,module,exports){
var iife = require("../tools/iife"),
    transpile = require("../transpile");

module.exports = function() {
    return iife([].slice.call(arguments).map(transpile));
};

},{"../tools/iife":17,"../transpile":23}],10:[function(require,module,exports){
var Expression = require("../tools/expression"),
    func = require("../tools/func"),
    _let = require("./let");

module.exports = function(args, body) {
    return func(["var __args = arguments",
        _let(args.reduce(function(arr, name, i) {
            if(name !== "&") {
                arr.push(name, new Expression("__args[" + i + "]"));
            }
            return arr;
        }, []), body)]);
};

},{"../tools/expression":15,"../tools/func":16,"./let":13}],11:[function(require,module,exports){
var indent = require("../tools/indent"),
    transpile = require("../transpile");

module.exports = function(cond, truthy, falsy) {
    return "((" + transpile(cond) + ")\n" +
            indent("? " + transpile(truthy)) + "\n" +
            indent(": " + transpile(falsy)) + ")";
};

},{"../tools/indent":18,"../transpile":23}],12:[function(require,module,exports){
module.exports = function(src) {
    return src;
};

},{}],13:[function(require,module,exports){
var iife = require("../tools/iife"),
    transpile = require("../transpile"),
    def = require("./def");

module.exports = function(vars, content) {
    var defs = [];
    vars.forEach(function(val, i) {
        if(i % 2) {
            defs.push(def(vars[i - 1], vars[i]));
        }
    }, this);
    return iife(defs.concat([transpile(content)]), ["env"], ["Object.create(env)"]);
};

},{"../tools/iife":17,"../transpile":23,"./def":8}],14:[function(require,module,exports){
var wrap = require("../tools/wrap"),
    transpile = require("../transpile");

module.exports = function(src, ctch) {
    if(!Array.isArray(ctch) || ctch[0] !== "catch" || ctch.length !== 3) {
        throw new Error("Expects argument 1 of try to be a catch with length 3");
    }

    return wrap("try {",
            transpile(src),
        "} " + transpile(ctch));
};

},{"../tools/wrap":22,"../transpile":23}],15:[function(require,module,exports){
function Expression(val) {
    this.val = val;
}

Expression.prototype.toString = function() {
    return this.val;
};

module.exports = Expression;

},{}],16:[function(require,module,exports){
var wrap = require("./wrap"),
    stmts = require("./stmts");

module.exports = function(content, args) {
    var execs = content.slice(),
        val = execs.pop();

    return wrap("(function(" + (args || []).join(", ") + ") {", stmts(execs.concat(["return " + val])), "})");
};

},{"./stmts":21,"./wrap":22}],17:[function(require,module,exports){
var func = require("./func");

module.exports = function(content, args, outerArgs) {
    return func(content, args) + "(" + (outerArgs || []).join(", ") + ")";
};

},{"./func":16}],18:[function(require,module,exports){
var Expression = require("./expression");

module.exports = function indent(str) {
    if(typeof(str) === "object" && str instanceof Expression) {
        return new Expression(indent(str.val));
    }
    return "    " + str.replace(/\n/g, "\n    ");
};

},{"./expression":15}],19:[function(require,module,exports){
var Expression = require("./expression"),
    transpile = require("../transpile");

module.exports = function(operand, maxArgs) {
    maxArgs = maxArgs || 2;
    return function() {
        return new Expression([].slice.call(arguments, 0, maxArgs).map(transpile).join(" " + operand + " "));
    };
};

},{"../transpile":23,"./expression":15}],20:[function(require,module,exports){
function Quoted(str) {
    this.str = str;
}

Quoted.prototype.toString = function() {
    return JSON.stringify(String(this.str));
};

module.exports = function(str) {
    if(typeof(str) === "object" && str instanceof Quoted) {
        return str;
    }
    return new Quoted(str);
};

},{}],21:[function(require,module,exports){
module.exports = function(arr) {
    return arr.join(";\n") + (arr.length ? ";" : "");
};

},{}],22:[function(require,module,exports){
var indent = require("./indent");

module.exports = function(str1, str2, str3) {
    return str1 + "\n" + indent(str2) + "\n" + str3;
};

},{"./indent":18}],23:[function(require,module,exports){
var quote = require("./tools/quote"),
    functions;

module.exports = function transpile(val) {
    if(typeof(val) === "string") {
        return "env[" + quote(val) + "]";
    }
    if(typeof(val) !== "object") {
        return JSON.stringify(val);
    }
    if(!Array.isArray(val)) {
        return val;
    }

    if(val[0] in functions) {
        if(typeof(functions[val[0]]) !== "function") {
            console.log(val[0]);
        }
        return functions[val[0]].apply(functions, val.slice(1));
    }
    val = val.map(transpile);
    return val[0] + "(" + val.slice(1).join(", ") + ")";
};

functions = require("./functions");

},{"./functions":2,"./tools/quote":20}],24:[function(require,module,exports){
/* jshint node: true */

var stmts = require("./lib/tools/stmts"),
    iife = require("./lib/tools/iife"),
    transpile = require("./lib/transpile");

function transpileProgram(val) {
    return stmts([iife([transpile(val)], ["env"], ["Object.create(null)"])]);
}

module.exports = transpileProgram;
transpileProgram.transpile = transpile;
transpileProgram.exec = function(arr) {
    /* jshint evil: true */
    return eval(this(arr));
};

},{"./lib/tools/iife":17,"./lib/tools/stmts":21,"./lib/transpile":23}],25:[function(require,module,exports){
/* parser generated by jison 0.4.15 */
/*
  Returns a Parser object of the following structure:

  Parser: {
    yy: {}
  }

  Parser.prototype: {
    yy: {},
    trace: function(),
    symbols_: {associative list: name ==> number},
    terminals_: {associative list: number ==> name},
    productions_: [...],
    performAction: function anonymous(yytext, yyleng, yylineno, yy, yystate, $$, _$),
    table: [...],
    defaultActions: {...},
    parseError: function(str, hash),
    parse: function(input),

    lexer: {
        EOF: 1,
        parseError: function(str, hash),
        setInput: function(input),
        input: function(),
        unput: function(str),
        more: function(),
        less: function(n),
        pastInput: function(),
        upcomingInput: function(),
        showPosition: function(),
        test_match: function(regex_match_array, rule_index),
        next: function(),
        lex: function(),
        begin: function(condition),
        popState: function(),
        _currentRules: function(),
        topState: function(),
        pushState: function(condition),

        options: {
            ranges: boolean           (optional: true ==> token location info will include a .range[] member)
            flex: boolean             (optional: true ==> flex-like lexing behaviour where the rules are tested exhaustively to find the longest match)
            backtrack_lexer: boolean  (optional: true ==> lexer regexes are tested in order and for each matching regex the action code is invoked; the lexer terminates the scan when a token is returned by the action code)
        },

        performAction: function(yy, yy_, $avoiding_name_collisions, YY_START),
        rules: [...],
        conditions: {associative list: name ==> set},
    }
  }


  token location info (@$, _$, etc.): {
    first_line: n,
    last_line: n,
    first_column: n,
    last_column: n,
    range: [start_number, end_number]       (where the numbers are indexes into the input string, regular zero-based)
  }


  the parseError function receives a 'hash' object with these members for lexer and parser errors: {
    text:        (matched text)
    token:       (the produced terminal token, if any)
    line:        (yylineno)
  }
  while parser (grammar) errors will also provide these members, i.e. parser errors deliver a superset of attributes: {
    loc:         (yylloc)
    expected:    (string describing the set of expected tokens)
    recoverable: (boolean: TRUE when the parser has a error recovery rule available for this particular error)
  }
*/
var parser = (function(){
var o=function(k,v,o,l){for(o=o||{},l=k.length;l--;o[k[l]]=v);return o},$V0=[1,3],$V1=[1,11],$V2=[1,12],$V3=[1,13],$V4=[8,9,10,12,13];
var parser = {trace: function trace() { },
yy: {},
symbols_: {"error":2,"expressions":3,"list":4,"EOF":5,"arguments":6,"argument":7,"STRING":8,"NUMBER":9,"TOKEN":10,"listContent":11,"LIST_START":12,"LIST_END":13,"$accept":0,"$end":1},
terminals_: {2:"error",5:"EOF",8:"STRING",9:"NUMBER",10:"TOKEN",12:"LIST_START",13:"LIST_END"},
productions_: [0,[3,2],[6,1],[6,2],[7,1],[7,1],[7,1],[7,1],[11,2],[11,1],[11,2],[11,1],[4,3]],
performAction: function anonymous(yytext, yyleng, yylineno, yy, yystate /* action[1] */, $$ /* vstack */, _$ /* lstack */) {
/* this == yyval */

var $0 = $$.length - 1;
switch (yystate) {
case 1:
return $$[$0-1];
break;
case 2: case 9: case 11:
this.$ = [$$[$0]]
break;
case 3: case 8: case 10:
this.$ = [$$[$0-1]].concat($$[$0])
break;
case 4:
this.$ = ["`", $$[$0]]
break;
case 5: case 6: case 7:
this.$ = $$[$0]
break;
case 12:
this.$ = $$[$0-1]
break;
}
},
table: [{3:1,4:2,12:$V0},{1:[3]},{5:[1,4]},{4:7,10:[1,6],11:5,12:$V0},{1:[2,1]},{13:[1,8]},{4:14,6:9,7:10,8:$V1,9:$V2,10:$V3,12:$V0,13:[2,9]},{4:14,6:15,7:10,8:$V1,9:$V2,10:$V3,12:$V0,13:[2,11]},o([5,8,9,10,12,13],[2,12]),{13:[2,8]},{4:14,6:16,7:10,8:$V1,9:$V2,10:$V3,12:$V0,13:[2,2]},o($V4,[2,4]),o($V4,[2,5]),o($V4,[2,6]),o($V4,[2,7]),{13:[2,10]},{13:[2,3]}],
defaultActions: {4:[2,1],9:[2,8],15:[2,10],16:[2,3]},
parseError: function parseError(str, hash) {
    if (hash.recoverable) {
        this.trace(str);
    } else {
        throw new Error(str);
    }
},
parse: function parse(input) {
    var self = this, stack = [0], tstack = [], vstack = [null], lstack = [], table = this.table, yytext = '', yylineno = 0, yyleng = 0, recovering = 0, TERROR = 2, EOF = 1;
    var args = lstack.slice.call(arguments, 1);
    var lexer = Object.create(this.lexer);
    var sharedState = { yy: {} };
    for (var k in this.yy) {
        if (Object.prototype.hasOwnProperty.call(this.yy, k)) {
            sharedState.yy[k] = this.yy[k];
        }
    }
    lexer.setInput(input, sharedState.yy);
    sharedState.yy.lexer = lexer;
    sharedState.yy.parser = this;
    if (typeof lexer.yylloc == 'undefined') {
        lexer.yylloc = {};
    }
    var yyloc = lexer.yylloc;
    lstack.push(yyloc);
    var ranges = lexer.options && lexer.options.ranges;
    if (typeof sharedState.yy.parseError === 'function') {
        this.parseError = sharedState.yy.parseError;
    } else {
        this.parseError = Object.getPrototypeOf(this).parseError;
    }
    function popStack(n) {
        stack.length = stack.length - 2 * n;
        vstack.length = vstack.length - n;
        lstack.length = lstack.length - n;
    }
    _token_stack:
        function lex() {
            var token;
            token = lexer.lex() || EOF;
            if (typeof token !== 'number') {
                token = self.symbols_[token] || token;
            }
            return token;
        }
    var symbol, preErrorSymbol, state, action, a, r, yyval = {}, p, len, newState, expected;
    while (true) {
        state = stack[stack.length - 1];
        if (this.defaultActions[state]) {
            action = this.defaultActions[state];
        } else {
            if (symbol === null || typeof symbol == 'undefined') {
                symbol = lex();
            }
            action = table[state] && table[state][symbol];
        }
                    if (typeof action === 'undefined' || !action.length || !action[0]) {
                var errStr = '';
                expected = [];
                for (p in table[state]) {
                    if (this.terminals_[p] && p > TERROR) {
                        expected.push('\'' + this.terminals_[p] + '\'');
                    }
                }
                if (lexer.showPosition) {
                    errStr = 'Parse error on line ' + (yylineno + 1) + ':\n' + lexer.showPosition() + '\nExpecting ' + expected.join(', ') + ', got \'' + (this.terminals_[symbol] || symbol) + '\'';
                } else {
                    errStr = 'Parse error on line ' + (yylineno + 1) + ': Unexpected ' + (symbol == EOF ? 'end of input' : '\'' + (this.terminals_[symbol] || symbol) + '\'');
                }
                this.parseError(errStr, {
                    text: lexer.match,
                    token: this.terminals_[symbol] || symbol,
                    line: lexer.yylineno,
                    loc: yyloc,
                    expected: expected
                });
            }
        if (action[0] instanceof Array && action.length > 1) {
            throw new Error('Parse Error: multiple actions possible at state: ' + state + ', token: ' + symbol);
        }
        switch (action[0]) {
        case 1:
            stack.push(symbol);
            vstack.push(lexer.yytext);
            lstack.push(lexer.yylloc);
            stack.push(action[1]);
            symbol = null;
            if (!preErrorSymbol) {
                yyleng = lexer.yyleng;
                yytext = lexer.yytext;
                yylineno = lexer.yylineno;
                yyloc = lexer.yylloc;
                if (recovering > 0) {
                    recovering--;
                }
            } else {
                symbol = preErrorSymbol;
                preErrorSymbol = null;
            }
            break;
        case 2:
            len = this.productions_[action[1]][1];
            yyval.$ = vstack[vstack.length - len];
            yyval._$ = {
                first_line: lstack[lstack.length - (len || 1)].first_line,
                last_line: lstack[lstack.length - 1].last_line,
                first_column: lstack[lstack.length - (len || 1)].first_column,
                last_column: lstack[lstack.length - 1].last_column
            };
            if (ranges) {
                yyval._$.range = [
                    lstack[lstack.length - (len || 1)].range[0],
                    lstack[lstack.length - 1].range[1]
                ];
            }
            r = this.performAction.apply(yyval, [
                yytext,
                yyleng,
                yylineno,
                sharedState.yy,
                action[1],
                vstack,
                lstack
            ].concat(args));
            if (typeof r !== 'undefined') {
                return r;
            }
            if (len) {
                stack = stack.slice(0, -1 * len * 2);
                vstack = vstack.slice(0, -1 * len);
                lstack = lstack.slice(0, -1 * len);
            }
            stack.push(this.productions_[action[1]][0]);
            vstack.push(yyval.$);
            lstack.push(yyval._$);
            newState = table[stack[stack.length - 2]][stack[stack.length - 1]];
            stack.push(newState);
            break;
        case 3:
            return true;
        }
    }
    return true;
}};
/* generated by jison-lex 0.3.4 */
var lexer = (function(){
var lexer = ({

EOF:1,

parseError:function parseError(str, hash) {
        if (this.yy.parser) {
            this.yy.parser.parseError(str, hash);
        } else {
            throw new Error(str);
        }
    },

// resets the lexer, sets new input
setInput:function (input, yy) {
        this.yy = yy || this.yy || {};
        this._input = input;
        this._more = this._backtrack = this.done = false;
        this.yylineno = this.yyleng = 0;
        this.yytext = this.matched = this.match = '';
        this.conditionStack = ['INITIAL'];
        this.yylloc = {
            first_line: 1,
            first_column: 0,
            last_line: 1,
            last_column: 0
        };
        if (this.options.ranges) {
            this.yylloc.range = [0,0];
        }
        this.offset = 0;
        return this;
    },

// consumes and returns one char from the input
input:function () {
        var ch = this._input[0];
        this.yytext += ch;
        this.yyleng++;
        this.offset++;
        this.match += ch;
        this.matched += ch;
        var lines = ch.match(/(?:\r\n?|\n).*/g);
        if (lines) {
            this.yylineno++;
            this.yylloc.last_line++;
        } else {
            this.yylloc.last_column++;
        }
        if (this.options.ranges) {
            this.yylloc.range[1]++;
        }

        this._input = this._input.slice(1);
        return ch;
    },

// unshifts one char (or a string) into the input
unput:function (ch) {
        var len = ch.length;
        var lines = ch.split(/(?:\r\n?|\n)/g);

        this._input = ch + this._input;
        this.yytext = this.yytext.substr(0, this.yytext.length - len);
        //this.yyleng -= len;
        this.offset -= len;
        var oldLines = this.match.split(/(?:\r\n?|\n)/g);
        this.match = this.match.substr(0, this.match.length - 1);
        this.matched = this.matched.substr(0, this.matched.length - 1);

        if (lines.length - 1) {
            this.yylineno -= lines.length - 1;
        }
        var r = this.yylloc.range;

        this.yylloc = {
            first_line: this.yylloc.first_line,
            last_line: this.yylineno + 1,
            first_column: this.yylloc.first_column,
            last_column: lines ?
                (lines.length === oldLines.length ? this.yylloc.first_column : 0)
                 + oldLines[oldLines.length - lines.length].length - lines[0].length :
              this.yylloc.first_column - len
        };

        if (this.options.ranges) {
            this.yylloc.range = [r[0], r[0] + this.yyleng - len];
        }
        this.yyleng = this.yytext.length;
        return this;
    },

// When called from action, caches matched text and appends it on next action
more:function () {
        this._more = true;
        return this;
    },

// When called from action, signals the lexer that this rule fails to match the input, so the next matching rule (regex) should be tested instead.
reject:function () {
        if (this.options.backtrack_lexer) {
            this._backtrack = true;
        } else {
            return this.parseError('Lexical error on line ' + (this.yylineno + 1) + '. You can only invoke reject() in the lexer when the lexer is of the backtracking persuasion (options.backtrack_lexer = true).\n' + this.showPosition(), {
                text: "",
                token: null,
                line: this.yylineno
            });

        }
        return this;
    },

// retain first n characters of the match
less:function (n) {
        this.unput(this.match.slice(n));
    },

// displays already matched input, i.e. for error messages
pastInput:function () {
        var past = this.matched.substr(0, this.matched.length - this.match.length);
        return (past.length > 20 ? '...':'') + past.substr(-20).replace(/\n/g, "");
    },

// displays upcoming input, i.e. for error messages
upcomingInput:function () {
        var next = this.match;
        if (next.length < 20) {
            next += this._input.substr(0, 20-next.length);
        }
        return (next.substr(0,20) + (next.length > 20 ? '...' : '')).replace(/\n/g, "");
    },

// displays the character position where the lexing error occurred, i.e. for error messages
showPosition:function () {
        var pre = this.pastInput();
        var c = new Array(pre.length + 1).join("-");
        return pre + this.upcomingInput() + "\n" + c + "^";
    },

// test the lexed token: return FALSE when not a match, otherwise return token
test_match:function (match, indexed_rule) {
        var token,
            lines,
            backup;

        if (this.options.backtrack_lexer) {
            // save context
            backup = {
                yylineno: this.yylineno,
                yylloc: {
                    first_line: this.yylloc.first_line,
                    last_line: this.last_line,
                    first_column: this.yylloc.first_column,
                    last_column: this.yylloc.last_column
                },
                yytext: this.yytext,
                match: this.match,
                matches: this.matches,
                matched: this.matched,
                yyleng: this.yyleng,
                offset: this.offset,
                _more: this._more,
                _input: this._input,
                yy: this.yy,
                conditionStack: this.conditionStack.slice(0),
                done: this.done
            };
            if (this.options.ranges) {
                backup.yylloc.range = this.yylloc.range.slice(0);
            }
        }

        lines = match[0].match(/(?:\r\n?|\n).*/g);
        if (lines) {
            this.yylineno += lines.length;
        }
        this.yylloc = {
            first_line: this.yylloc.last_line,
            last_line: this.yylineno + 1,
            first_column: this.yylloc.last_column,
            last_column: lines ?
                         lines[lines.length - 1].length - lines[lines.length - 1].match(/\r?\n?/)[0].length :
                         this.yylloc.last_column + match[0].length
        };
        this.yytext += match[0];
        this.match += match[0];
        this.matches = match;
        this.yyleng = this.yytext.length;
        if (this.options.ranges) {
            this.yylloc.range = [this.offset, this.offset += this.yyleng];
        }
        this._more = false;
        this._backtrack = false;
        this._input = this._input.slice(match[0].length);
        this.matched += match[0];
        token = this.performAction.call(this, this.yy, this, indexed_rule, this.conditionStack[this.conditionStack.length - 1]);
        if (this.done && this._input) {
            this.done = false;
        }
        if (token) {
            return token;
        } else if (this._backtrack) {
            // recover context
            for (var k in backup) {
                this[k] = backup[k];
            }
            return false; // rule action called reject() implying the next rule should be tested instead.
        }
        return false;
    },

// return next match in input
next:function () {
        if (this.done) {
            return this.EOF;
        }
        if (!this._input) {
            this.done = true;
        }

        var token,
            match,
            tempMatch,
            index;
        if (!this._more) {
            this.yytext = '';
            this.match = '';
        }
        var rules = this._currentRules();
        for (var i = 0; i < rules.length; i++) {
            tempMatch = this._input.match(this.rules[rules[i]]);
            if (tempMatch && (!match || tempMatch[0].length > match[0].length)) {
                match = tempMatch;
                index = i;
                if (this.options.backtrack_lexer) {
                    token = this.test_match(tempMatch, rules[i]);
                    if (token !== false) {
                        return token;
                    } else if (this._backtrack) {
                        match = false;
                        continue; // rule action called reject() implying a rule MISmatch.
                    } else {
                        // else: this is a lexer rule which consumes input without producing a token (e.g. whitespace)
                        return false;
                    }
                } else if (!this.options.flex) {
                    break;
                }
            }
        }
        if (match) {
            token = this.test_match(match, rules[index]);
            if (token !== false) {
                return token;
            }
            // else: this is a lexer rule which consumes input without producing a token (e.g. whitespace)
            return false;
        }
        if (this._input === "") {
            return this.EOF;
        } else {
            return this.parseError('Lexical error on line ' + (this.yylineno + 1) + '. Unrecognized text.\n' + this.showPosition(), {
                text: "",
                token: null,
                line: this.yylineno
            });
        }
    },

// return next match that has a token
lex:function lex() {
        var r = this.next();
        if (r) {
            return r;
        } else {
            return this.lex();
        }
    },

// activates a new lexer condition state (pushes the new lexer condition state onto the condition stack)
begin:function begin(condition) {
        this.conditionStack.push(condition);
    },

// pop the previously active lexer condition state off the condition stack
popState:function popState() {
        var n = this.conditionStack.length - 1;
        if (n > 0) {
            return this.conditionStack.pop();
        } else {
            return this.conditionStack[0];
        }
    },

// produce the lexer rule set which is active for the currently active lexer condition state
_currentRules:function _currentRules() {
        if (this.conditionStack.length && this.conditionStack[this.conditionStack.length - 1]) {
            return this.conditions[this.conditionStack[this.conditionStack.length - 1]].rules;
        } else {
            return this.conditions["INITIAL"].rules;
        }
    },

// return the currently active lexer condition state; when an index argument is provided it produces the N-th previous condition state, if available
topState:function topState(n) {
        n = this.conditionStack.length - 1 - Math.abs(n || 0);
        if (n >= 0) {
            return this.conditionStack[n];
        } else {
            return "INITIAL";
        }
    },

// alias for begin(condition)
pushState:function pushState(condition) {
        this.begin(condition);
    },

// return the number of states currently on the stack
stateStackSize:function stateStackSize() {
        return this.conditionStack.length;
    },
options: {},
performAction: function anonymous(yy,yy_,$avoiding_name_collisions,YY_START) {
var YYSTATE=YY_START;
switch($avoiding_name_collisions) {
case 0:/* skip whitespace */
break;
case 1:this.begin('string');
break;
case 2:this.popState();
break;
case 3:yy_.yytext = yy_.yytext.replace(/\\"/g, '"'); return 8;
break;
case 4:return 'EOF_IN_STRING';
break;
case 5:yy_.yytext = Number(yy_.yytext); return 9;
break;
case 6:return 10
break;
case 7:return 12
break;
case 8:return 13
break;
case 9:return 5
break;
}
},
rules: [/^(?:\s+)/,/^(?:")/,/^(?:")/,/^(?:(?:\\"|[^"])*)/,/^(?:$)/,/^(?:[0-9]+(\.[0-9]+)?\b)/,/^(?:[^\s()]+)/,/^(?:\()/,/^(?:\))/,/^(?:$)/],
conditions: {"string":{"rules":[2,3,4],"inclusive":false},"INITIAL":{"rules":[0,1,5,6,7,8,9],"inclusive":true}}
});
return lexer;
})();
parser.lexer = lexer;
function Parser () {
  this.yy = {};
}
Parser.prototype = parser;parser.Parser = Parser;
return new Parser;
})();


module.exports=parser.parse.bind(parser);
},{}],26:[function(require,module,exports){
/* jshint browser: true */
/* global ace */

(function(document) {
    var lispToJs = require("lisp-to-js"),
        form = document.querySelector("form[name=\"lisp-to-js\"]"),
        inp = ace.edit(form.querySelector("[name=\"input\"]")),
        out = ace.edit(form.querySelector("[name=\"output\"]")),
        err = form.querySelector("[name=\"error\"]");

    inp.getSession().on("change", function() {
        var content, errContent;

        try {
            content = lispToJs(inp.getValue());
        } catch(e) {
            err.textContent = e.toString();
            errContent = e.toString().split(/on line /)[1].split(":");
            inp.getSession().setAnnotations([{
                row: Number(errContent[0].match(/\d+$/)[0]) - 1,
                column: 0,
                text: errContent.slice(1).join(":").trim().slice(1).trim(),
                type: "error"
            }]);
        }

        if(content) {
            inp.getSession().setAnnotations([]);
            out.setValue(content, -1);
            err.textContent = "";
        }
    });

    [inp, out].forEach(function(editor) {
        editor.setTheme("ace/theme/monokai");
        editor.getSession().setMode("ace/mode/" + editor.container.dataset.mode);
        editor.setReadOnly("disabled" in editor.container.dataset);
    });

    inp.setValue(inp.getValue(), 1);
})(document);

},{"lisp-to-js":1}]},{},[26])(26)
});