/* eslint-disable @typescript-eslint/naming-convention */
const path = require("path");

const target = "node";
const distdir = path.join(__dirname, "dist", target);

module.exports = [
  {
    target: target,
    entry: "./build/cli.js",
    output: {
      path: distdir,
      filename: "cli.js",
      library: {
        type: "commonjs2",
      },
    },
    plugins: [],
    resolve: {},
  },
];
