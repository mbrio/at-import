var fs = require('fs'),
    path = require('path'),
    Lazy = require('lazy');

var Importer = function(input, output, replacements) {
  this._replacements = replacements || {}
  this._input = input;
  this._output = output;
  this._contents = [];
  this._imported = {};
  
  if (typeof(input) !== 'string') {
    throw 'You must specify an input file.';
  }
  
  if (typeof(output) !== 'string') {
    throw 'You must specify an output file.';
  }
};

Importer.prototype._processReplacements = function(input) {
  var key;
  
  for (key in this._replacements) {
    var regexp = new RegExp(key, "gm");
    input = input.replace(regexp, this._replacements[key]);
  }

  return input;
};

Importer.prototype._processFiles = function(input, space, shallow) {
  var stat;
  if (this._imported[input] === true) { return; }
  
  shallow = shallow || false;
  space = space || '';
  
  stat = fs.statSync(input);
  
  if (stat.isDirectory()) { this._processDirectory(input, space, shallow); }
  else if (stat.isFile()) { this._processFile(input, space, shallow); }
};

Importer.prototype._processDirectory = function(input, space, shallow) {
  var files = fs.readdirSync(input),
      stat, i, j, file;
  
  for (i = 0, j = files.length; i < j; i++) {
    file = path.resolve(path.join(input, files[i]));
    stat = fs.statSync(file);

    if (shallow !== true || !stat.isDirectory()) {
      this._processFiles(file, space);
    }
  }
  
  this._imported[input] = true;
};

Importer.prototype._processFile = function(input, space, shallow) {
  var lineProcessor, lazy;
  if (!/\.js$/.test(input)) { return; }
  
  lineProcessor = (function(context) {
    return function(line) {
      var regexpLine = /^(\s*)(?:\/\/|\/\*)\s*@\s*(shallow_)?import\s*\(\s*((?:["][^"]+["]\s*,?\s*)+)\s*\)\s*(?:\*\/)?$/,
          regexpValue = /["]([^"]+)["]/g,
          resultLine = regexpLine.exec(line),
          resultValue, child;
    
      if (resultLine) {
        while (resultValue = regexpValue.exec(resultLine[3])) {
          child = path.resolve(path.join(path.dirname(input), resultValue[1]));
          context._processFiles(child, space + resultLine[1], (resultLine[2] === 'shallow_'));
        }
      } else {
        context._contents.push(space + line);
      }
    }
  }(this));
  
  //lazy = new Lazy(fs.createReadStream(input));
  //lazy.lines.forEach(lineProcessor);
  fs.readFileSync(input).toString().split('\n').forEach(lineProcessor);

  this._imported[input] = true;
};

Importer.prototype.process = function() {
  var fd = fs.openSync(this._output, 'w');

  this._processFiles(this._input);
  fs.writeSync(fd, this._processReplacements(this._contents.join('\n')));
  fs.closeSync(fd);
  
  return this;
};

Importer.process = function(input, output, replacements) {
  return new Importer(input, output, replacements).process();
};

module.exports = function(input, output, replacements) {
  return Importer.process(input, output, replacements)
};