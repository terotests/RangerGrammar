

/*
const isCommentStart = createDetector(['<!--'])
*/

export type detectorFn = (buff:string, index:number) => number

export function createDetector( strs:string[]) : detectorFn {
  let cached_detectors = new Array(256)
  function cacheDetector(str, str_index:number) {
    const cache_index = str.charCodeAt(0)
    if(!cached_detectors[cache_index]) cached_detectors[cache_index] = []
    cached_detectors[cache_index].push((buff:string, index:number) : number => {
      if((buff.length - index) < str.length) return -1
      for(let i=0; i<str.length; i++) {
        if(str.charCodeAt(i) != buff.charCodeAt(index + i)) return -1
      }
      return str_index
    })
  }  
  let str_index = 0
  for( let s of strs ) {
    cacheDetector(s, str_index)
    str_index++
  }
  return (buff:string, index:number) : number => {
    const detectors = cached_detectors[buff.charCodeAt(index)]
    if(detectors) {
      for( let fn of detectors) {
        const ci = fn(buff,index)
        if(ci >= 0) return ci        
      }
    }
    return -1
  }
}

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