"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
// npm install @types/chai @types/mocha --save-dev
require("mocha");
var chai_1 = require("chai");
var buffer_1 = require("../src/astparsers/buffer");
var walker_1 = require("../src/rules/walker");
var detector_1 = require("../src/astparsers/detector");
var ast_1 = require("../src/ast/ast");
// const expect  = require("chai").expect;
var equal_signs = [
    '<', '>', '===', '==', '<=', '>='
];
var statements = [
    'for', 'while', 'if', 'then'
];
var keywords = [
    'class', 'function', 'extends', 'static'
];
// simple detector
var plusOperator = detector_1.createDetector(['+']);
// how to create operator from that?
var isComparator = detector_1.createDetector(equal_signs);
var isStatement = detector_1.createDetector(statements);
var isKeyword = detector_1.createDetector(keywords);
var is_space = walker_1.WalkRule.createNamedType('space', function (buff) { return buff.getSpace(); }).forget();
var is_numeric = walker_1.WalkRule.createNamedType('number', function (buff) { return buff.getWhile(function (buff) {
    var c = buff.here();
    var zero = '0'.charCodeAt(0);
    var nine = '9'.charCodeAt(0);
    return (c >= zero) && (c <= nine);
}); });
describe("Test simple parser", function () {
    it('Simple Expr', function () {
        // operator could start the collection of items...
        // maybe you always create operator...
        /*
    
    4 + 5 * 10
    
    
    
        */
        var plus_op = walker_1.WalkRule.operator('+', 13, 1);
        var mul_op = walker_1.WalkRule.operator('*', 14, 1);
        var buff = new buffer_1.ParserBuffer(["\n      12345 + 17 * 10\n    "]);
        // spaces and numbers are OK...
        var startRuleSet = walker_1.WalkRuleSet.create('std', [
            is_space,
            is_numeric,
            plus_op,
            mul_op,
        ]);
        var firstExpression = walker_1.WalkRule.create(function (buff) {
            var n = new ast_1.ASTNode();
            n.expression = true;
            return n;
        });
        firstExpression.ruleset = startRuleSet;
        var e = buff.walkRule(firstExpression);
        console.log(e.getCodeString());
    });
    it('Sub Expr', function () {
        var buff = new buffer_1.ParserBuffer(["\n      12345 { 4 5 } 4444\n    "]);
        // spaces and numbers are OK...
        // Here, some small problem, how to allow recursion?
        // Maybe we could crate the rule using name ? 
        // 'RuleBraces' ->
        // then refer to it recursively...
        /*
    
        Extendable rule:
          rule1 <contents> <namedpart2>
    
        */
        // And where to insert the subrules in this kind of situation ? 
        var braces_rule = walker_1.WalkRule.createEnterRule('{', [
            is_space,
            is_numeric,
            // TODO: make possible injecting things to create a rule template...
            walker_1.WalkRule.createExitRule('}')
        ]);
        // Then you could take the rule and add things into the rule template
        // for certain positions if required...
        var startRuleSet = walker_1.WalkRuleSet.create('std', [
            is_space,
            is_numeric,
            braces_rule
        ]);
        var firstExpression = walker_1.WalkRule.create(function (buff) {
            var n = new ast_1.ASTNode();
            n.expression = true;
            return n;
        });
        firstExpression.ruleset = startRuleSet;
        var e = buff.walkRule(firstExpression);
        // console.log(e.children[3])
        // console.log('child count ', e.children.length)
    });
    it('Numbers and spaces', function () {
        var buff = new buffer_1.ParserBuffer(["\n      12345\n    "]);
        // spaces and numbers are OK...
        var startRule = walker_1.WalkRuleSet.create('std', [
            is_space,
            is_numeric,
        ]);
        buff.activeRuleset = startRule;
        var parentNode = new ast_1.ASTNode();
        buff.walk(parentNode);
        chai_1.expect(parentNode.children.length).to.equal(3);
        chai_1.expect(parentNode.children[0].typeName).to.equal('space');
        chai_1.expect(parentNode.children[1].typeName).to.equal('number');
        chai_1.expect(parentNode.children[2].typeName).to.equal('space');
    });
    it('Should parse simple rules', function () {
        var buff = new buffer_1.ParserBuffer(["\n      1 2 3 4\n    "]);
        // spaces and numbers are OK...
        var startRule = walker_1.WalkRuleSet.create('std', [
            is_space,
            is_numeric,
        ]);
        buff.activeRuleset = startRule;
        var parentNode = new ast_1.ASTNode();
        buff.walk(parentNode);
        chai_1.expect(parentNode.children.length).to.equal(9);
    });
    // console.log( parentNode.children )
});
//# sourceMappingURL=parser.js.map