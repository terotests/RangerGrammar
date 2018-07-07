
/*

Buffer is created for parsing streams of values and strings.

*/

import {detectorFn, createDetector} from './detector'
import { ASTNode } from '../ast/ast';
import { WalkCmd, WalkRule, WalkRuleSet, WalkerFunction } from '../rules/walker'

export type bufferType = string 

export class ParserBuffer  {

  __len = 0
  buff_index = 0
  used_index = 0

  // the current buffer and the index inside it
  buff:bufferType
  i = 0
  eof = false

  buffers:bufferType[]
  last_finished = null

  in_tagdef = false
  is_selfclosing = false
  last_tag_name = ''

  // what is the rulez scope we are walking right now...
  scopes:string[]

  // The current ruleset to be applied...
  walkRules:WalkRule[] = []

  // Named rules
  namedRulez:{[key:string]:WalkRuleSet} = {}

  // What is the ruleset to use...
  rulez:WalkRuleSet[] = []

  // Active ruleset...
  activeRuleset:WalkRuleSet

  save() : any {
    return {
      buff : this.buff,
      i : this.i,
      buffers: this.buffers,
      walkRules: this.walkRules,
      namedRulez : this.namedRulez,
      rulez : this.rulez,
      activeRuleset : this.activeRuleset,
      buff_index : this.buff_index,
      used_index : this.used_index,
    }
  }

  restore( from:any ) {
    this.buff = from.buff 
    this.i = from.i 
    this.buffers = from.buffers 
    this.walkRules = from.walkRules
    this.namedRulez = from.namedRulez
    this.rulez = from.rulez 
    this.activeRuleset = from.activeRuleset
    this.buff_index = from.buff_index
    this.used_index = from.used_index
  }

  constructor(initWith:string[]) {
    this.buffers = initWith
    this.buff = initWith[0]
    this.i = 0
    this.buff_index = 0
    this.used_index = 0
    this.eof = false
    if(typeof(this.buff)==='undefined') this.eof = true
  }

  addRule (rule:WalkRule) {
    this.walkRules.push(rule)
  }

  createDetector( list:string[]) : () => string | boolean {
    const does_match = createDetector(list)
    return () : string | boolean => {
      const i = does_match( this.buff, this.i )
      if( i>=0) {
        const cnt = list[i].length
        this.step(cnt)
        return list[i]
      }
      return false
    }
  }

  // The end criteria etc...
  startEnd ( startCh:string, endCh:string ) {
    
    const is_start = this.createDetector([startCh])
    const is_end = this.createDetector([endCh])
    const is_paren_start = new WalkRule();

    // How can you evaluate the buffer using the new reuleset ? 
    is_paren_start.exec = (buff) => {
      if(is_start() !== false) {
        const node = new ASTNode()
        node.expression = true 
        return node
      }
    }
    
    const is_paren_end = WalkRule.create( (buff) => {
      if(is_end() !== false) {
        const node = new ASTNode()
        node.end_expression = true 
        return node
      }
    })   
    this.addRule( is_paren_start ) 
    this.addRule( is_paren_end ) 
  }

  createRule ( fn:(buff:ParserBuffer) => ASTNode | undefined)  {
    const rule = new WalkRule()    
    rule.exec = fn 
    this.walkRules.push( rule )
  }

  // almost same as "exec"
  walkRule( rule: WalkRule ) : ASTNode | undefined {

    // also, the rule could be just a reference to a some subrule...

    // just the simple rule execution...
    const theNode = rule.exec(this)

    // could the execute return also new rule ? 
    if(theNode instanceof WalkRule) {
      return
    }

    if(rule.isRequired && !theNode) {
      throw `Error parsing rule ${rule.name}`
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
    
    if(theNode && !theNode.nop) {      

      if(rule.typeName) theNode.typeName = rule.typeName

      // this node could be just ending the expression...
      if(theNode.end_expression) return theNode      

      // we have children maybe then...
      if(theNode.expression) {

        // here:
        // 1. needs expression
        // 2. the ruleset must define the rules which are used inside this expression

        if(rule.ruleset) {
          // 1. map the subrules based on the generator...
          let list_of_rules = rule.ruleset.walkRules.map( r => {
            return r.ruleGenerator ? r.ruleGenerator() : r
          })    
  
          let res
          let last_index = this.i
          let not_found_cnt = 0
          let exit_xpr = false
          
          // current op pred...
          let active_op_pred = 9999

          // the primary operator
          let left_op = theNode
          let right_op = null

          let activeNode = theNode

          // for the sub expression which may be created...
          const node_stack = []

          while(!this.eof && !exit_xpr) {
            for(let rule of list_of_rules) {
              // 3. Here, perhaps we should walk the subrule

              // NOT:
              // res = rule.exec(this)
              res = this.walkRule( rule )
              // if we get node, add it to the ASTNode created...
              if( res instanceof ASTNode ) {
                /*

                  The active operator should be asking 

                    - how many operands are still needed ? 
                    - what is my associativity ? (left-to-rigt, right-to-left)

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

                  (new Matrix) * (new Matrix)

                  "member acess operator"
                  m1.x + m2.y  -> (. m1 x) + (. m2 y)

                  "Computed Member Access"
                  m[key]      -> ( [] m key)




                  --> first you try operator 'new .. ( ... )'
                  --> then 'new xxx'

                  new                
                  new myClass     

                  ... in the original ranger there was a list of operators which was examined
                  ... the correct operator was selected according to the type of previous op res
                  

                  Type Matchin can not be one here...
                  
                  ???
                  new DDD () <--- this is the class type definition

                  The problem when trying to match ops is that we may not know
                  what the correct operand and datatype are at some positions...

                  Like 

                  funtion(a,b) {
                    return a + b
                  }

                  We do not know what types a and b really are now.

                  funtion(a:int,b:int) {
                    return a + b
                  }

                  Works.
                  Ok is

                  const b = new Something
                  const f = new Something<int>
                  ^ specific constructor ? 

                  class myClass<T> {
                    function foo() : T {
                      const x = new T
                      return x
                    }
                  }



                  new...
                    [new xxx]
                    [new yyyy ()]
                    [new something else ?? ]

                  */

                if(res.operator_pred > 0 ) {
                  console.log('FOUND OP', res, 'pred', res.operator_pred)
                  // console.log('OP parent is ', theNode)
                  console.log('active_pred',  active_op_pred) 
                  if(res.operator_assoc === 1 ) {

                    if( active_op_pred < res.operator_pred) {
                      console.log()
                      // we have to create a new by stealing the last part from active...
                      const last_ch = theNode.children.pop()
                      const new_expr = new ASTNode()
                      new_expr.expression = true 
                      new_expr.children.push( res )
                      new_expr.children.push( last_ch )

                      activeNode.children.push( new_expr )
                      node_stack.push( activeNode )
                      activeNode = new_expr

                      active_op_pred = res.operator_pred
                      continue

                    } else {

                    }
                    // TODO: fix 
                    console.log('left-to-rigth assoc op')
                    // simple, add this as first
                    activeNode.children.unshift(res)
                  }

                  active_op_pred = res.operator_pred
                  
                  // has been managed using operator rules
                  continue
                }

                if( res.end_expression ) {

                  exit_xpr = true 
                  break
                }

                if(!rule.isSkipped) {
                  // the res.name could be groupName for the AstNode
                  if(res.name) {
                    if(!activeNode.namedChildren[res.name]) activeNode.namedChildren[res.name] = []
                    activeNode.namedChildren[res.name].push( res )
                  } else {
                    activeNode.children.push(res)
                  }  
                }
                break  
              }
            }
            if(last_index === this.i) {
              // not finding anything ???
              if( not_found_cnt++ > 0 ) break
            } else {
              not_found_cnt = 0
            }
            last_index = this.i      
          }
        }  
      }
    }
    // this is the default behaviour... walk and return...
    return theNode
  }

  /*
  
  The Walk should be refactored so that it can walk any Rule and return a node
  or list of nodes

  */

  
  walk(parentNode:ASTNode) {
    if(!this.activeRuleset) {
      throw 'Active ruleset not defined'
    }
    let last_i = this.i
    let last_buff = this.buff

    let list_of_rules = this.activeRuleset.walkRules.map( r => {
      return r.ruleGenerator ? r.ruleGenerator() : r
    })
    while(!this.eof) {
      last_i = this.i
      last_buff = this.buff
      let res = null
      for(let rule of list_of_rules) {
        res = rule.exec(this)
        if(rule.isRequired && !res) {
          throw `Error parsing rule ${rule.name}`
        }
        if(res && !res.nop) {
          // walking the subrules etc...
          if(res.end_expression) return
          if(res.expression) {
            // -- the rule matched, check if the rule has its own set of rules
            let current_ruleset = this.activeRuleset
            if(rule.ruleset) {
              this.rulez.push( this.activeRuleset )
              this.activeRuleset = rule.ruleset
            }
            // this approach is perhaps a bit less modular because it assumes
            // the environment is setup at some way...
            this.walk( res )
            // then we exit the ruleset and continue...
            if(rule.ruleset) {
              this.rulez.pop( )
              this.activeRuleset = current_ruleset
            }            
          }

          // This is a bit strange, consider removing...
          if(rule.typeName) res.typeName = rule.typeName

          if(res.name) {
            if(!parentNode.namedChildren[res.name]) parentNode.namedChildren[res.name] = []
            parentNode.namedChildren[res.name].push( res )
          } else {
            parentNode.children.push(res)
          }
          break
        }
      }
      if(last_i === this.i && last_buff === this.buff) {
        // maybe rise error? could not match
        console.log('--- rules --- ')
        console.log(list_of_rules)
        throw 'Parser could not apply rules to the whole buffer at ' + this.buff.substring(this.i)
      }    
    }
  }

  code ( index:number ) : number {
    if( typeof(this.buff) != 'string' ) {
      return 0
    }
    if(this.buff.length <= this.i + index ) {
      const next = this.buffers[this.buff_index + 1]
      if(typeof(next) != 'string') {
        return 0
      }
      if(next) {
        return next.charCodeAt( this.i + index - this.buff.length )
      }
      return 0
    }        
    return this.buff.charCodeAt( this.i + index )
  }

  here () : number {
    if(typeof(this.buff) != 'string') return 0
    return this.buff.charCodeAt( this.i )
  }

  isHere ( value:number | detectorFn) : boolean {
    if(typeof(value) === 'function') {
      return value(this.buff, this.i ) >= 0
    }
    return this.buff.charCodeAt( this.i ) == value
  }  

  whatIsHere ( value: detectorFn) : number {
    return value(this.buff, this.i )
  }    

  step ( index:number ) : number {
    this.i += index
    this.used_index = this.buff_index
    if(this.buff.length <= this.i ) {
      this.i = this.i - this.buff.length
      this.buff_index = this.buff_index + 1
      this.used_index = this.buff_index
      this.buff = this.buffers[ this.buff_index ]
      if(typeof(this.buff) === 'undefined') {
        this.eof = true
        return 0
      } else {
        return this.buff.charCodeAt(0)
      }
    }
    return this.buff.charCodeAt(this.i)
  }   

  stepBuffer() {
    this.buff_index = this.buff_index + 1
    this.used_index = this.buff_index
    this.buff = this.buffers[ this.buff_index ]
    this.i = 0
    if(typeof(this.buff) === 'undefined') {
      this.eof = true
    }   
  }

  getWhile( fn:(buff:ParserBuffer) => boolean) : ASTNode | undefined { 
    let any_node:ASTNode
    let c = this.here()
    while(!this.eof) {
      if( !fn(this) ) return any_node;
      c = this.step(1)
      if(!any_node) {
        // the filename should be perhapce marked at the position, OR it could
        // be part of the AST tree ? 
        any_node = new ASTNode()
        any_node.buff = this.buff
        any_node.sp = this.i-1
        any_node.ep = this.i
      } else {
        any_node.ep = this.i
      }
    }
    return any_node
  }   

  getSpace() : ASTNode | undefined { 
    let spacenode:ASTNode
    let c = this.here()
    while(!this.eof) {
      if( c > 32 ) return spacenode;
      c = this.step(1)
      if(!spacenode) {
        // the filename should be perhapce marked at the position, OR it could
        // be part of the AST tree ? 
        spacenode = new ASTNode()
        spacenode.buff = this.buff
        spacenode.sp = this.i -1
        spacenode.ep = this.i
      } else {
        spacenode.ep = this.i
      }
    }
    return spacenode
  }  

  skipspace() : boolean { 
    let had_space = false
    let c = this.here()
    while(!this.eof) {
      if( c > 32 ) break;
      c = this.step(1)
      had_space = true
    }
    return had_space
  }

  // for detecting XML tag chars, not really useful as generic function
  isTagChar( c:number, first:boolean ) {
    return (    ((c >= 65) && (c <= 90))     // A - Z
    || ((c >= 97) && (c <= 122))    // a - z
    || ( c == 95)                   // _
    || ( c == 58)                   // :
    || (!first && (c >= 48) && (c <= 57))     // 0 - 9
    || (!first && c == 46)          // .
    || (!first && c == 45)          // -
   )
  }

  // collects a name like div or attribute name ( a bit simplified version )
  collectXMLName () : string {
    let sp = this.i;
    let c = this.here()
    let first = true
    const start_buff = this.buff
    while( !this.eof && this.isTagChar( c, first) ) {
      c = this.step(1)
      first = false
    }
    if(start_buff == this.buff) {
      return this.buff.substring( sp, this.i )
    }
    return start_buff.substring( sp ) + this.buff.substring( 0, this.i )
  } 

  skipUntil (fn) {
    let curr_buff = this.buff
    while( (false === fn(this.buff,this.i)) && !this.eof ) {
      this.step(1)
    }
  }    

  collectUntil (value) : string {
    let sp = this.i;
    let c = this.here()
    const start_buff = this.buff
    let curr_buff = this.buff
    const intermediate = []
    while( c != value && !this.eof ) {
      c = this.step(1)
      if(curr_buff != this.buff) {
        intermediate.push(this.buff)
      }
      curr_buff = this.buff
    }
    if(start_buff == this.buff) {
      return this.buff.substring( sp, this.i )
    }
    intermediate.pop() // remove last intermediate because it is this.buff
    return start_buff.substring( sp ) + intermediate.join('') + this.buff.substring( 0, this.i )
  }   
}