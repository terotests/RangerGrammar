"use strict";
/*

Buffer is created for parsing streams of values and strings.

*/
Object.defineProperty(exports, "__esModule", { value: true });
var detector_1 = require("./detector");
var ast_1 = require("../ast/ast");
var walker_1 = require("../rules/walker");
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
    ParserBuffer.prototype.save = function () {
        return {
            buff: this.buff,
            i: this.i,
            buffers: this.buffers,
            walkRules: this.walkRules,
            namedRulez: this.namedRulez,
            rulez: this.rulez,
            activeRuleset: this.activeRuleset,
            buff_index: this.buff_index,
            used_index: this.used_index,
        };
    };
    ParserBuffer.prototype.restore = function (from) {
        this.buff = from.buff;
        this.i = from.i;
        this.buffers = from.buffers;
        this.walkRules = from.walkRules;
        this.namedRulez = from.namedRulez;
        this.rulez = from.rulez;
        this.activeRuleset = from.activeRuleset;
        this.buff_index = from.buff_index;
        this.used_index = from.used_index;
    };
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
        var is_paren_start = new walker_1.WalkRule();
        // How can you evaluate the buffer using the new reuleset ? 
        is_paren_start.exec = function (buff) {
            if (is_start() !== false) {
                var node = new ast_1.ASTNode();
                node.expression = true;
                return node;
            }
        };
        var is_paren_end = walker_1.WalkRule.create(function (buff) {
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
        var rule = new walker_1.WalkRule();
        rule.exec = fn;
        this.walkRules.push(rule);
    };
    // almost same as "exec"
    ParserBuffer.prototype.walkRule = function (rule) {
        // also, the rule could be just a reference to a some subrule...
        // just the simple rule execution...
        var theNode = rule.exec(this);
        // could the execute return also new rule ? 
        if (theNode instanceof walker_1.WalkRule) {
            return;
        }
        if (rule.isRequired && !theNode) {
            throw "Error parsing rule " + rule.name;
        }
        // can you create another rule using the "exec" ???
        // The rule has information if you should walk further...
        /*
        const rulez = new WalkRuleSet
        rulez.walkRules = ruleset
        endCondition.ruleset = rulez
        endCondition.name = startCh
        return endCondition
        */
        if (theNode && !theNode.nop) {
            if (rule.typeName)
                theNode.typeName = rule.typeName;
            // this node could be just ending the expression...
            if (theNode.end_expression)
                return theNode;
            // we have children maybe then...
            if (theNode.expression) {
                // here:
                // 1. needs expression
                // 2. the ruleset must define the rules which are used inside this expression
                if (rule.ruleset) {
                    // 1. map the subrules based on the generator...
                    var list_of_rules = rule.ruleset.walkRules.map(function (r) {
                        return r.ruleGenerator ? r.ruleGenerator() : r;
                    });
                    var res = void 0;
                    var last_index = this.i;
                    var not_found_cnt = 0;
                    var exit_xpr = false;
                    // current op pred...
                    var active_op_pred = 9999;
                    // the primary operator
                    var left_op = theNode;
                    var right_op = null;
                    var activeNode = theNode;
                    // for the sub expression which may be created...
                    var node_stack = [];
                    while (!this.eof && !exit_xpr) {
                        for (var _i = 0, list_of_rules_1 = list_of_rules; _i < list_of_rules_1.length; _i++) {
                            var rule_1 = list_of_rules_1[_i];
                            // 3. Here, perhaps we should walk the subrule
                            // NOT:
                            // res = rule.exec(this)
                            res = this.walkRule(rule_1);
                            // if we get node, add it to the ASTNode created...
                            if (res instanceof ast_1.ASTNode) {
                                /*
                                  4               ( 4 )
                                  4 +             (+ 4)             "op wants 1 more..."
                                  4 + 5           (+ 4 5)           "full operator"
                                  4 + 5 *         (+ 4 (* 5))
                                  4 + 5 * 10      (+ 4 (* 5 10))
                
                                  4
                                  4 *
                                  4 * 5
                                  4 * 5 +
                                  4 * 5 + 10
                
                
                                  */
                                if (res.operator_pred > 0) {
                                    console.log('FOUND OP', res, 'pred', res.operator_pred);
                                    // console.log('OP parent is ', theNode)
                                    console.log('active_pred', active_op_pred);
                                    if (res.operator_assoc === 1) {
                                        if (active_op_pred < res.operator_pred) {
                                            console.log();
                                            // we have to create a new by stealing the last part from active...
                                            var last_ch = theNode.children.pop();
                                            var new_expr = new ast_1.ASTNode();
                                            new_expr.expression = true;
                                            new_expr.children.push(res);
                                            new_expr.children.push(last_ch);
                                            activeNode.children.push(new_expr);
                                            node_stack.push(activeNode);
                                            activeNode = new_expr;
                                            active_op_pred = res.operator_pred;
                                            continue;
                                        }
                                        else {
                                        }
                                        // TODO: fix 
                                        console.log('left-to-rigth assoc op');
                                        // simple, add this as first
                                        activeNode.children.unshift(res);
                                    }
                                    active_op_pred = res.operator_pred;
                                    // has been managed using operator rules
                                    continue;
                                }
                                if (res.end_expression) {
                                    exit_xpr = true;
                                    break;
                                }
                                if (!rule_1.isSkipped) {
                                    // the res.name could be groupName for the AstNode
                                    if (res.name) {
                                        if (!activeNode.namedChildren[res.name])
                                            activeNode.namedChildren[res.name] = [];
                                        activeNode.namedChildren[res.name].push(res);
                                    }
                                    else {
                                        activeNode.children.push(res);
                                    }
                                }
                                break;
                            }
                        }
                        if (last_index === this.i) {
                            // not finding anything ???
                            if (not_found_cnt++ > 0)
                                break;
                        }
                        else {
                            not_found_cnt = 0;
                        }
                        last_index = this.i;
                    }
                }
            }
        }
        // this is the default behaviour... walk and return...
        return theNode;
    };
    /*
    
    The Walk should be refactored so that it can walk any Rule and return a node
    or list of nodes
  
    */
    ParserBuffer.prototype.walk = function (parentNode) {
        if (!this.activeRuleset) {
            throw 'Active ruleset not defined';
        }
        var last_i = this.i;
        var last_buff = this.buff;
        var list_of_rules = this.activeRuleset.walkRules.map(function (r) {
            return r.ruleGenerator ? r.ruleGenerator() : r;
        });
        while (!this.eof) {
            last_i = this.i;
            last_buff = this.buff;
            var res = null;
            for (var _i = 0, list_of_rules_2 = list_of_rules; _i < list_of_rules_2.length; _i++) {
                var rule = list_of_rules_2[_i];
                res = rule.exec(this);
                if (rule.isRequired && !res) {
                    throw "Error parsing rule " + rule.name;
                }
                if (res && !res.nop) {
                    // walking the subrules etc...
                    if (res.end_expression)
                        return;
                    if (res.expression) {
                        // -- the rule matched, check if the rule has its own set of rules
                        var current_ruleset = this.activeRuleset;
                        if (rule.ruleset) {
                            this.rulez.push(this.activeRuleset);
                            this.activeRuleset = rule.ruleset;
                        }
                        // this approach is perhaps a bit less modular because it assumes
                        // the environment is setup at some way...
                        this.walk(res);
                        // then we exit the ruleset and continue...
                        if (rule.ruleset) {
                            this.rulez.pop();
                            this.activeRuleset = current_ruleset;
                        }
                    }
                    // This is a bit strange, consider removing...
                    if (rule.typeName)
                        res.typeName = rule.typeName;
                    if (res.name) {
                        if (!parentNode.namedChildren[res.name])
                            parentNode.namedChildren[res.name] = [];
                        parentNode.namedChildren[res.name].push(res);
                    }
                    else {
                        parentNode.children.push(res);
                    }
                    break;
                }
            }
            if (last_i === this.i && last_buff === this.buff) {
                // maybe rise error? could not match
                console.log('--- rules --- ');
                console.log(list_of_rules);
                throw 'Parser could not apply rules to the whole buffer at ' + this.buff.substring(this.i);
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