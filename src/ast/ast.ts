import { ParserBuffer } from "../astparsers/buffer";


export class ASTNode {

  // can there be some named nodes ??? 
  name = ''
  typeName = ''

  // if you collect things like
  // - classBody
  // - arguments
  // - extends
  // ... etc.
  namedChildren:{[key:string]:ASTNode[]} = {}

  children:ASTNode[] = []
  parent:ASTNode
  
  end_expression = false
  infix_operator = false
  infix_node:ASTNode

  expression_name = ''
  
  operator_pred = 0
  operator_assoc = 0

  expression = false
  block = false
  nop = false
  
  buff : string 
  sp : number
  ep : number

  getCodeString() : string {
    const named = Object.keys(this.namedChildren);
    let n = ''
    if(named.length > 0 ) {
      for( let name of named ) {
        n = n + name + ' => '+this.namedChildren[name].map( n => n.getCodeString() ).join(',')
      }
    }
    if(n) {
      n = `[${n}]`
    }
    if(this.expression) {
      return n + this.expression_name + this.children.map( ch => ch.getCodeString() ).join(' ') + ')' 
    }
    if(this.buff) {
      if(this.sp > this.ep) return ''
      return n + this.buff.substring(this.sp, this.ep) 
    }
  }

}
