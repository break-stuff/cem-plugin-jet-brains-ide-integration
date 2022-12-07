import {
    generateWebTypesFile,
    logPluginInit,
    setComponentReferences,
    updateConfig,
  } from "./web-type-generator/generator.js";
  import type { Options, Params } from "../types";
  
  export function generateWebTypes(params: Options = {}) {
    updateConfig(params);
  
    return {
      name: "cem-plugin-vs-code-custom-data-generator",
      // @ts-ignore
      analyzePhase({ ts, node, moduleDoc }) {
        setComponentReferences(ts, node, moduleDoc);
      },
      packageLinkPhase({ customElementsManifest }: Params) {
        logPluginInit();
        generateWebTypesFile(customElementsManifest);
      },
    };
  }
  