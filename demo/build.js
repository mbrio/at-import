var atImport = require('../at-import');

atImport({
  input: 'src/main.js',
  output: 'script.js',
  replacements: {
    '@@VERSION@@': '1.0.0'
  }
}, function() {
  require('./script');
});