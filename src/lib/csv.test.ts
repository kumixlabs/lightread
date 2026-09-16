import { describe, expect, test } from "bun:test";

import { parseCsv } from "./csv";

describe("parseCsv", () => {
  test("basic comma rows", () => {
    expect(parseCsv("a,b\nc,d", ",")).toEqual([
      ["a", "b"],
      ["c", "d"],
    ]);
  });
  test("quoted fields with delimiters and newlines", () => {
    expect(parseCsv('"x,y","line\nbreak"', ",")).toEqual([["x,y", "line\nbreak"]]);
  });
  test("escaped quotes inside quoted fields", () => {
    expect(parseCsv('"say ""hi""",b', ",")).toEqual([['say "hi"', "b"]]);
  });
  test("tab delimiter and trailing field without newline", () => {
    expect(parseCsv("a\tb\nc\td", "\t")).toEqual([
      ["a", "b"],
      ["c", "d"],
    ]);
    expect(parseCsv("only", ",")).toEqual([["only"]]);
  });
  test("CRLF is ignored", () => {
    expect(parseCsv("a,b\r\nc,d", ",")).toEqual([
      ["a", "b"],
      ["c", "d"],
    ]);
  });
});
