const jds = require('./jeach-jds');

console.log("JDS  : " + jds);
console.log("JDS  : " + jds.getOID());

console.log("Seek : " + jds.getProject('jeachx'));
console.log("Projects: " + JSON.stringify(jds.getProjects()));

console.log("Create 1: " + JSON.stringify(jds.createProject()));
console.log("Create 2: " + JSON.stringify(jds.createProject(null)));
console.log("Create 3: " + JSON.stringify(jds.createProject('')));
console.log("Create 4: " + JSON.stringify(jds.createProject(' ')));
console.log("Create 5: " + JSON.stringify(jds.createProject('jeach')));

var name = 

console.log("Create 5: " + JSON.stringify(jds.createProject('jeach')));

