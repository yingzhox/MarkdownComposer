/* Process inline math */

'use strict';

function scanDelims(state, start) {
  var pos = state.pos,
    lastChar, nextChar, count,
    isLastWhiteSpace, isLastPunctChar,
    isNextWhiteSpace, isNextPunctChar,
    can_open = true,
    can_close = true,
    max = state.posMax,
    isWhiteSpace = state.md.utils.isWhiteSpace,
    isPunctChar = state.md.utils.isPunctChar,
    isMdAsciiPunct = state.md.utils.isMdAsciiPunct;
  // treat beginning of the line as a whitespace
  lastChar = start > 0 ? state.src.charCodeAt(start - 1) : 0x20;
  if (pos >= max) {
    can_open = false;
  }
  count = pos - start;
  // treat end of the line as a whitespace
  nextChar = pos < max ? state.src.charCodeAt(pos) : 0x20;
  isLastPunctChar = isMdAsciiPunct(lastChar) || isPunctChar(String.fromCharCode(lastChar));
  isNextPunctChar = isMdAsciiPunct(nextChar) || isPunctChar(String.fromCharCode(nextChar));
  isLastWhiteSpace = isWhiteSpace(lastChar);
  isNextWhiteSpace = isWhiteSpace(nextChar);
  if (isNextWhiteSpace) {
    can_open = false;
  }
  else if (isNextPunctChar) {
    if (!(isLastWhiteSpace || isLastPunctChar)) {
      can_open = false;
    }
  }
  if (isLastWhiteSpace) {
    can_close = false;
  }
  else if (isLastPunctChar) {
    if (!(isNextWhiteSpace || isNextPunctChar)) {
      can_close = false;
    }
  }
  return {
    can_open: can_open,
    can_close: can_close,
    delims: count
  };
}

function matchMath(open, close, state, silent, isBlock, blockOpen) {
  var startCount,
    found,
    res,
    token,
    closeDelim,
    max = state.posMax,
    start = state.pos,
    openDelim = state.src.slice(start, start + open.length);
  //console.log(state);
  if (openDelim !== open) {
    return false;
  } 
  var blockEnd = start + blockOpen.length;
  if (!isBlock && state.src.length >= blockEnd && blockOpen == state.src.slice(start, blockEnd)) {
    return false;
  }
  if (silent) {
    return false;
  } // Don’t run any pairs in validation mode

  res = scanDelims(state, start + open.length);
  startCount = res.delims;

  if (!res.can_open) {
    state.pos += startCount;
    // Earlier we checked !silent, but this implementation does not need it
    state.pending += state.src.slice(start, state.pos);
    return true;
  }

  state.pos = start + open.length;

  while (state.pos < max) {
    closeDelim = state.src.slice(state.pos, state.pos + close.length);
    if (closeDelim === close) {
      res = scanDelims(state, state.pos + close.length);
      if (res.can_close) {
        found = true;
        break;
      }
    }

    state.md.inline.skipToken(state);
  }

  if (!found) {
    // Parser failed to find ending tag, so it is not a valid math
    state.pos = start;
    return false;
  }

  // Found!
  state.posMax = state.pos;
  state.pos = start + close.length;

  // Earlier we checked !silent, but this implementation does not need it
  token = state.push('math_inline', 'math', 0);
  token.content = state.src.slice(state.pos, state.posMax);
  token.markup = open;
  token.meta = {
    isBlock: isBlock
  };
  state.pos = state.posMax + close.length;
  state.posMax = max;

  return true;
}

function makeMath_inline(inlineOpen, inlineClose, blockOpen, blockClose) {
  return function math_inline(state, silent) {
    return matchMath(blockOpen, blockClose, state, silent, true, blockOpen) || matchMath(inlineOpen, inlineClose, state, silent, false, blockOpen);
  };
}

module.exports = function math_plugin(md, options) {
  // Default options
  options = typeof options === 'object' ? options : {};
  var inlineOpen = options.inlineOpen || '$',
    inlineClose = options.inlineClose || '$',
    blockOpen = options.blockOpen || '$$',
    blockClose = options.blockClose || '$$';
  var inlineRenderer = 
    function(tokens, idx) {
      return options.inlineRenderer(tokens[idx]);
    };

  var math_inline = makeMath_inline(inlineOpen, inlineClose, blockOpen, blockClose);
  md.inline.ruler.before('escape', 'math_inline', math_inline);
  md.renderer.rules.math_inline = inlineRenderer;
};