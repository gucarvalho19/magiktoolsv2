import { Bucket } from "encore.dev/storage/objects";

export const magikToolsLogos = new Bucket("magiktools-logos", {
  public: true,
  versioned: false,
});
