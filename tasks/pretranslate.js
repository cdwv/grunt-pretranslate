'use strict';

var _ = require('underscore');

function escapeRegExp(str) {
  return str.replace(/[\-\[\]\/\{\}\(\)\*\+\?\.\\\^\$\|]/g, "\\$&");
}

module.exports = function(grunt) {
    grunt.task.registerMultiTask('pretranslate', 'Translation precompile', function() {
        
        var self = this;
        
        var options = self.options();
                       
        // This task is asynchronious
        var done = self.async();
        
        function processContent(content, fullDict, newDict, ns) {
            content = content.replace(/jade\.escape\(null == \(jade_interp = __\('([-_a-z0-9:\. ]+)'\)\) \? "" : jade_interp\)/ig, function(str, arg1) {
                return JSON.stringify(_.escape(i18next.t(arg1)));
            }).replace(/jade\.escape\(null == \(jade_interp = __\("([-_a-z0-9:\. ]+)"\)\) \? "" : jade_interp\)/ig, function(str, arg1) {
                return JSON.stringify(_.escape(i18next.t(arg1)));
            }).replace(/__\('([-_a-z0-9:\. ]+)'\)/ig, function(str, arg1) {
                return JSON.stringify(i18next.t(arg1));
            }).replace(/__\("([-_a-z0-9:\. ]+)"\)/ig, function(str, arg1) {
                return JSON.stringify(i18next.t(arg1));
            });
            
            var tmp = content;
            //matches: for(var match; match = tmp.match(/__\('([-_a-z0-9:\. ]+)'\s[^\)]*/); ) {
            matches: for(var match; match = tmp.match(/__\((?:'([-_a-z0-9:\. ]+)'|"([-_a-z0-9:\. ]+)"),/); ) {
                tmp = tmp.substr(match.index+match[0].length);
                
                var key = match[1] || match[2];
                var pos;
                if((pos = key.indexOf(':')) != -1) {
                    ns = key.substr(0, pos);
                    key = key.substr(pos+1);
                }

                var envOld = fullDict[ns], envNew,
                    envNewRoot = envNew = newDict[ns] || {};
                    
                if(!envOld) {
                    continue;
                }
                
                var path = key.split('.');
                key = path.pop();
                for(var i = 0; i < path.length; i++) {
                    envOld = envOld[path[i]];
                    if(!envOld) {
                        continue matches;
                    }
                    if(!envNew[path[i]]) {
                        envNew[path[i]] = {};
                    }
                    envNew = envNew[path[i]];
                }
                
                var regex = new RegExp('^'+escapeRegExp(key)+'(_|$)');
                for(var i in envOld) {
                    if(regex.test(i)) {
                        envNew[i] = envOld[i];
                        if(!newDict[ns]) {
                            newDict[ns] = envNewRoot;
                        }
                    }
                }
            }
            
            return content;
        }
               
        var lng = options.langs[0]
        
        var i18next = require('i18next');
        i18next.init({
            lng: lng,
            useCookie: false,
            fallbackLng: false,
            resGetPath: options.srcDictionary,
            ns: {
                namespaces: _.union(options.ns || [], options.forceNs || []),
                defaultNs: options.defaultNs
            },
            debug: true
        }, function() {

            var curFullDict = i18next.sync.resStore[lng];
            var newDict = {};
            
            if(options.forceNs) {
                _.each(options.forceNs, function(ns) {
                    newDict[ns] = curFullDict[ns];
                });
            }
            
            self.files.forEach(function(f) { // for each configuration
                var out = '';
                f.src.forEach(function(filepath) { // for each file
                    out += processContent(grunt.file.read(filepath), curFullDict, newDict, options.defaultNs);
                });
                grunt.file.write(f.dest, out);
                grunt.log.writeln('>> Bundled '+f.dest);
            });
            
            // write result dictionary
            if(options.destDictionaryFile) {
                grunt.file.write(options.destDictionaryFile.replace('__lng__', lng), 'module.exports='+JSON.stringify(newDict));
            }
            
            done();
        });
    });
}