const { promisify } = require('util');  
const fs = require('fs');  
const path = require('path');  
const readFile = promisify(fs.readFile);  
const writeFile = promisify(fs.writeFile);  
const { HtmlWebpackPlugin } = require('html-webpack-plugin');

/**
 * 1、筛选出script、link、标签
 * 2、增加onerror事件和处理方法__reload_source__(this, event)
 * 3、向html里面插入一段代码
 */
class WebpackPluginSourceReload {
  constructor (options = {}) {
    this.options = options;
  }

  getScript() {
    const { cndReplaceRules, globalErrorHandlerName, maxReloadCount } = this.options;
    return `
  (function(options) {
  
  var win = window;

  win.__report_reload__ = function(url, loadStatus) {
    // 上报加埋点
    console.log(url, loadStatus);
  }

  win.__reloadRule__ = function(url) {
    var cdnReplaceRule = options.cndReplaceRules;
    var newUrl = url;

    for (var _i = 0; _i < cdnReplaceRule.length; _i++) {
      var _rule = cdnReplaceRule[i];
      if (url.indexOf(_rule[0]) > -1) {
        newUrl = url.replace(rule[0], rule[1]);
        break;
      }
    }

    return newUrl;
  }

  var load = function (dom, url, type, reloadCount) {
    var _dom;
    if (reloadCount === void 0) {
      reloadCount = 0;
    }

    if (reloadCount < options.maxReloadCount) {
      reloadCount++;

      var newUrl = win.__reloadRule__(url);
      if (type === 'link') {
        var newLink = dom.cloneNode();
        newLink.href = newUrl;
        newLink.onerror = ''.concat(options.globalErrorHandlerName, '(this.event').concat(reloadCount, ')');
        newLink.onload = ''.concat(options.globalErrorHandlerName, '(this.event').concat(reloadCount, ')');

        (_dom = dom.parentNode) === null || _dom === void 0 ? void 0 : _dom.insertBefore(newLink, dom);
      } else if (type === 'script') {
       var scriptText = '<scri' + 'pt type = \"text/javascript\" src=\"' + newUrl
       + "\" onload=\"".concat(options.globalErrorHandlerName, "(this, event" + ')\""
       + "\" onerror=\"".concat(options.globalErrorHandlerName, "(this, event, ") + retryTimes + ')\" ></scr' + 'ipt>';

       document.write(scriptText);
      }
    }
  }

  win[options.globalErrorHandlerName] = function (dom, event, reloadCount) {
    if (reloadCount === void 0) {
      reloadCount = 0;
    }
    var url = dom.src || dom.href;
    
    if (event.type === 'load') {
      // 上报重载onload
      win.__report_reload__(url, 'success');
      return;
    }
    if (reloadCount > 0) {
      win.__report_reload__(url, 'error');
    }

    var tag = dom.tagName.toLowerCase();
    var type = tag === 'script' ? 'js' : tag === 'link' ? 'link' : '';
    if (type) {
      load(dom, url, type, reloadCount);
    }
  }
  })({cdnReplaceRules: ${cndReplaceRules}, globalErrorHandlerName: ${globalErrorHandlerName}, maxReloadCount: ${maxReloadCount}})
    
    `;
  }
  apply(compiler) {
    compiler.hooks.emit.tapAsync('SourceReloadPlugin', (compilation, callback) => {
      const htmlFilePath = path.join(compilation.outputOptions.path, 'index.html');

      readFile(htmlFilePath, 'utf8')
      .then((data) => {
        const parsedHtml = this.parsedHtml(data);
        const updateHtml = this.addOnErrorToScriptAndLinks(parsedHtml);

        return writeFile(htmlFilePath, updateHtml, 'utf8');
      })
      .then(() => callback())
      .catch(err => callback(err));
    });

    compiler.hooks.compilation.tap('AddScriptPlugin', (compilation) => {
      HtmlWebpackPlugin.getHooks(compilation).alterAssetTags.tapAsync('AddScriptPlugin', (data, callback) => {
        const existingScripts = data.body.filter(tag => tag.tagName === 'script');  
        const scriptAlreadyExists = existingScripts.some(script => script.attributes.src === this.scriptSrc || script.innerHTML.trim() === this.script.trim());
        if (!scriptAlreadyExists) {
          // 创建一个Script标签对象
          const newScript = {
            tagName: 'script',
            voidTag: false,
            attributes: {},
            innerHTML: this.getScript()
          }
          // 将新script标签添加到head部分的末尾（或者根据需要添加到其他位置）  
          const headIndex = data.body.findIndex(tag => tag.tagName === 'head');  
          if (headIndex !== -1) {  
            data.body.splice(headIndex + 1, 0, newScript); // 在head之后添加  
          } else {  
            // 如果没有找到head标签，则添加到body的末尾（这通常不会发生，除非HTML结构异常）  
            data.body.push(newScript);  
          }  
        }
        callback(null, data);
      });
    });
  }
  parsedHtml(html) {
    // 使用一个简单的HTML解析器，比如 cheerio，来解析和修改HTML  
    const cheerio = require('cheerio');  
    const $ = cheerio.load(html);  
    return $;  
  }

  addOnErrorToScriptAndLinks($) {
    $('script').each((index, element) => {
      const src = $(element).attr('src');
      if (src) {
        $(element).attr('onerror', `handleError('script', '${src}')`);
        
      }
    })
    $('link').each((index, element) => {
      const src = $(element).attr('href');
      if (src) {
        $(element).attr('onerror', `handleError('link', '${href}')`);

      }
    })

    return $.html();
  }
}

export default WebpackPluginSourceReload;