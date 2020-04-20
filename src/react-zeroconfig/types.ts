import { PackageJson } from 'type-fest';

/* eslint-disable @typescript-eslint/typedef */
export const packageCommands = ['build', 'publish', 'validate', 'list', 'sync'] as const;
export const webappCommands = ['build', 'start', 'server-watch', 'server-start', 'browser-start'] as const;
export const desktopappCommands = ['build', 'start', 'electron-watch', 'electron-start'] as const;
export const extensionCommands = ['build', 'watch'] as const;
export const modes = ['production', 'development'] as const;
/* eslint-enable @typescript-eslint/typedef */

export type PackageCommand = typeof packageCommands[number];
export type WebappCommand = typeof webappCommands[number];
export type DesktopappCommand = typeof desktopappCommands[number];
export type ExtensionCommand = typeof extensionCommands[number];
export type Mode = typeof modes[number];

const packageCommandSet: Set<string> = new Set(packageCommands);
const webappCommandSet: Set<string> = new Set(webappCommands);
const desktopappCommandSet: Set<string> = new Set(desktopappCommands);
const extensionCommandSet: Set<string> = new Set(extensionCommands);
const modeSet: Set<string> = new Set(modes);

export function isPackageCommand(command: string): command is PackageCommand {
  return packageCommandSet.has(command);
}

export function isWebappCommand(command: string): command is WebappCommand {
  return webappCommandSet.has(command);
}

export function isDesktopappCommand(command: string): command is DesktopappCommand {
  return desktopappCommandSet.has(command);
}

export function isExtensionCommand(command: string): command is ExtensionCommand {
  return extensionCommandSet.has(command);
}

export function isMode(mode: string | undefined): mode is Mode {
  return mode ? modeSet.has(mode) : false;
}

export interface PackageArgv {
  command: PackageCommand;

  // publish
  // --choice false
  choice: boolean;
}

export interface PackageBuildOption {
  /** module name is package.json name */
  name: string;
  /** absolute index file location */
  file: string;
  /** build typescript declarations */
  buildTypescriptDeclaration: boolean;
  /** external libraries */
  externals: string[];
}

export interface PackagePublishOption {
  /** module name is package.json name */
  name: string;
  /** tag (eg. latest, alpha, beta) */
  tag: string;
  /** current package.json */
  currentPackageJson: PackageJson;
  /** remote package.json */
  remotePackageJson: PackageJson | undefined;
}

export interface WebappArgv {
  // common
  command: WebappCommand;
  app: string;

  // --source-map true --mode production
  // --source-map false --mode development
  sourceMap: boolean | undefined;

  // --static-file-directories "public static" - relative paths from cwd or absolute paths
  // --static-file-packages "xxx yyy" - packages
  staticFileDirectories: string | undefined;
  staticFilePackages: string | undefined;

  // build
  // --size-report false
  // --mode "production" | "development"
  // --output "/path/to" - relative paths from cwd or absolute paths
  // --app-file-name "app"
  // --vendor-file-name "vendor"
  // --style-file-name "style"
  // --chunk-path "" - a relative path from output
  // --public-path ""
  // --internal-eslint false
  sizeReport: boolean;
  mode: Mode;
  output: string | undefined;
  appFileName: string;
  vendorFileName: string;
  styleFileName: string;
  chunkPath: string;
  publicPath: string;
  internalEslint: boolean;

  // start
  // --port 3100
  // --server-port 4100
  // --https true | false
  // --https-key path-to-custom.key --https-cert path-to-custom.crt
  port: number;
  serverPort: number;
  https: boolean | { key: string; cert: string };
}

export interface WebappConfig {
  command: WebappCommand;
  app: string;

  sourceMap: boolean | undefined;

  // build
  staticFileDirectories: string[]; // absolute paths

  sizeReport: boolean;
  mode: Mode;
  output: string; // absolute paths
  appFileName: string;
  vendorFileName: string;
  styleFileName: string;
  chunkPath: string; // a relative path from output
  publicPath: string;
  internalEslint: boolean;

  // start
  port: number;
  serverPort: number;
  https: boolean | { key: string; cert: string };

  // internal
  cwd: string; // a absolute path
  zeroconfigPath: string; // a absolute path
  extend: {
    serverSideRendering: boolean;
    templateFiles: string[]; // file names without directory path
  };
}

export interface DesktopappArgv {
  // common
  command: DesktopappCommand;
  app: string;

  // --mode "production" | "development"
  mode: Mode;

  // --source-map true --mode production
  // --source-map false --mode development
  sourceMap: boolean | undefined;

  // --output "/path/to" - relative paths from cwd or absolute paths
  output: string | undefined;

  // --static-file-directories "public static" - relative paths from cwd or absolute paths
  // --static-file-packages "xxx yyy" - packages
  staticFileDirectories: string | undefined;
  staticFilePackages: string | undefined;
}

export interface DesktopappConfig {
  command: DesktopappCommand;
  app: string;

  sourceMap: boolean | undefined;

  // build
  staticFileDirectories: string[];

  mode: Mode;
  output: string; // absolute paths

  // internal
  cwd: string; // a absolute path
  zeroconfigPath: string; // a absolute path
  extend: {
    templateFiles: string[]; // file names without directory path
  };
}

export interface ExtensionArgv {
  command: ExtensionCommand;
  app: string;

  output: string | undefined;

  vendorFileName: string;
  styleFileName: string;

  staticFileDirectories: string | undefined;
  staticFilePackages: string | undefined;
}

export interface ExtensionConfig {
  command: ExtensionCommand;
  app: string;

  output: string; // absolute paths

  vendorFileName: string;
  styleFileName: string;

  staticFileDirectories: string[];

  entryFiles: string[];

  // internal
  cwd: string; // a absolute path
  zeroconfigPath: string; // a absolute path
  extend: {
    templateFiles: string[]; // file names without directory path
  };
}
