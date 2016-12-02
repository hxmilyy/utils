//construct project js file dependencies
var fs = require('fs');
var path = require('path');
var esprima = require('esprima');
var estraverse = require('estraverse');
var dirIterator = require('./dir_iterate');//遍历文件夹

//判断语法树node是否是调用require方法
function isRequireNode(node){
  return node.type == "CallExpression" && node.callee && node.callee.name == 'require';
}

//判断语法树node是否是调用define方法
function isDefineNode(node){
  return node.type == "CallExpression" && node.callee && node.callee.name == 'define';
}

//获取require或者define的依赖数组
function getDependencies(node){
  var deps = [], depsArray = (node.arguments || []).filter(function(a){
    return a.type == 'ArrayExpression'
  });
    
  return depsArray && depsArray[0] && depsArray[0].elements ? depsArray[0].elements.map(function(a){return a.value}) : deps;  
}

//读取AMD依赖
function readFile(filename){
  var content, ast, dependencies = [];
  
  try{
    content = fs.readFileSync(filename, { encoding: 'utf8' });  
    ast = esprima.parse(content,{ sourceType: 'module' });
    
    estraverse.traverse(ast, {
      enter: function(node) {
        if(isDefineNode(node)){
          dependencies = getDependencies(node).concat(dependencies);
          return;
        }
        
        if(isRequireNode(node)){
          dependencies = getDependencies(node).concat(dependencies);
          return;
        }
      },
      leave: function(node) {}
    });
    // estraverse.replace(ast, {});
  }catch(e){
    console.log('出错了');
    console.log(e.message);
  }
  return dependencies;
}

//依赖扁平化
function flat(map){
  function _flat(deps_array){
    var all = [];
    
    deps_array.forEach(function(a){
      var mod = map[a], tmp;
      
      if(mod && mod.length > 0){
        tmp = _flat(mod);
        all = all.concat(tmp);
      }
      all.indexOf(a) == -1 && all.push(a);
    });
    
    return all;
  }
  
  for(var a in map){
    var deps = _flat(map[a]);
    map[a] = deps;
  }
}

// var global_deps_map = {}, 
// project_base = 'E:/git/furniture/', //项目路径
// js_base = 'src/js/', //js文件路径
// js_module_base = 'src/js/lib', //js模块化路径
// handler = function(file){
//   if(path.extname(file) == '.js'){
//     var deps = readFile(file), name = path.relative(project_base + js_base, file);
//     if(deps){
//       deps = deps.map(function(a){
//         return path.join(path.relative(js_base, js_module_base), a).split(path.sep).join('/') + '.js'
//       });
//     }
//     global_deps_map[name.split(path.sep).join('/')] = deps || [];
//   }
// };
// var start = Date.now();
// dirIterator(project_base + js_base, handler);

// flat(global_deps_map)
// console.log(Date.now() - start);
// console.log(global_deps_map);

/**
 * 针对AMD模块define，require进行依赖分析，返回提供路径下所有js文件AMD方式调用的对应依赖
 */
module.exports = function(js_base, js_module_base, project_base){
  js_base = js_base || 'src/js/';
  js_module_base = js_module_base || 'src/js/lib';
  project_base = project_base || 'E:/git/furniture/';
  
  var global_deps_map = {}, 
  handler = function(file){
    if(path.extname(file) == '.js'){
      var deps = readFile(file), name = path.relative(project_base + js_base, file);
      if(deps){
        deps = deps.map(function(a){
          return path.join(path.relative(js_base, js_module_base), a).split(path.sep).join('/') + '.js'
        });
      }
      global_deps_map[name.split(path.sep).join('/')] = deps || [];
    }
  };
  
  dirIterator(project_base + js_base, handler);
  flat(global_deps_map);
  return global_deps_map
}