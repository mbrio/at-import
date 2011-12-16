var fs = require('fs'),
    path = require('path');

var Importer = function(options) {
  this._replacements = options.replacements || {};
  this._input = options.input;
  this._output = options.output;
  this._contents = [];
  this._imported = {};
  this._stream = null;
  
  if (typeof(this._input) !== 'string') {
    throw 'You must specify an input file.';
  }
  
  if (typeof(this._output) !== 'string') {
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
    };
  }(this));
  
  fs.readFileSync(input).toString().split('\n').forEach(lineProcessor);

  this._imported[input] = true;
};

Importer.prototype.process = function(callback) {
  var self = this, data;
  
  self._processFiles(self._input);
  data = self._processReplacements(self._contents.join('\n'));
  
  self._stream = fs.createWriteStream(self._output, { flags: 'w' });
  self._stream.addListener('error', function(err) {
    throw err;
  });
  
  self._stream.write(data);
  
  self._stream.addListener('drain', function() {
    self._stream.end();
    self._stream = null;
    if (callback) callback();
  });
  
  return self;
};

Importer.process = function(options, callback) {
  return new Importer(options).process(callback);
};

module.exports = function() {
  return Importer.process.apply(Importer, arguments)
};