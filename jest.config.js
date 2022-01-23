/** @type {import('ts-jest/dist/types').InitialOptionsTsJest} */
module.exports = {
  preset: "ts-jest",
  testEnvironment: "node",
  testPathIgnorePatterns: ["dist", "packages"],
  collectCoverageFrom: [
    "**/*.{ts,tsx}",
    "!<rootDir>/node_modules/",
    "!index.ts",
  ],
};
