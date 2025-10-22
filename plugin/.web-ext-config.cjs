module.exports = {
  ignoreFiles: [
    "package.json",
    "package-lock.json",
    "node_modules",
    "*.test.js",
    "coverage",
    ".web-ext-config.cjs",
    "package.sh",
    "build",
    "dist",
  ],
  run: {
    reload: true, // Automatically reload on file changes
    browserConsole: true, // Open browser console by default
  },
};
