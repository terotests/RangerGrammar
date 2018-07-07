"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var ASTNode = /** @class */ (function () {
    function ASTNode() {
        // can there be some named nodes ??? 
        this.name = '';
        this.typeName = '';
        // if you collect things like
        // - classBody
        // - arguments
        // - extends
        // ... etc.
        this.namedChildren = {};
        this.children = [];
        this.end_expression = false;
        this.infix_operator = false;
        this.expression_name = '';
        this.operator_pred = 0;
        this.operator_assoc = 0;
        this.expression = false;
        this.block = false;
        this.nop = false;
    }
    ASTNode.prototype.getCodeString = function () {
        var named = Object.keys(this.namedChildren);
        var n = '';
        if (named.length > 0) {
            for (var _i = 0, named_1 = named; _i < named_1.length; _i++) {
                var name_1 = named_1[_i];
                n = n + name_1 + ' => ' + this.namedChildren[name_1].map(function (n) { return n.getCodeString(); }).join(',');
            }
        }
        if (n) {
            n = "[" + n + "]";
        }
        if (this.expression) {
            return n + this.expression_name + this.children.map(function (ch) { return ch.getCodeString(); }).join(' ') + ')';
        }
        if (this.buff) {
            if (this.sp > this.ep)
                return '';
            return n + this.buff.substring(this.sp, this.ep);
        }
    };
    return ASTNode;
}());
exports.ASTNode = ASTNode;
//# sourceMappingURL=ast.js.map