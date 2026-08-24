import { useState } from "react";
import { relaunch } from "@tauri-apps/plugin-process";
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
    <p className="pt-4 pb-1 font-medium text-muted-foreground text-xs uppercase tracking-wide">
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
        <div className="flex size-8 items-center justify-center rounded-lg bg-muted/60">
          <Icon className="size-4 text-muted-foreground" />
        </div>
        <div>
          <p className="font-medium text-sm">{label}</p>
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
        className="w-140 max-w-[92vw] gap-0 overflow-hidden rounded-xl border-border p-0 sm:max-w-[92vw]"
      >
        <DialogTitle className="sr-only">Settings</DialogTitle>
        <div className="flex items-center gap-2 border-border border-b px-5 py-4">
          <Settings className="size-5 text-muted-foreground" />
          <h2 className="font-semibold text-base">Settings</h2>
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
                <ComboboxTrigger className="flex h-8 w-full items-center justify-between rounded-md border border-input bg-background px-3 py-1.5 text-xs shadow-xs hover:bg-accent/50">
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
          <UpdateCheckerRow />
        </div>

        <div className="flex items-center justify-between border-border border-t bg-muted/20 px-5 py-3">
          <Button
            variant="ghost"
            size="sm"
            onClick={resetSettings}
            className="text-muted-foreground text-xs hover:text-foreground"
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
  const [status, setStatus] = useState<
    "idle" | "checking" | "latest" | "available" | "downloading" | "error"
  >("idle");
  const [newVersion, setNewVersion] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [updateHandle, setUpdateHandle] = useState<Awaited<ReturnType<typeof check>> | null>(null);

  const handleCheckUpdate = async () => {
    setStatus("checking");
    setErrorMessage(null);
    try {
      const update = await check();
      if (update?.available) {
        setNewVersion(update.version);
        setUpdateHandle(update);
        setStatus("available");
      } else {
        setStatus("latest");
      }
    } catch (err) {
      setStatus("error");
      setErrorMessage(err instanceof Error ? err.message : "Failed to check for updates");
    }
  };

  const handleInstallUpdate = async () => {
    if (!updateHandle) return;
    setStatus("downloading");
    try {
      await updateHandle.downloadAndInstall();
      await relaunch();
    } catch (err) {
      setStatus("error");
      setErrorMessage(err instanceof Error ? err.message : "Failed to download update");
    }
  };

  return (
    <div className="flex flex-col gap-2 py-3">
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="flex size-8 items-center justify-center rounded-lg bg-muted/60">
            <Sparkles className="size-4 text-muted-foreground" />
          </div>
          <div>
            <p className="font-medium text-sm">LightRead v{__APP_VERSION__}</p>
            <p className="text-muted-foreground text-xs">
              {status === "checking" && "Checking for new releases..."}
              {status === "latest" && "You're on the latest version"}
              {status === "available" && `Update available: v${newVersion}`}
              {status === "downloading" && "Downloading & installing update..."}
              {status === "error" && (errorMessage || "Update check failed")}
              {status === "idle" && "Check GitHub Releases for updates"}
            </p>
          </div>
        </div>
        <div>
          {status === "available" ? (
            <Button size="sm" onClick={handleInstallUpdate} className="gap-1.5">
              <Download className="size-3.5" />
              Update to v{newVersion}
            </Button>
          ) : (
            <Button
              variant="outline"
              size="sm"
              disabled={status === "checking" || status === "downloading"}
              onClick={handleCheckUpdate}
              className="gap-1.5"
            >
              {status === "checking" || status === "downloading" ? (
                <Loader2 className="size-3.5 animate-spin" />
              ) : status === "latest" ? (
                <CheckCircle2 className="size-3.5 text-emerald-500" />
              ) : (
                <RefreshCw className="size-3.5" />
              )}
              {status === "checking"
                ? "Checking..."
                : status === "downloading"
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
