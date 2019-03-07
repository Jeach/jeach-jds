# Jeach JSON Data Store

Jeach JDS is a simple JSON Data Store project for Node.js and web clients. 
Very similar in nature to the HTML5 `localStore` and `sessionStore`, except that instead of saving client-side, it provides support for server-side (and backups).

**Warning:** This code is experimental and only work in progress. Some functionalities have not yet been implemented! And the current code is in a state of 'limbo', meaning that it was used for something else, brought in to do this project and assembled quickly without too much though. A design will be put together and the code eventually cleaned up.

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

## Intent (todo)

```
POST    /jds/project/{key}
GET     /jds/project/{key}
DELETE  /jds/project/{key}
```

The above essentially allows one to create a store (POST), fetch (GET) or delete (DELETE) data associated with the `key` provided. The data can be any regular JSON data-structure.

In order for one to load meta-data for a given project, they could do so with:

```
GET     /jds/project/{key}/info
```

Which would provide the project `uuidd`, `key` (or name), creation date, last update date, number of backup files, current version number and a few more things.

Should someone want to load a previous version of the data, they could do so with:

```
GET    /jds/project/{key}/{version}
```

Where `version` is a sequence number, such as 2, 9, 22 or 105. Just remember that only a few backups are kept (default is 5). So requesting a purged backup data would return an error.
