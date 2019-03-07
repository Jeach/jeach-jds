# JSON Data Store (JDS)

The **JDS** project is a simple JSON Data Store for Node.js and web clients.

Very similar in nature to the HTML5 `localStore` and `sessionStore`, except that instead of saving client-side, it provides support for server-side (and backups).

**Warning:** This code is experimental and only work in progress. Some functionalities have not yet been implemented! And the current code is in a state of 'limbo', meaning that it was used for something else, brought in to do this project and assembled quickly without too much though. A design will be put together and the code eventually cleaned up.

## Intent (todo)

In order to expose the RESTful API, you would simply invoke the following three lines of code:


```
const jds = require('jeach-jds');
const routes = jds.getRoutes();

app.get('/jds', routes);
```

Once the Node.js server started and the routes exposed, one could simply make the following calls from the client-side:

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
