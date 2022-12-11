/**
 * CONFIGURATION
 */

export interface Options {
  /** Path to output directory */
  outdir?: string;
  /** Name of the file for your custom data */
  webTypesFileName?: string | null;
  /** Class names of any components you would like to exclude from the custom data */
  exclude?: string[];
  /** The property name from the component object constructed by the CEM Analyzer */
  descriptionSrc?: "description" | "summary";
  /** Displays the slot section of the element description */
  slotDocs?: boolean;
  /** Displays the event section of the element description */
  eventDocs?: boolean;
  /** Displays the CSS custom properties section of the element description */
  cssPropertiesDocs?: boolean;
  /** Displays the CSS parts section of the element description */
  cssPartsDocs?: boolean;
  /** Excludes any custom element documentation */
  excludeHtml?: boolean;
  /** Excludes any custom CSS documentation */
  excludeCss?: boolean;
  /** Overrides the default section labels in the component description */
  labels?: DescriptionLabels;
}

interface DescriptionLabels {
  slots?: string;
  events?: string;
  cssProperties?: string;
  cssParts?: string;
}


/**
 * WEB-TYPE
 */

export interface WebTypeElement {
  name: string;
  description: string;
  ['doc-url']: string;
  attributes: WebTypeAttribute[];
  js?: JsProperties;
}

interface WebTypeAttribute {
  name: string;
  description: string;
  value: WebTypeValue;
}

interface WebTypeValue {
  type: string;
}

interface JsProperties {
  properties: WebTypeAttribute[];
  events: WebTypeEvent[];
}

interface WebTypeEvent {
  name: string;
  description: string;
}

interface WebTypePseudoElement {
  name: string;
  description: string;
  docUrl?: string;
  arguments?: boolean;
  deprecated?: boolean;
}

interface WebTypeCssProperty {
  name: string;
  description?: string;
  values?: string[];
}

interface Reference {
  name: string;
  url: string;
}

/**
 *
 * CEM TYPES
 *
 */

export interface Params {
  customElementsManifest: CustomElementsManifest;
}

export interface CustomElementsManifest {
  schemaVersion: string;
  readme: string;
  modules: Module[];
}

interface Module {
  kind: string;
  path: string;
  declarations: Declaration[];
  exports: Export[];
}

export interface Declaration {
  kind: string;
  description: string;
  name: string;
  cssProperties?: CssProperty[];
  cssParts?: CssPart[];
  slots: Slot[];
  members?: Member[];
  events?: Event[];
  attributes: Attribute[];
  superclass: SuperClass;
  tagName: string;
  summary?: string;
  customElement: boolean;
}
interface CssProperty {
  description: string;
  name: string;
  default?: string;
  type?: Type;
}

interface CssPart {
  description: string;
  name: string;
}

interface Slot {
  description: string;
  name: string;
}

interface Member {
  kind: string;
  name: string;
  type: Type;
  default?: string;
  description: string;
  attribute?: string;
  reflects?: boolean;
  privacy?: string;
  parameters?: Parameter[];
  return?: Return;
  static?: boolean;
}

interface Type {
  text: string;
}

interface Parameter {
  name: string;
  type: Type;
}

interface Return {
  type: Type;
}

interface Event {
  name: string;
  type?: Type;
  description: string;
}

interface Attribute {
  name: string;
  type: Type;
  default?: string;
  description: string;
  fieldName?: string;
}

interface SuperClass {
  name: string;
  package?: string;
}

interface Export {
  kind: string;
  name: string;
  declaration: {
    name: string;
    module: string;
  };
}
