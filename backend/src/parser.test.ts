import { parseName, parseParagraph, parseSimpleValue } from "./parser";

describe("parseName", () => {
  it("parses correct attribute name", () => {
    const [name, _] = parseName("Package: libws-commons-util-java");
    expect(name).toBe("Package");
  });
});

describe("parseSimpleValue", () => {
  it("simple field", () => {
    const [value, _] = parseSimpleValue(" libws-commons-util-java\n");
    expect(value).toBe("libws-commons-util-java");
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
