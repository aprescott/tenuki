var page = require("webpage").create();
var fs = require("fs");

page.onError = function(msg, trace) {
  var msgStack = ['PHANTOM ERROR: ' + msg];
  if (trace && trace.length) {
    msgStack.push('TRACE:');
    trace.forEach(function(t) {
      msgStack.push(' -> ' + (t.file || t.sourceURL) + ': ' + t.line + (t.function ? ' (in function ' + t.function +')' : ''));
    });
  }
  console.error(msgStack.join('\n'));
  phantom.exit(1);
};

page.open("file://" + fs.absolute("test.html"), function(status) {
  if (status == "success") {
    console.log("Tests pass in PhantomJS.");
    phantom.exit();
  } else {
    console.log("Failed to open test.html page. (Status: " + status + ")");
    phantom.exit(1);
  }
});
