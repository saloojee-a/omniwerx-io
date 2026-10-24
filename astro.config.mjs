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
        "connect-src 'self'",
        "font-src 'self'",
        "form-action 'self'",
        "frame-src 'none'",
        "img-src 'self'",
        "object-src 'none'",
        "worker-src 'self'",
      ],
      scriptDirective: {
        resources: ["'self'"],
      },
      styleDirective: {
        resources: [{ resource: "'unsafe-inline'", kind: "attribute" }],
      },
    },
  },
  vite: {
    build: {
      rolldownOptions: {
        // Font URLs are resolved by the production Worker rather than the build.
        external: /^\/fonts\/[^/]+\.woff2$/,
      },
    },
  },
});
