/** Unit tests for pure logic (no React Native runtime). */
module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  roots: ['<rootDir>/__tests__'],
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/$1'
  },
  transform: {
    '^.+\\.tsx?$': ['ts-jest', { isolatedModules: true, tsconfig: { strict: false, esModuleInterop: true, skipLibCheck: true } }]
  }
};
