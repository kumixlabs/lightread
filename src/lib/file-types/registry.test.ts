import { describe, expect, test } from "bun:test";

import { detectFileType } from "./registry";

describe("detectFileType", () => {
  test("known text formats", () => {
    expect(detectFileType("README.md").viewer).toBe("markdown");
    expect(detectFileType("notes.txt").viewer).toBe("text");
    expect(detectFileType("Dockerfile").viewer).toBe("code");
    expect(detectFileType(".env").viewer).toBe("text");
    expect(detectFileType("app.tsx").language).toBe("typescript");
  });
  test("media and vectors", () => {
    expect(detectFileType("photo.JPG").viewer).toBe("image");
    expect(detectFileType("logo.svg").viewer).toBe("svg");
    expect(detectFileType("clip.mp4").viewer).toBe("media");
    expect(detectFileType("song.mp3").viewer).toBe("media");
  });
  test("unknown extensions fall back to plain text", () => {
    expect(detectFileType("data.weirdext").viewer).toBe("text");
  });
});
