/** @type {import('jest').Config} */
module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  rootDir: 'src',
  testMatch: ['<rootDir>/tests/**/*.test.ts'],
  setupFilesAfterEnv: ['<rootDir>/tests/setup.ts'],
  moduleNameMapper: {
    '^src/(.*)$': '<rootDir>/$1',
  },
  transform: {
    '^.+\\.tsx?$': ['ts-jest', { tsconfig: '<rootDir>/../tsconfig.jest.json' }],
  },
  clearMocks: true,
  restoreMocks: true,
  collectCoverageFrom: [
    '<rootDir>/services/**/*.ts',
    '<rootDir>/controllers/**/*.ts',
    '<rootDir>/middleware/**/*.ts',
    '<rootDir>/utils/**/*.ts',
    '!<rootDir>/server.ts',
    '!<rootDir>/seed.ts',
  ],
  coverageDirectory: '../coverage',
  coverageReporters: ['text', 'lcov', 'html'],
};
