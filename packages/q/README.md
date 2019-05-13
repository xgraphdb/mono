# graph-q

A query language over the @xgraph/core graph.

## Usage

```js
const q = require('graph-q');
const graph = require('./graph');

// get all User typed vertices from the graph
const { users } = q(graph)`(users:User)`;
// embedding raw values
const { users } = q(graph)`(users:${q.raw('User')})`;
// get all vertices who have incoming edges from vertex id foo
const { results } = q(graph)`(#foo)-->(results)`;
// get all User typed vertices from the graph
// with the username "foobar"
q(graph)`(users:User{username:"foobar"})`;
// get all resources that have an edge into them
// from User typed vertices
q(graph)`(:User)-->(r:Resource)`;
// get all resources that are owned by users
q(graph)`(:User)-[:owns]->(r:Resource)`;
// get all users who own a resource
q(graph)`(?users:User)-[:owns]->(:Resource)`;
q(graph)`(:Resource)<-[:owns]-(users:User)`;
// use advanced mongo-like filtering
q(graph)`
  (users:User{
    name: {
      $size: 4
    }
  })
`;
// pass query as a parameter
q(
  graph,
  `(users:User{
      name: {
        $size: 4
      }
    })`
);
```
