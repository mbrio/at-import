/*
@import.js
Version: 1.0.4

Copyright (c) 2011 Michael Diolosa (@mbrio)

Permission is hereby granted, free of charge, to any person obtaining a copy of
this software and associated documentation files (the "Software"), to deal in
the Software without restriction, including without limitation the rights to
use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies
of the Software, and to permit persons to whom the Software is furnished to do
so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.
*/

/*jshint node: true */

(function(){
  'use strict';
  
  var fs = require('fs'),
      path = require('path'),
      Lazy = require('lazy');
    
  var Document = function() {
    this.children = [];
  };

  Document.prototype.toString = function() {
    var i, j;
    var output = output || '';
  
    for (i = 0, j = this.children.length; i < j; i++) {
      var child = this.children[i];
    
      if (typeof(child) === 'string') {
        output += child + '\n';
      } else {
        output += child.toString();
      }
    }
  
    return output;
  };

  var Importer = function(options, callback) {
    this._replacements = options.replacements || {};
    this._input = options.input;
    this._output = options.output;
    this._imported = {};
    this._stream = null;
    this._document = new Document();
    this._dependancies = 0;
    this._callback = callback;
  
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
  
  Importer.prototype._addDependant = function() {
    this._dependancies++;
  };
  
  Importer.prototype._removeDependant = function() {
    this._dependancies--;

    if (this._dependancies === 0) {
      this._write();
    }
  };

  Importer.prototype._processFiles = function(doc, input, space, shallow) {
    if (this._imported[input] === true) { return; }
    this._addDependant();
    
    var currentDoc = new Document();
    if (doc) doc.children.push(currentDoc);
    this._imported[input] = true;
  
    shallow = shallow || false;
    space = space || '';
  
    var statCallback = (function(self, doc, currentDoc, input, space, shallow) {
      return function(err, stat) {
        if (err) { throw err; }
        if (stat.isDirectory()) { self._processDirectory(currentDoc, input, space, shallow); }
        else if (stat.isFile()) { self._processFile(doc, currentDoc, input, space, shallow); }
        else { self._removeDependant(); }
      };
    }(this, doc, currentDoc, input, space, shallow));

    /* Async */
    //fs.stat(input, statCallback);

    /* Sync */
    var stat = fs.statSync(input);
    statCallback(null, stat);
  };

  Importer.prototype._processDirectory = function(doc, input, space, shallow) {  
    var readdirCallback = (function(self, doc, input, space, shallow) {
      return function(err, files) {
        var i, j, file;
        if (err) { throw err; }
        
        if (files.length === 0) { self._removeDependant(); }
        else {
          var statCallback = function(self, doc, file, space, shallow, i, j) {
            return function(err, stat) {
              if (err) { throw err; }
              if (shallow !== true || !stat.isDirectory()) {
                self._processFiles(doc, file, space);
              }

              if (i === j - 1) { self._removeDependant(); }
            };
          };
          
          for (i = 0, j = files.length; i < j; i++) {
            file = path.resolve(path.join(input, files[i]));
            fs.stat(file, statCallback(self, doc, file, space, shallow, i, j));
          }
        }
      };
    }(this, doc, input, space, shallow))

    /* Async */
    //fs.readdir(input, readdirCallback);

    /* Sync */
    var files = fs.readdirSync(input);
    readdirCallback(null, files);
  };

  Importer.prototype._processFile = function(doc, currentDoc, input, space, shallow) {
    var lineProcessor, stream, lazy;
    if (!/\.js$/.test(input)) { this._removeDependant(); return; }
  
    lineProcessor = (function(self, currentDoc) {
      return function(line) {
        self._addDependant();
        line = line.replace(/^\s*\u0030\s*$/, '');
        var regexpLine = /^(\s*)(?:\/\/|\/\*)\s*@\s*(shallow_)?import\s*\(\s*((?:["][^"]+["]\s*,?\s*)+)\s*\)\s*(?:\*\/)?$/,
            regexpValue = /["]([^"]+)["]/g,
            resultLine = regexpLine.exec(line),
            resultValue, child;
    
        if (resultLine) {
          do
          {
            resultValue = regexpValue.exec(resultLine[3]);
            if (resultValue) {
              child = path.resolve(path.join(path.dirname(input), resultValue[1]));
              self._processFiles(currentDoc, child, space + resultLine[1], (resultLine[2] === 'shallow_'));
            }
          } while(resultValue);
        } else {
          currentDoc.children.push(space + line);
        }  
        self._removeDependant();
      };
    }(this, currentDoc));
    
    stream = fs.createReadStream(input, {
      encoding: 'utf8'
    });
  
    var endCallback = (function(self, input){
      return function() {
        self._removeDependant();
      };
    }(this, input));

    /* Async */
    /*lazy = new Lazy(stream);
    lazy.on('end', endCallback);
    lazy.lines.map(String).forEach(lineProcessor);*/

    /* Sync */
    fs.readFileSync(input).toString().split('\n').forEach(lineProcessor);
    endCallback();
  };
  
  Importer.prototype._write = function() {
    var self = this, data;
    data = self._processReplacements(self._document.toString());
  
    self._stream = fs.createWriteStream(self._output, { flags: 'w' });
    self._stream.addListener('error', function(err) {
      throw err;
    });
  
    self._stream.write(data);
  
    self._stream.addListener('drain', function() {
      self._stream.end();
      self._stream = null;
      if (self._callback) self._callback();
    });
  };

  Importer.prototype.process = function() {
    this._processFiles(this._document, this._input);
  
    return this;
  };

  Importer.process = function(options, callback) {
    return new Importer(options, callback).process();
  };

  module.exports = function() {
    return Importer.process.apply(Importer, arguments);
  };
}());