@{%
const moo = require("moo");

const lexer = moo.compile({
    space: {match: /\s+/, lineBreaks: true},
    number: /-?(?:[0-9]|[1-9][0-9]+)(?:\.[0-9]+)?(?:[eE][-+]?[0-9]+)?\b/,
    dstring: /"(?:\\["bfnrt\/\\]|\\u[a-fA-F0-9]{4}|[^"\\])*"/,
    sstring: /'(?:\\["bfnrt\/\\]|\\u[a-fA-F0-9]{4}|[^"\\])*'/,
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
    identifier: /[a-zA-Z]\w*/,
    vertexOp: /[#:]/,
    edgeOp: /[:]/,
    vertexNamePrefix: /[?&]/,
    stateFilterPrefix: /\$\$[0-9]+/,
});
%}

@lexer lexer

script -> _ command (_ term _ command):* (term):? _ {% extractScript %}

command -> query

query -> vertex (_ edge (_ vertex):?):* {% extractQuery %}

edge -> ltrEdge | rtlEdge

rtlEdge -> "<" "-" "-" {%() => ({ type: 'edge', out: false })%}
         | "<" "-" "[" _ nodeName _ "]" "-" {%(d) => ({
            type: 'edge',
            out: false,
            ...extractProps(d.slice(4), 2),
          })%}
         | "<" "-" "[" _ (nodeName):? (edgeSubfilter) _ "]" "-" {%(d) => ({
            type: 'edge',
            out: false,
            ...extractProps(d.slice(4), 2),
          })%}
         | "<" "-" "[" _ (nodeName):? (edgeSubfilter):? _ filterer _ "]" "-" {%(d) => ({
            type: 'edge',
            out: false,
            ...extractProps(d.slice(4), 2),
          })%}

ltrEdge -> "-" "-" ">" {%() => ({ type: 'edge', out: true })%}
         | "-" "[" _ nodeName _ "]" "-" ">" {%(d) => ({
            type: 'edge',
            out: true,
            ...extractProps(d.slice(3), 3),
          })%}
         | "-" "[" _ (nodeName):? (edgeSubfilter) _ "]" "-" ">" {%(d) => ({
            type: 'edge',
            out: true,
            ...extractProps(d.slice(3), 3),
          })%}
         | "-" "[" _ (nodeName):? (edgeSubfilter):? _ filterer _ "]" "-" ">" {%(d) => ({
            type: 'edge',
            out: true,
            ...extractProps(d.slice(3), 3),
          })%}

vertex -> "(" _ ")" {%() => ({ type: 'vertex' })%}
        | "(" _ (nodeName) _ ")" {%(d) => ({
          type: 'vertex',
          ...extractProps(d.slice(2)),
        })%}
        | "(" _ (nodeName):? (subfilter) _ ")" {%(d) => ({
          type: 'vertex',
          ...extractProps(d.slice(2)),
        })%}
        | "(" _ (nodeName):? (subfilter):? _ filterer _ ")" {%(d) => ({
          type: 'vertex',
          ...extractProps(d.slice(2)),
        })%}

filterer -> "{" _ %stateFilterPrefix identifier _ "}" {% ([,,, filter]) => ({filter}) %}
             | json {%([{value:filter}]) => ({ filter })%}

subfilter -> [#:] identifier {%
  ([prefix, value]) => prefix.value === ':' ? {
    vtype: value,
  } : {
    vid: value,
  }
%}

edgeSubfilter -> [:] identifier {%
  ([prefix, value]) => ({
    etype: value,
  })
%}

nodeName -> ([?&]):? identifier {%([prefix ,varName]) => {
  const node = { varName };
  if (prefix) {
    const [token] = prefix;
    node[token.value === '?' ? 'delayed' : 'isRef'] = true;
  }
  return node;
}%}

identifier -> %identifier {% ([{value}]) => value %}

json -> _ (object) _ {% function(d) { return { type: 'object', value: d[1][0] }; } %}

object -> "{" _ "}" {% function(d) { return {}; } %}
    | "{" _ pair (_ "," _ pair):* _ "}" {% extractObject %}

array -> "[" _ "]" {% function(d) { return []; } %}
    | "[" _ value (_ "," _ value):* _ "]" {% extractArray %}

value ->
      object {% id %}
    | array {% id %}
    | number {% id %}
    | string {% id %}
    | "true" {% function(d) { return true; } %}
    | "false" {% function(d) { return false; } %}
    | "null" {% function(d) { return null; } %}

number -> %number {% function(d) { return parseFloat(d[0].value) } %}

string -> %dstring {% function(d) { return JSON.parse(d[0].value) } %}
        | %sstring {% function(d) { return JSON.parse(d[0].value.replace(/^'|'$/, '"')) } %}

pair -> key _ ":" _ value {% function(d) { return [d[0], d[4]]; } %}

key -> string {% id %}
     | identifier {% id %}

_ -> null | %space {% function(d) { return null; } %}

term -> ";" {% () => null %}

@{%
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

%}