var buttons = require('sdk/ui/button/action');
var tabs = require("sdk/tabs");
var { setTimeout } = require("sdk/timers");
//var {inn:{name:"dialog", description:"bar", enabled:true}, out :null};

const self = require("sdk/self");

const {Cc, Ci, Cu} = require("chrome");

Cu.import("resource://gre/modules/Services.jsm");
Cu.import("resource://gre/modules/NetUtil.jsm");

const ChromeRegistry = Cc["@mozilla.org/chrome/chrome-registry;1"].
                       getService(Ci.nsIChromeRegistry);
const ResProtoHandler = Services.io.getProtocolHandler("resource").
                        QueryInterface(Ci.nsIResProtocolHandler);

function copyToTemp(uri, callback) {
  // Based on http://stackoverflow.com/a/24850643/484441
  let file = Services.dirsvc.get("TmpD", Ci.nsIFile);
  file.append(self.name + "_" + uri.spec.replace(/^.+\//, ""));
  file.createUnique(Ci.nsIFile, 0o0700);
  NetUtil.asyncFetch(uri, function(istream) {
    let ostream = Cc["@mozilla.org/network/file-output-stream;1"].
                  createInstance(Ci.nsIFileOutputStream);
    ostream.init(file, -1, -1, Ci.nsIFileOutputStream.DEFER_OPEN);
    NetUtil.asyncCopy(istream, ostream, function(result) {
      callback && callback(file, result);
    });
  });
}

function runProcessAndThen(file, callback) {
  console.log("running", file.path);

  let proc = Cc["@mozilla.org/process/util;1"].createInstance(Ci.nsIProcess);
  try {
    // Set executable bit on unix
    file.permissions = file.permissions | 0o0500;
  }
  catch (ex) {
    // Might throw?!
  }
  proc.init(file);
  proc.runAsync([], 0, callback);
}

function runFromURIWithPotentialCopy(uri, callback) {
  if (!uri.spec) {
    uri = Services.io.newURI(uri, null, null);
  }
  if (uri.scheme === "resource") {
    // Need to resolve futher. Strip one layer of indirection and recursively
    // call ourselves.
    uri = Services.io.newURI(ResProtoHandler.resolveURI(uri), null, null);
    return runFromURIWithPotentialCopy(uri, callback);
  }

  if (uri.scheme === "chrome") {
    // Need to resolve futher. Strip one layer of indirection and recursively
    // call ourselves.
    return runFromURIWithPotentialCopy(ChromeRegistry.convertChromeURL(uri), callback);
  }

  if (uri instanceof Ci.nsIFileURL) {
    // A plain file we can execute directly.
    return runProcessAndThen(uri.file, callback);
  }

  if (uri instanceof Ci.nsIJARURI) {
    // A packaged file (in an XPI most likely).
    // Need to copy the data into some plain file and run the result.
    return copyToTemp(uri, function(f) {
      runProcessAndThen(f, function() {
        try {
          // Clean up after ourselves.
          f.remove(false);
        }
        catch (ex) {
          console.error("Failed to remove tmp file again", ex);
        }
        callback.apply(null, arguments);
      });
    });
  }

  throw new Error("Cannot handle URI");
}

function afterRun(subject, topic, data) {
    console.log(subject, topic, data);
}

function runFileFromDataDirectory(name, callback) {
  try {
    runFromURIWithPotentialCopy(self.data.url(name), callback);
  }
  catch (ex) {
    console.error(ex);
  }
}


var button = buttons.ActionButton({
    
  id: "IITK_Fortinet_Logger",
  label: "IITK Fortinet AutoLogger",
  icon: {
    "16": "./icon-16.png",
    "32": "./icon-32.png",
    "64": "./icon-64.png"
  },
  onClick: handleClick
});

function handleClick(state) {
    //window.openDialog("chrome://")
    runFileFromDataDirectory("fl.py", afterRun);
}

