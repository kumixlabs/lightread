import { Monitor, Moon, Palette, Save, Settings, Sun, Type } from "lucide-react";

import { Dialog, DialogContent, DialogTitle } from "@kumix/ui/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@kumix/ui/ui/select";
import { Slider } from "@kumix/ui/ui/slider";
import { Switch } from "@kumix/ui/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@kumix/ui/ui/tabs";
import { useStore } from "@/stores/app-store";
import type { CodeTheme, Theme } from "@/types";

const THEME_OPTIONS: { value: Theme; label: string; icon: typeof Sun }[] = [
  { value: "light", label: "Light", icon: Sun },
  { value: "dark", label: "Dark", icon: Moon },
  { value: "system", label: "System", icon: Monitor },
];

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

function SettingRow({
  icon: Icon,
  label,
  hint,
  children,
}: {
  icon: typeof Sun;
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

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent
        showCloseButton
        className="max-w-2xl gap-0 overflow-hidden rounded-xl border-border p-0"
      >
        <DialogTitle className="sr-only">Settings</DialogTitle>
        <div className="flex items-center gap-2 border-border border-b px-5 py-4">
          <Settings className="size-5 text-muted-foreground" />
          <h2 className="font-semibold text-base">Settings</h2>
        </div>
        <Tabs defaultValue="appearance" className="flex min-h-105">
          <div className="w-44 shrink-0 border-border border-r bg-muted/20 p-3">
            <TabsList
              variant="line"
              className="flex h-auto w-full flex-col items-stretch gap-0.5 bg-transparent"
            >
              <TabsTrigger value="appearance" className="justify-start gap-2 px-3 py-2 text-sm">
                <Palette className="size-4" />
                Appearance
              </TabsTrigger>
              <TabsTrigger value="editor" className="justify-start gap-2 px-3 py-2 text-sm">
                <Type className="size-4" />
                Editor
              </TabsTrigger>
            </TabsList>
          </div>

          <div className="flex-1 px-6 py-2">
            <TabsContent value="appearance" className="mt-2">
              <div className="space-y-1">
                <p className="py-2 font-medium text-muted-foreground text-xs uppercase tracking-wide">
                  Theme
                </p>
                <div className="flex gap-2 py-1">
                  {THEME_OPTIONS.map(({ value, label, icon: Icon }) => (
                    <button
                      key={value}
                      onClick={() => updateSettings({ theme: value })}
                      className={`flex flex-1 flex-col items-center gap-2 rounded-lg border-2 p-4 transition-colors ${
                        settings.theme === value
                          ? "border-primary bg-primary/5"
                          : "border-border hover:bg-muted/50"
                      }`}
                    >
                      <Icon className="size-5" />
                      <span className="text-sm">{label}</span>
                    </button>
                  ))}
                </div>

                <div className="border-border border-t" />

                <p className="py-2 font-medium text-muted-foreground text-xs uppercase tracking-wide">
                  Font Size
                </p>
                <SettingRow icon={Type} label="Editor font size" hint={`${settings.fontSize}px`}>
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
              </div>
            </TabsContent>

            <TabsContent value="editor" className="mt-2">
              <div className="space-y-1">
                <SettingRow
                  icon={Type}
                  label="Line numbers"
                  hint="Show line numbers in code viewer"
                >
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
                <SettingRow
                  icon={Save}
                  label="Markdown default mode"
                  hint="Initial mode when opening .md files"
                >
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
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="source">Editable source</SelectItem>
                        <SelectItem value="preview">Rendered preview</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </SettingRow>
                <div className="border-border border-t" />

                <p className="py-2 font-medium text-muted-foreground text-xs uppercase tracking-wide">
                  Code Theme
                </p>
                <SettingRow icon={Palette} label="Syntax highlighting" hint="Shiki color scheme">
                  <div className="w-52">
                    <Select
                      value={settings.codeTheme}
                      onValueChange={(v) => updateSettings({ codeTheme: v as CodeTheme })}
                    >
                      <SelectTrigger size="sm" className="w-full">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {CODE_THEME_OPTIONS.map(({ value, label }) => (
                          <SelectItem key={value} value={value}>
                            {label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </SettingRow>
              </div>
            </TabsContent>
          </div>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}
