(function(){
  'use strict';
  
  var vows = require('vows'),
      should = require('should');
  
  var version = '@@VERSION@@',
      alerts = 0,
      alert_helper = 0,
      not_there = 0,
      view1 = 0,
      view2 = 0;

  // @shallow_import("lib/alert.js", "lib")
  // @import("views")
  // @import("nothing_in_here")
  // @import("nothing")

  vows.describe('All test variables').addBatch({
    'should be properly initialized': function() {
      alerts.should.equal(1);
      alert_helper.should.equal(1);
      not_there.should.equal(0);
      view1.should.equal(1);
      view2.should.equal(1);
    }
  }).run();
  
}());