// npm install @types/chai @types/mocha --save-dev
import 'mocha';
import { expect } from 'chai' 

import { ParserBuffer  } from '../src/astparsers/buffer'
import { WalkRule, WalkRuleSet, ParsingRule } from '../src/rules/walker'
import {detectorFn, createDetector} from '../src/astparsers/detector'
import { ASTNode } from '../src/ast/ast';
// const expect  = require("chai").expect;

const equal_signs = [
  '<', '>', '===', '==', '<=', '>='
]
const statements = [
  'for', 'while', 'if','then'
]
const keywords = [
  'class', 'function', 'extends', 'static'
]

// simple detector
const plusOperator = createDetector(['+'])

// how to create operator from that?


const isComparator = createDetector(equal_signs)
const isStatement = createDetector(statements)
const isKeyword = createDetector(keywords)

const is_space =WalkRule.createNamedType( 'space',  buff => buff.getSpace() ).forget()

const is_numeric = WalkRule.createNamedType( 'number',
 buff => buff.getWhile( buff => {
  const c = buff.here()
  const zero = '0'.charCodeAt(0)
  const nine = '9'.charCodeAt(0)
  return (c >= zero) && (c <= nine)
}))

describe("Test simple parser", function() {

  it('Simple Expr', ()=> {

    // operator could start the collection of items...
    // maybe you always create operator...

    /*

4 + 5 * 10    



    */

    let braces_rule = WalkRule.createEnterRule('{', [
      // is_space,
      // is_numeric,
      // TODO: make possible injecting things to create a rule template...
      WalkRule.createExitRule('}')
    ])    

    const plus_op = WalkRule.operator('+', 13, 1)
    const mul_op = WalkRule.operator('*', 14, 1)
    const buff = new ParserBuffer([`
      12345 + 17 * 10 { 3 }
    `])  

    // example of a named rule...
    buff.saveRuleAs( 'spaces', is_space )
    buff.saveRuleAs( 'braces', braces_rule )

    // Then, adding subrules to some rule...




    // spaces and numbers are OK...
    const startRuleSet = WalkRuleSet.create('std', 
    [
      WalkRule.named('spaces'),

      // TODO: konstructor does it's work a bit late...

      // This might be some kind of constructor function which gets the
      // prodcued rule and transforms it into 'braces'
      WalkRule.named('braces').insertAt(0, [is_space, is_numeric]),
//       is_space,
      is_numeric,
      plus_op,
      mul_op,
    ])  
    const firstExpression = WalkRule.create( (buff)=>{
      const n = new ASTNode()
      n.expression = true 
      return n
    })    
    firstExpression.ruleset = startRuleSet
    const e = buff.walkRule( firstExpression )
    console.log(e.getCodeString())
  })

  it('Sub Expr', ()=> {
    const buff = new ParserBuffer([`
      12345 { 4 5 } 4444
    `])  
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
    let braces_rule = WalkRule.createEnterRule('{', [
      is_space,
      is_numeric,
      // TODO: make possible injecting things to create a rule template...
      WalkRule.createExitRule('}')
    ])

    // Then you could take the rule and add things into the rule template
    // for certain positions if required...

    const startRuleSet = WalkRuleSet.create('std', 
    [
      is_space,
      is_numeric,
      braces_rule      
    ])  

    const firstExpression = WalkRule.create( (buff)=>{
      const n = new ASTNode()
      n.expression = true 
      return n
    })    
    firstExpression.ruleset = startRuleSet
    const e = buff.walkRule( firstExpression )
    // console.log(e.children[3])
    // console.log('child count ', e.children.length)
  })  

  it('Numbers and spaces', ()=> {
    const buff = new ParserBuffer([`
      12345
    `])  
    // spaces and numbers are OK...
    const startRule = WalkRuleSet.create('std', 
    [
      is_space,
      is_numeric,
    ])  
    buff.activeRuleset = startRule
    const parentNode = new ASTNode()
    buff.walk( parentNode )  
    expect(parentNode.children.length).to.equal( 3 )
    expect(parentNode.children[0].typeName).to.equal('space')
    expect(parentNode.children[1].typeName).to.equal('number')
    expect(parentNode.children[2].typeName).to.equal('space')
  })

  it('Should parse simple rules', ()=> {
    const buff = new ParserBuffer([`
      1 2 3 4
    `])  
    // spaces and numbers are OK...
    const startRule = WalkRuleSet.create('std', 
    [
      is_space,
      is_numeric,
    ])  
    buff.activeRuleset = startRule
    const parentNode = new ASTNode()
    buff.walk( parentNode )  
    expect(parentNode.children.length).to.equal( 9 )
  })



  // console.log( parentNode.children )


})