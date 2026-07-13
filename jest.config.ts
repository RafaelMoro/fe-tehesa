import type { Config } from "jest"
import nextJest from "next/jest.js"

const createJestConfig = nextJest({ dir: "./" })

const config: Config = {
  testEnvironment: "jsdom",
  testEnvironmentOptions: {
    customExportConditions: ["node", "node-addons"],
  },
  setupFilesAfterEnv: ["<rootDir>/jest.setup.ts"],
  moduleNameMapper: {
    "^@/(.*)$": "<rootDir>/src/$1",
    "^@__tests__/(.*)$": "<rootDir>/__tests__/$1",
    "^@heroui/react$": "<rootDir>/node_modules/@heroui/react/dist/index.js",
  },
  testMatch: ["<rootDir>/__tests__/**/*.{test,spec}.{ts,tsx}"],
  collectCoverage: true,
  collectCoverageFrom: ["src/**/*.{ts,tsx}"],
}

export default createJestConfig(config)
