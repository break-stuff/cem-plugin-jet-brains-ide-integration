import fs from "fs";
import path from "path";
import prettier from "prettier";
import type {
  CssPart,
  CssProperty,
  CustomElementsManifest,
  Declaration,
  JsProperties,
  Options,
  Reference,
  WebTypeAttribute,
  WebTypeCssProperty,
  WebTypeElement,
  WebTypeEvent,
  WebTypePseudoElement,
} from "../../types";

const packageJson = JSON.parse(fs.readFileSync("package.json", "utf8"));
let componentReferences: { [key: string]: Reference[] } = {};
const defaultLabels = {
  slots: "Slots",
  events: "Events",
  cssProperties: "CSS Properties",
  cssParts: "CSS Parts",
};

export let config: Options = {
  outdir: "./",
  webTypesFileName: "web-types.json",
  exclude: [],
  descriptionSrc: undefined,
  slotDocs: true,
  eventDocs: true,
  cssPropertiesDocs: true,
  cssPartsDocs: true,
  excludeHtml: false,
  excludeCss: false,
  labels: {},
};

export function updateConfig(params: Options) {
  config = { ...config, ...params };
  config.labels = { ...defaultLabels, ...params?.labels };
}

export function getCssPropertyList(
  customElementsManifest: CustomElementsManifest
): WebTypeCssProperty[] {
  const components = getComponents(customElementsManifest);
  return (
    components?.map((component) => {
      return (
        component.cssProperties?.map((prop) => {
          return {
            name: prop.name,
            description: prop.description,
          };
        }) || []
      );
    }) || []
  ).flat();
}

export function getCssPartList(
  customElementsManifest: CustomElementsManifest
): WebTypePseudoElement[] {
  const components = getComponents(customElementsManifest);
  return (
    components?.map((component) => {
      return (
        component.cssParts?.map((prop) => {
          return {
            name: `part(${prop.name})`,
            description: prop.description,
          };
        }) || []
      );
    }) || []
  ).flat();
}

export function getCssPropertyValues(value?: string): string[] {
  return value
    ? (value.includes("|") ? value.split("|") : value.split(",")).map((x) =>
        getCssNameValue(x.trim())
      )
    : [];
}

function getCssNameValue(value: string) {
  return !value ? "" : value.startsWith("--") ? `var(${value})` : value;
}

export function getTagList(
  customElementsManifest: CustomElementsManifest
): WebTypeElement[] {
  const components = getComponents(customElementsManifest);
  return components.map((component) => {
    const slots =
      has(component.slots) && config.slotDocs
        ? `\n\n**${config.labels?.slots}:**\n ${getSlotDocs(component)}`
        : "";
    const events =
      has(component.events) && config.eventDocs
        ? `\n\n**${config.labels?.events}:**\n ${getEventDocs(component)}`
        : "";
    const cssProps =
      has(component.cssProperties) && config.cssPropertiesDocs
        ? `\n\n**${config.labels?.cssProperties}:**\n ${getCssPropertyDocs(
            component.cssProperties!
          )}`
        : "";
    const parts =
      has(component.cssParts) && config.cssPartsDocs
        ? `\n\n**${config.labels?.cssParts}:**\n ${getCssPartsDocs(
            component.cssParts!
          )}`
        : "";

    return {
      name: component.tagName,
      description:
        getDescription(component) + slots + events + cssProps + parts,
      ["doc-url"]: has(componentReferences[`${component.tagName}`])
        ? componentReferences[`${component.tagName}`][0]?.url
        : "",
      attributes: getComponentAttributes(component),
      js: getJsProperties(component),
    };
  });
}

function getJsProperties(component: Declaration): JsProperties {
  return {
    properties: getWebTypeProperties(component),
    events: getWebTypeEvents(component),
  };
}

function getWebTypeProperties(component: Declaration): WebTypeAttribute[] {
  return (
    (component.attributes || component.members)?.map((attr) => {
      return {
        name: attr.name,
        description: attr.description,
        value: {
          type: attr.type?.text,
        },
      };
    }) || []
  );
}

function getWebTypeEvents(component: Declaration): WebTypeEvent[] {
  return (
    component.events?.map((event) => {
      return {
        name: event.name,
        description: event.description,
      };
    }) || []
  );
}

function getDescription(component: Declaration) {
  return (
    (config.descriptionSrc
      ? component[config.descriptionSrc]
      : component.summary || component.description
    )?.replaceAll("\\n", "\n") || ""
  );
}

export function generateWebTypesFile(
  customElementsManifest: CustomElementsManifest
) {
  const elements = config.webTypesFileName
    ? getTagList(customElementsManifest)
    : [];
  const cssProperties = getCssPropertyList(customElementsManifest);
  const cssParts = getCssPartList(customElementsManifest);

  saveWebTypeFile(elements, cssProperties, cssParts);
}

function getComponents(customElementsManifest: CustomElementsManifest) {
  return customElementsManifest.modules
    ?.map((mod) =>
      mod?.declarations?.filter(
        (dec: Declaration) =>
          config.exclude &&
          !config.exclude.includes(dec.name) &&
          (dec.customElement || dec.tagName)
      )
    )
    .flat();
}

function getComponentAttributes(component: Declaration) {
  const attributes: WebTypeAttribute[] = [];
  component?.attributes?.forEach((attr) => {
    const existingAttr = attributes.find(
      (x) => x.name === attr.name || x.name === attr.fieldName
    );
    if (existingAttr) {
      return;
    }

    attributes.push({
      name: attr.name || attr.fieldName,
      description: attr.description,
      value: {
        type: attr.type?.text,
      },
    } as WebTypeAttribute);
  });

  return attributes;
}

function getEventDocs(component: Declaration) {
  return component.events
    ?.map((event) => `- **${event.name}** - ${event.description}`)
    .join("\n");
}

function getCssPropertyDocs(properties: CssProperty[]) {
  return properties
    ?.map(
      (prop) =>
        `- **${prop.name}** - ${prop.description} _(default: ${prop.default})_`
    )
    .join("\n");
}

function getCssPartsDocs(parts: CssPart[]) {
  return parts
    ?.map((part) => `- **${part.name}** - ${part.description}`)
    .join("\n");
}

function getSlotDocs(component: Declaration) {
  return component.slots
    ?.map(
      (slot) =>
        `- ${slot.name ? `**${slot.name}**` : "_default_"} - ${
          slot.description
        }`
    )
    .join("\n");
}

function has(arr?: any[]) {
  return Array.isArray(arr) && arr.length > 0;
}

export function removeQuoteWrappers(value: string) {
  return value.trim().replace(/^["'](.+(?=["']$))["']$/, "$1");
}

//
// CEM Analysis
//

export function setComponentReferences(ts: any, node: any, moduleDoc: any) {
  if (node.kind !== ts.SyntaxKind.ClassDeclaration) {
    return;
  }

  const references = getReferences(node);
  updateReferences(references, node, moduleDoc);
}

function getReferences(node: any) {
  const docs = getDocsByTagName(node, "reference");
  return docs
    ?.map((tags: any) =>
      tags?.map((doc: any) => {
        const values = doc?.comment.split(/ - (.*)/s);

        if (values && values.length > 1) {
          return {
            name: values[0].trim(),
            url: values[1].trim(),
          };
        }
      })
    )
    .flat();
}

function updateReferences(references: Reference[], node: any, moduleDoc: any) {
  if (!references?.length) {
    return;
  }

  const className: string = node.name.getText();
  const component: Declaration = moduleDoc?.declarations?.find(
    (dec: Declaration) => dec.name === className
  );

  componentReferences[`${component.tagName}`] = references as Reference[];
}

function getDocsByTagName(node: any, tagName: string) {
  return node?.jsDoc?.map((doc: any) =>
    doc?.tags?.filter((tag: any) => tag?.tagName?.getText() === tagName)
  );
}

//
// OUTPUTS
//

export function logPluginInit() {
  console.log(
    "\u001b[" +
      32 +
      "m" +
      "[vs-code-custom-data-generator] - Generating config files..." +
      "\u001b[0m"
  );
}

export function saveWebTypeFile(
  tags: WebTypeElement[],
  cssProperties: WebTypeCssProperty[],
  parts: WebTypePseudoElement[]
) {
  createOutdir(config.outdir!);

  if (config.webTypesFileName) {
    saveFile(
      config.outdir!,
      config.webTypesFileName!,
      getWebTypesFileContents(tags, cssProperties, parts)
    );
    savePackageJson(packageJson);
  }
}

export function createOutdir(outdir: string) {
  if (outdir !== "./" && !fs.existsSync(outdir)) {
    fs.mkdirSync(outdir);
  }
}

function saveFile(outdir: string, fileName: string, contents: string) {
  fs.writeFileSync(
    path.join(outdir, fileName),
    prettier.format(contents, { parser: "json" })
  );
}

function savePackageJson(packageJson: any) {
  packageJson["web-types"] =
    (!config.outdir?.endsWith("/") ? config.outdir + "/" : config.outdir || "") +
    config.webTypesFileName;
  fs.writeFileSync("./package.json", JSON.stringify(packageJson, null, 2));
}

function getWebTypesFileContents(
  tags: WebTypeElement[],
  cssProperties: WebTypeCssProperty[],
  parts: WebTypePseudoElement[]
) {
  return `{
    "$schema": "https://json.schemastore.org/web-types",
    "name": "${packageJson.name}",
    "version": "${packageJson.version}",
    "description-markup": "markdown",
    "contributions": {
      ${
        config.excludeHtml
          ? ""
          : `"html": {
        "elements": ${JSON.stringify(tags)}
      },`
      }
      ${
        config.excludeCss
          ? ""
          : `"css": {
        "properties": ${JSON.stringify(cssProperties)},
        "pseudo-elements": ${JSON.stringify(parts)}
      }`
      }
    }
  }`;
}
