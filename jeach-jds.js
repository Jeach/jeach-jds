/*
 * Copyright (C) 2019 by Christian Jean.
 * All rights reserved.
 *
 * CONFIDENTIAL AND PROPRIETARY INFORMATION!
 *
 * Disclosure or use in part or in whole without prior written consent
 * constitutes an infringement of copyright laws which may be punishable
 * by law.
 *
 * THIS SOFTWARE IS PROVIDED "AS IS" AND ANY EXPRESSED OR IMPLIED WARRANTIES
 * INCLUDING, BUT NOT LIMITED TO, THE IMPLIED WARRANTIES OF MERCHANTABILITY
 * AND FITNESS FOR A PARTICULAR PURPOSE ARE DISCLAIMED.  IN NO EVENT SHALL
 * THE LICENSOR OR ITS CONTRIBUTORS BE LIABLE FOR ANY DIRECT, INDIRECT,
 * INCIDENTAL, SPECIAL, EXEMPLARY, OR CONSEQUENTIAL DAMAGES (INCLUDING, BUT
 * NOT LIMITED TO, PROCUREMENT OF SUBSTITUTE GOODS OR SERVICES; LOSS OF USE,
 * DATA, OR PROFITS; OR BUSINESS INTERRUPTION) HOWEVER CAUSED AND ON ANY
 * THEORY OF LIABILITY, WHETHER IN CONTRACT, STRICT LIABILITY, OR TORT
 * (INCLUDING NEGLIGENCE OR OTHERWISE) ARISING IN ANY WAY OUT OF THE USE OF
 * THIS SOFTWARE, EVEN IF ADVISED OF THE POSSIBILITY OF SUCH DAMAGE.
 */



//-----------------------------------------------------------------------------
// Load our dependencies...
//-----------------------------------------------------------------------------

const fs = require('fs');
const log4node = require('jeach-log4node');
const chance = require('chance').Chance();
const jsonfile = require('jsonfile');


//-----------------------------------------------------------------------------
// Configure our logger...
//-----------------------------------------------------------------------------

log4node.configure("./config/log4js.json");

const log = log4node.getLogger('jeach.jds');



//-----------------------------------------------------------------------------
// Define a few constants...
//-----------------------------------------------------------------------------

const BASE_PATH = 'jds';
const CONF_FILE = 'jds.conf';
const FILE_EXT  = 'jds';

const DEFAULT_CONFIG = {
        created: new Date().toISOString(),
        updated: new Date().toISOString(),
        project: {},
        projects: []
};


//----------------------------------------------------------------------------------------
// Define our module...
//----------------------------------------------------------------------------------------

const JeachJDS = (function() {

  //------------------------------------------------------------------
  // Private memebers
  //------------------------------------------------------------------

  const instances = [];
  var oid = null;
  var config = null; 
  const projects = [];


  //------------------------------------------------------------------
  // Private methods
  //------------------------------------------------------------------

  const _ = {
    getUUID: function() {
      return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
        var r = Math.random() * 16 | 0, v = c == 'x' ? r : (r & 0x3 | 0x8);
        return v.toString(16);
      });
    },

    getOID: function() {
      return 'xxxxxxxx'.replace(/[xy]/g, function(c) {
        var r = Math.random() * 16 | 0, v = c == 'x' ? r : (r & 0x3 | 0x8);
        return v.toString(16);
      });
    },

    pad: function(n, width, z) {
      z = z || '0';
      n = n + '';
      return n.length >= width ? n : new Array(width - n.length + 1).join(z) + n;
    },

    getFilename(sequence) {
      const ts = (new Date().getTime() / 1000).toFixed(0);
      const uq = this.pad(sequence, 3, '0');
      const fn = ts + '-' + uq;
      log.debug(" > Filename: " + fn);
      return fn;
    },

    /**
     * Will seek for the project, by name, in the central registry. If a project
     * if found, it will load and return the concrete project.
     */
    seekProject: function(name) {
      var proj = null;

      log.debug("Seeking instance '" + name + "'");
      log.debug(" > Have " + config.projects.length + " projects");

      for (var i=0; i<config.projects.length; i++) {
        var p = config.projects[i];
        log.debug(" > Project: " + JSON.stringify(p));
        if (p.name === name) {
          log.debug(" > HIT, using this one!");
          proj = p;
          break;
        }
      }

      if (!proj) {
        log.debug("Project '" + name + "' not found");
        return proj;
      }

      // Our 'proj' is the information from our central registry.
      // We must now load the actual project data (in not already cached)

      var pp = projects[proj.id];

      if (pp) {
        log.debug("Loaded project from cache");
        return pp;
      }

      if (proj) {
        pp = _.loadProject(proj.id, proj.name);
      }

      if (pp) {
        log.debug(" > Have project: " + JSON.stringify(pp));
        projects[pp.id] = pp;
      }

      return pp;
    },

    saveConfig: function(config) {
      const file = BASE_PATH + '/' + CONF_FILE;

      if (!config) return null;

      log.debug("Saving config file");

      // Will this create recursively???
      if (!fs.existsSync(BASE_PATH)) {
        log.debug("Directory '" + BASE_PATH + "' does not exist, creating it!");
        try {
          fs.mkdirSync(BASE_PATH);
        } catch (e) {
          log.error(e);
        }
      }

      try {
        config.updated = new Date().toISOString();
        jsonfile.writeFileSync(file, config);
        log.debug("Saved config file to '" + file + "'");
        log.debug("Config: " + JSON.stringify(config));
      } catch (e) {
        config = null;
        log.error(e);
      }

      return config;
    },

    /**
     * Load the configuration file. If it can not be loaded, a default will be
     * used and saved.
     * 
     * @author  Christian Jean
     * @since   0.2.0 2019.03.05
     * @returns a configuration ojbect
     */
    loadConfig: function() {
      const file = BASE_PATH + '/' + CONF_FILE;
      var config = null;

      log.debug("Loading config file from '" + file + "'");

      try {
        config = jsonfile.readFileSync(file);
      } catch (e) {
        // Ignored! //log.error(e);
      }

      if (!config) {
        log.warn("Cold not load config, creating default.");
        config = _.saveConfig(DEFAULT_CONFIG);
      }

      if (!config) throw Error("Could not obtain a config file!");

      log.debug("Config: " + JSON.stringify(config));

      return config;
    },

    /**
     * Will save a project. If a project does not have any data (is 'null'), the
     * project will only be saved if the version sequence is zero (0).
     *
     * @author  Christian Jean
     * @since   0.2.0 2019.03.07
     */
    saveProject: function(project) {
      var b = false;

      log.debug("Saving project: " + JSON.stringify(project));

      if (!project) return b;
      if (!project.data && project.version > 0) return b;

      var path = BASE_PATH + '/' + project.id;
      var file = path + '/' + _.getFilename(project.version++) + '.' + FILE_EXT;

      project.updated = new Date().toISOString();
      project.backups.files.push(file);

      if (!fs.existsSync(path)) {
        log.debug("Directory '" + path + "' does not exist, creating it!");
        try {
          fs.mkdirSync(BASE_PATH + '/' + project.id);
        } catch (e) {
          log.error(e);
          return b;
        }
      }

      try {
        jsonfile.writeFileSync(file, project);
        log.debug("Saved config to file '" + file + "'");
        log.debug("Config: " + JSON.stringify(config));
      } catch (e) {
        log.error(e);
        return b;
      }

      log.debug("Saving a copy to project cache");
      projects[project.id] = projects;

      return true;
    },

    loadProject: function(id, name) {
      log.debug("Loading project '" + name + "' (id: " + id + ")");
      const files = _.readProjectFiles(id);
      var project = null;
      log.debug("Files: " + JSON.stringify(files));
      if (!files) return null;
      if (files.length < 1) return null;

      const file = files[files.length - 1];
      log.debug(" > Found " + files.length + " files, loading last (file: '" + file + "')");
      log.debug(" > Loading file '" + file + "'");
    
      try {
        project = jsonfile.readFileSync(BASE_PATH + '/' + id + '/' + file);
      } catch (e) {
        log.error(e);
      } 

      return project;
    },

    /**
     * Read all files for this project.
     */
    readProjectFiles: function(id) {
      const _ = require('lodash');
      const fs = require('fs');

      var list = [];
      var path = BASE_PATH + '/' + id;

      log.debug("Reading files for project path '" + path + "':");
      const files = fs.readdirSync(path);

      for (var i=0; files && i<files.length; i++) {
        log.debug(" > File: " + files[i]);
      }

      list = _.sortBy(files);

      return list;
    },
  }

  oid = _.getOID();
  config = _.loadConfig();


  //------------------------------------------------------------------
  // Public members / methods
  //------------------------------------------------------------------

  return {
    getProject: function(project) {
      log.debug("Getting project '" + project + "'");
      const instance = _.seekProject(project);

      if (!instance) {
        log.debug("Project '" + project + "' does not exist");
      }

      return instance;
    },

    /** 
     * Return a list of projects as determined by our central registry.
     */
    getProjects: function() {
      var projects = config.projects;
      return projects;
    },

    createProject: function(name, backups) {
      log.debug("Creating project '" + name + "', backups: " + backups);

      if (name) name = name.trim();
      if (!name) return null;

      var p = _.seekProject(name);

      // TODO: We must load our real project and not the reference!!!
      if (p) return p;

      const project = {};

      project.id = _.getUUID();
      project.name = name;
      project.created = new Date().toISOString();
      project.updated = new Date().toISOString();
      project.version = 0;
      project.backups = {};
      project.backups.max = backups || 3;
      project.backups.files = [];
      project.data = null;

      log.debug("Created project: " + JSON.stringify(project));
      
      // Update our central registry with a portion of the project information
      config.projects.push({ id: project.id, name: project.name, created: project.created });
      config = _.saveConfig(config);

      var b = _.saveProject(project);

      if (b) log.debug("Saved project successfully!");
      else log.warn("Could not save project!");

      return project;
    },

    getProjectCount: function() {
      return config.projects.length;
    },
    
    getOID: function() {
      return oid;
    },

    toString: function() {
      return "[JeachJDS@" + this.getOID() + "] projects: " + this.getProjectCount();
    }
  }
})();


function XXX() {
  console.log("XXX");
}

XXX.prototype.getName = function() {
  return this.name;
}

XXX.prototype.getBackupCount = function() {
  return this.backups;
}

XXX.prototype.setBackupCount = function(n) {
  this.backups = n >= 1 && n <= 10 ? n : BACKUPS;
}

XXX.prototype.save = function(data) {
  var json = null;
  log.debug(this.toString());
  log.debug("Saving data...");
  if (typeof data === 'object') json = JSON.stringify(data);
  if (typeof data === 'string') json = data;
  log.debug(" > Data: " + json);
  if (!json) return;
  if (json.localeCompare(this.data.json) === 0) {
    log.debug(" > Data is identical, not saving!");
    return;
  }

  this.data.json = json;

  const filename = this.name + '-' + getFilename(this.data.backups.sequence++) + '.' + EXT;
  this.data.backups.files.push(filename);
  this.data.backups.last = new Date().toISOString();
  // Purge old files... 
  if (this.data.backups.files.length > this.data.backups.count) {
    log.debug(" > Purging  : have " + this.data.backups.files.length + ", max: " + this.data.backups.count);
    var olist = this.data.backups.files;
    var plist = this.data.backups.files.slice(0, this.data.backups.files.length - this.data.backups.count);
    var nlist = this.data.backups.files.slice(-this.data.backups.count);
    log.debug(" > Olist : " + olist.length + ", list: " + olist);
    log.debug(" > Plist : " + plist.length + ", list: " + plist);
    log.debug(" > Nlist : " + nlist.length + ", list: " + nlist);
    this.purge(plist);
    this.data.backups.files = nlist;
  }
  try {
    jsonfile.writeFileSync(BASE_DIR + '/' + filename, this.data);
    log.debug(" > Saved file");
  } catch (e) {
    log.debug(" > Error saving file: " + e);
  }
}

// TODO: Purge n backups...
XXX.prototype.purge = function(list) {
  const fs = require('fs');
  if (!list) return;
  log.debug("Purging " + list.length + " backup files for '" + this.name + "'...");
  //list.push("some-bogus-file.jds");
  for (var i=0; i<list.length; i++) {
    var path = BASE_DIR + '/' + list[i];
    log.debug(" > Purging: " + path);
    if (fs.existsSync(path)) {
      fs.unlink(path, (err) => {
        if (err) log.debug(" > " + err);
        else log.debug(" > Successfully removed: '" + path + "'");
      });
    } else {
      log.debug(" > Could not find file: '" + path + "'");
    }
  }
}

/**
 * Get an array of all the files for this project.
 */
XXX.prototype.getFiles = function() {
  return this.readFiles();
}

/**
 * List all list for this project.
 */
XXX.prototype.listFiles = function(list) {
  const ll = list || this.readFiles();
  log.debug("Listing files for '" + this.name + "':");
  for (var i=0; ll && i<ll.length; i++) {
    log.debug(" > File: " + ll[i]);
  }
}

/**
 * Read all files for this project.
 */
XXX.prototype.readFiles = function() {
  const _ = require('lodash');
  const fs = require('fs');
  let  list = [];
  log.debug("Reading files for '" + this.name + "' in '" + BASE_DIR + "':");
  const files = fs.readdirSync(BASE_DIR);
  //log.debug("Files: " + JSON.stringify(files));
  for (var i=0; files && i<files.length; i++) {
    //log.debug(" > File: " + files[i]);
    if (files[i].startsWith(this.name)) {
      list.push(files[i]);
    }
  }
  list = _.sortBy(list);
  return list;
}

/** 
 * Load the most recent file.
 */
XXX.prototype.loadFile = function() {
  const files = this.getFiles();
  let data = null;
  log.debug("Reading most recent file...");
  if (files && files.length > 0) {
    const file = files[files.length - 1];
    log.debug(" > Found " + files.length + " files, loading last (file: '" + file + "')");
    data = jsonfile.readFileSync(BASE_DIR + '/' + file);
  }
  if (data) {
    this.data = data;
    log.debug(" > Data: " + JSON.stringify(this.data));
  }
  return data;
}

XXX.prototype.toString = function() {
  return "XXX@" + pad(this.oid, 8) +
          ", name: " + this.name +
          ", data: " + (this.data.json ? this.data.json.length : 0) + " bytes"
          ;
}

//----------------------------------------------------------------------------------------

function pad(n, width, z) {
  z = z || '0';
  n = n + '';
  return n.length >= width ? n : new Array(width - n.length + 1).join(z) + n;
}

function getFilename(n) {
  const ts = (new Date().getTime() / 1000).toFixed(0);
  const uq = pad(n, 3, '0');
  const fn = ts + '-' + uq;
  log.debug(" > Filename: " + fn);
  return fn;
}


//-----------------------------------------------------------------------------
// Export our module...
//-----------------------------------------------------------------------------

module.exports = JeachJDS;
