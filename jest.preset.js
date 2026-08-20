module.exports = {
  testMatch: ['**/+(*.)+(spec|test).+(ts|js)?(x)'],
  transform: {
    '^.+\\.(ts|js|html)$': [
      'ts-jest',
      {
        tsconfig: '<rootDir>/tsconfig.spec.json',
      },
    ],
  },
  moduleFileExtensions: ['ts', 'js', 'html'],
  coverageReporters: ['html'],
  moduleNameMapper: {
    '^@ng-console-api/common/(.*)$': '<rootDir>/../../libs/common/src/$1',
    '^@ng-console-api/common$': '<rootDir>/../../libs/common/src/index.ts',
    '^@ng-console-api/contracts/(.*)$': '<rootDir>/../../libs/contracts/src/$1',
    '^@ng-console-api/contracts$': '<rootDir>/../../libs/contracts/src/index.ts',
    '^@ng-console-api/database/(.*)$': '<rootDir>/../../libs/database/src/$1',
    '^@ng-console-api/database$': '<rootDir>/../../libs/database/src/index.ts',
  },
};
