// jest.config.js

module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  roots: ['<rootDir>/apps/api/tests'],
  testMatch: ['**/*.test.ts'],
  moduleFileExtensions: ['ts', 'js', 'json'],
  transform: {
    '^.+\\.tsx?$': ['ts-jest', { tsconfig: '<rootDir>/apps/api/tests/tsconfig.json' }],
  },
  collectCoverageFrom: [
    'apps/api/src/**/*.ts',
    '!apps/api/src/**/*.d.ts',
    '!apps/api/src/servers/**',
    '!apps/api/src/routes/index.ts',
  ],
  moduleNameMapper: {
    '^@erp/shared-types$': '<rootDir>/packages/shared-types/src',
    '^@erp/validation$': '<rootDir>/packages/validation/src',
    '^@erp/constants$': '<rootDir>/packages/constants/src',
    '^@erp/utils$': '<rootDir>/packages/utils/src',
  },
};
