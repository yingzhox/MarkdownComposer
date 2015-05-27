"use strict";

jQuery.expr[':'].regex = function (elem, index, match) {
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
var mkrws = {};
$(document).ready(function () {
    $('.ui.dropdown').dropdown({
        on: 'hover'
    });

    $(document).mouseup(function (e) {
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
    editor.on("change", function (e) {
        render(i, e);
    });
    var previousScroll = 0;
    editor.selection.on("changeCursor", function (e) {
        markSelection(editors['editor_' + i], i);
    });
    editor.session.on("changeScrollTop", function (e) {
        //console.log(e);
        var direction = e - previousScroll;
        syncScroll(editors['editor_' + i], i, direction);
        previousScroll = e;
    });
    editors['editor_' + i] = editor;

    var commonmark = window.commonmark;
    var writer = new commonmark.HtmlRenderer({
        sourcepos: true
    });
    var reader = new commonmark.Parser();

    var mkrw = {
        reader: reader,
        writer: writer
    };
    mkrws['editor_' + i] = mkrw;
}

function render(i, e) {
    //change data = e.data;
    var editor = editors['editor_' + i];
    var value = editor.getValue();
    //console.log(value);

    var mk = mkrws['editor_' + i];
    var parsed = mk.reader.parse(value);
    renderHTML(i, mk.writer, parsed);
    markSelection(editors['editor_' + i], i);
    //var converter = new showdown.Converter();
    //var html = converter.makeHtml(value);
    //$("#file_" + i + "_view").html(html);
}


function renderHTML(i, writer, parsed) {
    if (parsed === undefined) {
        return;
    }
    var result = writer.render(parsed);
    console.log(writer);
    $("#file_" + i + "_view").html(result);
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

function syncScroll(editor, i, direction) {
    editor.renderer.$computeLayerConfig();
    var row = editor.getFirstVisibleRow();
    //console.log(row + " fully?:" + editor.isRowFullyVisible(row) + " direction:" + direction);
    if (!editor.isRowFullyVisible(row) && direction > 0) { //scroll down
        row++;
    }
    var expStart = "#file_" + i + "_view :regex(data-sourcepos,^" + (row + 1) + "\:)";
    var expEnd = '#file_' + i + '_view :regex(data-sourcepos,\-' + (row + 1) + '\:\\d+$)';
    //console.log("#file_" + i + "_view [data-sourcepos^='" + (cursor.row + 1) + ":']");
    //console.log(expEnd);
    var elt = $(expEnd).add(expStart).last();
    if (elt.length > 0) {
        //console.log(elt);
        $('#file_' + i + '_view').animate({
            scrollTop: $('#file_' + i + '_view').scrollTop() + elt.position().top - 34
        }, 20);
        //elt.scrollIntoView(true);
        //syncScroll();
    }

};

function markSelection(editor, i) {
    var cursor = editor.selection.getCursor();
    //console.log(cursor);
    var expStart = "#file_" + i + "_view :regex(data-sourcepos,^" + (cursor.row + 1) + "\:)";
    var expEnd = '#file_' + i + '_view :regex(data-sourcepos,\-' + (cursor.row + 1) + '\:\\d+$)';
    //console.log("#file_" + i + "_view [data-sourcepos^='" + (cursor.row + 1) + ":']");
    //console.log(expEnd);
    $("#file_" + i + "_view .selected").removeClass("selected");
    var elt = $(expEnd).add(expStart).last();
    if (elt.length > 0) {
        //console.log(elt);
        elt.addClass("selected");
        //syncScroll();
    }

};

function initializeTab(i) {
    var min = 200;
    var max = 3600;
    var mainmin = 200;
    var id = '#file_' + i + ' .splitdragger';
    $(id).mousedown(function (e) {
        e.preventDefault();
        $(document).mousemove(function (e) {
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
