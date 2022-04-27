# Change Log

All notable changes to this project will be documented in this file.

## [0.1.58] - 2022-04-23

### Added
#### by [@mast1ff](https://github.com/mast1ff) - 2022-04-23
- First Commit

## [0.1.60] - 2022-04-24
### Added
#### by [@mast1ff](https://github.com/mast1ff) - 2022-04-24
- Import esbuild module declaration
  - `src/node/compiler/builder/esbuild-laders.ts`
  - `src/node/index.ts`
- Postcss processor to Riot compiler
  - `src/node/compiler/builder/esbuild-server-template-plugin.ts`
- Clean build directories on build process
  - `src/node/compiler/builder/create-browser-build.ts`
- Render raw html
  - `src/node/riot.ts`
  - `src/node/server-handler.ts`
  - `src/node/types/render.ts`
- Include markdown contents to build
  - `src/node/types/config.ts`
  - `src/node/types/server-build.ts`
  - `src/node/types/server-handler.ts`
  - `src/node/types/route-modules.ts`
  - `src/node/config.ts`
  - `src/node/compiler/builder/esbuild-server-entry-module-plugin.ts`
  - `src/node/server-handler.ts`
- Install css on browser
  - `src/browser/entry.ts`
- Changed template engine
  - `src/node/config.ts`
  - `src/node/server-handler.ts`
  - `src/node/templates.ts`
  - `src/node/types/config.ts`
  - `src/node/types/server-build.ts`
  - `src/node/compiler/build.ts`
  - `src/node/comipler/builder/esbuild-loaders.ts`
  - `src/node/compiler/builder/esbuild-server-template-plugin.ts`

### Fixed
#### by [@mast1ff](https://github.com/mast1ff) - 2022-04-24
- Toplevel named route path in resolve config
  - `src/config.ts`

## [0.1.64] - 2022-04-27
### Fixed
#### by [@mast1ff](https://github.com/mast1ff) - 2022-04-27
- Problem of broken path mapping when multiple directories exist in the same level
  - `src/node/config.ts`