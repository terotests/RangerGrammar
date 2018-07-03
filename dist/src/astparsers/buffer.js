"use strict";
/*

Buffer is created for parsing streams of values and strings.

*/
Object.defineProperty(exports, "__esModule", { value: true });
var detector_1 = require("./detector");
var ast_1 = require("../ast/ast");
var WalkCmd = /** @class */ (function () {
    function WalkCmd() {
        // does this command end the expression?
        this.end_expression = false;
        // These could be properties of the node
        this.is_expression = false;
        this.is_block = false;
    }
    return WalkCmd;
}());
exports.WalkCmd = WalkCmd;
// how to create language rules
var WalkRule = /** @class */ (function () {
    function WalkRule() {
        this.name = '';
        this.scopeName = '';
    }
    WalkRule.create = function (fn) {
        var n = new WalkRule();
        n.exec = fn;
        return n;
    };
    WalkRule.createSub = function (fn, ruleset) {
        var n = new WalkRule();
        n.ruleset = ruleset;
        n.exec = fn;
        return n;
    };
    WalkRule.createEnterRule = function (startCh, ruleset) {
        var does_match = detector_1.createDetector([startCh]);
        var endCondition = new WalkRule();
        // How can you evaluate the buffer using the new reuleset ? 
        endCondition.exec = function (buff) {
            var i = does_match(buff.buff, buff.i);
            if (i >= 0) {
                buff.step(startCh.length);
                var node = new ast_1.ASTNode();
                node.expression_name = startCh;
                node.expression = true;
                return node;
            }
        };
        var rulez = new WalkRuleSet;
        rulez.walkRules = ruleset;
        endCondition.ruleset = rulez;
        return endCondition;
    };
    WalkRule.createExit = function () {
        var endCondition = new WalkRule();
        // How can you evaluate the buffer using the new reuleset ? 
        endCondition.exec = function (buff) {
            // exit in any case
            var node = new ast_1.ASTNode();
            node.end_expression = true;
            return node;
        };
        return endCondition;
    };
    WalkRule.createExitRule = function (endCh) {
        var does_match = detector_1.createDetector([endCh]);
        var endCondition = new WalkRule();
        // How can you evaluate the buffer using the new reuleset ? 
        endCondition.exec = function (buff) {
            var i = does_match(buff.buff, buff.i);
            if (i >= 0) {
                buff.step(endCh.length);
                var node = new ast_1.ASTNode();
                node.end_expression = true;
                return node;
            }
        };
        return endCondition;
    };
    WalkRule.createTokenRules = function (list) {
        var does_match = detector_1.createDetector(list);
        var endCondition = new WalkRule();
        // How can you evaluate the buffer using the new reuleset ? 
        endCondition.exec = function (buff) {
            var i = does_match(buff.buff, buff.i);
            if (i >= 0) {
                // Token node...
                var node = new ast_1.ASTNode();
                node.sp = buff.i;
                node.ep = buff.i + list[i].length;
                node.buff = buff.buff;
                buff.step(list[i].length);
                return node;
            }
        };
        return endCondition;
    };
    return WalkRule;
}());
exports.WalkRule = WalkRule;
// Some rules to apply in ceratain conditions...
var WalkRuleSet = /** @class */ (function () {
    function WalkRuleSet() {
        this.name = '';
        this.walkRules = [];
    }
    WalkRuleSet.create = function (name, rules) {
        var o = new WalkRuleSet();
        o.name = name;
        o.walkRules = rules;
        return o;
    };
    return WalkRuleSet;
}());
exports.WalkRuleSet = WalkRuleSet;
var ParserBuffer = /** @class */ (function () {
    function ParserBuffer(initWith) {
        this.__len = 0;
        this.buff_index = 0;
        this.used_index = 0;
        this.i = 0;
        this.eof = false;
        this.last_finished = null;
        this.in_tagdef = false;
        this.is_selfclosing = false;
        this.last_tag_name = '';
        // The current ruleset to be applied...
        this.walkRules = [];
        // Named rules
        this.namedRulez = {};
        // What is the ruleset to use...
        this.rulez = [];
        this.buffers = initWith;
        this.buff = initWith[0];
        this.i = 0;
        this.buff_index = 0;
        this.used_index = 0;
        this.eof = false;
        if (typeof (this.buff) === 'undefined')
            this.eof = true;
    }
    ParserBuffer.prototype.addRule = function (rule) {
        this.walkRules.push(rule);
    };
    ParserBuffer.prototype.createDetector = function (list) {
        var _this = this;
        var does_match = detector_1.createDetector(list);
        return function () {
            var i = does_match(_this.buff, _this.i);
            if (i >= 0) {
                var cnt = list[i].length;
                _this.step(cnt);
                return list[i];
            }
            return false;
        };
    };
    // The end criteria etc...
    ParserBuffer.prototype.startEnd = function (startCh, endCh) {
        var is_start = this.createDetector([startCh]);
        var is_end = this.createDetector([endCh]);
        var is_paren_start = new WalkRule();
        // How can you evaluate the buffer using the new reuleset ? 
        is_paren_start.exec = function (buff) {
            if (is_start() !== false) {
                var node = new ast_1.ASTNode();
                node.expression = true;
                return node;
            }
        };
        var is_paren_end = WalkRule.create(function (buff) {
            if (is_end() !== false) {
                var node = new ast_1.ASTNode();
                node.end_expression = true;
                return node;
            }
        });
        this.addRule(is_paren_start);
        this.addRule(is_paren_end);
    };
    ParserBuffer.prototype.createRule = function (fn) {
        var rule = new WalkRule();
        rule.exec = fn;
        this.walkRules.push(rule);
    };
    ParserBuffer.prototype.walk = function (parentNode) {
        if (!this.activeRule) {
            throw 'Active ruleset not defined';
        }
        var last_i = this.i;
        var last_buff = this.buff;
        while (!this.eof) {
            last_i = this.i;
            last_buff = this.buff;
            for (var _i = 0, _a = this.activeRule.walkRules; _i < _a.length; _i++) {
                var rule = _a[_i];
                var res = rule.exec(this);
                if (res) {
                    if (res.end_expression)
                        return;
                    if (res.expression) {
                        // -- the rule matched, check if the rule has its own set of rules
                        var current_ruleset = this.activeRule;
                        if (rule.ruleset) {
                            this.rulez.push(this.activeRule);
                            this.activeRule = rule.ruleset;
                        }
                        this.walk(res);
                        // then we exit the ruleset and continue...
                        if (rule.ruleset) {
                            this.rulez.pop();
                            this.activeRule = current_ruleset;
                        }
                    }
                    parentNode.children.push(res);
                    break;
                }
            }
            if (last_i === this.i && last_buff === this.buff) {
                // maybe rise error? could not match
                throw 'Parser could not apply rules to the whole buffer';
            }
        }
    };
    ParserBuffer.prototype.code = function (index) {
        if (typeof (this.buff) != 'string') {
            return 0;
        }
        if (this.buff.length <= this.i + index) {
            var next = this.buffers[this.buff_index + 1];
            if (typeof (next) != 'string') {
                return 0;
            }
            if (next) {
                return next.charCodeAt(this.i + index - this.buff.length);
            }
            return 0;
        }
        return this.buff.charCodeAt(this.i + index);
    };
    ParserBuffer.prototype.here = function () {
        if (typeof (this.buff) != 'string')
            return 0;
        return this.buff.charCodeAt(this.i);
    };
    ParserBuffer.prototype.isHere = function (value) {
        if (typeof (value) === 'function') {
            return value(this.buff, this.i) >= 0;
        }
        return this.buff.charCodeAt(this.i) == value;
    };
    ParserBuffer.prototype.whatIsHere = function (value) {
        return value(this.buff, this.i);
    };
    ParserBuffer.prototype.step = function (index) {
        this.i += index;
        this.used_index = this.buff_index;
        if (this.buff.length <= this.i) {
            this.i = this.i - this.buff.length;
            this.buff_index = this.buff_index + 1;
            this.used_index = this.buff_index;
            this.buff = this.buffers[this.buff_index];
            if (typeof (this.buff) === 'undefined') {
                this.eof = true;
                return 0;
            }
            else {
                return this.buff.charCodeAt(0);
            }
        }
        return this.buff.charCodeAt(this.i);
    };
    ParserBuffer.prototype.stepBuffer = function () {
        this.buff_index = this.buff_index + 1;
        this.used_index = this.buff_index;
        this.buff = this.buffers[this.buff_index];
        this.i = 0;
        if (typeof (this.buff) === 'undefined') {
            this.eof = true;
        }
    };
    ParserBuffer.prototype.getWhile = function (fn) {
        var any_node;
        var c = this.here();
        while (!this.eof) {
            if (!fn(this))
                return any_node;
            c = this.step(1);
            if (!any_node) {
                // the filename should be perhapce marked at the position, OR it could
                // be part of the AST tree ? 
                any_node = new ast_1.ASTNode();
                any_node.buff = this.buff;
                any_node.sp = this.i - 1;
                any_node.ep = this.i;
            }
            else {
                any_node.ep = this.i;
            }
        }
        return any_node;
    };
    ParserBuffer.prototype.getSpace = function () {
        var spacenode;
        var c = this.here();
        while (!this.eof) {
            if (c > 32)
                return spacenode;
            c = this.step(1);
            if (!spacenode) {
                // the filename should be perhapce marked at the position, OR it could
                // be part of the AST tree ? 
                spacenode = new ast_1.ASTNode();
                spacenode.buff = this.buff;
                spacenode.sp = this.i - 1;
                spacenode.ep = this.i;
            }
            else {
                spacenode.ep = this.i;
            }
        }
        return spacenode;
    };
    ParserBuffer.prototype.skipspace = function () {
        var had_space = false;
        var c = this.here();
        while (!this.eof) {
            if (c > 32)
                break;
            c = this.step(1);
            had_space = true;
        }
        return had_space;
    };
    // for detecting XML tag chars, not really useful as generic function
    ParserBuffer.prototype.isTagChar = function (c, first) {
        return (((c >= 65) && (c <= 90)) // A - Z
            || ((c >= 97) && (c <= 122)) // a - z
            || (c == 95) // _
            || (c == 58) // :
            || (!first && (c >= 48) && (c <= 57)) // 0 - 9
            || (!first && c == 46) // .
            || (!first && c == 45) // -
        );
    };
    // collects a name like div or attribute name ( a bit simplified version )
    ParserBuffer.prototype.collectXMLName = function () {
        var sp = this.i;
        var c = this.here();
        var first = true;
        var start_buff = this.buff;
        while (!this.eof && this.isTagChar(c, first)) {
            c = this.step(1);
            first = false;
        }
        if (start_buff == this.buff) {
            return this.buff.substring(sp, this.i);
        }
        return start_buff.substring(sp) + this.buff.substring(0, this.i);
    };
    ParserBuffer.prototype.skipUntil = function (fn) {
        var curr_buff = this.buff;
        while ((false === fn(this.buff, this.i)) && !this.eof) {
            this.step(1);
        }
    };
    ParserBuffer.prototype.collectUntil = function (value) {
        var sp = this.i;
        var c = this.here();
        var start_buff = this.buff;
        var curr_buff = this.buff;
        var intermediate = [];
        while (c != value && !this.eof) {
            c = this.step(1);
            if (curr_buff != this.buff) {
                intermediate.push(this.buff);
            }
            curr_buff = this.buff;
        }
        if (start_buff == this.buff) {
            return this.buff.substring(sp, this.i);
        }
        intermediate.pop(); // remove last intermediate because it is this.buff
        return start_buff.substring(sp) + intermediate.join('') + this.buff.substring(0, this.i);
    };
    return ParserBuffer;
}());
exports.ParserBuffer = ParserBuffer;
//# sourceMappingURL=buffer.js.map