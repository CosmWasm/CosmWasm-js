const chrome = require("karma-chrome-launcher");
const firefox = require("karma-firefox-launcher");
const jasmine = require("karma-jasmine");
const kjhtml = require("karma-jasmine-html-reporter");

module.exports = function (config) {
  config.set({
    // base path that will be used to resolve all patterns (eg. files, exclude)
    basePath: ".",
    // registers plugins but does not activate them
    plugins: [jasmine, kjhtml, chrome, firefox],

    // frameworks to use
    // available frameworks: https://npmjs.org/browse/keyword/karma-adapter
    frameworks: ["jasmine"],

    // list of files / patterns to load in the browser
    files: ["../../jasmine-global-variables.js", "dist/web/tests.js"],

    client: {
      jasmine: {
        random: false,
        timeoutInterval: 15000,
      },
    },

    // test results reporter to use
    // possible values: 'dots', 'progress'
    // available reporters: https://npmjs.org/browse/keyword/karma-reporter
    reporters: ["progress", "kjhtml"],

    // web server port
    port: 9876,

    // enable / disable colors in the output (reporters and logs)
    colors: true,

    // level of logging
    // possible values: config.LOG_DISABLE || config.LOG_ERROR || config.LOG_WARN || config.LOG_INFO || config.LOG_DEBUG
    logLevel: config.LOG_INFO,

    // enable / disable watching file and executing tests whenever any file changes
    autoWatch: false,

    // start these browsers
    // available browser launchers: https://npmjs.org/browse/keyword/karma-launcher
    browsers: ["Firefox"],

    browserNoActivityTimeout: 90000,

    // Keep brower open for debugging. This is overridden by yarn scripts
    singleRun: false,
  });
};
