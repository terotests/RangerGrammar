
import { ASTNode } from '../ast/ast';
import { ParserBuffer } from '../astparsers/buffer'
import { detectorFn, createDetector } from '../astparsers/detector'
 
export class WalkCmd {

  // does this command end the expression?
  end_expression = false
  
  // These could be properties of the node
  is_expression = false
  is_block = false

  node:ASTNode
}

export interface ParsingRule {
  matchName?:string
  walkRule?:WalkRule
  maxCnt?:number
  required?:boolean
}

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
// how to create language rules

export type WalkerFunction = (buff:ParserBuffer) => ASTNode | WalkRule | undefined

export class WalkRule {
  name = ''
  typeName = ''
  scopeName = ''
  callback : (rulename:string, buff:ParserBuffer, stepLen:number) => void
  exec : WalkerFunction

  // if set the rule is constructed using this function
  ruleGenerator : () => WalkRule | undefined
  ruleset : WalkRuleSet
  isRequired = false
  isSkipped = false

  forget() : WalkRule {
    this.isSkipped = true 
    return this
  }

  static create( fn:WalkerFunction) : WalkRule {
    const n = new WalkRule()
    n.exec = fn
    return n
  }

  // this is a bit messed up, typeName etc.
  static createNamedType( name:string, fn:WalkerFunction) : WalkRule {
    const n = new WalkRule()
    n.typeName = name
    n.exec = fn
    return n
  }  

  static generator( fn:() => WalkRule ) : WalkRule {
    const n = new WalkRule()
    n.ruleGenerator = fn
    return n
  }  

  // const plusOperator = createDetector(['+'])

  // This does not really work now ;/ 

  static try( rule : WalkRule ) : WalkRule {
    const n = new WalkRule()
    let buff_index 
    let buff_buff
    let eof 
    n.exec = (buff:ParserBuffer) => {
      const orig_buff = buff.save()
      // OK, we try this rule but it does not need to match...
      try {
        // buff.walk()
        console.log('TRY rule ',buff.i, rule)
        console.log('at ', buff.buff.substring(buff.i))
        // The problem is that this is not going to walk the buffer...
        const res = rule.exec( buff )
        if(res) {
          console.log('-- did match try --')
          console.log(res)
          return res
        }
      } catch(e) {
        console.log('GOT ERROR!!!') 
        console.log(e)
      }
      console.log('RETURNING INDEX TO ', buff.i)
      buff.restore( orig_buff )

      // return undefined
      const nop = new ASTNode()
      nop.nop = true
      return nop
    }
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
      const i = does_match( buff.buff, buff.i )
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
    endCondition.name = startCh
    return endCondition    
  }  

  static once() : WalkRule {
    return WalkRule.generator( () => {
      // Example of rule which matches only once...
      let cnt = 0
      return WalkRule.create( (buff) => {
        if(cnt === 0) {
          cnt++
          const node = new ASTNode()
          node.nop = true
          return node
        }
        const node = new ASTNode()
        node.end_expression = true 
        return node
      }) 
    })    
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

  static fail( ) : WalkRule {

    const endCondition = new WalkRule();
    endCondition.exec = (buff) => {
      throw 'Fails always'
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

  // opeator('+',17)

  static operator( token:string, precedence:number, assoc:number ) : WalkRule {

    const does_match = createDetector([token])    
    const endCondition = new WalkRule();

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
    endCondition.exec = (buff) => {
      const i = does_match( buff.buff, buff.i)
      if(i >= 0) {
        const node = new ASTNode()
        node.sp = buff.i 
        node.ep = buff.i + token.length
        node.buff = buff.buff
        node.expression_name = token
        node.operator_pred = precedence
        node.operator_assoc = assoc
        buff.step(token.length)
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

  static rule( rule:ParsingRule ) {
    return WalkRule.generator( () => {
      // Example of rule which matches only once...
      let cnt = 0
      return WalkRule.create( (buff) => {
        const matches = rule.walkRule.exec(buff);
        if( matches ) {          
          if(rule.maxCnt) {
            if(cnt++ >= rule.maxCnt) {
              throw 'Can not match two identifiers at class!!! ' + buff.buff.substring( buff.i )
            }  
          }
          // and set the name for the element...
          matches.name = rule.matchName
          return matches  
        } else {
          if(rule.required && cnt === 0) {
            throw 'Required rule ' + rule.matchName+ ' not found!!! ' + buff.buff.substring( buff.i )            
          }
        }
      })
    })    
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