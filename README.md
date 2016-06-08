grunt-pretranslate
====================

Pretranslate static strings with grunt.

Example of configuration
-------------------------

```js
pretranslate: {
    options: {
        langs: ['pl'],
        ns: ['main', 'dashboard'],
        defaultNs: 'main',
        srcDictionary: 'assets/locales/__lng__/__ns__.json',
        destDictionary: 'public/locales/__lng__/__ns__.json'
    },
    main: {
        src: ['tmp/compiledTemplates.js'],
        dest: 'app/templates/compiledTemplates.js'
    }
}
```