import { defineConfig } from "vite-plus";

export default defineConfig({
  lint: {
    ignorePatterns: ["public/draco/**"],
    jsPlugins: [{ name: "vite-plus", specifier: "vite-plus/oxlint-plugin" }],
    rules: { "vite-plus/prefer-vite-plus-imports": "error" },
    options: { typeAware: true, typeCheck: true },
  },
  fmt: {
    // Oxfmt does not support Astro files; Prettier checks them in `vp run verify`.
    ignorePatterns: ["public/draco/**", "**/*.astro", "worker-configuration.d.ts"],
    useTabs: false,
    tabWidth: 2,
    overrides: [
      {
        files: ["*.css"],
        options: {
          useTabs: true,
        },
      },
    ],
  },
  staged: {
    "*": "vp check --fix",
    "*.astro": "vp exec prettier --write",
  },
});
