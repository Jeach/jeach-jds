# Jeach JSON Data Store

Jeach JDS is a simple JSON Data Store project for Node.js and web clients. 
Very similar in nature to the HTML5 `localStore` and `sessionStore`, except that instead of saving client-side, it provides support for server-side (and backups).

**Warning:** This code is experimental and only work in progress. Some functionalities have not yet been implemented!

## Usage

If you want to use the API programmatically, you can do so as follows:

```
const jds = require('jeach-jds');

const foo = jds.getProject("foo");      // Previously created and saved
const bar = jds.createProject("bar");   // Create a new project and return it

var data1 = { x: 1, y: true, z: 'some value' };
var data2 = [ { one: 1, two: 2 }, { three: 3, four: 4 } ];

jds.saveData(foo, data1);
jds.saveData(bar, data2);
```

In the above example, data is saved for each project.

Should you want to expose this same logic to your client, you can simply do:

```
const jds = require('jeach-jds');

const routes = jds.getRoutes();

app.get('/jds', routes);
```

And the above routes would be provided, allowing a client to make the following calls...

To get the data for a given project:

```
GET /jds/project/{name}
```

To create a new project:

```
POST /jds/project/{name}
```

## Disclaimer

Much of what is currently code will be changed. As of now there is a notion of 'projects' which I'm not sure I like. I will probably change it to something more 'key' / 'value' based. Exposing the following API's instead:

```
POST    /jds/key/{key}
GET     /jds/key/{key}
DELETE  /jds/key/{key}
```

The above essentially allows one to store, fetch or delte any data associated with the `{key}` (on the server). The data associated with a `key` can be any regular JSON data-structure.
