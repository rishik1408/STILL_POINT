module.exports = {
  preset: 'jest-expo',
  testMatch: ['**/__tests__/**/*.(test|spec).[jt]s?(x)'],
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/src/$1',
  },
};
