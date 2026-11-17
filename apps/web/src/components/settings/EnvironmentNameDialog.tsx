import {
  AuthSettingsWriteScope,
  ENVIRONMENT_NAME_MAX_LENGTH,
  resolveEnvironmentLabel,
  type EnvironmentId,
  type ServerConfig,
} from "@t3tools/contracts";
import { useId, useState } from "react";

import { useUpdateEnvironmentSettings } from "../../hooks/useSettings";
import { useEnvironmentScope } from "../../state/session";
import { Button } from "../ui/button";
import {
  Dialog,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogPanel,
  DialogPopup,
  DialogTitle,
} from "../ui/dialog";
import { Input } from "../ui/input";
import { Label } from "../ui/label";
import { MenuItem } from "../ui/menu";

type NameServerConfig = Pick<ServerConfig, "environment" | "settings">;

export function resolveEnvironmentNameLock(input: {
  readonly serverConfig: NameServerConfig | null;
  readonly operateAccess: "granted" | "denied";
}): string | null {
  if (input.serverConfig === null) {
    return "Connect to this environment to rename it.";
  }
  if (input.serverConfig.environment.capabilities.environmentName !== true) {
    return "Update T3 Code on this environment to rename it.";
  }
  if (input.operateAccess !== "granted") {
    return "Your session on this environment cannot change its settings.";
  }
  return null;
}

/** The host's own name is the default, so saving it clears the override. */
export function environmentNameSetting(draft: string, hostLabel: string): string | null {
  const name = draft.trim();
  return name === "" || name === hostLabel ? null : name;
}

export function EnvironmentRenameMenuItem({
  environmentId,
  serverConfig,
  onSelect,
}: {
  readonly environmentId: EnvironmentId;
  readonly serverConfig: NameServerConfig | null;
  readonly onSelect: () => void;
}) {
  const operateAccess = useEnvironmentScope(environmentId, AuthSettingsWriteScope)
    ? "granted"
    : "denied";
  const lock = resolveEnvironmentNameLock({ serverConfig, operateAccess });
  return (
    <MenuItem disabled={lock !== null} title={lock ?? undefined} onClick={onSelect}>
      Rename…
    </MenuItem>
  );
}

export function EnvironmentNameDialog({
  environmentId,
  serverConfig,
  open,
  onOpenChange,
}: {
  readonly environmentId: EnvironmentId;
  readonly serverConfig: NameServerConfig | null;
  readonly open: boolean;
  readonly onOpenChange: (open: boolean) => void;
}) {
  const updateSettings = useUpdateEnvironmentSettings(environmentId);
  const inputId = useId();
  const hostLabel = serverConfig?.environment.label ?? "";
  const current = serverConfig === null ? "" : resolveEnvironmentLabel(serverConfig);
  const [draft, setDraft] = useState(current);
  const [wasOpen, setWasOpen] = useState(open);
  if (open !== wasOpen) {
    setWasOpen(open);
    if (open) setDraft(current);
  }
  const overridden = serverConfig?.settings?.environmentName != null;

  const save = (environmentName: string | null) => {
    if (environmentName !== (serverConfig?.settings?.environmentName ?? null)) {
      updateSettings({ environmentName });
    }
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogPopup>
        <form
          className="flex min-h-0 flex-col"
          onSubmit={(event) => {
            event.preventDefault();
            save(environmentNameSetting(draft, hostLabel));
          }}
        >
          <DialogHeader>
            <DialogTitle>Rename environment</DialogTitle>
            <DialogDescription>
              Every device connected to this environment shows the new name.
            </DialogDescription>
          </DialogHeader>
          <DialogPanel>
            <div className="flex flex-col gap-2">
              <Label htmlFor={inputId}>Name</Label>
              <Input
                id={inputId}
                autoFocus
                value={draft}
                maxLength={ENVIRONMENT_NAME_MAX_LENGTH}
                placeholder={hostLabel}
                onChange={(event) => setDraft(event.target.value)}
              />
              {hostLabel ? (
                <p className="text-sm text-muted-foreground">
                  Leave it empty to use the computer's name, {hostLabel}.
                </p>
              ) : null}
            </div>
          </DialogPanel>
          <DialogFooter>
            {overridden ? (
              <Button variant="ghost" className="sm:mr-auto" onClick={() => save(null)}>
                Use computer name
              </Button>
            ) : null}
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit">Save</Button>
          </DialogFooter>
        </form>
      </DialogPopup>
    </Dialog>
  );
}
