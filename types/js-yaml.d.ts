declare module "js-yaml" {
  export function load(input: string): unknown;

  const yaml: {
    load(input: string): unknown;
  };

  export default yaml;
}

