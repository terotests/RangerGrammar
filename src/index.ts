
import { ParserBuffer, WalkRule, WalkRuleSet } from './astparsers/buffer'
import {detectorFn, createDetector} from './astparsers/detector'
import { ASTNode } from './ast/ast';

console.log('HEllo')

const equal_signs = [
  '<', '>', '===', '==', '<=', '>='
]
const statements = [
  'for', 'while', 'if','then'
]
const keywords = [
  'class', 'function', 'extends'
]

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

const isComparator = createDetector(equal_signs)
const isStatement = createDetector(statements)
const isKeyword = createDetector(keywords)

//
const buff = new ParserBuffer([`

  SELECT name FROM foobar;

  for while 22 ( 4*4*19/2)
  begin
   3 4 5  what
  end

  class foobar  {
    717
  }

  class someotherClass
  class myClass

`])
const isFor = createDetector(['if', 'while', 'for'])

/*

Instructions for the parser

1. push new expression into the parser stack
2. unwind expressions and continue

*/

const is_space = new WalkRule()
is_space.exec = buff => buff.getSpace()

// This rule is still wrong...
const is_any = new WalkRule()
is_any.exec = buff => buff.getWhile( buff => {
  const c = buff.here()
  const A = 'A'.charCodeAt(0)
  const z = 'z'.charCodeAt(0)
  return (c >= A) && (c <= z)
})

const is_valid_identifier = new WalkRule()
is_valid_identifier.exec = buff => {
  
  // identifier can not be a keyword...
  if(isKeyword(buff.buff, buff.i) >= 0) return

  return buff.getWhile( buff => {
    const c = buff.here()
    const A = 'A'.charCodeAt(0)
    const z = 'z'.charCodeAt(0)
    return (c >= A) && (c <= z)
  })
}

// parsing a number...
const is_numeric = new WalkRule()
is_numeric.exec = buff => buff.getWhile( buff => {
  const c = buff.here()
  const zero = '0'.charCodeAt(0)
  const nine = '9'.charCodeAt(0)
  return (c >= zero) && (c <= nine)
})

// the exec should be able to return...
/*

begin
  
end

*/

const is_paren_start = new WalkRule();
is_paren_start.exec = (buff) => {
  if(buff.here() == '('.charCodeAt(0)) {
    buff.step(1)
    const node = new ASTNode()
    node.expression = true 
    return node
  }
}

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


const is_comp = new WalkRule()
is_comp.exec = buff => buff.getWhile( buff => buff.here() == '<'.charCodeAt(0) )

const is_plus = WalkRule.create(  buff => buff.getWhile( buff => buff.here() == '+'.charCodeAt(0) ) )

// Two rules...
/*

   
*/

// ---> the basic ruleset...
const startRule = WalkRuleSet.create('std', 
  [
    is_space,
    is_numeric,


    // 1. rule can be simple push as child rule
    // 2. rule can be named rule
    // 3. name rule with multiple instances..

    // 4. a the ruleset could also be run only once...

    WalkRule.createEnterRule('class', 
    [
      // maybe some ordered state which is created when you enter this...
      // function which creates the state function ? 
      // first you consume name, then optional args, then body
      // finally you exit the conditional parser...

      is_space,
      is_valid_identifier,
      // collect this rule into special variable name 'classBody'
      WalkRule.createEnterRule('{', [
        is_space,
        is_numeric,
        is_any,
        WalkRule.createExitRule('}')
      ]),      
      WalkRule.createExit(),
      // exits if nothing matches...
    ]), 

    // Testing SELECT + other SQL rules
    WalkRule.createEnterRule('SELECT', [
      is_space,
      is_numeric,
      is_any,
      WalkRule.createTokenRules(['+', '-', '*', '/']),
      WalkRule.createExitRule(';')
    ]),    
    
    // ? how to model <div attr="foobar" attr2="foobar2"></div>
    // collect items into namespaces...
    WalkRule.createEnterRule('(', [
      is_space,
      is_numeric,
      WalkRule.createTokenRules(['+', '-', '*', '/']),
      WalkRule.createExitRule(')')
    ]),

    WalkRule.createEnterRule('begin', [
      is_space,
      is_numeric,
      WalkRule.createExitRule('end'),
      is_any,
      WalkRule.createTokenRules(['+', '-', '*', '/', ')', '(']),
      
    ]),
    is_any    
  ]
)

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
buff.activeRule = startRule

const parentNode = new ASTNode()

buff.walk( parentNode )

parentNode.children.forEach( (ch,i) => {
  console.log(ch.getCodeString())
})

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





