// scripts/patch-cwd.js
if (typeof process !== 'undefined') {
  const defaultDir = '/Users/dweb/NestJs/ng-console-api';
  try {
    process.cwd();
  } catch (e) {
    process.cwd = function () {
      return process.env.PWD_OVERRIDE || process.env.INIT_CWD || defaultDir;
    };
  }
}
