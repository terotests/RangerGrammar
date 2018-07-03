import { ParserBuffer } from "../astparsers/buffer";


export class ASTNode {

  // can there be some named nodes ??? 
  name = ''

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
  
  buff : string 
  sp : number
  ep : number

  getCodeString() : string {
    if(this.expression) {
      return this.expression_name + this.children.map( ch => ch.getCodeString() ).join(' ') + ')'
    }
    if(this.buff) {
      if(this.sp > this.ep) return ''
      return this.buff.substring(this.sp, this.ep)
    }
  }

}
