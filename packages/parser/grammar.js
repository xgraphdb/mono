// Generated automatically by nearley, version 2.16.0
// http://github.com/Hardmath123/nearley
(function () {
function id(x) { return x[0]; }

const moo = require("moo");

const lexer = moo.compile({
    space: {match: /(?:\s|\/\/(?:.*)?\n)+/, lineBreaks: true},
    number: /-?(?:[0-9]|[1-9][0-9]+)(?:\.[0-9]+)?(?:[eE][-+]?[0-9]+)?\b/,
    dstring: /"(?:\\["bfnrt\/\\]|\\u[a-fA-F0-9]{4}|[^"\\])*"/,
    sstring: /'(?:\\["bfnrt\/\\]|\\u[a-fA-F0-9]{4}|[^'\\])*'/,
    '{': '{',
    '}': '}',
    '[': '[',
    ']': ']',
    '(': '(',
    ')': ')',
    ',': ',',
    ':': ':',
    ';': ';',
    '-': '-',
    '>': '>',
    '<': '<',
    true: 'true',
    false: 'false',
    null: 'null',
    mutate: /(?:RETURN)|(?:return)/,
    createVertex: /(?:CREATE\s+VERTEX)|(?:create\s+vertex)/,
    createEdge: /(?:CREATE\s+EDGE)|(?:create\s+edge)/,
    update: /(?:(?:UPDATE)|(?:update))\s/,
    del: /(?:(?:DELETE)|(?:delete))\s/,
    as_: /(?:(?:AS)|(?:as))\s/,
    from_: /(?:(?:FROM)|(?:from))\s/,
    to_: /(?:(?:TO)|(?:to))\s/,
    stateFilterPrefix: /\$\$[0-9]+f/,
    jsIdentifier: /[a-zA-Z_$0-9]+(?:-+[a-zA-Z_$0-9]+)*/,
    identifier: /[a-zA-Z]\w*/,
    vertexOp: /[#]/,
    edgeOp: /[:]/,
    vertexNamePrefix: /[?&]/,
});


const { flow, filter, compact, flattenDeep: flatten, map } = require('lodash/fp');

function extractScript(d) {
  return flow(flatten, compact)(d);
}

function extractQuery(d) {
  return { type: 'query', value: flow(flatten, compact)(d) };
}

function extractProps(d, pops=1) {
  const frags = flow(flatten, compact)(d);
  for (let i=0; i < pops; i++) {
    frags.pop();
  }
  return frags.reduce((past, current) => Object.assign(past, current), {});
}

function extractPair(kv, output) {
    if(kv[0]) { output[kv[0]] = kv[1]; }
}

function extractObject(d) {
    let output = {};

    extractPair(d[2], output);

    for (let i in d[3]) {
        extractPair(d[3][i][3], output);
    }

    return output;
}

function extractArray(d) {
    let output = [d[2]];

    for (let i in d[3]) {
        output.push(d[3][i][3]);
    }

    return output;
}

var grammar = {
    Lexer: lexer,
    ParserRules: [
    {"name": "script$ebnf$1", "symbols": []},
    {"name": "script$ebnf$1$subexpression$1", "symbols": ["_", "term", "_", "command"]},
    {"name": "script$ebnf$1", "symbols": ["script$ebnf$1", "script$ebnf$1$subexpression$1"], "postprocess": function arrpush(d) {return d[0].concat([d[1]]);}},
    {"name": "script$ebnf$2$subexpression$1", "symbols": ["term"]},
    {"name": "script$ebnf$2", "symbols": ["script$ebnf$2$subexpression$1"], "postprocess": id},
    {"name": "script$ebnf$2", "symbols": [], "postprocess": function(d) {return null;}},
    {"name": "script", "symbols": ["_", "command", "script$ebnf$1", "script$ebnf$2", "_"], "postprocess": extractScript},
    {"name": "command", "symbols": ["query"]},
    {"name": "command", "symbols": ["createEntity"]},
    {"name": "command", "symbols": ["updateFragment"]},
    {"name": "command", "symbols": ["deleteEntity"]},
    {"name": "command", "symbols": ["mutateQuery"]},
    {"name": "mutateQuery", "symbols": [(lexer.has("mutate") ? {type: "mutate"} : mutate)], "postprocess":  () => ({
          type: 'return',
        }) },
    {"name": "updateFragment", "symbols": [(lexer.has("update") ? {type: "update"} : update), "_", "ident", "_", "json"], "postprocess":  ([,, varName,,{ value }]) => ({
          type: 'update',
          varName,
          payload: value,
        }) },
    {"name": "deleteEntity", "symbols": [(lexer.has("del") ? {type: "del"} : del), "_", "ident"], "postprocess":  ([,, varName]) => ({
          type: 'delete',
          varName,
        }) },
    {"name": "createEntity", "symbols": ["createVertexStatement"]},
    {"name": "createEntity", "symbols": ["createEdgeStatement"]},
    {"name": "createVertexStatement$ebnf$1$subexpression$1", "symbols": ["alias"]},
    {"name": "createVertexStatement$ebnf$1", "symbols": ["createVertexStatement$ebnf$1$subexpression$1"], "postprocess": id},
    {"name": "createVertexStatement$ebnf$1", "symbols": [], "postprocess": function(d) {return null;}},
    {"name": "createVertexStatement", "symbols": [(lexer.has("createVertex") ? {type: "createVertex"} : createVertex), "ws", "ident", "_", "json", "createVertexStatement$ebnf$1"], "postprocess": 
        ([,, type,, props, alias]) => ({
          type: 'create',
          entityType: 'vertex',
          payload: {
            vtype: type,
            properties: props.value
          },
          varName: alias ? alias[0] : null
        })
                                  },
    {"name": "createEdgeStatement$ebnf$1$subexpression$1", "symbols": ["json", "_"]},
    {"name": "createEdgeStatement$ebnf$1", "symbols": ["createEdgeStatement$ebnf$1$subexpression$1"], "postprocess": id},
    {"name": "createEdgeStatement$ebnf$1", "symbols": [], "postprocess": function(d) {return null;}},
    {"name": "createEdgeStatement$ebnf$2$subexpression$1", "symbols": ["alias"]},
    {"name": "createEdgeStatement$ebnf$2", "symbols": ["createEdgeStatement$ebnf$2$subexpression$1"], "postprocess": id},
    {"name": "createEdgeStatement$ebnf$2", "symbols": [], "postprocess": function(d) {return null;}},
    {"name": "createEdgeStatement", "symbols": [(lexer.has("createEdge") ? {type: "createEdge"} : createEdge), "ws", "ident", "_", "createEdgeStatement$ebnf$1", (lexer.has("from_") ? {type: "from_"} : from_), "ident", "_", (lexer.has("to_") ? {type: "to_"} : to_), "ident", "createEdgeStatement$ebnf$2"], "postprocess": 
        ([,,etype,,props,,from_,,,to_, alias]) => {
          props = props && props[0].value;
          alias = alias && alias[0];
          return {
            type: 'create',
            entityType: 'edge',
            payload: {
              etype,
              properties: props,
              sourceVar: from_,
              targetVar: to_,
            },
            varName: alias
          }
        }
                                  },
    {"name": "alias", "symbols": ["ws", (lexer.has("as_") ? {type: "as_"} : as_), "_", "ident"], "postprocess": d => d.pop()},
    {"name": "query$ebnf$1", "symbols": []},
    {"name": "query$ebnf$1$subexpression$1$ebnf$1$subexpression$1", "symbols": ["_", "vertex"]},
    {"name": "query$ebnf$1$subexpression$1$ebnf$1", "symbols": ["query$ebnf$1$subexpression$1$ebnf$1$subexpression$1"], "postprocess": id},
    {"name": "query$ebnf$1$subexpression$1$ebnf$1", "symbols": [], "postprocess": function(d) {return null;}},
    {"name": "query$ebnf$1$subexpression$1", "symbols": ["_", "edge", "query$ebnf$1$subexpression$1$ebnf$1"]},
    {"name": "query$ebnf$1", "symbols": ["query$ebnf$1", "query$ebnf$1$subexpression$1"], "postprocess": function arrpush(d) {return d[0].concat([d[1]]);}},
    {"name": "query", "symbols": ["vertex", "query$ebnf$1"], "postprocess": extractQuery},
    {"name": "edge", "symbols": ["ltrEdge"]},
    {"name": "edge", "symbols": ["rtlEdge"]},
    {"name": "rtlEdge", "symbols": [{"literal":"<"}, {"literal":"-"}, {"literal":"-"}], "postprocess": () => ({ type: 'edge', out: false })},
    {"name": "rtlEdge", "symbols": [{"literal":"<"}, {"literal":"-"}, {"literal":"["}, "_", "nodeName", "_", {"literal":"]"}, {"literal":"-"}], "postprocess": (d) => ({
          type: 'edge',
          out: false,
          ...extractProps(d.slice(4), 2),
        })},
    {"name": "rtlEdge$ebnf$1$subexpression$1", "symbols": ["nodeName"]},
    {"name": "rtlEdge$ebnf$1", "symbols": ["rtlEdge$ebnf$1$subexpression$1"], "postprocess": id},
    {"name": "rtlEdge$ebnf$1", "symbols": [], "postprocess": function(d) {return null;}},
    {"name": "rtlEdge$subexpression$1", "symbols": ["edgeSubfilter"]},
    {"name": "rtlEdge", "symbols": [{"literal":"<"}, {"literal":"-"}, {"literal":"["}, "_", "rtlEdge$ebnf$1", "rtlEdge$subexpression$1", "_", {"literal":"]"}, {"literal":"-"}], "postprocess": (d) => ({
          type: 'edge',
          out: false,
          ...extractProps(d.slice(4), 2),
        })},
    {"name": "rtlEdge$ebnf$2$subexpression$1", "symbols": ["nodeName"]},
    {"name": "rtlEdge$ebnf$2", "symbols": ["rtlEdge$ebnf$2$subexpression$1"], "postprocess": id},
    {"name": "rtlEdge$ebnf$2", "symbols": [], "postprocess": function(d) {return null;}},
    {"name": "rtlEdge$ebnf$3$subexpression$1", "symbols": ["edgeSubfilter"]},
    {"name": "rtlEdge$ebnf$3", "symbols": ["rtlEdge$ebnf$3$subexpression$1"], "postprocess": id},
    {"name": "rtlEdge$ebnf$3", "symbols": [], "postprocess": function(d) {return null;}},
    {"name": "rtlEdge", "symbols": [{"literal":"<"}, {"literal":"-"}, {"literal":"["}, "_", "rtlEdge$ebnf$2", "rtlEdge$ebnf$3", "_", "filterer", "_", {"literal":"]"}, {"literal":"-"}], "postprocess": (d) => ({
          type: 'edge',
          out: false,
          ...extractProps(d.slice(4), 2),
        })},
    {"name": "ltrEdge", "symbols": [{"literal":"-"}, {"literal":"-"}, {"literal":">"}], "postprocess": () => ({ type: 'edge', out: true })},
    {"name": "ltrEdge", "symbols": [{"literal":"-"}, {"literal":"["}, "_", "nodeName", "_", {"literal":"]"}, {"literal":"-"}, {"literal":">"}], "postprocess": (d) => ({
          type: 'edge',
          out: true,
          ...extractProps(d.slice(3), 3),
        })},
    {"name": "ltrEdge$ebnf$1$subexpression$1", "symbols": ["nodeName"]},
    {"name": "ltrEdge$ebnf$1", "symbols": ["ltrEdge$ebnf$1$subexpression$1"], "postprocess": id},
    {"name": "ltrEdge$ebnf$1", "symbols": [], "postprocess": function(d) {return null;}},
    {"name": "ltrEdge$subexpression$1", "symbols": ["edgeSubfilter"]},
    {"name": "ltrEdge", "symbols": [{"literal":"-"}, {"literal":"["}, "_", "ltrEdge$ebnf$1", "ltrEdge$subexpression$1", "_", {"literal":"]"}, {"literal":"-"}, {"literal":">"}], "postprocess": (d) => ({
          type: 'edge',
          out: true,
          ...extractProps(d.slice(3), 3),
        })},
    {"name": "ltrEdge$ebnf$2$subexpression$1", "symbols": ["nodeName"]},
    {"name": "ltrEdge$ebnf$2", "symbols": ["ltrEdge$ebnf$2$subexpression$1"], "postprocess": id},
    {"name": "ltrEdge$ebnf$2", "symbols": [], "postprocess": function(d) {return null;}},
    {"name": "ltrEdge$ebnf$3$subexpression$1", "symbols": ["edgeSubfilter"]},
    {"name": "ltrEdge$ebnf$3", "symbols": ["ltrEdge$ebnf$3$subexpression$1"], "postprocess": id},
    {"name": "ltrEdge$ebnf$3", "symbols": [], "postprocess": function(d) {return null;}},
    {"name": "ltrEdge", "symbols": [{"literal":"-"}, {"literal":"["}, "_", "ltrEdge$ebnf$2", "ltrEdge$ebnf$3", "_", "filterer", "_", {"literal":"]"}, {"literal":"-"}, {"literal":">"}], "postprocess": (d) => ({
          type: 'edge',
          out: true,
          ...extractProps(d.slice(3), 3),
        })},
    {"name": "vertex", "symbols": [{"literal":"("}, "_", {"literal":")"}], "postprocess": () => ({ type: 'vertex' })},
    {"name": "vertex$subexpression$1", "symbols": ["nodeName"]},
    {"name": "vertex", "symbols": [{"literal":"("}, "_", "vertex$subexpression$1", "_", {"literal":")"}], "postprocess": (d) => ({
          type: 'vertex',
          ...extractProps(d.slice(2)),
        })},
    {"name": "vertex$ebnf$1$subexpression$1", "symbols": ["nodeName"]},
    {"name": "vertex$ebnf$1", "symbols": ["vertex$ebnf$1$subexpression$1"], "postprocess": id},
    {"name": "vertex$ebnf$1", "symbols": [], "postprocess": function(d) {return null;}},
    {"name": "vertex$subexpression$2", "symbols": ["subfilter"]},
    {"name": "vertex", "symbols": [{"literal":"("}, "_", "vertex$ebnf$1", "vertex$subexpression$2", "_", {"literal":")"}], "postprocess": (d) => ({
          type: 'vertex',
          ...extractProps(d.slice(2)),
        })},
    {"name": "vertex$ebnf$2$subexpression$1", "symbols": ["nodeName"]},
    {"name": "vertex$ebnf$2", "symbols": ["vertex$ebnf$2$subexpression$1"], "postprocess": id},
    {"name": "vertex$ebnf$2", "symbols": [], "postprocess": function(d) {return null;}},
    {"name": "vertex$ebnf$3$subexpression$1", "symbols": ["subfilter"]},
    {"name": "vertex$ebnf$3", "symbols": ["vertex$ebnf$3$subexpression$1"], "postprocess": id},
    {"name": "vertex$ebnf$3", "symbols": [], "postprocess": function(d) {return null;}},
    {"name": "vertex", "symbols": [{"literal":"("}, "_", "vertex$ebnf$2", "vertex$ebnf$3", "_", "filterer", "_", {"literal":")"}], "postprocess": (d) => ({
          type: 'vertex',
          ...extractProps(d.slice(2)),
        })},
    {"name": "filterer", "symbols": [{"literal":"{"}, "_", (lexer.has("stateFilterPrefix") ? {type: "stateFilterPrefix"} : stateFilterPrefix), "number", "_", {"literal":"}"}], "postprocess": ([,,, filter]) => ({filter})},
    {"name": "filterer", "symbols": ["json"], "postprocess": ([{value:filter}]) => ({ filter })},
    {"name": "subfilter", "symbols": ["vertexIdFilter"]},
    {"name": "subfilter", "symbols": ["vertexTypeFilter"]},
    {"name": "vertexIdFilter", "symbols": [/[#]/, "ident"], "postprocess": 
        ([, value]) => ({
          vid: value,
        })
                          },
    {"name": "vertexTypeFilter", "symbols": [/[:]/, "ident"], "postprocess": 
        ([, value]) => ({
          vtype: value,
        })
        },
    {"name": "edgeSubfilter", "symbols": [/[:]/, "ident"], "postprocess": 
        ([, value]) => ({
          etype: value,
        })
                          },
    {"name": "nodeName$ebnf$1$subexpression$1", "symbols": [/[?&]/]},
    {"name": "nodeName$ebnf$1", "symbols": ["nodeName$ebnf$1$subexpression$1"], "postprocess": id},
    {"name": "nodeName$ebnf$1", "symbols": [], "postprocess": function(d) {return null;}},
    {"name": "nodeName", "symbols": ["nodeName$ebnf$1", "ident"], "postprocess": ([prefix ,varName]) => {
          const node = { varName };
          if (prefix) {
            const [token] = prefix;
            node[token.value === '?' ? 'delayed' : 'isRef'] = true;
          }
          return node;
        }},
    {"name": "ident", "symbols": ["identifier"]},
    {"name": "ident", "symbols": ["jsIdentifier"], "postprocess": id},
    {"name": "identifier", "symbols": [(lexer.has("identifier") ? {type: "identifier"} : identifier)], "postprocess": ([{value}]) => value},
    {"name": "jsIdentifier", "symbols": [(lexer.has("jsIdentifier") ? {type: "jsIdentifier"} : jsIdentifier)], "postprocess": ([{value}]) => value},
    {"name": "json$subexpression$1", "symbols": ["object"]},
    {"name": "json", "symbols": ["_", "json$subexpression$1", "_"], "postprocess": function(d) { return { type: 'object', value: d[1][0] }; }},
    {"name": "object", "symbols": [{"literal":"{"}, "_", {"literal":"}"}], "postprocess": function(d) { return {}; }},
    {"name": "object$ebnf$1", "symbols": []},
    {"name": "object$ebnf$1$subexpression$1", "symbols": ["_", {"literal":","}, "_", "pair"]},
    {"name": "object$ebnf$1", "symbols": ["object$ebnf$1", "object$ebnf$1$subexpression$1"], "postprocess": function arrpush(d) {return d[0].concat([d[1]]);}},
    {"name": "object", "symbols": [{"literal":"{"}, "_", "pair", "object$ebnf$1", "_", {"literal":"}"}], "postprocess": extractObject},
    {"name": "array", "symbols": [{"literal":"["}, "_", {"literal":"]"}], "postprocess": function(d) { return []; }},
    {"name": "array$ebnf$1", "symbols": []},
    {"name": "array$ebnf$1$subexpression$1", "symbols": ["_", {"literal":","}, "_", "value"]},
    {"name": "array$ebnf$1", "symbols": ["array$ebnf$1", "array$ebnf$1$subexpression$1"], "postprocess": function arrpush(d) {return d[0].concat([d[1]]);}},
    {"name": "array", "symbols": [{"literal":"["}, "_", "value", "array$ebnf$1", "_", {"literal":"]"}], "postprocess": extractArray},
    {"name": "value", "symbols": ["object"], "postprocess": id},
    {"name": "value", "symbols": ["array"], "postprocess": id},
    {"name": "value", "symbols": ["number"], "postprocess": id},
    {"name": "value", "symbols": ["string"], "postprocess": id},
    {"name": "value", "symbols": [{"literal":"true"}], "postprocess": function(d) { return true; }},
    {"name": "value", "symbols": [{"literal":"false"}], "postprocess": function(d) { return false; }},
    {"name": "value", "symbols": [{"literal":"null"}], "postprocess": function(d) { return null; }},
    {"name": "number", "symbols": [(lexer.has("number") ? {type: "number"} : number)], "postprocess": function(d) { return parseFloat(d[0].value) }},
    {"name": "string", "symbols": [(lexer.has("dstring") ? {type: "dstring"} : dstring)], "postprocess": function(d) { return JSON.parse(d[0].value) }},
    {"name": "string", "symbols": [(lexer.has("sstring") ? {type: "sstring"} : sstring)], "postprocess":  function(d) { 
           const value = d[0].value.replace(/^'|'$/g, '"');
           return JSON.parse(value)
        } },
    {"name": "pair", "symbols": ["key", "_", {"literal":":"}, "_", "value"], "postprocess":  function(d) {
          return [d[0], d[4]];
        } },
    {"name": "key", "symbols": ["string"], "postprocess": id},
    {"name": "key", "symbols": ["jsIdentifier"], "postprocess": id},
    {"name": "key", "symbols": ["identifier"], "postprocess": id},
    {"name": "_", "symbols": []},
    {"name": "_", "symbols": ["ws"], "postprocess": id},
    {"name": "ws", "symbols": [(lexer.has("space") ? {type: "space"} : space)], "postprocess": () => null},
    {"name": "term", "symbols": [{"literal":";"}], "postprocess": () => null}
]
  , ParserStart: "script"
}
if (typeof module !== 'undefined'&& typeof module.exports !== 'undefined') {
   module.exports = grammar;
} else {
   window.grammar = grammar;
}
})();
