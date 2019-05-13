# @xgraph/core

### A core graph data structure: multiedged, directed and cyclic

## API

### class:Graph()

Create a new instance of a Graph.

### Graph::setVertex(id: string, type:string, props={})

Set a vertex (create or update) with an `id` and a `type`.

```js
g.setVertex('foo', 'Person', { name: 'Foo Bar', age: 23 });
```

### Graph::vertex(id:string)

Get a vertex by its `id`.

```js
g.vertex('foo').name === 'Foo Bar';
```

### Graph::hasVertex(id:string)

Check if a vertex exists by its `id`.

```js
g.hasVertex('foo') === true;
```

### Graph::removeVertex(id:string)

Remove a vertex by its `id` and all of its edges.
Returns all of the discarded edges.

```js
g.removeVertex('foo');
```

### Graph::setEdge(originVertexId:string, targetVertexId:string, type:string, properties={})

Ensure an edge of type `type` from vertex `origin` to vertex `target`.

```js
g.setEdge('foo', 'bar', 'friendOf');
```

### Graph::edge(originVertexId:string, targetVertexId:string, type:string)

Get the `type` edge from `origin` to `target` if exists, `null` otherwise.

```js
g.edge('foo', 'bar', 'friendOf').type === 'friends';
g.edge('foo', 'bar', 'father') === null;
```

### Graph::hasEdge(originVertexId:string, targetVertexId:string, type:string)

Check if a `type` edge from `origin` to `target` exists.

```js
g.hasEdge('foo', 'bar', 'friendOf') === true;
```

### Graph::removeEdge(originVertexId:string, targetVertexId:string, type:string)

Remove a `type` edge from `origin` to `target`.

```js
g.removeEdge('foo', 'bar', 'friendOf');
```

### Graph::inEdges(targetVertexId:string), Graph::outEdges(originVertexId:string), Graph::interEdges(originVertexId:string, targetVertexId:string), Graph::allEdges(vertexId:string)

Get all edges to `target`, all edges from `origin`, all edges from `origin` to `target`, all edges involving `vertexId` - respectively.

### Graph::vertices()

An `iterator` over all the graph's vertices.

### Graph::vertices(type:string)

An `iterator` over all the graph's vertices of a given `type`.

### Graph::vertices(type:string, searchObject:object)

An `iterator` over all the graph's vertices of a given `type`, filtering using [monjo](https://github.com/oakfang/monjo) syntax, using Indices where possible.

### Graph::vertices(searchObject:object)

An `iterator` over all the graph's vertices, filtering using [monjo](https://github.com/oakfang/monjo) syntax, using Indices where possible.

*Note:* Using the unIndexed monjo version for all vertices will, inevitaly, be slower than simply using `graph.vertices().filter(...)` instead.

*Note:* Using the `type` parameter is syntactic sugar for querying the `Graph.TYPE` auto Index, which means that using it with an Index (and especially a Typed Index) will incur an Index Intersection performance penalty.

### Graph::toObject(), Graph.fromObject(bareObject)

Serialize and de-serialize the graph

## Usage

```js
const Graph = require('@xgraph/core');
const g = new Graph();

g.setVertex('foo', 'Person', { name: 'Foo Bar', age: 23 });
g.setVertex('bar', 'Person', { name: 'Bar Bar', age: 22 });
g.setEdge('foo', 'bar', 'friendOf');
g.outEdges('foo')
  .filter(({ type }) => type === 'friendsOf')
  .map(({ target }) => g.vertex(target).age); // [22]
```

## Advnced Usage - Indexing

Should you wish to, you may add (and remove) Indices for better querying performances.

### Graph::addIndex(prop:string, type?:string)

Create an Index for `prop`, possibly limited to only vertices of type `type`.
_Notice:_ creating an index of property `prop` drops any existing index of that property.

### Graph::dropIndex(prop:string)

Drop any existing Index for property `prop`;

### Graph::hasIndex(prop:string)

Return whether or not an Index for property `prop` exists.

### Benchmarks

```
Benchmarks for 1000000 vertices:
Setup [no initial Index]: 2237.697ms
Setup [with initial index]: 3374.034ms
Querying over all vertices, 50 times [no index, no type annotation, monjo syntax]: 7344.953ms
Querying over all vertices, 50 times [no index, with type annotation, monjo syntax]: 29761.764ms
Querying over all vertices, 50 times [no index, no type annotation, classic filter]: 1428.090ms
Querying over all vertices, 50 times [no index, with type annotation, classic filter]: 19563.437ms
Creating an index for all vertices: 439.150ms
Querying over all vertices, 50 times [with index, no type annotation]: 0.431ms
Querying over all vertices, 50 times [with index, with type annotation]: 0.738ms
```
