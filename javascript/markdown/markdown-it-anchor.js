'use strict';

Object.defineProperty(exports, '__esModule', {
  value: true
});

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { 'default': obj }; }

var _lodashAssign = require('lodash.assign');

var _lodashAssign2 = _interopRequireDefault(_lodashAssign);

var _string = require('string');

var _string2 = _interopRequireDefault(_string);

var _markdownItLibToken = require('markdown-it/lib/token');

var _markdownItLibToken2 = _interopRequireDefault(_markdownItLibToken);

var slugify = function slugify(s) {
  return (0, _string2['default'])(s).slugify().toString();
};

var renderPermalink = function renderPermalink(slug, opts, tokens, idx) {
  return tokens[idx + 1].children.unshift((0, _lodashAssign2['default'])(new _markdownItLibToken2['default']('link_open', 'a', 1), {
    attrs: [['class', opts.permalinkClass], ['href', '#' + slug]] }), (0, _lodashAssign2['default'])(new _markdownItLibToken2['default']('text', '', 0), { content: opts.permalinkSymbol }), new _markdownItLibToken2['default']('link_close', 'a', -1), (0, _lodashAssign2['default'])(new _markdownItLibToken2['default']('text', '', 0), { content: ' ' }));
};

var uniqueSlug = function uniqueSlug(slug, env) {
  // Add slug storage to environment if it doesn't already exist.
  env.slugs = env.slugs || {};

  // Mark this slug as used in the environment.
  env.slugs[slug] = (env.slugs[slug] || 0) + 1;

  // First slug, return as is.
  if (env.slugs[slug] === 1) {
    return slug;
  }

  // Duplicate slug, add a `-2`, `-3`, etc. to keep ID unique.
  return slug + '-' + env.slugs[slug];
};

var anchor = function anchor(md, opts) {
  opts = (0, _lodashAssign2['default'])({}, anchor.defaults, opts);

  var originalHeadingOpen = md.renderer.rules.heading_open;

  md.renderer.rules.heading_open = function () {
    for (var _len = arguments.length, args = Array(_len), _key = 0; _key < _len; _key++) {
      args[_key] = arguments[_key];
    }

    var tokens = args[0];
    var idx = args[1];
    var env = args[3];
    var self = args[4];

    if (tokens[idx].tag.substr(1) >= opts.level) {
      var title = tokens[idx + 1].children.reduce(function (acc, t) {
        return acc + t.content;
      }, '');

      var slug = uniqueSlug(opts.slugify(title), env);(tokens[idx].attrs = tokens[idx].attrs || []).push(['id', slug]);

      if (opts.permalink) {
        opts.renderPermalink.apply(opts, [slug, opts].concat(args));
      }
    }

    if (originalHeadingOpen) {
      return originalHeadingOpen.apply(this, args);
    } else {
      return self.renderToken.apply(self, args);
    }
  };
};

anchor.defaults = {
  level: 1,
  slugify: slugify,
  permalink: false,
  renderPermalink: renderPermalink,
  permalinkClass: 'header-anchor',
  permalinkSymbol: '¶' };

exports['default'] = anchor;
module.exports = exports['default'];
