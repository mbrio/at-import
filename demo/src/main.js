(function(){
  
  var version = '@@VERSION@@',
      alerts = false,
      alert_helper = false,
      not_there = false,
      view1 = false,
      view2 = false;
  
  // @shallow_import("lib")
  /* @import("views") */

  console.log("Passed: " + (alerts === true));
  console.log("Passed: " + (alert_helper === true));
  console.log("Passed: " + (not_there === false));
  console.log("Passed: " + (view1 === true));
  console.log("Passed: " + (view1 === true));
  
}())