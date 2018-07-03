
/*

Buffer is created for parsing streams of values and strings.

*/

import {detectorFn, createDetector} from './detector'
import { ASTNode } from '../ast/ast';

export type bufferType = string 


export class WalkCmd {

  // does this command end the expression?
  end_expression = false
  
  // These could be properties of the node
  is_expression = false
  is_block = false

  node:ASTNode
}

// how to create language rules
export class WalkRule {
  name = ''
  scopeName = ''
  callback : (rulename:string, buff:ParserBuffer, stepLen:number) => void
  exec : (buff:ParserBuffer) => ASTNode | undefined
  ruleset : WalkRuleSet
  static create( fn:(buff:ParserBuffer) => ASTNode | undefined ) : WalkRule {
    const n = new WalkRule()
    n.exec = fn
    return n
  }

  static createSub( 
      fn:(buff:ParserBuffer) => ASTNode | undefined,
      ruleset : WalkRuleSet 
    ) : WalkRule {
    const n = new WalkRule()
    n.ruleset = ruleset
    n.exec = fn
    return n
  }

  static createEnterRule( startCh:string, ruleset:WalkRule[] ) : WalkRule {

    const does_match = createDetector([startCh])    
    const endCondition = new WalkRule();

    // How can you evaluate the buffer using the new reuleset ? 
    endCondition.exec = (buff) => {
      const i = does_match( buff.buff, buff.i)
      if(i >= 0) {
        buff.step(startCh.length)
        const node = new ASTNode()
        node.expression_name = startCh
        node.expression = true 
        return node
      }
    }
    const rulez = new WalkRuleSet
    rulez.walkRules = ruleset
    endCondition.ruleset = rulez
    return endCondition    
  }  

  static createExit() : WalkRule {

    const endCondition = new WalkRule();

    // How can you evaluate the buffer using the new reuleset ? 
    endCondition.exec = (buff) => {
      // exit in any case
      const node = new ASTNode()
      node.end_expression = true 
      return node
    }
    return endCondition
  }   

  static createExitRule( endCh:string ) : WalkRule {

    const does_match = createDetector([endCh])    
    const endCondition = new WalkRule();

    // How can you evaluate the buffer using the new reuleset ? 
    endCondition.exec = (buff) => {
      const i = does_match( buff.buff, buff.i)
      if(i >= 0) {
        buff.step(endCh.length)
        const node = new ASTNode()
        node.end_expression = true 
        return node
      }
    }
    return endCondition
  }    

  static createTokenRules( list:string[] ) : WalkRule {

    const does_match = createDetector(list)    
    const endCondition = new WalkRule();

    // How can you evaluate the buffer using the new reuleset ? 
    endCondition.exec = (buff) => {
      const i = does_match( buff.buff, buff.i)
      if(i >= 0) {
        // Token node...
        const node = new ASTNode()
        node.sp = buff.i 
        node.ep = buff.i + list[i].length
        node.buff = buff.buff
        buff.step(list[i].length)
        return node
      }
    }
    return endCondition
  }   

}

// Some rules to apply in ceratain conditions...
export class WalkRuleSet {
  name = ''
  walkRules:WalkRule[] = []
  static create( name: string, rules:WalkRule[]) : WalkRuleSet {
    const o = new WalkRuleSet()
    o.name = name
    o.walkRules = rules
    return o
  }
}

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
  activeRule:WalkRuleSet

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

  walk(parentNode:ASTNode) {
    if(!this.activeRule) {
      throw 'Active ruleset not defined'
    }
    let last_i = this.i
    let last_buff = this.buff
    while(!this.eof) {
      last_i = this.i
      last_buff = this.buff
      for(let rule of this.activeRule.walkRules) {
        const res = rule.exec(this)
        if(res) {
          if(res.end_expression) return
          if(res.expression) {
            // -- the rule matched, check if the rule has its own set of rules
            let current_ruleset = this.activeRule
            if(rule.ruleset) {
              this.rulez.push( this.activeRule )
              this.activeRule = rule.ruleset
            }
            this.walk( res )
            // then we exit the ruleset and continue...
            if(rule.ruleset) {
              this.rulez.pop( )
              this.activeRule = current_ruleset
            }            
          }
          parentNode.children.push(res)
          break
        }
      }
      if(last_i === this.i && last_buff === this.buff) {
        // maybe rise error? could not match
        throw 'Parser could not apply rules to the whole buffer'
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