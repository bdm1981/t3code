import type { ServerConfig } from "@t3tools/contracts";
import { describe, expect, it } from "vite-plus/test";

import { environmentNameSetting, resolveEnvironmentNameLock } from "./EnvironmentNameDialog";

const config = (environmentName?: boolean) =>
  ({
    environment: { capabilities: environmentName === undefined ? {} : { environmentName } },
  }) as unknown as ServerConfig;

describe("resolveEnvironmentNameLock", () => {
  it("locks servers that would drop the name", () => {
    expect(
      resolveEnvironmentNameLock({ serverConfig: config(), operateAccess: "granted" }),
    ).toMatch(/Update T3 Code/);
    expect(
      resolveEnvironmentNameLock({ serverConfig: config(true), operateAccess: "denied" }),
    ).toMatch(/cannot change/);
    expect(
      resolveEnvironmentNameLock({ serverConfig: config(true), operateAccess: "granted" }),
    ).toBeNull();
  });
});

describe("environmentNameSetting", () => {
  it.each([
    ["  Studio  ", "Studio"],
    ["", null],
    ["   ", null],
    ["Mac Studio (2)", null],
  ])("saves %j as %j", (draft, expected) => {
    expect(environmentNameSetting(draft, "Mac Studio (2)")).toBe(expected);
  });
});
