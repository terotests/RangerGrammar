"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var ASTNode = /** @class */ (function () {
    function ASTNode() {
        this.children = [];
        this.end_expression = false;
        this.infix_operator = false;
        this.expression_name = '';
        this.operator_pred = 0;
        this.operator_assoc = 0;
        this.expression = false;
        this.block = false;
    }
    ASTNode.prototype.getCodeString = function () {
        if (this.expression) {
            return this.expression_name + this.children.map(function (ch) { return ch.getCodeString(); }).join(' ') + ')';
        }
        if (this.buff) {
            if (this.sp > this.ep)
                return '';
            return this.buff.substring(this.sp, this.ep);
        }
    };
    return ASTNode;
}());
exports.ASTNode = ASTNode;
//# sourceMappingURL=ast.js.map