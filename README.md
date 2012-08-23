[![build status](https://secure.travis-ci.org/mbrio/at-import.png)](http://travis-ci.org/mbrio/at-import)
@import.js
===
A node.js module that combines JavaScript files through the use of an @import
directive.

Requirements
---
* [Node](http://nodejs.org/)

Introduction
---
@import.js is used to automate the concatenation of JavaScript files through
the use of a custom import directive comment. Only two types of paths are able
to be passed to the import directive, a path to a directory or a path to a
file; it does not support wildcards and will only recognize files that end in
the `.js` extension. Directories will be searched recursively unless the
shallow_import directive is used.

@import.js will not import a file more than once. If an imported file
references another file that has already been imported @import.js will ignore
it.

The file names MUST be encased in double quotes ("), single quotes (') will
not be recognized.

You may pass multiple files to a single directive, all files must be encased
in double quotes and separated by commas.

You may use either single-line (//) or multi-line (/**/) comments.

The file referenced by the @import.js directive will be placed at the tab
position of the first character of the comment.

Directive Examples:
---
Given the following directory structure:

    * main.js
    * lib/
        * attributes.js
        * backbone/
            * backbone.js
        * jQuery.js
    * views/    
        * shared/
            * _login.js
        * view1.js
        
    
The following will import the files in this order:
  main.js

    // @import("main.js")
    
The following will import the files in this order:
  lib/attributes.js, lib/backbone/backbone.js, lib/jQuery.js

    /* @import("lib") */
    
The following will import the files in this order:
  lib/jQuery.js, lib/attributes.js, lib/backbone/backbone.js
  
    // @import("lib/jQuery.js", "lib")
    
The following will import the files in this order:
  views/view1.js

    // @shallow_import("views")


Library Usage
---
    var atImport = require('at-import');
    
    atImport({
      input: 'main.js',
      output: 'script.js',
      replacements = {
        '@@VERSION@@': '1.0.0'
      }
    });

Arguments
---
    * `options`
        * `input` = The input JavaScript file
        * `output` = The output JavaScript file
        * `replacements` = An object containing a map of text replacements
    * `callback`
    
Demo
---
The application within /demo contains a small display of how you could use
@import.js to combine JS files.

    cd demo
    node build.js
    
Install
---
You can download the source code at [GitHub](http://github.com/mbrio/at-import)
or you can install the library using npm:

    npm install at-import

License
---
Copyright (c) 2011 Michael Diolosa, [@mbrio](http://twitter.com/mbrio)

The @import.js library is licensed under the MIT license. For
more information see the
[Wiki](https://github.com/mbrio/at-import/wiki/License).