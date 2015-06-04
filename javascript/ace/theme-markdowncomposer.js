define("ace/theme/markdowncomposer", ["require", "exports", "module", "ace/lib/dom"], function (require, exports, module) {

    exports.isDark = false;
    exports.cssClass = "ace-github";
    exports.cssText = "\
.ace_cursor-layer{\
z-index:1;\
}\
.ace-github .ace_gutter {\
z-index: 1;\
background: rgb(245, 247, 250);\
border-right-color: rgb(211, 218, 234);\
border-right-style: solid;\
border-right-width: 1px;\
color: rgb(160, 170, 191);\
}\
.ace-github  {\
background: #fff;\
color: #000;\
}\
.ace-github .ace_heading {\
font-weight: 800;\
color: #D14;\
}\
.ace-github .ace_list {\
font-style: italic;\
}\
.ace-github .ace_url {\
background: rgba(102, 128, 153, 0.15);\
}\
.ace-github .ace_markup.ace_underline {\
background: rgba(102, 128, 153, 0.15);\
}\
.ace-github .ace_keyword {\
font-weight: bold;\
}\
.ace-github .ace_string {\
color: #D14;\
}\
.ace-github .ace_variable.ace_class {\
color: teal;\
}\
.ace-github .ace_constant {\
font-weight: 900;\
}\
.ace-github .ace_constant.ace_numeric {\
color: #099;\
}\
.ace-github .ace_constant.ace_buildin {\
color: #0086B3;\
}\
.ace-github .ace_support.ace_function {\
color: #0086B3;\
}\
.ace-github .ace_comment {\
color: #998;\
font-style: italic;\
}\
.ace-github .ace_variable.ace_language  {\
color: #0086B3;\
}\
.ace-github .ace_paren {\
font-weight: bold;\
}\
.ace-github .ace_boolean {\
font-weight: bold;\
}\
.ace-github .ace_string.ace_regexp {\
color: #009926;\
font-weight: normal;\
}\
.ace-github .ace_variable.ace_instance {\
color: teal;\
}\
.ace-github .ace_constant.ace_language {\
font-weight: bold;\
}\
.ace-github .ace_cursor {\
color: black;\
}\
.ace-github.ace_focus .ace_marker-layer .ace_active-line {\
background: #d6e8ff;\
}\
.ace-github .ace_marker-layer .ace_active-line {\
background: rgb(247, 250, 252);\
}\
.ace-github .ace_marker-layer .ace_selection {\
background: rgb(181, 213, 255);\
}\
.ace-github.ace_multiselect .ace_selection.ace_start {\
box-shadow: 0 0 3px 0px white;\
border-radius: 2px;\
}\
.ace-github.ace_nobold .ace_line > span {\
font-weight: normal !important;\
}\
.ace-github .ace_marker-layer .ace_step {\
background: rgb(252, 255, 0);\
}\
.ace-github .ace_marker-layer .ace_stack {\
background: rgb(164, 229, 101);\
}\
.ace-github .ace_marker-layer .ace_bracket {\
margin: -1px 0 0 -1px;\
border: 1px solid rgb(192, 192, 192);\
}\
.ace-github .ace_gutter-active-line {\
background-color : #E0E5EC;\
}\
.ace-github .ace_marker-layer .ace_selected-word {\
background: rgb(250, 250, 255);\
border: 1px solid rgb(200, 200, 250);\
}\
.ace-github .ace_invisible {\
color: #BFBFBF\
}\
.ace-github .ace_print-margin {\
width: 1px;\
background: #e8e8e8;\
}\
.ace-github .ace_indent-guide {\
background: url(\"data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAACCAYAAACZgbYnAAAAE0lEQVQImWP4////f4bLly//BwAmVgd1/w11/gAAAABJRU5ErkJggg==\") right repeat-y;\
}\
.ace-github .ace_blockquote {\
color:rgb(0,128,0);\
}\
";

    var dom = require("../lib/dom");
    dom.importCssString(exports.cssText, exports.cssClass);
});
