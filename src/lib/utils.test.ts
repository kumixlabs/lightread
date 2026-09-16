import { describe, expect, test } from "bun:test";

import {
  basename,
  dirname,
  extname,
  findMatches,
  formatBytes,
  relativePath,
  resolveRelative,
} from "./utils";

describe("basename/dirname/extname", () => {
  test("unix + windows separators", () => {
    expect(basename("/a/b/c.md")).toBe("c.md");
    expect(basename("D:\\a\\b\\c.md")).toBe("c.md");
    expect(dirname("/a/b/c.md")).toBe("/a/b");
    expect(dirname("D:\\a\\b\\c.md")).toBe("D:/a/b");
    expect(extname("D:\\a\\ARCHIVE.TAR.GZ")).toBe(".gz");
    expect(extname("noext")).toBe("");
  });
});

describe("relativePath", () => {
  test("inside workspace normalizes separators", () => {
    expect(relativePath("D:\\ws\\src\\a.ts", "D:\\ws")).toBe("src/a.ts");
    expect(relativePath("/ws/src/a.ts", "/ws")).toBe("src/a.ts");
  });
  test("outside workspace returns the original path", () => {
    expect(relativePath("/elsewhere/a.ts", "/ws")).toBe("/elsewhere/a.ts");
  });
});

describe("resolveRelative", () => {
  test("resolves ./ and ../ against the file dir", () => {
    expect(resolveRelative("/ws/docs/readme.md", "./img/x.png")).toBe("/ws/docs/img/x.png");
    expect(resolveRelative("/ws/docs/readme.md", "../img/x.png")).toBe("/ws/img/x.png");
    expect(resolveRelative("D:/ws/docs/readme.md", ".\\img\\x.png")).toBe("D:/ws/docs/img/x.png");
  });
  test("rejects urls, anchors, absolute links and escapes past drive root", () => {
    expect(resolveRelative("/ws/a.md", "https://x.dev/i.png")).toBeNull();
    expect(resolveRelative("/ws/a.md", "#anchor")).toBeNull();
    expect(resolveRelative("/ws/a.md", "/abs.md")).toBeNull();
    expect(resolveRelative("D:/ws/a.md", "../../escape.md")).toBeNull();
    expect(resolveRelative("/ws/a.md", "../../escape.md")).toBeNull();
  });
});

describe("findMatches", () => {
  test("case sensitivity and wrap-around navigation", () => {
    expect(findMatches("aA bA", "a", false)).toEqual([0, 1, 4]);
    expect(findMatches("aA bA", "a", true)).toEqual([0]);
    expect(findMatches("hello", "z", false)).toEqual([]);
  });
});

describe("formatBytes", () => {
  test("units", () => {
    expect(formatBytes(0)).toBe("0 B");
    expect(formatBytes(1024)).toBe("1 KB");
    expect(formatBytes(1024 * 1024 * 5)).toBe("5 MB");
  });
});
