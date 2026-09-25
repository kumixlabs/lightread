import { beforeEach, describe, expect, it } from "bun:test";

// Mock localStorage before app-store import to suppress persist middleware warnings
if (typeof window === "undefined" || !globalThis.localStorage) {
  const store = new Map<string, string>();
  const mockStorage = {
    getItem: (key: string) => store.get(key) ?? null,
    setItem: (key: string, val: string) => {
      store.set(key, val);
    },
    removeItem: (key: string) => {
      store.delete(key);
    },
    clear: () => store.clear(),
    key: (index: number) => Array.from(store.keys())[index] ?? null,
    get length() {
      return store.size;
    },
  };
  Object.defineProperty(globalThis, "localStorage", {
    value: mockStorage,
    configurable: true,
    writable: true,
  });
  if (typeof window !== "undefined") {
    Object.defineProperty(window, "localStorage", {
      value: mockStorage,
      configurable: true,
      writable: true,
    });
  }
}

const { useStore } = await import("./app-store");

describe("recents management", () => {
  beforeEach(() => {
    useStore.getState().clearRecents();
  });

  it("stores directories and files with independent quotas", () => {
    const { addRecent } = useStore.getState();

    // Add 2 directories
    addRecent({ path: "C:/projects/app1", name: "app1", isDir: true, openedAt: 1000 });
    addRecent({ path: "C:/projects/app2", name: "app2", isDir: true, openedAt: 2000 });

    // Add 25 files (more than 20)
    for (let i = 1; i <= 25; i++) {
      addRecent({
        path: `C:/projects/app2/file${i}.ts`,
        name: `file${i}.ts`,
        isDir: false,
        openedAt: 3000 + i,
      });
    }

    const { recents } = useStore.getState();
    const dirs = recents.filter((r) => r.isDir);
    const files = recents.filter((r) => !r.isDir);

    // Both directories MUST still be present (not kicked out by 25 files)
    expect(dirs.length).toBe(2);
    expect(dirs.map((d) => d.name)).toContain("app1");
    expect(dirs.map((d) => d.name)).toContain("app2");
    expect(files.length).toBe(25);
  });

  it("deduplicates paths across Windows and POSIX separators", () => {
    const { addRecent } = useStore.getState();

    addRecent({
      path: "C:\\Users\\dev\\project",
      name: "project",
      isDir: true,
      openedAt: 1000,
    });
    addRecent({
      path: "C:/Users/dev/project",
      name: "project",
      isDir: true,
      openedAt: 2000,
    });

    const { recents } = useStore.getState();
    const dirs = recents.filter((r) => r.isDir);
    expect(dirs.length).toBe(1);
    expect(dirs[0].openedAt).toBe(2000);
  });

  it("removes recent items by path regardless of slash format", () => {
    const { addRecent, removeRecent } = useStore.getState();

    addRecent({
      path: "C:/Users/dev/docs/readme.md",
      name: "readme.md",
      isDir: false,
      openedAt: 1000,
    });
    expect(useStore.getState().recents.length).toBe(1);

    removeRecent("C:\\Users\\dev\\docs\\readme.md");
    expect(useStore.getState().recents.length).toBe(0);
  });

  it("toggles recent dialog modal state", () => {
    const { setRecentOpen } = useStore.getState();
    expect(useStore.getState().recentOpen).toBe(false);

    setRecentOpen(true);
    expect(useStore.getState().recentOpen).toBe(true);

    setRecentOpen(false);
    expect(useStore.getState().recentOpen).toBe(false);
  });
});
