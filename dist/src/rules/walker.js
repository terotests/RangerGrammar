"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var ast_1 = require("../ast/ast");
var detector_1 = require("../astparsers/detector");
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
var WalkRule = /** @class */ (function () {
    function WalkRule() {
        this.name = '';
        this.typeName = '';
        this.scopeName = '';
        this.isRequired = false;
        this.isSkipped = false;
    }
    WalkRule.prototype.forget = function () {
        this.isSkipped = true;
        return this;
    };
    WalkRule.create = function (fn) {
        var n = new WalkRule();
        n.exec = fn;
        return n;
    };
    // this is a bit messed up, typeName etc.
    WalkRule.createNamedType = function (name, fn) {
        var n = new WalkRule();
        n.typeName = name;
        n.exec = fn;
        return n;
    };
    WalkRule.generator = function (fn) {
        var n = new WalkRule();
        n.ruleGenerator = fn;
        return n;
    };
    // const plusOperator = createDetector(['+'])
    // This does not really work now ;/ 
    WalkRule.try = function (rule) {
        var n = new WalkRule();
        var buff_index;
        var buff_buff;
        var eof;
        n.exec = function (buff) {
            var orig_buff = buff.save();
            // OK, we try this rule but it does not need to match...
            try {
                // buff.walk()
                console.log('TRY rule ', buff.i, rule);
                console.log('at ', buff.buff.substring(buff.i));
                // The problem is that this is not going to walk the buffer...
                var res = rule.exec(buff);
                if (res) {
                    console.log('-- did match try --');
                    console.log(res);
                    return res;
                }
            }
            catch (e) {
                console.log('GOT ERROR!!!');
                console.log(e);
            }
            console.log('RETURNING INDEX TO ', buff.i);
            buff.restore(orig_buff);
            // return undefined
            var nop = new ast_1.ASTNode();
            nop.nop = true;
            return nop;
        };
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
        endCondition.name = startCh;
        return endCondition;
    };
    WalkRule.once = function () {
        return WalkRule.generator(function () {
            // Example of rule which matches only once...
            var cnt = 0;
            return WalkRule.create(function (buff) {
                if (cnt === 0) {
                    cnt++;
                    var node_1 = new ast_1.ASTNode();
                    node_1.nop = true;
                    return node_1;
                }
                var node = new ast_1.ASTNode();
                node.end_expression = true;
                return node;
            });
        });
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
    WalkRule.fail = function () {
        var endCondition = new WalkRule();
        endCondition.exec = function (buff) {
            throw 'Fails always';
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
    // opeator('+',17)
    WalkRule.operator = function (token, precedence, assoc) {
        var does_match = detector_1.createDetector([token]);
        var endCondition = new WalkRule();
        // 10 + 30
        // number <operator> number
        // --> got reposition the operator...
        // 2 * 4 + 5
        /*
          
          2
          2 *  <- here we find operator...
    
            -> there is some active operator now...
    
          2 * 4
    
        */
        // Exprerssion can be anything...
        // Operator creates... expression ? 
        // How can you evaluate the buffer using the new reuleset ? 
        endCondition.exec = function (buff) {
            var i = does_match(buff.buff, buff.i);
            if (i >= 0) {
                var node = new ast_1.ASTNode();
                node.sp = buff.i;
                node.ep = buff.i + token.length;
                node.buff = buff.buff;
                node.expression_name = token;
                node.operator_pred = precedence;
                node.operator_assoc = assoc;
                buff.step(token.length);
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
    WalkRule.rule = function (rule) {
        return WalkRule.generator(function () {
            // Example of rule which matches only once...
            var cnt = 0;
            return WalkRule.create(function (buff) {
                var matches = rule.walkRule.exec(buff);
                if (matches) {
                    if (rule.maxCnt) {
                        if (cnt++ >= rule.maxCnt) {
                            throw 'Can not match two identifiers at class!!! ' + buff.buff.substring(buff.i);
                        }
                    }
                    // and set the name for the element...
                    matches.name = rule.matchName;
                    return matches;
                }
                else {
                    if (rule.required && cnt === 0) {
                        throw 'Required rule ' + rule.matchName + ' not found!!! ' + buff.buff.substring(buff.i);
                    }
                }
            });
        });
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
//# sourceMappingURL=walker.js.map