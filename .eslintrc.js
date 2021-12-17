module.exports = {
  env: {
    browser: true,
    es2021: true,
  },
  extends: ["airbnb-base"],
  parser: "@typescript-eslint/parser",
  parserOptions: {
    ecmaVersion: 13,
    sourceType: "module",
  },
  plugins: ["@typescript-eslint"],
  rules: {
    quotes: "off",
    "import/no-extraneous-dependencies": "off",
    "import/no-unresolved": "off",
    "max-classes-per-file": "off",
    "import/extensions": "off",
    "no-await-in-loop": "off",
    "comma-dangle": "off",
    "import/prefer-default-export": "off",
    "operator-linebreak": "off",
  },
};
