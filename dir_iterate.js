var fs = require('fs');
var path = require('path');

//dir iterate recursive
function walk(root, handler){
  var stat = fs.statSync(root);
  if(stat.isFile()){
    handler(root);
  }else if(stat.isDirectory()){
    var files = fs.readdirSync(root);
    files.forEach(function(file){
      var name = path.join(root, file), stat = fs.statSync(name);
      if(stat.isFile()){
        handler(name);
      }else if(stat.isDirectory()){
        walk(name + '/', handler);
      }
    });
  }  
}

module.exports = walk;