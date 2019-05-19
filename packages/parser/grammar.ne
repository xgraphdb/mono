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
%}

@lexer lexer

script -> _ command (_ term _ command):* (term):? _ {% extractScript %}

command -> query
         | createEntity
         | updateFragment
         | deleteEntity

updateFragment -> %update _ ident _ json {% ([,, varName,,{ value }]) => ({
  type: 'update',
  varName,
  payload: value,
}) %}

deleteEntity -> %del _ ident {% ([,, varName]) => ({
  type: 'delete',
  varName,
}) %}

createEntity -> createVertexStatement | createEdgeStatement

createVertexStatement -> %createVertex %space ident _ json (alias):? {%
                            ([,, type,, props, alias]) => ({
                              type: 'create',
                              entityType: 'vertex',
                              payload: {
                                vtype: type,
                                properties: props.value
                              },
                              varName: alias ? alias[0] : null
                            })
                          %}

createEdgeStatement -> %createEdge %space ident _ (json _):? %from_ ident _ %to_ ident (alias):? {%
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
                          %}

alias -> %space %as_ _ ident {% d => d.pop() %}

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

filterer -> "{" _ %stateFilterPrefix number _ "}" {% ([,,, filter]) => ({filter}) %}
             | json {%([{value:filter}]) => ({ filter })%}

subfilter -> vertexIdFilter | vertexTypeFilter

vertexIdFilter -> [#] ident {%
                    ([, value]) => ({
                      vid: value,
                    })
                  %}
                  
vertexTypeFilter -> [:] ident {%
  ([, value]) => ({
    vtype: value,
  })
%}

edgeSubfilter ->  [:] ident {%
                    ([, value]) => ({
                      etype: value,
                    })
                  %}

nodeName -> ([?&]):? ident {%([prefix ,varName]) => {
  const node = { varName };
  if (prefix) {
    const [token] = prefix;
    node[token.value === '?' ? 'delayed' : 'isRef'] = true;
  }
  return node;
}%}

ident -> identifier | jsIdentifier {% id %}

identifier -> %identifier {% ([{value}]) => value %}

jsIdentifier -> %jsIdentifier {% ([{value}]) => value %}

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
        | %sstring {% function(d) { 
            const value = d[0].value.replace(/^'|'$/g, '"');
            return JSON.parse(value)
         } %}

pair -> key _ ":" _ value {% function(d) { return [d[0], d[4]]; } %}

key -> string {% id %}
     | jsIdentifier {% id %}
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