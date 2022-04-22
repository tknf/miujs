import { VirtualModule } from "../types/server-build";

export const SERVER_BUILD_VIRTUAL_MODULE: VirtualModule = {
  id: `miujs-server-build`,
  filter: /^miujs-server-build$/
};

export const ASSETS_MANIFEST_VIRTUAL_MODULE: VirtualModule = {
  id: `miujs-assets-manifest`,
  filter: /^miujs-assets-manifest$/
};
