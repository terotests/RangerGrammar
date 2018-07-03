"use strict";
/*
const isCommentStart = createDetector(['<!--'])
*/
Object.defineProperty(exports, "__esModule", { value: true });
function createDetector(strs) {
    var cached_detectors = new Array(256);
    function cacheDetector(str, str_index) {
        var cache_index = str.charCodeAt(0);
        if (!cached_detectors[cache_index])
            cached_detectors[cache_index] = [];
        cached_detectors[cache_index].push(function (buff, index) {
            if ((buff.length - index) < str.length)
                return -1;
            for (var i = 0; i < str.length; i++) {
                if (str.charCodeAt(i) != buff.charCodeAt(index + i))
                    return -1;
            }
            return str_index;
        });
    }
    var str_index = 0;
    for (var _i = 0, strs_1 = strs; _i < strs_1.length; _i++) {
        var s = strs_1[_i];
        cacheDetector(s, str_index);
        str_index++;
    }
    return function (buff, index) {
        var detectors = cached_detectors[buff.charCodeAt(index)];
        if (detectors) {
            for (var _i = 0, detectors_1 = detectors; _i < detectors_1.length; _i++) {
                var fn = detectors_1[_i];
                var ci = fn(buff, index);
                if (ci >= 0)
                    return ci;
            }
        }
        return -1;
    };
}
exports.createDetector = createDetector;
// Collecting some set of characters using function...
// Creating functions that detect some character types...
/*
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
*/ 
//# sourceMappingURL=detector.js.map