// browserify -r markdown-it-anchor -r markdown-it-footnote -r markdown-it-highlightjs -r ./plugins/markdown-it-mathjax.js:markdown-it-mathjax > javascript/markdown/plugins.js  
"use strict";

jQuery.expr[':'].regex = function(elem, index, match) {
    var matchParams = match[3].split(','),
        validLabels = /^(data|css):/,
        attr = {
            method: matchParams[0].match(validLabels) ?
                matchParams[0].split(':')[0] : 'attr',
            property: matchParams.shift().replace(validLabels, '')
        },
        regexFlags = 'ig',
        regex = new RegExp(matchParams.join('').replace(/^s+|s+$/g, ''), regexFlags);
    return regex.test(jQuery(elem)[attr.method](attr.property));
};
 

var editors = {};
var mkd = {};
$(document).ready(function() {
    $('.ui.dropdown').dropdown({
        on: 'hover'
    });

    $(document).mouseup(function(e) {
        $(document).unbind('mousemove');
    });

    $('.menu .item').tab();
    initializeTab(0);
    initializeEditor(0);
});

function initializeEditor(i) {
    var id = "file_" + i + "_source";
    var editor = ace.edit(id);
    editor.setTheme("ace/theme/markdowncomposer");
    editor.getSession().setMode("ace/mode/markdown");
    editor.setOptions({
        fontFamily: "Menlo, 'Ubuntu Mono', Consolas, 'Courier New', 'Microsoft Yahei', 'Hiragino Sans GB', 'WenQuanYi Micro Hei', sans-serif",
        fontSize: "14px"
    });
    editor.session.setUseWrapMode(true);
    editor.container.style.lineHeight = "1.6";
    editor.on("change", function(e) {
        render(i, e);
    });
    var previousScroll = 0;
    editor.selection.on("changeCursor", function(e) {
        markSelection(editors['editor_' + i], i);
    });
    editor.session.on("changeScrollTop", function(e) {
        //console.log(e);
        var direction = e - previousScroll;
        syncScroll(editors['editor_' + i], i, direction);
        previousScroll = e;
    });
    editors['editor_' + i] = editor;

    var md = window.markdownit({
            html: true,
            linkify: true,
            typographer: true
                //}).use(require('markdown-it-anchor'),{level:1});
        }).use(require("markdown-it-footnote"))
        .use(require("markdown-it-highlightjs"))
        .use(require("markdown-it-mathjax"), {
            inlineOpen: '$',
            inlineClose: '$',
            blockOpen: '$$',
            blockClose: '$$',
            inlineRenderer: function(token) {
                //console.log(token);
                var content = token.content;
                var id = new Date().getTime();
                var rs;
                if(token.meta.isBlock){
                    rs = "<div id='math-" + id + "' class='math' style='text-align:center;'>" + content + "</div>";
                }else{
                    rs = "<span id='math-" + id + "' class='math'>" + content + "</span>";
                    
                }
                return rs;
            },
            renderingoptions: {}
        });
    initializeMD(md);
    mkd['editor_' + i] = md;
}

function renderMath(i){
    var mathElements = $('#file_'+i+'_view .math');
    //console.log(mathElements);
    mathElements.each(function(){
        var el = $(this);
        var text = el.text();
            
        try {
           katex.render(text, this);
        }
        catch(err) {
            el.html("<span style='color:red;font-style:italic;'>"+err.message+"</span>");
        }
        // var el = $(this);
        // var jax;
        // var target= document.getElementById(el.attr('id'));
        // console.log(target);
        // MathJax.Hub.Queue(
        //   //["Typeset",MathJax.Hub,target],
        //   function (){
        //       MathJax.Hub.Typeset(target);
        //   },
        //   function () {
        //       jax = MathJax.Hub.getAllJax(el.attr('id'))[0];
        //   },
        //   ["Text",jax,el.text()]
        // );
        //console.log($(this).text());
        //MathJax.Hub.queue.Push(function(){},["Text",math,$(this).text()],function(){});
    });
}

// function renderMath(id,text) {
//     var math = MathJax.Hub.getAllJax(id)[0];
//         MathJax.Hub.Queue(["Text",math,tet]);
// }

function initializeMD(md) {
    //
    // Inject line numbers for sync scroll. Notes:
    //
    // - We track only headings and paragraphs on first level. That's enough.
    // - Footnotes content causes jumps. Level limit filter it automatically.
    function injectLineNumbers(tokens, idx, options, env, self) {
        var line;
        if (tokens[idx].map /*&& tokens[idx].level === 0*/ ) {
            line = tokens[idx].map[0];
            tokens[idx].attrPush(['class', 'source-line']);
            tokens[idx].attrPush(['start', String(line + 1)]);
            if(tokens[idx].map.length > 1)
                tokens[idx].attrPush(['end', String(tokens[idx].map[1])]);
        }
        return self.renderToken(tokens, idx, options, env, self);
    }

    md.renderer.rules.paragraph_open = md.renderer.rules.heading_open = md.renderer.rules.list_item_open = injectLineNumbers;
}

function render(i, e) {
    //change data = e.data;
    var editor = editors['editor_' + i];
    var value = editor.getValue();
    //console.log(value);

    var md = mkd['editor_' + i];
    var parsed = md.render(value);
    renderHTML(i, parsed);
    renderMath(i);
    markSelection(editors['editor_' + i], i);
    //var converter = new showdown.Converter();
    //var html = converter.makeHtml(value);
    //$("#file_" + i + "_view").html(html);
}


function renderHTML(i, parsed) {
    if (parsed === undefined) {
        return;
    }
    $("#file_" + i + "_view").html(parsed);
    // $("#html").text(result);
    // $("#ast").text(xmlwriter.render(parsed));
    // $("#rendertime").text(renderTime);
};

function onResize(editor) {
    var session = editor.session;
    editor.resize();
    if (session.getUseWrapMode()) {
        var characterWidth = editor.renderer.characterWidth;
        var contentWidth = editor.renderer.scroller.clientWidth;
        if (contentWidth > 0) {
            session.setWrapLimit(parseInt(contentWidth / characterWidth, 10));
        }
    }
}
function bsearchElementByLine(i,line,mustMatch){
    var els = $("#file_" + i + "_view .source-line");
    if(els.length>0){
        var left=0,mid,right=els.length-1;
        for(;left<=right;){
            mid=parseInt((left+right)/2);
            var start = parseInt(els[mid].getAttribute('start'));
            if(start>line){
                right=mid-1;
            }else if(start<line){
                if(mid+1>right || els[mid+1].getAttribute('start') > line){
                    if(mustMatch){ // for hightlight use
                        if(parseInt(els[mid].getAttribute('end'))>=line){
                            return els[mid];
                        }else{
                            return null;
                        }
                    }else{ //for sync scroll
                        return els[mid];
                    }
                }
                left=mid+1;
            }else{
                return els[mid];
            }
        }
    }
    return null;
}
function syncScroll(editor, i, direction) {
    editor.renderer.$computeLayerConfig();
    var row = editor.getFirstVisibleRow();
    //console.log(row + " fully?:" + editor.isRowFullyVisible(row) + " direction:" + direction);
    if (!editor.isRowFullyVisible(row) && direction > 0) { //scroll down
        row++;
    }
    //console.log("searchline:"+(row+1))
    var el = bsearchElementByLine(i,row+1,false);
    //var expStart = "#file_" + i + "_view :regex(data-sourcepos,^" + (row + 1) + "\:)";
    //var expEnd = '#file_' + i + '_view :regex(data-sourcepos,\-' + (row + 1) + '\:\\d+$)';
    //console.log("#file_" + i + "_view [data-sourcepos^='" + (cursor.row + 1) + ":']");
    //console.log(expEnd);
    //var elt = $(expEnd).add(expStart).last();
    if (el!=null) {
        //console.log(el);
        //console.log(elt);
        var elt = $(el);
        $('#file_' + i + '_view').clearQueue();
        $('#file_' + i + '_view').stop();
        $('#file_' + i + '_view').animate({
            scrollTop: $('#file_' + i + '_view').scrollTop() + elt.position().top - 34
        }, 40);
        //elt.scrollIntoView(true);
        //syncScroll();
    }

};

function markSelection(editor, i) {
    var cursor = editor.selection.getCursor();
    //console.log("selec line:"+(cursor.row+1));
    
    $("#file_" + i + "_view .selected").removeClass("selected");
    var el = bsearchElementByLine(i,cursor.row + 1,true);
    //console.log(el);    
    if (el != null) {
        //console.log(elt);
        var elt = $(el);
        elt.addClass("selected");
        //syncScroll();
    }

};

function initializeTab(i) {
    var min = 200;
    var max = 3600;
    var mainmin = 200;
    var id = '#file_' + i + ' .splitdragger';
    $(id).mousedown(function(e) {
        e.preventDefault();
        $(document).mousemove(function(e) {
            e.preventDefault();
            var source = $(id).prev();
            var render = $(id).next();
            var x = e.pageX - source.offset().left;
            if (x > min && x < max && e.pageX < ($(window).width() - mainmin)) {
                var widthchange = source.width() - x;
                source.css("width", x);
                onResize(editors['editor_' + i]);
            }
        })
    });
}
