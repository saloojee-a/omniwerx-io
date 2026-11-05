// @ts-check
import { defineConfig, passthroughImageService } from "astro/config";

// https://astro.build/config
export default defineConfig({
  site: "https://omniwerx.io",
  image: {
    service: passthroughImageService(),
  },
  security: {
    csp: {
      directives: [
        "default-src 'self'",
        "base-uri 'none'",
        "connect-src 'self' blob:",
        "font-src 'self'",
        "form-action 'self'",
        "frame-src 'none'",
        "img-src 'self' blob:",
        "object-src 'none'",
        "worker-src 'self' blob:",
      ],
      scriptDirective: {
        resources: ["'self'", "'wasm-unsafe-eval'"],
      },
      styleDirective: {
        resources: [{ resource: "'unsafe-inline'", kind: "attribute" }],
      },
    },
  },
  vite: {
    assetsInclude: ["**/*.glb", "**/*.hdr"],
    build: {
      rolldownOptions: {
        // Font URLs are resolved by the production Worker rather than the build.
        external: /^\/fonts\/[^/]+\.woff2$/,
      },
    },
  },
});
