(function(){
  
  var version = '@@VERSION@@',
      alerts = 0,
      alert_helper = 0,
      not_there = 0,
      view1 = 0,
      view2 = 0;

  // @shallow_import("lib/alert.js", "lib")
  // @import("views")

  console.log("Passed: " + (alerts === 1));
  console.log("Passed: " + (alert_helper === 1));
  console.log("Passed: " + (not_there === 0));
  console.log("Passed: " + (view1 === 1));
  console.log("Passed: " + (view1 === 1));
  
}())