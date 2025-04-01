/// <reference path="../.astro/types.d.ts" />
/// <reference types="astro/client" />

interface ImportMetaEnv {
  readonly GOOGLE_API_KEY: string;
  readonly GOOGLE_PLACE_ID: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}