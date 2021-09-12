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
Original-Maintainer: Debian Java Maintainers <pkg-java-maintainers@lists.alioth.debian.org>
Homepage: http://ws.apache.org/commons/util/
`.trim();

    const result = parseParagraph(paragraph);

    expect(result["Package"]).toBe("libws-commons-util-java");
    expect(result["Status"]).toBe("install ok installed");
    expect(result["Priority"]).toBe("optional");
    expect(result["Section"]).toBe("java");
    expect(result["Installed-Size"]).toBe("101");
    expect(result["Maintainer"]).toBe(
      "Ubuntu Developers <ubuntu-devel-discuss@lists.ubuntu.com>"
    );
    expect(result["Architecture"]).toBe("all");
    expect(result["Version"]).toBe("1.0.1-7");
    expect(result["Original-Maintainer"]).toBe(
      "Debian Java Maintainers <pkg-java-maintainers@lists.alioth.debian.org>"
    );
    expect(result["Homepage"]).toBe("http://ws.apache.org/commons/util/");
  });
});
