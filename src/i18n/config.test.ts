import { describe, expect, it } from "vitest";
import {
  alternatePath,
  isLocale,
  localeDir,
  localePath,
  pathLocale,
} from "./config";

describe("isLocale", () => {
  it("accepts supported locales and rejects others", () => {
    expect(isLocale("en")).toBe(true);
    expect(isLocale("he")).toBe(true);
    expect(isLocale("fr")).toBe(false);
    expect(isLocale("")).toBe(false);
  });
});

describe("localeDir", () => {
  it("maps locales to directions", () => {
    expect(localeDir("en")).toBe("ltr");
    expect(localeDir("he")).toBe("rtl");
  });
});

describe("localePath", () => {
  it("leaves default-locale paths bare", () => {
    expect(localePath("en", "/posts")).toBe("/posts");
    expect(localePath("en", "/")).toBe("/");
  });
  it("prefixes non-default locales", () => {
    expect(localePath("he", "/posts")).toBe("/he/posts");
    expect(localePath("he", "/")).toBe("/he/");
  });
  it("normalizes a missing leading slash", () => {
    expect(localePath("he", "posts")).toBe("/he/posts");
  });
});

describe("pathLocale", () => {
  it("detects the locale segment", () => {
    expect(pathLocale("/he/posts")).toBe("he");
    expect(pathLocale("/he/")).toBe("he");
    expect(pathLocale("/he")).toBe("he");
    expect(pathLocale("/posts")).toBe("en");
    expect(pathLocale("/")).toBe("en");
    expect(pathLocale("/hello")).toBe("en");
  });
});

describe("alternatePath", () => {
  it("maps en pages to he and back", () => {
    expect(alternatePath("/posts", "he")).toBe("/he/posts");
    expect(alternatePath("/he/posts", "en")).toBe("/posts");
    expect(alternatePath("/", "he")).toBe("/he/");
    expect(alternatePath("/he/", "en")).toBe("/");
  });
  it("is a no-op when already in the target locale", () => {
    expect(alternatePath("/he/posts", "he")).toBe("/he/posts");
    expect(alternatePath("/posts", "en")).toBe("/posts");
  });
  it("does not mangle segments that merely start with the prefix", () => {
    expect(alternatePath("/hello", "he")).toBe("/he/hello");
  });
});
