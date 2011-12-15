var fs = require('fs'),
    path = require('path');

module.exports = function(input, output, replacements) {
  replacements = replacements || {};
  
  var replacer = function(input) {
    var key;
    
    for (key in replacements) {
      var regexp = new RegExp(key, "gm");
      input = input.replace(regexp, replacements[key]);
    }

    return input;
  };
  
  var contents = [],
      imported = {},
      fd = fs.openSync(output, 'w'),

      writeFile = function(input, space, shallow) {
        var stat;
        
        if (imported[input] === true) {
          return;
        }

        space = space || '';

        stat = fs.statSync(input);

        if (shallow !== true && stat.isDirectory()) {
          var files = fs.readdirSync(input),
              i, j, file;
              
          for (i = 0, j = files.length; i < j; i++) {
            file = path.join(input, files[i]);
            writeFile(file, space);
          }
        } else if(stat.isFile() && /\.js$/.test(input)) {
          var data = fs.readFileSync(input);

          data.toString().split('\n').forEach(function(line) {            
            var lineRegexp = /^(\s*)\/\/\s*@\s*(shallow_)?import\s*\(\s*((?:["][^"]+["]\s*,?\s*)+)\s*\)\s*$/g,
                valueRegexp = /["]([^"]+)["]/g,
                lineResult = lineRegexp.exec(line),
                child, valueResult;

            if(lineResult) {
              while (valueResult = valueRegexp.exec(lineResult[3])) {
                child = path.join(path.dirname(input), valueResult[1]);
                writeFile(child, lineResult[1], (lineResult[2] === 'shallow_'));
              }
            } else {
              contents.push(space + line);
            }
          });

          imported[input] = true;
        }
      };

  writeFile(input);
  fs.writeSync(fd, replacer(contents.join('\n')));
  fs.closeSync(fd);
};