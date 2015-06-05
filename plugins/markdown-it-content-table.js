"use strict";
var string = require("string");
var assign = require("lodash.assign");
var string = require("string");
var defaults = {
  includeLevel: 2,
  containerClass: "table-of-contents",
  slugify: function(str) {
    return string(str).slugify().toString();
  }
};

module.exports = function(md, options) {
  var options = assign({}, defaults, options);
  var tocRegexp = /^\[\[toc\]\]/im;
  var gstate;
  function toc(state, startLine, endLine, silent){
    var token;
    var match;

    var startPos = state.bMarks[startLine]+state.tShift[startLine];
    var endPos = state.eMarks[startLine];
    var line = state.src.slice(startPos,endPos);
    // while (state.src.indexOf("\n") >= 0 && state.src.indexOf("\n") < state.src.indexOf("[[toc]]")) {
    //   if (state.tokens.slice(-1)[0].type === "softbreak") {
    //     state.src = state.src.split("\n").slice(1).join("\n");
    //     state.pos = 0;
    //   }
    // }

    //if(startLine!=endLine)
    // Reject if the token does not start with [
    if (state.src.charCodeAt(startPos) !== 0x5B /* [ */ ) {
      return false;
    }
    // Don't run any pairs in validation mode
    if (silent) { 
      return false;
    }

    // Detect TOC markdown
    // match = tocRegexp.exec(line);
    // match = !match ? [] : match.filter(function(m) { return m; });
    // if (match.length < 1) {
    //   return false;
    // }
    match = line.trimRight().toUpperCase() == "[[TOC]]";
    if(!match) return false;
    if(state.bMarks.length>=startLine+1 && (state.bMarks[startLine+1]+state.tShift[startLine+1]) != state.eMarks[startLine+1]){
        return false;
    }
    // Build content
   
    
    token = state.push("toc_open", "toc", 1);
    token.map = [startLine,startLine];
    token.markup = "[[toc]]";
    token = state.push("toc_body", "", 0);
    token.map = [startLine,startLine];
    token = state.push("toc_close", "toc", -1);
  
    // Update pos so the parser can continue
    state.line = startLine+1;

    return true;
  }
//   function toc(state, silent) {
//     var token;
//     var match;

//     while (state.src.indexOf("\n") >= 0 && state.src.indexOf("\n") < state.src.indexOf("[[toc]]")) {
//       if (state.tokens.slice(-1)[0].type === "softbreak") {
//         state.src = state.src.split("\n").slice(1).join("\n");
//         state.pos = 0;
//       }
//     }

//     // Reject if the token does not start with [
//     if (state.src.charCodeAt(state.pos) !== 0x5B /* [ */ ) {
//       return false;
//     }
//     // Don't run any pairs in validation mode
//     if (silent) { 
//       return false;
//     }

//     // Detect TOC markdown
//     match = tocRegexp.exec(state.src);
//     match = !match ? [] : match.filter(function(m) { return m; });
//     if (match.length < 1) {
//       return false;
//     }

//     // Build content
//     token = state.push("toc_open", "toc", 1);
//     token.markup = "[[toc]]";
//     token = state.push("toc_body", "", 0);
//     token = state.push("toc_close", "toc", -1);

//     // Update pos so the parser can continue
//     var newline = state.src.indexOf("\n");
//     if (newline !== -1) {
//       state.pos = state.pos + newline;
//     } else {
//       state.pos = state.pos + state.posMax + 1;
//     }

//     return true;
//   }

  md.renderer.rules.toc_open = function(tokens, index) {
    return "<div class=\"table-of-contents\">";
  };

  md.renderer.rules.toc_close = function(tokens, index) {
    return "</div>";
  };

  md.renderer.rules.toc_body = function(tokens, index) {
    var headings = [];
    var currentLevel = 1;
    var hasHeader = false;
    for (var i = 0, size = gstate.tokens.length; i < size; i++) {
      var token = gstate.tokens[i];
      var heading = gstate.tokens[i - 1];
      var level = token.tag.substr(1, 1);
      if (token.type !== "heading_close" || level  > options.includeLevel || heading.type !== "inline") {
        continue; // Skip if not matching criteria
      }
      hasHeader = true;
      if(level>currentLevel){
           headings.push("<ul>");
      }else if(level<currentLevel){
          headings.push("</ul>");
      }
      headings.push("<li><a href=\"#" + options.slugify(heading.content) + "\">" + heading.content + "</a></li>");
      currentLevel = level;
    }
    if(hasHeader)
        headings.push("</ul>");
    //return "<ul>" + headings.join("") + "</ul>";
    return headings.join("");
  };

  // Catch all the tokens for iteration later
  md.core.ruler.push("grab_state", function(state) {
    gstate = state;
  });

  // Insert TOC
  //md.inline.ruler.after("emphasis", "toc", toc);
  md.block.ruler.after("blockquote", "toc", toc);
};
