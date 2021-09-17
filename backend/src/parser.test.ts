import { Description, parseField, parseName, parseParagraph } from "./parser";

describe("parseName", () => {
  it("parses correct attribute name", () => {
    const [name, _] = parseName("Package: libws-commons-util-java");
    expect(name).toBe("Package");
  });
});

describe("parseField", () => {
  describe("simple field", () => {
    it("works", () => {
      const [{ name, value }, _] = parseField(
        "Package: libws-commons-util-java\n"
      );
      expect(name).toBe("Package");
      expect(value).toBe("libws-commons-util-java");
    });
  });

  describe("multiline field", () => {
    it("description", () => {
      const input = `Description: Common utilities from the Apache Web Services Project
 This is a small collection of utility classes, that allow high
 performance XML processing based on SAX.\n`;

      const [{ name, value }, _] = parseField(input);
      const description = value as Description;

      expect(name).toBe("Description");
      expect(description.synopsis).toBe(
        "Common utilities from the Apache Web Services Project"
      );
      expect(description.description)
        .toBe(`This is a small collection of utility classes, that allow high
performance XML processing based on SAX.`);
    });
  });
});

describe("parseParagraph", () => {
  it("smoke test", () => {
    const paragraph = `
Package: libws-commons-util-java
Status: install ok installed
Priority: optional
Section: java
Installed-Size: 101
Maintainer: Ubuntu Developers <ubuntu-devel-discuss@lists.ubuntu.com>
Architecture: all
Version: 1.0.1-7
Description: Common utilities from the Apache Web Services Project
 This is a small collection of utility classes, that allow high
 performance XML processing based on SAX.
Original-Maintainer: Debian Java Maintainers <pkg-java-maintainers@lists.alioth.debian.org>
Homepage: http://ws.apache.org/commons/util/
`.trim();

    const result = parseParagraph(paragraph);

    expect(result.name).toBe("libws-commons-util-java");
    expect(result.description.synopsis).toBe(
      "Common utilities from the Apache Web Services Project"
    );
    expect(result.description.description)
      .toBe(`This is a small collection of utility classes, that allow high
performance XML processing based on SAX.`);
  });

  it("fails on duplicate keys", () => {
    const paragraph = `
Package: libws-commons-util-java
Description: Common utilities from the Apache Web Services Project
 This is a small collection of utility classes, that allow high
 performance XML processing based on SAX.
Package: duplicate key
`.trim();

    expect(() => {
      parseParagraph(paragraph);
    }).toThrow(new Error("Duplicate keys found: Package"));
  });
});
