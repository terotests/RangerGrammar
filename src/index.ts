
import { WalkRule, WalkRuleSet, ParsingRule } from './rules/walker'
import { ParserBuffer } from './astparsers/buffer'
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
  'class', 'function', 'extends', 'static'
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
const buff2 = new ParserBuffer([`

  SELECT name FROM foobar;

  for while 22 ( 4*4*19/2)
  begin
   3 4 5  what
  end

  class normalClass

  class lolcatz

  class foobar  {
    717
  }

  static class foob {

  }

  class someotherClass
  class myClass

  class abba extends someclass {
    This is the class Defintion
  }

`])

const buff = new ParserBuffer([`
  class normalClass
`])

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

let rule_class;

const startRule = WalkRuleSet.create('std', 
  [
    is_space,
    is_numeric,

    // 1. rule can be simple push as child rule
    // 2. rule can be named rule
    // 3. name rule with multiple instances..

    // 4. a the ruleset could also be run only once...

    
    WalkRule.try(WalkRule.createEnterRule('class', 
    [
      // maybe some ordered state which is created when you enter this...
      // function which creates the state function ? 
      // first you consume name, then optional args, then body
      // finally you exit the conditional parser...
      is_space,
      WalkRule.fail(),
      WalkRule.rule({
        maxCnt : 1,
        required : true,
        matchName : 'classN',
        walkRule : WalkRule.createTokenRules(['lolcatz'])
      }),      
      WalkRule.createExit()
    ])),
    
    rule_class = WalkRule.createEnterRule('class', 
    [
      // maybe some ordered state which is created when you enter this...
      // function which creates the state function ? 
      // first you consume name, then optional args, then body
      // finally you exit the conditional parser...

      is_space,
      WalkRule.rule({
        maxCnt : 1,
        matchName : 'classN',
        walkRule : is_valid_identifier
      }),
      // class X extends Y
      WalkRule.createEnterRule('extends', 
      [
        is_space,
        // extra rule for this condition...
        WalkRule.rule({
          maxCnt : 2,
          matchName : 'lol',
          walkRule : WalkRule.createTokenRules(['lolz'])
        }),        
        WalkRule.rule({
          maxCnt : 1,
          required : true,
          matchName : 'className',
          walkRule : is_valid_identifier
        }),        
        WalkRule.createExit()
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
      WalkRule.createEnterRule('{', [
        is_space,
        is_numeric,
        is_any,
        WalkRule.createExitRule('}')
      ]),      
      WalkRule.createExit(),
      // exits if nothing matches...
    ]), 

    WalkRule.createEnterRule('static', [
      is_space,
      // example guard which stops the expression if evaluated many times
      WalkRule.once(),
      WalkRule.createEnterRule('class', 
      [
        is_space,
        WalkRule.rule({
          maxCnt : 1,
          matchName : 'classN',
          walkRule : is_valid_identifier
        }),
        // class X extends Y
        WalkRule.createEnterRule('extends', 
        [
          is_space,
          // extra rule for this condition...
          WalkRule.rule({
            maxCnt : 2,
            matchName : 'lol',
            walkRule : WalkRule.createTokenRules(['lolz'])
          }),        
          WalkRule.rule({
            maxCnt : 1,
            required : true,
            matchName : 'className',
            walkRule : is_valid_identifier
          }),        
          WalkRule.createExit()
        ]),
        // collect this rule into special variable name 'classBody'
        WalkRule.createEnterRule('{', [
          is_space,
          is_numeric,
          is_any,
          WalkRule.createExitRule('}')
        ]),      
        WalkRule.createExit(),
        // exits if nothing matches...
      ])
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
buff.activeRuleset = startRule

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





