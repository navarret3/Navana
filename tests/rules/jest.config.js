// Tests de las reglas de Firestore. Se ejecutan en Node contra el emulador:
//   npm run test:rules
module.exports = {
  rootDir: '../..',
  testEnvironment: 'node',
  testMatch: ['<rootDir>/tests/rules/**/*.test.ts'],
  transform: {
    '\\.[jt]sx?$': ['babel-jest', { presets: ['babel-preset-expo'] }],
  },
  testTimeout: 20000,
};
