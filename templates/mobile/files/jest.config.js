/** @type {import('jest').Config} */
module.exports = {
  // TODO(init): Expo → preset: 'jest-expo'
  preset: '@react-native/jest-preset',
  setupFiles: ['./jest.env.js', 'react-native-unistyles/mocks', './src/theme.ts'],
  setupFilesAfterEnv: ['<rootDir>/jest.setup.ts'],
  testPathIgnorePatterns: ['/node_modules/', '<rootDir>/e2e/', '<rootDir>/src/utils/testUtils.tsx'],
  transformIgnorePatterns: [
    'node_modules/(?!(\\.pnpm|react-native|@react-native|@react-navigation|react-native-.*)/)'
  ],
  moduleNameMapper: {
    '^@app/(.*)$': '<rootDir>/src/$1',
    '^@fixtures/(.*)$': '<rootDir>/__fixtures__/$1',
    '\\.svg$': '<rootDir>/__mocks__/svgMock.js'
  },
  clearMocks: true,
  collectCoverage: true,
  coverageReporters: ['text-summary', 'lcov', 'text'],
  coveragePathIgnorePatterns: ['/node_modules/', '/__fixtures__/', '/__mocks__/', '\\.d\\.ts$'],
  coverageThreshold: {
    global: {statements: 90, branches: 90, functions: 90, lines: 90}
  }
}
