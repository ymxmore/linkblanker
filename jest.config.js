module.exports = {
    "roots": [
        "<rootDir>/src/ts",
        "<rootDir>/tests/ts",
    ],
    "testMatch": [
        "**/__tests__/**/*.+(ts|tsx|js)",
        "**/?(*.)+(spec|test).+(ts|tsx|js)",
    ],
    "transform": {
        "^.+\\.(ts|tsx)$": "ts-jest",
    },
};
