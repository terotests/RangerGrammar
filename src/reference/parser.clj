
Import "ng_CodeNode.clj"

operator type:void all {

  fn is_not_limiter:boolean (c:char) {
    return ( (c > 32 ) && 
             (c != (ccode ";")) && 
             (c != (ccode ")")) && 
             (c != (ccode "(")) && 
             (c != (ccode "}")) && 
             (c != (ccode ",")) )
  }
}

class RangerLispParser { 

  def code@(optional):SourceCode
  def buff@(optional):charbuffer
  def len:int 0
  def i:int 0
  def last_line_start 0
  def current_line_index 0
  def parents@(weak):[CodeNode]
  def next@(optional):CodeNode
  def paren_cnt:int 0
  def get_op_pred:int 0
  def rootNode@(optional):CodeNode
  def curr_node@(optional weak):CodeNode
  def had_error:boolean false
  def disableOperators false
  
  Constructor ( code_module:SourceCode ) {
    buff = (to_charbuffer code_module.code)
    code = code_module
    len = (length (( unwrap buff)))
    rootNode = (new CodeNode(( unwrap code) 0 0))
    rootNode.is_block_node = true
    rootNode.expression = true
    curr_node = rootNode
    push parents ( unwrap curr_node)
    paren_cnt = 1
  }
  
  fn joo:void ( cm@(lives):SourceCode) {
    def ll:int ( strlen cm.code)
  }
    
  fn parse_raw_annotation:CodeNode () {
    def sp:int i
    def ep:int i
    i = i + 1
    sp = i
    ep = i
    if (i < len ) {
      def a_node2@(returnvalue):CodeNode (new CodeNode(( unwrap code) sp ep))
      a_node2.expression = true
      a_node2.row = current_line_index
      curr_node = a_node2
      push parents a_node2
      i = i + 1
      paren_cnt = paren_cnt + 1
      this.parse(false)
      return a_node2
    } {
    }
    return (new CodeNode(( unwrap code) sp ep))
  }
  
  fn skip_space:boolean ( is_block_parent@(lives):boolean) {
    def s:charbuffer ( unwrap buff)
    def did_break:boolean false
    if (i >= len) {
      return true
    }
    def c:char (charAt s i)
    def bb:boolean c == ((ccode "."))
    while ((i < len) && (c <= 32)) {
      if( c < 8 ) {
        i = len
        return true
;        throw "Invalid string"
      }
      if (is_block_parent && ((c == 10) || (c == 13))) {
        this.end_expression()
        current_line_index = current_line_index + 1
        did_break = true
        break
      }
      ;         current_line_index = current_line_index + 1
      def had_break false
      while( (i < len ) &&  c == 10 || c == 13) {
        had_break = true
        i = i + 1
        if (i >= len) {
          return true
        }
        c = (charAt s i)
        if( c == 10 || c == 13) {
        }
      }

      if had_break {
        current_line_index = current_line_index + 1
      } {
        i = 1 + i
        if (i >= len) {
          return true
        }
        c = (charAt s i)
      }

    }
    return did_break
  }
  
  fn end_expression:boolean () {
    i = 1 + i
    if (i >= len) {
      return false
    }
    paren_cnt = paren_cnt - 1
    if (paren_cnt < 0) {
      print "Parser error ) mismatch"
    }
    removeLast parents
    if ((!null? curr_node)) {
      curr_node.ep = i
      curr_node.infix_operator = false
    }
    if (((array_length parents)) > 0 ) {
      curr_node = (itemAt parents (((array_length parents)) - 1))
    } {
      curr_node = rootNode
    }
    curr_node.infix_operator = false
    return true
  }
  
  fn getOperator:int ( disabled:boolean ) {
    if disabled {
      return 0
    }
    def s:charbuffer ( unwrap buff)
    if ((i + 2) >= len) {
      return 0
    }
    def c:char (charAt s i)
    def c2:char (charAt s (i + 1))
    switch ( c ) { 
      case (ccode "*") { 
        i = i + 1
        return 14
      }
      case (ccode "/") { 
        i = i + 1
        return 14
      }
      case (ccode "%") { 
        i = i + 1
        return 14
      }
      case (ccode "+") { 
        i = i + 1
        return 13
      }
      case (ccode "-") { 
        i = i + 1
        return 13
      }
      case (ccode "<") { 
        if (c2 == ((ccode "="))) {
          i = i + 2
          return 11
        }
        i = i + 1
        return 11
      }
      case (ccode ">") { 
        if (c2 == ((ccode "="))) {
          i = i + 2
          return 11
        }
        i = i + 1
        return 11
      }
      case (ccode "!") { 
        if (c2 == ((ccode "="))) {
          i = i + 2
          return 10
        }
        return 0
      }
      case (ccode "=") { 
        if (c2 == ((ccode "="))) {
          i = i + 2
          return 10
        }
        i = i + 1
        return 3
      }
      case (ccode "&") { 
        if (c2 == ((ccode "&"))) {
          i = i + 2
          return 6
        }
        return 0
      }
      case (ccode "|") { 
        if (c2 == ((ccode "|"))) {
          i = i + 2
          return 5
        }
        return 0
      }
      default { 
      }
    }
    return 0
  }
  
  fn isOperator:int ( disabled:boolean ) {
    if disabled {
      return 0
    }
    def s:charbuffer ( unwrap buff)
    if ((i - 2) > len) {
      return 0
    }
    def c:char (charAt s i)
    def c2:char (charAt s (i + 1))
    switch (c ) { 
      case (ccode "*") { 
        return 1
      }
      case (ccode "/") { 
        return 14
      }
      case (ccode "+") { 
        return 13
      }
      case (ccode "%") { 
        return 14
      }
      case (ccode "-") { 
        return 13
      }
      case (ccode "<") { 
        if (c2 == ((ccode "="))) {
          return 11
        }
        return 11
      }
      case (ccode ">") { 
        if (c2 == ((ccode "="))) {
          return 11
        }
        return 11
      }
      case (ccode "!") { 
        if (c2 == ((ccode "="))) {
          return 10
        }
        return 0
      }
      case (ccode "=") { 
        if (c2 == ((ccode "="))) {
          return 10
        }
        return 3
      }
      case (ccode "&") { 
        if (c2 == ((ccode "&"))) {
          return 6
        }
        return 0
      }
      case (ccode "|") { 
        if (c2 == ((ccode "|"))) {
          return 5
        }
        return 0
      }
      default { 
      }
    }
    return 0
  }
  
  fn getOperatorPred:int ( str@(lives):string disabled:boolean) {
    if(disabled) {
      return 0
    }
    switch (str ) { 
      case "<" { 
        return 11
      }
      case ">" { 
        return 11
      }
      case "<=" { 
        return 11
      }
      case ">=" { 
        return 11
      }
      case "==" { 
        return 10
      }
      case "!=" { 
        return 10
      }
      case "=" { 
        return 3
      }
      case "&&" { 
        return 6
      }
      case "||" { 
        return 5
      }
      case "+" { 
        return 13
      }
      case "-" { 
        return 13
      }
      case "%" { 
        return 14
      }
      case "*" { 
        return 14
      }
      case "/" { 
        return 14
      }
      default { 
      }
    }
    return 0
  }
  
  fn insert_node:void ( p_node@(strong lives):CodeNode) {
    def push_target@(optional weak lives):CodeNode curr_node
    if (curr_node.infix_operator) {
      push_target = curr_node.infix_node
      if (push_target.to_the_right) {
        push_target = push_target.right_node
        p_node.parent = push_target
      }
    }
    push push_target.children p_node
  }

  fn parse_attributes:boolean () {
    def s:charbuffer (unwrap buff)
    def last_i:int 0
    def do_break:boolean false
    def attr_name:string ""
    def sp:int i
    def ep:int i
    def c:char 0
    def cc1:char 0
    def cc2:char 0
    cc1 = (charAt s i)
    while (i < len) {
      last_i = i
      while ((i < len) && ((charAt s i) <= 32)) {
        i = (1 + i)
      }
      cc1 = (charAt s i)
      cc2 = (charAt s (i + 1))
      if (i >= len) {
        break _
      }
      if (cc1 == (ccode ">")) {
        return do_break
      }
      if ((cc1 == (ccode "/")) && (cc2 == (ccode ">"))) {
        i = (2 + i)
        return true
      }
      sp = i
      ep = i
      c = (charAt s i)
      while ((i < len) && (((c >= 65) && (c <= 90)) || ((c >= 97) && (c <= 122)) || ((c >= 48) && (c <= 57)) || (c == (ccode "_")) || (c == (ccode "-")))) {
        i = (1 + i)
        c = (charAt s i)
      }
      i = (i - 1)
      def an_sp:int sp
      def an_ep:int i
      c = (charAt s i)
      while ((i < len) && (c != (ccode "="))) {
        i = (1 + i)
        c = (charAt s i)
      }
      if (c == (ccode "=")) {
        i = (1 + i)
      }
      while ((i < len) && ((charAt s i) <= 32)) {
        i = (1 + i)
      }
      if (i >= len) {
        break _
      }
      c = (charAt s i)

      ; parse attribute node...
      if( c == (ccode "{")) {
        print "--> attribute had a code child...."

        def cNode@(lives) curr_node

        def new_attr@(lives):CodeNode (new CodeNode(( unwrap code) sp ep))
        new_attr.value_type = RangerNodeType.XMLAttr
        new_attr.parsed_type = new_attr.value_type
        new_attr.vref = (substring s an_sp (an_ep + 1))
        new_attr.string_value = (substring s sp ep)
        push curr_node.attrs new_attr
        
        curr_node = new_attr

        paren_cnt = paren_cnt + 1
        def new_qnode@(lives):CodeNode (new CodeNode(( unwrap code) i i))
        new_qnode.expression = true
        this.insert_node(new_qnode)
        push parents new_qnode
        curr_node = new_qnode
        i = 1 + i
        this.parse(false)

        curr_node = cNode

        continue 
      }

      if( (c == 34) || ( c == (ccode "'")) ) {
        i = (i + 1)
        sp = i
        ep = i
        c = (charAt s i)
        while ((i < len) && (c != 34) && ( c!= (ccode "'"))) {
          i = (1 + i)
          c = (charAt s i)
        }
        ep = i
        if ((i < len) && (ep > sp)) {
          def new_attr@(lives):CodeNode (new CodeNode(( unwrap code) sp ep))
          new_attr.value_type = RangerNodeType.XMLAttr
          new_attr.parsed_type = new_attr.value_type
          new_attr.vref = (substring s an_sp (an_ep + 1))
          new_attr.string_value = (substring s sp ep)
          push curr_node.attrs new_attr
        }
        i = (1 + i)
      }
      if (last_i == i) {
        i = (1 + i)
      }
    }
    return do_break
  }

  fn parseXML:void () {

    def s:charbuffer (unwrap buff)
    def c:char 0
    def next_c:char 0
    def fc:char 0
    def new_node:CodeNode
    def sp:int i
    def ep:int i
    def last_i:int 0
    def cc1:char 0
    def cc2:char 0
    def tag_depth 0 

    ; print "parseXML called"
    
    while (i < len) {
      last_i = i
      if (i >= (len - 1)) {
        break _
      }
      cc1 = (charAt s i)
      cc2 = (charAt s (i + 1))

      if( cc1 == (ccode "{")) {
        def cNode@(lives) curr_node
        paren_cnt = paren_cnt + 1
        def new_qnode@(lives):CodeNode (new CodeNode(( unwrap code) i i))
        new_qnode.expression = true
        this.insert_node(new_qnode)
        push parents new_qnode
        curr_node = new_qnode
        i = 1 + i
        this.parse(false)
        curr_node = cNode
        continue 
      }

      if (cc1 == (ccode ">")) {
        i = (i + 1)
        cc1 = (charAt s i)
        cc2 = (charAt s (i + 1))
        continue 1
      }
      if (((ccode "/") == cc1) && (cc2 == (ccode ">"))) {
        tag_depth = (tag_depth - 1)
        i = (i + 2)
        if( tag_depth <= 0 ) {
          removeLast parents
          def p_cnt:int (array_length parents)        
          def last_parent@(lives):CodeNode (itemAt parents (p_cnt - 1))
          curr_node = last_parent          
          return
        }
        continue 1
      }
      if (i >= len) {
        break _
      }
      if (((ccode "<") == cc1) && (cc2 == (ccode "/"))) {
        tag_depth = (tag_depth - 1)
        i = (i + 2)
        sp = i
        ep = i
        c = (charAt s i)
        while ((i < len) && (c > 32) && (c != (ccode ">"))) {
          i = (1 + i)
          c = (charAt s i)
        }
        ep = i
        removeLast parents
        def p_cnt:int (array_length parents)
        def last_parent@(lives):CodeNode (itemAt parents (p_cnt - 1))
        curr_node = last_parent
        if( tag_depth <= 0 ) {
          return
        }
        continue 
      }
      if (cc1 == (ccode "<")) {
        i = (i + 1)
        sp = i
        ep = i
        c = (charAt s i)
        while ((i < len) && (c != (ccode ">")) && (((c >= 65) && (c <= 90)) || ((c >= 97) && (c <= 122)) || ((c >= 48) && (c <= 57)) || (c == 95) || (c == 46) || (c == 64))) {
          i = (1 + i)
          c = (charAt s i)
        }
        tag_depth = tag_depth  + 1
        ep = i
        def new_tag:string (substring s sp ep)
        if (null? curr_node) {
          def new_rnode:CodeNode (new CodeNode(( unwrap code) sp ep))
          new_rnode.vref = new_tag
          new_rnode.value_type = RangerNodeType.XMLNode
          new_rnode.parsed_type = new_rnode.value_type
          rootNode = new_rnode
          push parents new_rnode
          curr_node = new_rnode
        } {
          def new_node:CodeNode (new CodeNode(( unwrap code) sp ep))
          new_node.vref = new_tag
          new_node.value_type = RangerNodeType.XMLNode
          new_node.parsed_type = new_node.value_type
          push curr_node.children new_node
          new_node.parent = curr_node
          push parents new_node
          curr_node = new_node
        }        
        if (this.parse_attributes()) {
          removeLast parents
          def p_cnt:int (array_length parents)
          def last_parent@(lives):CodeNode (itemAt parents (p_cnt - 1))
          curr_node = last_parent
          tag_depth = (tag_depth - 1)
          if( tag_depth <= 0 ) {
            return
          }
          continue           
        }
        continue 1
      }
      if (!null? curr_node) {
        sp = i
        ep = i
        c = (charAt s i)
        while ((i < len) && (c != (ccode "<")) && (c != (ccode "{")) ) {
          i = (1 + i)
          c = (charAt s i)
        }
        ep = i
        if (ep > sp) {
          def new_node:CodeNode (new CodeNode(( unwrap code) sp ep))
          new_node.string_value = (substring s sp ep)
          new_node.value_type = RangerNodeType.XMLText
          new_node.parsed_type = new_node.value_type
          push curr_node.children new_node
          new_node.parent = curr_node
        }
      }
      if (last_i == i) {
        i = (1 + i)
      }
    }
  }
  
  
  fn parse:void ( disable_ops:boolean ) {
    def s:charbuffer ( unwrap buff)
    def c:char (charAt s 0)
    def next_c:char 0
    def fc:char 0
    def new_node@(optional):CodeNode
    def sp:int 0
    def ep:int 0
    def last_i:int 0
    def had_lf:boolean false
    def disable_ops_set disable_ops

    while (i < len) {

      if(!null? curr_node) {
        ; called from the XML parser...
        if(curr_node.value_type == RangerNodeType.XMLAttr) {
          return
        }
        if(curr_node.value_type == RangerNodeType.XMLNode) {
          return
        }
      }

      if (had_error) {
        break
      }
      last_i = i
      def is_block_parent:boolean false
      if (had_lf) {
        had_lf = false
        this.end_expression()
        break
      }
      if ((!null? curr_node)) {
        if ((!null? curr_node.parent)) {
          def nodeParent@(optional):CodeNode curr_node.parent
          if (nodeParent.is_block_node) {
            is_block_parent = true
          }
        }
      }
      if ((this.skip_space(is_block_parent))) {
        break
      }
      had_lf = false
      c = (charAt s i)
      if (i < len) {
        c = (charAt s i)

        if ( (ccode "<") == c) {
          if( (i + 1) < len ) {
            def next_c (charAt s (i + 1))
            if ( (ccode "A") < next_c  && (ccode "z") > next_c)  {
              ; print "XML start found"
              def spos i
;              i = i + 1
              this.parseXML()
              ; print "XML parsed at index " + i + " the leng was " + len 
              ; print "XML was " + (substring s spos i)
              i = i + 1
              continue
            }
          }
          if( i > 0 ) {
            def prev_c (charAt s (i - 1))
            if ( (ccode ">") == prev_c)  {
              ; print "XML END found"
            }
          }
        } 

        ; multiline comments ? 
        if (c == 59) {
          sp = i + 1
          while ((i < len) && (((charAt s i)) > 31)) {
            i = 1 + i
          }
          if (i >= len) {
            break
          }
          new_node = (new CodeNode(( unwrap code) sp i))
          new_node.parsed_type = RangerNodeType.Comment
          new_node.value_type = RangerNodeType.Comment
          new_node.string_value = (substring s sp i)
          push curr_node.comments ( unwrap new_node)
          continue 
        }

        if (i < (len - 1)) {
          fc = (charAt s (i + 1))


          if ((c == 40) || (c == ((ccode "{"))) ) {
            paren_cnt = paren_cnt + 1
            if ((null? curr_node) ) {
              rootNode = (new CodeNode(( unwrap code) i i))
              curr_node = rootNode
              curr_node.expression = true
              push parents ( unwrap curr_node)
            } {
              def new_qnode@(lives):CodeNode (new CodeNode(( unwrap code) i i))
              new_qnode.expression = true
              this.insert_node(new_qnode)
              push parents new_qnode
              curr_node = new_qnode
            }
            if (c == ((ccode "{"))) {
              curr_node.is_block_node = true
            }
            i = 1 + i
            this.parse( disable_ops_set )
            continue 
          }
        }
        sp = i
        ep = i
        fc = (charAt s i)
        ; number testing...
        if (((fc == 45) && (((charAt s (i + 1))) >= 46) && (((charAt s (i + 1))) <= 57)) || ((fc >= 48) && (fc <= 57))) {
          def is_double:boolean false
          sp = i
          i = 1 + i
          c = (charAt s i)
          while ((i < len) && (((c >= 48) && (c <= 57)) || (c == ((ccode "."))) || ((i == sp) && ((c == ((ccode "+"))) || (c == ((ccode "-"))))))) {
            if (c == ((ccode "."))) {
              is_double = true
            }
            i = 1 + i
            c = (charAt s i)
          }
          ep = i
          def new_num_node:CodeNode (new CodeNode(( unwrap code) sp ep))
          if (is_double ) {
            new_num_node.parsed_type = RangerNodeType.Double
            new_num_node.value_type = RangerNodeType.Double
            new_num_node.double_value = ( unwrap ((str2double ((substring s sp ep)))))
          } {
            new_num_node.parsed_type = RangerNodeType.Integer
            new_num_node.value_type = RangerNodeType.Integer
            new_num_node.int_value = ( unwrap ((str2int ((substring s sp ep)))))
          }
          this.insert_node(new_num_node)
          continue 
        }

        def str_limit fc
        def b_had_str ( fc == 34 || fc == 96 || fc == 39 ) 

        if b_had_str {
          sp = i + 1
          ep = sp
          c = (charAt s i)
          def must_encode:boolean false
          while (i < len) {
            i = 1 + i
            c = (charAt s i)
            if (c == str_limit) {
              break
            }
            if (c == 92) {
              i = 1 + i
              if (i < len ) {
                must_encode = true
                c = (charAt s i)
              } {
                break
              }
            }
          }
          ep = i
          if (i < len) {
            def encoded_str:string ""
            if (must_encode) {
              ; print "parsing encoded string " + (substring s sp ep)
              def subs (substring s sp ep)
              def orig_str:charbuffer (to_charbuffer subs)
              def str_length:int (length orig_str)
              def ii:int 0
              while (ii < str_length) {def cc:char (charAt orig_str ii)
                if (cc == 92 ) {
                  def next_ch:char (charAt orig_str (ii + 1))
                  switch (next_ch ) { 
                    case 34 { 
                      encoded_str = encoded_str + ((strfromcode 34))
                    }
                    case 92 { 
                      encoded_str = encoded_str + ((strfromcode 92))
                    }
                    case 47 { 
                      encoded_str = encoded_str + ((strfromcode 47))
                    }
                    case 98 { 
                      encoded_str = encoded_str + ((strfromcode 8))
                    }
                    case 102 { 
                      encoded_str = encoded_str + ((strfromcode 12))
                    }
                    case 110 { 
                      encoded_str = encoded_str + ((strfromcode 10))
                    }
                    case 114 { 
                      encoded_str = encoded_str + ((strfromcode 13))
                    }
                    case 116 { 
                      encoded_str = encoded_str + ((strfromcode 9))
                    }
                    case 117 { 
                      ii = ii + 4
                    }
                    default { 
                    }
                  }
                  ii = ii + 2
                } {
                  encoded_str = encoded_str + ((substring orig_str ii (1 + ii)))
                  ii = ii + 1
                }
              }
            } {
              ; print "string without encoding"
            }

            def new_str_node:CodeNode (new CodeNode(( unwrap code) sp ep))
            new_str_node.parsed_type = RangerNodeType.String
            new_str_node.value_type = RangerNodeType.String
            if (must_encode ) {
              new_str_node.string_value = encoded_str
            } {
              new_str_node.string_value = (substring s sp ep)
            }
            this.insert_node(new_str_node)
            i = 1 + i
            continue 
          }
        }
        if ((fc == ((ccode "t"))) && (((charAt s (i + 1))) == ((ccode "r"))) && (((charAt s (i + 2))) == ((ccode "u"))) && (((charAt s (i + 3))) == ((ccode "e")))) {
          def new_true_node:CodeNode (new CodeNode(( unwrap code) sp sp + 4))
          new_true_node.value_type = RangerNodeType.Boolean
          new_true_node.parsed_type = RangerNodeType.Boolean
          new_true_node.boolean_value = true
          this.insert_node(new_true_node)
          i = i + 4
          continue 
        }
        if ((fc == ((ccode "f"))) && (((charAt s (i + 1))) == ((ccode "a"))) && (((charAt s (i + 2))) == ((ccode "l"))) && (((charAt s (i + 3))) == ((ccode "s"))) && (((charAt s (i + 4))) == ((ccode "e")))) {
          def new_f_node:CodeNode (new CodeNode(( unwrap code) sp sp + 5))
          new_f_node.value_type = RangerNodeType.Boolean
          new_f_node.parsed_type = RangerNodeType.Boolean
          new_f_node.boolean_value = false
          this.insert_node(new_f_node)
          i = i + 5
          continue 
        }

        if (fc == ((ccode "@"))) {
          i = i + 1
          sp = i
          ep = i
          c = (charAt s i)
          while ((i < len) && (((charAt s i)) > 32) && (c != 40) && (c != 41) && (c != ((ccode "}"))  )) {
            i = 1 + i
            c = (charAt s i)
          }
          ep = i
          if ((i < len) && (ep > sp)) {
            def a_node2@(lives):CodeNode (new CodeNode(( unwrap code) sp ep))
            def a_name:string (substring s sp ep)
            if( a_name == "noinfix") {
              disable_ops_set = true
            }
            a_node2.expression = true
            curr_node = a_node2
            push parents a_node2
            i = i + 1
            paren_cnt = paren_cnt + 1
            this.parse(disable_ops_set)
            def use_first:boolean false
            if (1 == ((array_length a_node2.children))) {
              def ch1:CodeNode (itemAt a_node2.children 0)
              use_first = (ch1.isPrimitive())
            }
            if (use_first ) {
              def theNode:CodeNode (array_extract a_node2.children 0)
              set curr_node.props a_name theNode
            } {
              set curr_node.props a_name a_node2
            }
            push curr_node.prop_keys a_name
            continue 
          }
        }
        def ns_list@(temp):[string]
        def last_ns:int i
        def ns_cnt:int 1
        def vref_had_type_ann:boolean false
        def vref_ann_node@(optional temp):CodeNode
        def vref_end:int i
        if ((i < len) && (((charAt s i)) > 32) && (c != 58) && (c != 40) && (c != 41) && (c != ((ccode "}")) )  ) {
          if (curr_node.is_block_node == true) {
            def new_expr_node:CodeNode (new CodeNode(( unwrap code) sp ep))
            new_expr_node.parent = curr_node
            new_expr_node.expression = true
            push curr_node.children new_expr_node
            curr_node = new_expr_node
            push parents new_expr_node
            paren_cnt = 1 + paren_cnt
            this.parse(disable_ops_set)
            continue 
          }
        }
        def op_c:int 0
        ; if (((array_length curr_node.children)) >= 0) {
          op_c = (this.getOperator(disable_ops_set))
        ; }
        def last_was_newline:boolean false
        if (op_c > 0 ) {
        } {

          while ((i < len) && (((charAt s i)) > 32) && (c != 58) && (c != 40) && (c != 41) && (c != ((ccode "}"))) ) {
            if (i > sp) {
              def is_opchar:int (this.isOperator(disable_ops_set))
              if (is_opchar > 0) {
                break
              }
            }
            i = 1 + i
            c = (charAt s i)
            if ((c == 10) || (c == 13)) {
              last_was_newline = true
              break
            }
            if (c == ((ccode "."))) {
              push ns_list (substring s last_ns i)
              last_ns = i + 1
              ns_cnt = 1 + ns_cnt
            }
            if ((i > vref_end) && (c == ((ccode "@")))) {
              vref_had_type_ann = true
              vref_end = i
              vref_ann_node = (this.parse_raw_annotation())
              c = (charAt s i)
              break
            }
          }
        }
        ep = i
        if (vref_had_type_ann) {
          ep = vref_end
        }

        push ns_list (substring s last_ns ep)
        c = (charAt s i)
        while ((i < len) && (c <= 32) && (false == last_was_newline)) {
          i = 1 + i
          c = (charAt s i)
          if (is_block_parent && ((c == 10) || (c == 13))) {
            i = i - 1
            c = (charAt s i)
            had_lf = true
            break
          }
        }
        if ( (false == disable_ops_set) && (c == (ccode ":") ) ) {
          i = i + 1
          while ((i < len) && (((charAt s i)) <= 32)) {
            i = 1 + i
          }
          def vt_sp:int i
          def vt_ep:int i
          c = (charAt s i)
          if (c == ((ccode "("))) {

            ; tring to parser as annotation...
            def vann_arr2@(lives):CodeNode (this.parse_raw_annotation())
            vann_arr2.expression = true

            ;def a_node3@(lives):CodeNode (new CodeNode(( unwrap code) sp ep))
            ;a_node3.expression = true
            ;curr_node = a_node3
            ;push parents a_node3
            ;i = i + 1
            ;this.parse(disable_ops_set)
            def new_expr_node:CodeNode (new CodeNode(( unwrap code) sp vt_ep))
            new_expr_node.vref = (substring s sp ep)
            new_expr_node.ns = ns_list
            new_expr_node.expression_value = vann_arr2
            new_expr_node.parsed_type = RangerNodeType.ExpressionType
            new_expr_node.value_type = RangerNodeType.ExpressionType
            if (vref_had_type_ann) {
              new_expr_node.vref_annotation = vref_ann_node
              new_expr_node.has_vref_annotation = true
            }
            push curr_node.children new_expr_node
            continue 
          }
          if (c == ((ccode "["))) {
            i = i + 1
            vt_sp = i
            def hash_sep:int 0
            def had_array_type_ann:boolean false
            c = (charAt s i)
            while ((i < len) && (c > 32) && (c != 93)) {
              i = 1 + i
              c = (charAt s i)
              if (c == ((ccode ":"))) {
                hash_sep = i
              }
              if (c == ((ccode "@"))) {
                had_array_type_ann = true
                break
              }
            }
            vt_ep = i
            if (hash_sep > 0 ) {
              vt_ep = i
              def type_name:string (substring s (1 + hash_sep) vt_ep)
              def key_type_name:string (substring s vt_sp hash_sep)
              def new_hash_node:CodeNode (new CodeNode(( unwrap code) sp vt_ep))
              new_hash_node.vref = (substring s sp ep)
              new_hash_node.ns = ns_list
              new_hash_node.parsed_type = RangerNodeType.Hash
              new_hash_node.value_type = RangerNodeType.Hash
              new_hash_node.array_type = type_name
              new_hash_node.key_type = key_type_name
              if (vref_had_type_ann) {
                new_hash_node.vref_annotation = vref_ann_node
                new_hash_node.has_vref_annotation = true
              }
              if (had_array_type_ann) {
                def vann_hash:CodeNode (this.parse_raw_annotation())
                new_hash_node.type_annotation = vann_hash
                new_hash_node.has_type_annotation = true
              }
              new_hash_node.parent = curr_node
              push curr_node.children new_hash_node
              i = 1 + i
              continue 
            } {
              vt_ep = i
              def type_name:string (substring s vt_sp vt_ep)
              def new_arr_node:CodeNode (new CodeNode(( unwrap code) sp vt_ep))
              new_arr_node.vref = (substring s sp ep)
              new_arr_node.ns = ns_list
              new_arr_node.parsed_type = RangerNodeType.Array              
              new_arr_node.value_type = RangerNodeType.Array
              new_arr_node.array_type = type_name
              new_arr_node.parent = curr_node
              push curr_node.children new_arr_node
              if (vref_had_type_ann) {
                new_arr_node.vref_annotation = vref_ann_node
                new_arr_node.has_vref_annotation = true
              }
              if (had_array_type_ann) {
                def vann_arr:CodeNode (this.parse_raw_annotation())
                new_arr_node.type_annotation = vann_arr
                new_arr_node.has_type_annotation = true
                print "--> parsed ARRAY TYPE annotation"
              }
              i = 1 + i
              continue 
            }
          }
          def had_type_ann:boolean false
          ; is_not_limiter
 ;         while ((i < len) && (((charAt s i)) > 32) && (c != 58) && (c != 40) && (c != 41) && (c != ((ccode "}"))) && (c != ((ccode ",")))) {         
          ; while ((i < len) && (((charAt s i)) > 32) && (c != 58) && (is_not_limiter c) ) {

          while ( (i < len) && (is_not_limiter c) ) {   
            i = 1 + i
            c = (charAt s i)
            if (c == ((ccode "@"))) {
              had_type_ann = true
              break
            }
          }
          if (i < len) {
            vt_ep = i
            def type_name:string (substring s vt_sp vt_ep)
            def new_ref_node:CodeNode (new CodeNode(( unwrap code) sp ep))
            new_ref_node.vref = (substring s sp ep)
            new_ref_node.ns = ns_list
            new_ref_node.parsed_type = RangerNodeType.VRef
            new_ref_node.value_type = RangerNodeType.VRef
            new_ref_node.type_name = (substring s vt_sp vt_ep)
            new_ref_node.parent = curr_node
            if (vref_had_type_ann) {
              new_ref_node.vref_annotation = vref_ann_node
              new_ref_node.has_vref_annotation = true
            }
            push curr_node.children new_ref_node
            if (had_type_ann) {
              def vann:CodeNode (this.parse_raw_annotation())
              new_ref_node.type_annotation = vann
              new_ref_node.has_type_annotation = true
            }
            continue 
          }
        } {
          if ((i < len) && (ep > sp)) {
            def new_vref_node:CodeNode (new CodeNode(( unwrap code) sp ep))
            new_vref_node.vref = (substring s sp ep)
            new_vref_node.parsed_type = RangerNodeType.VRef
            new_vref_node.value_type = RangerNodeType.VRef
            new_vref_node.ns = ns_list
            new_vref_node.parent = curr_node
            def op_pred:int (this.getOperatorPred(new_vref_node.vref disable_ops_set))
            if (new_vref_node.vref == ",") {
              curr_node.infix_operator = false
              continue 
            }
            def pTarget@(optional weak):CodeNode curr_node
            if (curr_node.infix_operator) {
              def iNode@(optional):CodeNode curr_node.infix_node
              if ((op_pred > 0) || (iNode.to_the_right == false) ) {
                pTarget = iNode
              } {
                def rn@(optional lives):CodeNode iNode.right_node
                new_vref_node.parent = rn
                pTarget = rn
              }
            }
            push pTarget.children new_vref_node
            if (vref_had_type_ann) {
              new_vref_node.vref_annotation = vref_ann_node
              new_vref_node.has_vref_annotation = true
            }
            if ( (i + 1) < len ) {
              if ((((charAt s (i + 1))) == ((ccode "("))) || (((charAt s (i + 0))) == ((ccode "(")))) {
                if ((0 == op_pred) && curr_node.infix_operator && (1 == ((array_length curr_node.children)))) {
                }
              }
            }

            if (((op_pred > 0) && curr_node.infix_operator) || ((op_pred > 0) && (((array_length curr_node.children)) >= 2))) {
              if ((op_pred == 3) && (2 == ((array_length curr_node.children))) ) {
                def n_ch:CodeNode (array_extract curr_node.children 0)
                push curr_node.children n_ch
              } {
                if (false == curr_node.infix_operator) {
                  def if_node@(temp lives):CodeNode (new CodeNode(( unwrap code) sp ep))
                  curr_node.infix_node = if_node
                  curr_node.infix_operator = true
                  if_node.infix_subnode = true
                  curr_node.value_type = RangerNodeType.NoType
                  curr_node.parsed_type = curr_node.value_type
                  curr_node.expression = true
                  if_node.expression = true
                  def ch_cnt:int (array_length curr_node.children)
                  def ii:int 0
                  def start_from:int ch_cnt - 2
                  def keep_nodes:CodeNode (new CodeNode(( unwrap code) sp ep))
                  while (ch_cnt > 0) {
                    def n_ch:CodeNode (array_extract curr_node.children 0)
                    def p_target:CodeNode if_node
                    if ((ii < start_from) || n_ch.infix_subnode) {
                      p_target = keep_nodes
                    }
                    push p_target.children n_ch
                    ch_cnt = ch_cnt - 1
                    ii = 1 + ii
                  }
                  for keep_nodes.children keep:CodeNode i2 {
                    push curr_node.children keep
                  }
                  push curr_node.children if_node
                }
                def ifNode@(optional lives):CodeNode curr_node.infix_node
                def new_op_node@(temp):CodeNode (new CodeNode(( unwrap code) sp ep))
                new_op_node.expression = true
                new_op_node.parent = ifNode
                def until_index:int ((array_length ifNode.children)) - 1
                def to_right:boolean false
                def just_continue:boolean false
                if ((ifNode.operator_pred > 0) && (ifNode.operator_pred < op_pred)) {
                  to_right = true
                }
                if ((ifNode.operator_pred > 0) && (ifNode.operator_pred > op_pred)) {
                  ifNode.to_the_right = false
                }
                if ((ifNode.operator_pred > 0) && (ifNode.operator_pred == op_pred)) {
                  to_right = ifNode.to_the_right
                }
                def opTarget@(optional):CodeNode ifNode
                if (to_right ) {
                  def op_node:CodeNode (array_extract ifNode.children until_index)
                  def last_value:CodeNode (array_extract ifNode.children (until_index - 1))
                  push new_op_node.children op_node
                  push new_op_node.children last_value
                } {
                  if (false == just_continue) {
                    while (until_index > 0) {
                      def what_to_add:CodeNode (array_extract ifNode.children 0)
                      push new_op_node.children what_to_add
                      until_index = until_index - 1
                    }
                  }
                }
                if (to_right || (false == just_continue)) {
                  push ifNode.children new_op_node
                }
                if (to_right) {
                  ifNode.right_node = new_op_node
                  ifNode.to_the_right = true
                }
                ifNode.operator_pred = op_pred
                continue 
              }
            }
            continue 
          }
        }

        ; 
        if (   (c == 41) || (c == ((ccode "}")))) {
          if ((c == ((ccode "}"))) && is_block_parent && (((array_length curr_node.children)) > 0)) {
            this.end_expression()
          }
          i = 1 + i
          paren_cnt = paren_cnt - 1
          if (paren_cnt < 0) {
            break
          }
          removeLast parents
          if ((!null? curr_node)) {
            curr_node.ep = i
          }
          if (((array_length parents)) > 0 ) {
            curr_node = (itemAt parents (((array_length parents)) - 1))
          } {
            curr_node = rootNode
          }
          break
        }
        if (last_i == i) {
          i = 1 + i
        }
      }
    }
  }
}
