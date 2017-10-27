module.exports = {
  env: {
    node: true
  },
  extends: [
    "eslint:recommended",
    "plugin:node/recommended",
  ],
  parserOptions: {
    ecmaVersion: "2017",
    sourceType: "script",
  },
  plugins: [
    "node"
  ],
  rules: {
    "arrow-parens": ["error", "always"],
    "comma-dangle": ["error", "always-multiline"],
    "indent": ["error", 2],
    "no-console": "off" ,
    "no-empty": ["error", { allowEmptyCatch: true }],
    "no-unused-vars": ["error", { argsIgnorePattern: "^_" }],
    "quotes": ["error", "double"],
    "semi": ["error", "never"],
  },
}
