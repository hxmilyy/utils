var fs = require('fs');
var path = require('path');
var glob = require('glob');
var jsdom = require('jsdom');
var dirIterator = require('./dir_iterate');

function combin(options){
  // {
  //   基准路径String
  //   base: ...
  //   html匹配String
  //   pattern: ...
  //   需要合并URL的域名Array|String|Function
  //   combinDomain: ...
  //   需要排除的资源Array|String|Function
  //   excludeResource: ...
  //   需要处理的html Array|String|Function
  //   files: ...
  //   url分割符String
  //   separator: ...
  //   是否合并内容Object|Boolean
  //   inline: {
  //     css: true|false,
  //     script: true|false
  //   }
  // }
  
  options = options || {};
  /*获取文件*/
  console.log(options.pattern || '**/*/html')
  console.log(options.base || null)
  glob(options.pattern || '**/*.html', options, function(error, files){
    if(!error){
      console.log(files)
    } else{
      console.error(error)
    }
  });
}
combin()
module.exports = combin

//获取单个url的域名，非http、https、//开头返回localhost
function getDomainFromURL(url){
  if(typeof url === 'string'){
    if(/^(https?)?:?\/\/([^\/]+)(\/.*|$)/.test(url)){
      if(RegExp.$1 == 'http' || !RegExp.$1){
        return '//' + RegExp.$2;
      }else if(RegExp.$1 == 'https'){
        return RegExp.$1 + '://' + RegExp.$2 
      }
      return 'localhost'
    }
    return 'localhost'
  }
}

//判断是否是同一域名
function isSameDomain(d1, d2){
  d1 = d1.replace(/^\/\/([^\/])/, 'http://$1');
  d2 = d2.replace(/^\/\/([^\/])/, 'http://$1');
  var a1 = url.parse(d1), a2 = url.parse(d2);
  return a1.protocol == a2.protocol && a1.hostname == a2.hostname
}

//判断路径是否包含
function contains(path1, subpath){
  return path.resolve(subpath).indexOf(path.resolve(path1)) == 0
}

//合并url
function doCombinURL(commonbase, urls, separator){
  return commonbase + urls.map(function(a){return a.replace(commonbase, '')}).join(separator || ',');
}

//传入节点，返回合并后节点和需要删除的节点
function getSummary(nodes, options){
  nodes = Array.prototype.slice.call(nodes);
  options = options || {};
  
  if(Array.isArray(nodes)){
    var removes = [], news = {}, tempDomainMap = {};
    for(var i = 0; i < nodes.length; i ++){
      var node = nodes[i],
      url = node.tagName == 'LINK'?node.href : node.src, 
      domain = getDomainFromURL(url),
      validDomain = false,//domain是否可以支持url合并
      arr;
      
      /**localhost需要判断，非localhost不需要判断**/
      
      //根据设置判断domain是否可以支持url合并
      if(domain){
        if(typeof options.combinDomain == 'String'){
          validDomain = isSameDomain(options.combinDomain, domain);
        }else if(typeof options.combinDomain == 'function'){
          validDomain = !!options.combinDomain(domain);
        }else if(Array.isArray(options.combinDomain)){
          var tmp = options.combinDomain.filter(function(a){
            return isSameDomain(a, domain);
          });
          validDomain = tmp.length > 0;
        }
      }
      
      //需要加个过滤来去掉不需要合并url或者不想改变位置的资源规则配置exclude
      
      
      if(validDomain){
        var base = options.base || './';
        //如果资源路径在base路径之内
        if(contains(base, path.dirname(url))){
          arr = tempDomainMap[domain] || [];
          arr.push(url);
          arr.push(node);
          tempDomainMap[domain] = arr;
        }
      }
    }

    for(var domain in tempDomainMap){
      var arr = tempDomainMap[domain];
      if(arr.length > 2){
        for(var i = 0; i < arr.length / 2; i ++){
          var url = arr[2 * i], node = arr[2 * i + 1];
          removes.push(node);
          news[domain] = news[domain] || [];
          news[domain].push(url);
        }
      }
    }
    
    return {
      removes: removes,
      news: news
    }
  }
}

//根据域名combin url
function combinURL(urlMap, html){
  //base路径，传入或者是html的dirname
  var htmlbase = path.resolve(html), htmldirname = path.dirname(htmlbase);
  console.log(urlMap);
  for(var domain in urlMap){
    var urls = urlMap[domain], common = [], commonbase = path.relative(urls[0],htmldirname);
    common.push(domain);
    urls.forEach(function(url,i){
      //如果解析出的路径不base路径下，则表明路径非法，
      //console.log(path.resolve(path.relative(htmldirname,urls[i])));
      
      url = url.replace(/^http:\/\//, '//')
      //可以依次求出相对base路径的相对路径
      //以path.sep分割，最短的就是公共路径
      //合并时候，分别算出每个url相对最短公共路径的地址
      //console.log(dirname, url, path.join(dirname, url));
    })
  }
}

// dirIterator('./test.html', function(file){
 // if(path.extname(file) == '.html'){
   // var content = fs.readFileSync(file, { encoding: 'utf8' }),
   // doc = jsdom.jsdom(content, {
     // FetchExternalResources : [],
     // ProcessExternalResources: [],
     // SkipExternalResources: false
   // });
   
   // var links = doc.querySelectorAll('link:not([rel="dns-prefetch"])[href]'),
   // summary = getSummary(links, {
     // combinDomain: function(){return true}
   // }),
   // node = combinURL(summary.news, file);
   
   // //删除removes
   
   // //添加新node
 // }
// });



function getDomain(url){
  if(typeof url === 'string'){
    if(/^(https?:)?\/\/([^\/]+)(\/.*|$)/.test(url)){
      return RegExp.$2;
    }else{
      return 'localhost'
    }
  }
}

function getCommonBase(domain, urls){
  var tmp = urls.map(function(a){return a.replace(/^http:/, '')});
  
  if(domain.startsWith('http:')){
    domain = domain.replace('http:', '')
  }else if(domain.startsWith('//')){
    domain = domain
  }else if(domain.startsWith('https:')){
    domain = domain
  }else{
    if(!domain.startsWith('.') && !domain.startsWith('/')){
      domain = '//' + domain;
    }
  }

  var tmp1 = tmp.map(function(a){return a.replace(domain, '').split('/')})
  .reduce(function(a,b){
    a.push(b.filter(function(x){return !!x}))
    return a
  },[]);
  
  var min = Math.min.apply(null,tmp1.map(function(a){return a.length})), tmp2 = [];
  for(var i = 0; i < min; i ++){
    var a = tmp1[0][0], allSame = true;
    for(var j = 0; j < tmp1.length; j ++){
      if(tmp1[j][0] != a){
        allSame = false;
        break
      }
    }

    if(allSame){
      for(var k = 0; k < tmp1.length; k ++){
        tmp1[k] = tmp1[k].slice(1);
      }
      tmp2.push(a);
    }else{
      break;
    }
  }

  var url = domain + '/' + tmp2.join('/') + '??' + tmp1.reduce(function(a,b){
    a.push(b.join('/'));
    return a;
  },[]).join(',');

  return url;
}

// var urls = ['http://www.jd.com/a/b/c/d/e.js','http://www.jd.com/a/b/c/d.js','http://www.jd.com/a/b/c.js','http://www.jd.com/a/b.js','//www.jd.com/a.js'];
// url = getCommonBase('www.jd.com', urls.slice(0,2));
// console.log(url);
// url = getCommonBase('www.jd.com', urls.slice(0,3));
// console.log(url);
// url = getCommonBase('www.jd.com', urls.slice(0,4));
// console.log(url);

// urls = urls.sort(function(a,b){return a.length - b.length});
// url = getCommonBase('www.jd.com', urls.slice(3,5));
// console.log(url);
// url = getCommonBase('www.jd.com', urls.slice(2,5));
// console.log(url);
// url = getCommonBase('www.jd.com', urls.slice(1,5));
// console.log(url);

// url = getCommonBase('www.jd.com', urls.slice(0,3));
// console.log(url);