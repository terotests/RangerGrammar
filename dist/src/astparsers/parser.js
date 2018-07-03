"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var ASTRule = /** @class */ (function () {
    function ASTRule() {
    }
    return ASTRule;
}());
exports.ASTRule = ASTRule;
var BufferWalker = /** @class */ (function () {
    function BufferWalker() {
        this.rules = {};
    }
    BufferWalker.prototype.addRule = function (name, keywords) {
        this.rules[name] = 'OK';
    };
    return BufferWalker;
}());
exports.BufferWalker = BufferWalker;
//# sourceMappingURL=parser.js.map