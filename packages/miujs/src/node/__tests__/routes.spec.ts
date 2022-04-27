import path from "path";
import type { MiuConfig } from "../types/config";
import type { RouteBuild } from "../types/server-build";
import { matchRoutes } from "../route-matching";
import { loadConfig } from "../config";

const root = path.resolve(__dirname, "fixtures/stack");

describe("node:routes", () => {
  let config: MiuConfig;
  beforeAll(async () => {
    config = await loadConfig(root);
  });

  describe("match route", () => {
    const mockModule = {};
    // @ts-ignore;
    const routes: RouteBuild[] = [
      {
        id: "home",
        path: "/",
        module: mockModule
      },
      {
        id: "products",
        path: "/products",
        module: mockModule
      },
      {
        id: "product",
        path: "/product/:id",
        module: mockModule
      },
      {
        id: "user",
        path: "/(user|u)",
        module: mockModule
      }
    ];
    test("/", () => {
      const result = matchRoutes(routes, "http://localhost:3000")?.matched;
      expect(result).toBeTruthy();
    });

    test("/products", () => {
      const result = matchRoutes(routes, "http://localhost:3000/products")?.matched;
      expect(result).toBeTruthy();
    });

    test("/product/apple", () => {
      const result = matchRoutes(routes, "http://localhost:3000/product/apple")?.matched;
      expect(result).toBeTruthy();
    });

    test("/us", () => {
      try {
        matchRoutes(routes, "http://localhost:3000/us")?.matched || false;
      } catch (e) {
        expect(e).toMatch("error");
      }
    });
  });
});
