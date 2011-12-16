var atImport = require('../at-import');

atImport('src/main.js', 'script.js', {
  '@@VERSION@@': '1.0.0'
}, function() {
  require('./script');
});