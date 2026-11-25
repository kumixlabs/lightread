import { useState } from "react";
import { check } from "@tauri-apps/plugin-updater";
import {
  CheckCircle2,
  Download,
  Loader2,
  Palette,
  RefreshCw,
  RotateCcw,
  Ruler,
  Save,
  Settings,
  Sparkles,
  Type,
} from "lucide-react";

import { Button } from "@kumix/ui/ui/button";
import {
  Combobox,
  ComboboxContent,
  ComboboxEmpty,
  ComboboxInput,
  ComboboxItem,
  ComboboxList,
  ComboboxTrigger,
  ComboboxValue,
} from "@kumix/ui/ui/combobox";
import { Dialog, DialogContent, DialogTitle } from "@kumix/ui/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@kumix/ui/ui/select";
import { Slider } from "@kumix/ui/ui/slider";
import { Switch } from "@kumix/ui/ui/switch";
import { formatBytes } from "@/lib/utils";
import { useStore } from "@/stores/app-store";
import type { CodeTheme } from "@/types";

const CODE_THEME_OPTIONS: { value: CodeTheme; label: string }[] = [
  { value: "auto", label: "Auto (follow theme)" },
  { value: "github-dark", label: "GitHub Dark" },
  { value: "github-light", label: "GitHub Light" },
  { value: "one-dark-pro", label: "One Dark Pro" },
  { value: "dracula", label: "Dracula" },
  { value: "nord", label: "Nord" },
  { value: "vitesse-dark", label: "Vitesse Dark" },
  { value: "vitesse-light", label: "Vitesse Light" },
  { value: "catppuccin-mocha", label: "Catppuccin Mocha" },
  { value: "catppuccin-latte", label: "Catppuccin Latte" },
  { value: "monokai", label: "Monokai" },
];

const MARKDOWN_MODE_LABELS: Record<"source" | "preview", string> = {
  source: "Editable source",
  preview: "Rendered preview",
};

function SectionTitle({ children }: { children: React.ReactNode }) {
  return (
    <p className="text-muted-foreground pt-4 pb-1 text-xs font-medium tracking-wide uppercase">
      {children}
    </p>
  );
}

function SettingRow({
  icon: Icon,
  label,
  hint,
  children,
}: {
  icon: typeof Type;
  label: string;
  hint?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex items-center justify-between gap-4 py-3">
      <div className="flex items-center gap-3">
        <div className="bg-muted/60 flex size-8 items-center justify-center rounded-lg">
          <Icon className="text-muted-foreground size-4" />
        </div>
        <div>
          <p className="text-sm font-medium">{label}</p>
          {hint && <p className="text-muted-foreground text-xs">{hint}</p>}
        </div>
      </div>
      {children}
    </div>
  );
}

export function SettingsDialog() {
  const open = useStore((s) => s.settingsOpen);
  const setOpen = useStore((s) => s.setSettingsOpen);
  const settings = useStore((s) => s.settings);
  const updateSettings = useStore((s) => s.updateSettings);
  const resetSettings = useStore((s) => s.resetSettings);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent
        showCloseButton
        className="border-border w-140 max-w-[92vw] gap-0 overflow-hidden rounded-xl p-0 sm:max-w-[92vw]"
      >
        <DialogTitle className="sr-only">Settings</DialogTitle>
        <div className="border-border flex items-center gap-2 border-b px-5 py-4">
          <Settings className="text-muted-foreground size-5" />
          <h2 className="text-base font-semibold">Settings</h2>
        </div>

        <div className="max-h-[70vh] overflow-y-auto px-5 pb-4">
          <SectionTitle>Editor</SectionTitle>
          <SettingRow icon={Type} label="Font size" hint={`${settings.fontSize}px`}>
            <div className="w-40">
              <Slider
                value={[settings.fontSize]}
                onValueChange={(v) =>
                  updateSettings({
                    fontSize: Array.isArray(v) ? (v[0] ?? 14) : v,
                  })
                }
                min={10}
                max={28}
                step={1}
              />
            </div>
          </SettingRow>
          <div className="border-border border-t" />
          <SettingRow icon={Ruler} label="Line height" hint={`${settings.lineHeight.toFixed(2)}`}>
            <div className="w-40">
              <Slider
                value={[settings.lineHeight]}
                onValueChange={(v) =>
                  updateSettings({
                    lineHeight: Array.isArray(v) ? (v[0] ?? 1.75) : v,
                  })
                }
                min={1}
                max={3}
                step={0.05}
              />
            </div>
          </SettingRow>
          <div className="border-border border-t" />
          <SettingRow icon={Type} label="Line numbers" hint="Show line numbers in code viewer">
            <Switch
              checked={settings.showLineNumbers}
              onCheckedChange={(v) => updateSettings({ showLineNumbers: v })}
            />
          </SettingRow>
          <div className="border-border border-t" />
          <SettingRow icon={Type} label="Word wrap" hint="Wrap long lines">
            <Switch
              checked={settings.wordWrap}
              onCheckedChange={(v) => updateSettings({ wordWrap: v })}
            />
          </SettingRow>
          <div className="border-border border-t" />
          <SettingRow icon={Type} label="Auto refresh" hint="Reload files on external change">
            <Switch
              checked={settings.autoRefresh}
              onCheckedChange={(v) => updateSettings({ autoRefresh: v })}
            />
          </SettingRow>
          <div className="border-border border-t" />
          <SettingRow icon={Save} label="Markdown default mode" hint="Initial mode for .md files">
            <div className="w-52">
              <Select
                value={settings.markdownDefaultMode}
                onValueChange={(v) =>
                  updateSettings({
                    markdownDefaultMode: v as "source" | "preview",
                  })
                }
              >
                <SelectTrigger size="sm" className="w-full">
                  <SelectValue>
                    {(val) => MARKDOWN_MODE_LABELS[val as "source" | "preview"] ?? val}
                  </SelectValue>
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="source">Editable source</SelectItem>
                  <SelectItem value="preview">Rendered preview</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </SettingRow>

          <SectionTitle>Code Theme</SectionTitle>
          <SettingRow icon={Palette} label="Syntax highlighting" hint="Shiki color scheme">
            <div className="w-52">
              <Combobox
                items={CODE_THEME_OPTIONS}
                value={
                  CODE_THEME_OPTIONS.find((o) => o.value === settings.codeTheme) ??
                  CODE_THEME_OPTIONS[0]
                }
                onValueChange={(item) => {
                  if (item) updateSettings({ codeTheme: item.value });
                }}
                itemToStringLabel={(item) => item?.label ?? ""}
                itemToStringValue={(item) => item?.value ?? ""}
              >
                <ComboboxTrigger className="border-input bg-background hover:bg-accent/50 flex h-8 w-full items-center justify-between rounded-md border px-3 py-1.5 text-xs shadow-xs">
                  <ComboboxValue placeholder="Select theme...">
                    {(item) => item?.label}
                  </ComboboxValue>
                </ComboboxTrigger>
                <ComboboxContent align="end" className="w-56">
                  <ComboboxInput
                    placeholder="Search theme..."
                    showTrigger={false}
                    showClear
                    className="text-xs"
                  />
                  <ComboboxList>
                    <ComboboxEmpty>No theme found</ComboboxEmpty>
                    {CODE_THEME_OPTIONS.map((item) => (
                      <ComboboxItem key={item.value} value={item} className="text-xs">
                        {item.label}
                      </ComboboxItem>
                    ))}
                  </ComboboxList>
                </ComboboxContent>
              </Combobox>
            </div>
          </SettingRow>

          <SectionTitle>Application & Updates</SectionTitle>
          <SettingRow
            icon={RefreshCw}
            label="Auto-update"
            hint="Check on launch, download & install in the background, restart when ready"
          >
            <Switch
              checked={settings.autoUpdate}
              onCheckedChange={(v) => updateSettings({ autoUpdate: v })}
            />
          </SettingRow>
          <div className="border-border border-t" />
          <UpdateCheckerRow />
        </div>

        <div className="border-border bg-muted/20 flex items-center justify-between border-t px-5 py-3">
          <Button
            variant="ghost"
            size="sm"
            onClick={resetSettings}
            className="text-muted-foreground hover:text-foreground text-xs"
          >
            <RotateCcw className="mr-1.5 size-3.5" />
            Reset to defaults
          </Button>
          <Button variant="outline" size="sm" onClick={() => setOpen(false)}>
            Close
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

function UpdateCheckerRow() {
  // Local state only covers the manual check; download/install/relaunch go
  // through the store's installUpdate (shared with the status-bar badge),
  // which enforces the dirty-tab guard before relaunching.
  const [status, setStatus] = useState<"idle" | "checking" | "latest">("idle");
  const [checkError, setCheckError] = useState<string | null>(null);
  const updateAvailable = useStore((s) => s.updateAvailable);
  const updateProgress = useStore((s) => s.updateProgress);
  const updatePendingRestart = useStore((s) => s.updatePendingRestart);
  const updateError = useStore((s) => s.updateError);
  const installUpdate = useStore((s) => s.installUpdate);

  const handleCheckUpdate = async () => {
    setStatus("checking");
    setCheckError(null);
    try {
      const update = await check();
      useStore.setState({ updateAvailable: update?.available ? update.version : null });
      setStatus(update?.available ? "idle" : "latest");
    } catch (err) {
      setStatus("idle");
      setCheckError(err instanceof Error ? err.message : "Failed to check for updates");
    }
  };

  const busy = !!updateProgress;
  const statusText =
    status === "checking"
      ? "Checking for new releases..."
      : checkError
        ? checkError
        : updateError
          ? updateError
          : updateProgress
            ? `Downloading & installing — ${formatBytes(updateProgress.received)}${
                updateProgress.total ? ` / ${formatBytes(updateProgress.total)}` : ""
              }`
            : updatePendingRestart
              ? `v${updateAvailable} installed — restart to finish`
              : updateAvailable
                ? `Update available: v${updateAvailable}`
                : status === "latest"
                  ? "You're on the latest version"
                  : "Check GitHub Releases for updates";

  return (
    <div className="flex flex-col gap-2 py-3">
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="bg-muted/60 flex size-8 items-center justify-center rounded-lg">
            <Sparkles className="text-muted-foreground size-4" />
          </div>
          <div>
            <p className="text-sm font-medium">LightRead v{__APP_VERSION__}</p>
            <p className="text-muted-foreground text-xs">{statusText}</p>
          </div>
        </div>
        <div>
          {updateAvailable && !busy ? (
            <Button size="sm" onClick={() => void installUpdate()} className="gap-1.5">
              {updatePendingRestart ? (
                <>
                  <RotateCcw className="size-3.5" />
                  Restart to update
                </>
              ) : (
                <>
                  <Download className="size-3.5" />
                  Update to v{updateAvailable}
                </>
              )}
            </Button>
          ) : (
            <Button
              variant="outline"
              size="sm"
              disabled={status === "checking" || busy}
              onClick={handleCheckUpdate}
              className="gap-1.5"
            >
              {status === "checking" || busy ? (
                <Loader2 className="size-3.5 animate-spin" />
              ) : status === "latest" ? (
                <CheckCircle2 className="size-3.5 text-emerald-500" />
              ) : (
                <RefreshCw className="size-3.5" />
              )}
              {status === "checking"
                ? "Checking..."
                : busy
                  ? "Updating..."
                  : status === "latest"
                    ? "Up to date"
                    : "Check updates"}
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
