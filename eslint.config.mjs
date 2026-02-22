import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  // Override default ignores of eslint-config-next.
  globalIgnores([
    // Default ignores of eslint-config-next:
    ".next/**",
    "out/**",
    "build/**",
    "next-env.d.ts",
    "scripts/**",
    // Evaluation/tooling scripts are not part of the Next.js app
    "eval/**",
  ]),
  {
    rules: {
      // Downgrade from error to warn — codebase uses `any` extensively in
      // AI/streaming contexts where precise types are non-trivial to add.
      "@typescript-eslint/no-explicit-any": "warn",
      // Calling setState inside a useEffect is a legitimate initialization
      // pattern; downgrade to warn rather than blocking CI.
      "react-hooks/set-state-in-effect": "warn",
    },
  },
]);

export default eslintConfig;
