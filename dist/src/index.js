"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var walker_1 = require("./rules/walker");
var buffer_1 = require("./astparsers/buffer");
var detector_1 = require("./astparsers/detector");
var ast_1 = require("./ast/ast");
console.log('HEllo');
var equal_signs = [
    '<', '>', '===', '==', '<=', '>='
];
var statements = [
    'for', 'while', 'if', 'then'
];
var keywords = [
    'class', 'function', 'extends', 'static'
];
/*
if( x > 0 ) {

}
--> add callback for something...
TODO:
- think if the comparator can be used generically
*/
// The Infix logic is quite simple actually...
// https://github.com/terotests/Ranger/blob/master/compiler/ng_parser_v2.clj#L1146-L1223
// add rules to the ...
var isComparator = detector_1.createDetector(equal_signs);
var isStatement = detector_1.createDetector(statements);
var isKeyword = detector_1.createDetector(keywords);
//
var buff2 = new buffer_1.ParserBuffer(["\n\n  SELECT name FROM foobar;\n\n  for while 22 ( 4*4*19/2)\n  begin\n   3 4 5  what\n  end\n\n  class normalClass\n\n  class lolcatz\n\n  class foobar  {\n    717\n  }\n\n  static class foob {\n\n  }\n\n  class someotherClass\n  class myClass\n\n  class abba extends someclass {\n    This is the class Defintion\n  }\n\n"]);
var buff = new buffer_1.ParserBuffer(["\n  class normalClass\n"]);
/*

Instructions for the parser

1. push new expression into the parser stack
2. unwind expressions and continue

*/
var is_space = new walker_1.WalkRule();
is_space.exec = function (buff) { return buff.getSpace(); };
// This rule is still wrong...
var is_any = new walker_1.WalkRule();
is_any.exec = function (buff) { return buff.getWhile(function (buff) {
    var c = buff.here();
    var A = 'A'.charCodeAt(0);
    var z = 'z'.charCodeAt(0);
    return (c >= A) && (c <= z);
}); };
var is_valid_identifier = new walker_1.WalkRule();
is_valid_identifier.exec = function (buff) {
    // identifier can not be a keyword...
    if (isKeyword(buff.buff, buff.i) >= 0)
        return;
    return buff.getWhile(function (buff) {
        var c = buff.here();
        var A = 'A'.charCodeAt(0);
        var z = 'z'.charCodeAt(0);
        return (c >= A) && (c <= z);
    });
};
// parsing a number...
var is_numeric = new walker_1.WalkRule();
is_numeric.exec = function (buff) { return buff.getWhile(function (buff) {
    var c = buff.here();
    var zero = '0'.charCodeAt(0);
    var nine = '9'.charCodeAt(0);
    return (c >= zero) && (c <= nine);
}); };
// the exec should be able to return...
/*

begin
  
end

*/
var is_paren_start = new walker_1.WalkRule();
is_paren_start.exec = function (buff) {
    if (buff.here() == '('.charCodeAt(0)) {
        buff.step(1);
        var node = new ast_1.ASTNode();
        node.expression = true;
        return node;
    }
};
// **** how to create start and end blocks ***
/*

const is_paren_end = new WalkRule()
is_paren_end.exec = (buff) => {
  if(buff.here() == ')'.charCodeAt(0)) {
    buff.step(1)
    const node = new ASTNode()
    node.end_expression = true
    return node
  }
}
*/
var is_comp = new walker_1.WalkRule();
is_comp.exec = function (buff) { return buff.getWhile(function (buff) { return buff.here() == '<'.charCodeAt(0); }); };
var is_plus = walker_1.WalkRule.create(function (buff) { return buff.getWhile(function (buff) { return buff.here() == '+'.charCodeAt(0); }); });
// Two rules...
/*

   
*/
// ---> the basic ruleset...
var rule_class;
var startRule = walker_1.WalkRuleSet.create('std', [
    is_space,
    is_numeric,
    // 1. rule can be simple push as child rule
    // 2. rule can be named rule
    // 3. name rule with multiple instances..
    // 4. a the ruleset could also be run only once...
    walker_1.WalkRule.try(walker_1.WalkRule.createEnterRule('class', [
        // maybe some ordered state which is created when you enter this...
        // function which creates the state function ? 
        // first you consume name, then optional args, then body
        // finally you exit the conditional parser...
        is_space,
        walker_1.WalkRule.fail(),
        walker_1.WalkRule.rule({
            maxCnt: 1,
            required: true,
            matchName: 'classN',
            walkRule: walker_1.WalkRule.createTokenRules(['lolcatz'])
        }),
        walker_1.WalkRule.createExit()
    ])),
    rule_class = walker_1.WalkRule.createEnterRule('class', [
        // maybe some ordered state which is created when you enter this...
        // function which creates the state function ? 
        // first you consume name, then optional args, then body
        // finally you exit the conditional parser...
        is_space,
        walker_1.WalkRule.rule({
            maxCnt: 1,
            matchName: 'classN',
            walkRule: is_valid_identifier
        }),
        // class X extends Y
        walker_1.WalkRule.createEnterRule('extends', [
            is_space,
            // extra rule for this condition...
            walker_1.WalkRule.rule({
                maxCnt: 2,
                matchName: 'lol',
                walkRule: walker_1.WalkRule.createTokenRules(['lolz'])
            }),
            walker_1.WalkRule.rule({
                maxCnt: 1,
                required: true,
                matchName: 'className',
                walkRule: is_valid_identifier
            }),
            walker_1.WalkRule.createExit()
        ]),
        /*
        WalkRule.generator( () => {
          // Example of rule which matches only once...
          let cnt = 0
          return WalkRule.create( (buff) => {
            const matches = is_valid_identifier.exec(buff);
            if( matches ) {
              if(cnt++ > 0) {
                throw 'Can not match two identifiers at class!!! ' + buff.buff.substring( buff.i )
              }
              // and set the name for the element...
              matches.name = 'className'
              return matches
            }
          })
        }),
        */
        // collect this rule into special variable name 'classBody'
        walker_1.WalkRule.createEnterRule('{', [
            is_space,
            is_numeric,
            is_any,
            walker_1.WalkRule.createExitRule('}')
        ]),
        walker_1.WalkRule.createExit(),
    ]),
    walker_1.WalkRule.createEnterRule('static', [
        is_space,
        // example guard which stops the expression if evaluated many times
        walker_1.WalkRule.once(),
        walker_1.WalkRule.createEnterRule('class', [
            is_space,
            walker_1.WalkRule.rule({
                maxCnt: 1,
                matchName: 'classN',
                walkRule: is_valid_identifier
            }),
            // class X extends Y
            walker_1.WalkRule.createEnterRule('extends', [
                is_space,
                // extra rule for this condition...
                walker_1.WalkRule.rule({
                    maxCnt: 2,
                    matchName: 'lol',
                    walkRule: walker_1.WalkRule.createTokenRules(['lolz'])
                }),
                walker_1.WalkRule.rule({
                    maxCnt: 1,
                    required: true,
                    matchName: 'className',
                    walkRule: is_valid_identifier
                }),
                walker_1.WalkRule.createExit()
            ]),
            // collect this rule into special variable name 'classBody'
            walker_1.WalkRule.createEnterRule('{', [
                is_space,
                is_numeric,
                is_any,
                walker_1.WalkRule.createExitRule('}')
            ]),
            walker_1.WalkRule.createExit(),
        ])
    ]),
    // Testing SELECT + other SQL rules
    walker_1.WalkRule.createEnterRule('SELECT', [
        is_space,
        is_numeric,
        is_any,
        walker_1.WalkRule.createTokenRules(['+', '-', '*', '/']),
        walker_1.WalkRule.createExitRule(';')
    ]),
    // ? how to model <div attr="foobar" attr2="foobar2"></div>
    // collect items into namespaces...
    walker_1.WalkRule.createEnterRule('(', [
        is_space,
        is_numeric,
        walker_1.WalkRule.createTokenRules(['+', '-', '*', '/']),
        walker_1.WalkRule.createExitRule(')')
    ]),
    walker_1.WalkRule.createEnterRule('begin', [
        is_space,
        is_numeric,
        walker_1.WalkRule.createExitRule('end'),
        is_any,
        walker_1.WalkRule.createTokenRules(['+', '-', '*', '/', ')', '(']),
    ]),
    is_any
]);
/*
buff.addRule( is_space )
buff.startEnd('(', ')')
buff.startEnd('begin', 'end')

//buff.addRule( is_paren_start )
//buff.addRule( is_paren_end )

buff.addRule( is_numeric )
buff.addRule( is_comp )
buff.addRule( is_plus )
buff.addRule( is_any )
*/
buff.activeRuleset = startRule;
var parentNode = new ast_1.ASTNode();
buff.walk(parentNode);
parentNode.children.forEach(function (ch, i) {
    console.log(ch.getCodeString());
});
/*
console.log(buff.whatIsHere(isFor))

if(buff.here() === 'f'.charCodeAt(0)) {
  console.log('First Char is F')
}
buff.step(1)

if(buff.here() === 'o'.charCodeAt(0)) {
  console.log('Second Char is o')
}
buff.step(3)

console.log(buff.whatIsHere(isFor))
*/
//# sourceMappingURL=index.js.map