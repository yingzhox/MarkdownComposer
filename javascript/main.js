// browserify -r ./plugins/markdown-it-footnotes.js:markdown-it-footnote -r ./plugins/markdown-it-content-table.js:markdown-it-table-of-contents -r string -r markdown-it-headinganchor -r markdown-it-highlightjs -r ./plugins/markdown-it-mathjax.js:markdown-it-mathjax > javascript/markdown/plugins.js  

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
        fontSize: "16px"
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
        }).use(require("markdown-it-footnote"))
        // .use(require('markdown-it-anchor'),{
        //     level:1,
        //     slugify: function(str) {
        //         var string = require("string");
        //         return string(str).stripTags().slugify().toString();
        //     }
        // })
        .use(require('markdown-it-headinganchor'), {
            anchorClass: 'head-anchor',
            addHeadingID: false,
            slugify: function(str, md) {
                var string = require("string");
                return string(str).stripTags().slugify().toString();
            }
        })
        .use(require("markdown-it-table-of-contents"), {
            includeLevel: 4,
            slugify: function(str) {
                var string = require("string");
                return string(str).stripTags().slugify().toString();
            }
        })
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
                if (token.meta.isBlock) {
                    rs = "<div id='math-" + id + "' class='math' style='text-align:center;'>" + content + "</div>";
                }
                else {
                    rs = "<span id='math-" + id + "' class='math'>" + content + "</span>";

                }
                return rs;
            },
            renderingoptions: {}
        });
    initializeMD(md);
    mkd['editor_' + i] = md;
}

function renderMath(i) {
    var mathElements = $('#file_' + i + '_view .math');
    //console.log(mathElements);
    mathElements.each(function() {
        var el = $(this);
        var text = el.text();

        try {
            katex.render(text, this);
        }
        catch (err) {
            el.html("<span style='color:red;font-style:italic;'>" + err.message + "</span>");
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
        if (tokens[idx].map && tokens[idx].level === 0) {
            line = tokens[idx].map[0];
            tokens[idx].attrPush(['class', 'source-line']);
            tokens[idx].attrPush(['start', String(line + 1)]);
            tokens[idx].attrPush(['ext', getExt(tokens, idx)]);
            if (tokens[idx].map.length > 1)
                tokens[idx].attrPush(['end', String(tokens[idx].map[1])]);
        }
        return self.renderToken(tokens, idx, options, env, self);
    }

    md.renderer.rules.paragraph_open = md.renderer.rules.heading_open =
        md.renderer.rules.blockquote_open = md.renderer.rules.table_open = md.renderer.rules.list_item_open = md.renderer.rules.bullet_list_open = md.renderer.rules.ordered_list_open = injectLineNumbers;
    //md.renderer.ruler.after('escape', 'math_inline', math_inline);
    injectCodeBlock(md.renderer.rules);
    injectCodeInline(md.renderer.rules);
    injectFences(md.renderer.rules);
    injectTOC(md.renderer.rules);
    injectHTML(md.renderer.rules);
    injectRenderToken(md.renderer);

}

function injectRenderToken(renderer) {
    renderer.renderToken = function(tokens, idx, options) {
        var tok = tokens[idx];
        if (tok.map) {
            tok.attrPush(['class', 'source-line']);
            tok.attrPush(['start', String(tok.map[0] + 1)]);
            tok.attrPush(['ext', getExt(tokens, idx)]);
            if (tok.map.length > 1)
                tok.attrPush(['end', String(tokens[idx].map[1])]);
        }
        var nextToken,
            result = '',
            needLf = false,
            token = tokens[idx];

        // Tight list paragraphs
        if (token.hidden) {
            return '';
        }

        // Insert a newline between hidden paragraph and subsequent opening
        // block-level tag.
        //
        // For example, here we should insert a newline before blockquote:
        //  - a
        //    >
        //
        if (token.block && token.nesting !== -1 && idx && tokens[idx - 1].hidden) {
            result += '\n';
        }

        // Add token name, e.g. `<img`
        result += (token.nesting === -1 ? '</' : '<') + token.tag;

        // Encode attributes, e.g. `<img src="foo"`
        result += renderer.renderAttrs(token);

        // Add a slash for self-closing tags, e.g. `<img src="foo" /`
        if (token.nesting === 0 && options.xhtmlOut) {
            result += ' /';
        }

        // Check if we need to add a newline after this tag
        if (token.block) {
            needLf = true;

            if (token.nesting === 1) {
                if (idx + 1 < tokens.length) {
                    nextToken = tokens[idx + 1];

                    if (nextToken.type === 'inline' || nextToken.hidden) {
                        // Block-level tag containing an inline tag.
                        //
                        needLf = false;

                    }
                    else if (nextToken.nesting === -1 && nextToken.tag === token.tag) {
                        // Opening tag + closing tag of the same type. E.g. `<li></li>`.
                        //
                        needLf = false;
                    }
                }
            }
        }

        result += needLf ? '>\n' : '>';

        return result;
    };
}

function getExt(tokens, idx) {
    var ext = tokens[idx].map[1];
    for (var next = idx + 1; next < tokens.length; next++) {
        if (tokens[next].level == 0 && tokens[next].map) {
            ext = tokens[next].map[0];
            break;
        }
    }
    return ext;
}

function getStartEndAttr(tokens, idx) {
    var token = tokens[idx];
    if (token.map) {
        return " class='source-line' start='" + token.map[0] + "' end='" + token.map[1] + "' ext='" + getExt(tokens, idx) + "'";
    }
    return "";
}

function injectTOC(rules) {
    var oldCB = rules.toc_open;
    rules.toc_open = function(tokens, idx, options, env, self) {
        var rs = oldCB(tokens, idx, options, env, self);
        return rs.replace("<div", "<div" + getStartEndAttr(tokens, idx));
    };
}

function injectHTML(rules) {
    var oldCB = rules.html_block;
    var newFunc = function(tokens, idx, options, env, self) {
        var rs = oldCB(tokens, idx, options, env, self);
        return rs.replace(">", " " + getStartEndAttr(tokens, idx) + ">");
    };
    rules.html_block = newFunc;
}

function injectCodeBlock(rules) {
    var oldCB = rules.code_block;
    rules.code_block = function(tokens, idx, options, env, self) {
        var rs = oldCB(tokens, idx, options, env, self);
        return rs.replace("<pre", "<pre" + getStartEndAttr(tokens, idx));
    };
}

function injectCodeInline(rules) {
    var oldCB = rules.code_inline;
    rules.code_inline = function(tokens, idx, options, env, self) {
        var rs = oldCB(tokens, idx, options, env, self);
        return rs.replace("<code", "<code" + getStartEndAttr(tokens, idx));
    };
}

function injectFences(rules) {
    //modify fences
    var oldCB = rules.fence;
    rules.fence = function(tokens, idx, options, env, self) {
        var rs = oldCB(tokens, idx, options, env, self);
        return rs.replace("<pre", "<pre" + getStartEndAttr(tokens, idx));
    };
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

function bsearchElementByLine(i, line, mustMatch) {
    var els = $("#file_" + i + "_view > .source-line");
    if (els.length > 0) {
        var left = 0,
            mid, right = els.length - 1;
        for (; left <= right;) {
            mid = parseInt((left + right) / 2);
            var start = parseInt(els[mid].getAttribute('start'));
            if (start > line) {
                right = mid - 1;
            }
            else if (start < line) {
                if (mid + 1 > right || els[mid + 1].getAttribute('start') > line) {
                    if (mustMatch) { // for hightlight use
                        if (parseInt(els[mid].getAttribute('end')) >= line) {
                            return els[mid];
                        }
                        else {
                            return null;
                        }
                    }
                    else { //for sync scroll
                        if (parseInt(els[mid].getAttribute('ext')) >= line) {
                            return els[mid];
                        }
                    }
                }
                left = mid + 1;
            }
            else {
                return els[mid];
            }
        }
    }
    return null;
}

function syncScroll(editor, i, direction) {
    editor.renderer.$computeLayerConfig();
    var row = editor.getFirstVisibleRow();
    if (!editor.isRowFullyVisible(row) && direction > 0) { //scroll down
        row++;
    }
    var el = bsearchElementByLine(i, row + 1, false);
    if (el != null) {
        //console.log(el);
        //console.log(elt);
        var elt = $(el);
        var preview = $('#file_' + i + '_view');
        var percentage = 1;
        var full =  elt.attr('ext')-elt.attr('start');
        
        if(full!=0){
            percentage = (row+1-elt.attr('start'))*1.0/full;
        }
        //console.log((row+1)+" full:"+full+" percentage:"+percentage);
        var offset = elt.position().top  + elt.height()*(percentage);
        var dest = preview.scrollTop() + offset ;//+10;
        //console.log("off:"+offset+" top:"+elt.position().top);
        animateScroll(preview[0],preview.scrollTop(),dest,function(){})
    }else{
        //scroll by percent
        
    }

};

var timeoutId;
var currentEndCb;

function animateScroll(elt, startValue, endValue, endCb) {
    if (currentEndCb) {
        clearTimeout(timeoutId);
        currentEndCb();
    }
    currentEndCb = endCb;
    var diff = endValue - startValue;
    var startTime = Date.now();

    function tick() {
        var currentTime = Date.now();
        var progress = (currentTime - startTime) / 200;
        if (progress < 1) {
            var scrollTop = startValue + diff * Math.cos((1 - progress) * Math.PI / 2);
            elt.scrollTop = scrollTop;
            //stepCb(scrollTop);
            timeoutId = setTimeout(tick, 1);
        }
        else {
            currentEndCb = undefined;
            elt.scrollTop = endValue;
            setTimeout(endCb, 100);
        }
    }

    tick();
}

function markSelection(editor, i) {
    var cursor = editor.selection.getCursor();
    //console.log("selec line:"+(cursor.row+1));

    $("#file_" + i + "_view .selected").removeClass("selected");
    var el = bsearchElementByLine(i, cursor.row + 1, true);
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
