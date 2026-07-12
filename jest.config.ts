import type { Config } from "jest"
import nextJest from "next/jest"

const createJestConfig = nextJest({ dir: "./" })

const config: Config = {
  testEnvironment: "jsdom",
  setupFilesAfterEnv: ["<rootDir>/jest.setup.ts"],
  moduleNameMapper: {
    "^@/(.*)$": "<rootDir>/src/$1",
  },
  testMatch: ["<rootDir>/__tests__/**/*.{test,spec}.{ts,tsx}"],
  collectCoverage: true,
  collectCoverageFrom: ["src/**/*.{ts,tsx}"],
}

export default createJestConfig(config)
