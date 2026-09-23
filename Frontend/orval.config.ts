import { defineConfig } from 'orval'

// Generates a typed API client (TanStack Query hooks + TS types) from the
// backend's OpenAPI schema. Regenerate with: pnpm generate:api
export default defineConfig({
  api: {
    // The schema exported by the backend (`python -m scripts.export_openapi`).
    // Swap for 'http://localhost:8000/openapi.json' to read from a running server.
    input: {
      target: '../Backend/openapi.json',
    },
    output: {
      mode: 'tags-split',
      target: 'src/api/endpoints',
      schemas: 'src/api/model',
      client: 'react-query',
      httpClient: 'axios',
      clean: true,
      prettier: false,
      override: {
        // Routes every request through our axios instance (base URL, auth, etc.).
        mutator: {
          path: './src/api/http-client.ts',
          name: 'customInstance',
        },
      },
    },
  },
})
