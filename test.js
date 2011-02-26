
var $ = require( "jquery" );


var a =  $("<h1>test passes</h1>").appendTo("body");
a.append("<div>HIIII</div>");
 
  console.log($("body").html()); 

