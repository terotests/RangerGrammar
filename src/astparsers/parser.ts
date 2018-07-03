
export class ASTRule {

}

export class BufferWalker  {

  rules: {[key:string]:ASTRule} = {}
  
  addRule(name:string, keywords:string[]) {

    this.rules[name] = 'OK'

  }
}