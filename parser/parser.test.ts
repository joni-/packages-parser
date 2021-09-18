import {
  Description,
  parseField,
  parseFile,
  parseName,
  parseParagraph,
} from "./parser";

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
Conffiles:
 /etc/modprobe.d/blacklist-ath_pci.conf d1da9bb08c2b0f56f3be93fd0e37946b
 /etc/modprobe.d/blacklist-firewire.conf 9cc07a17e8e64f9cd35ff59c29debe69
 /etc/modprobe.d/blacklist-framebuffer.conf 96f2f501cc646b598263693c8976ddd1
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

describe("parseFile", () => {
  it("smoke test", () => {
    const input = `Package: libws-commons-util-java
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

Package: python-pkg-resources
Status: install ok installed
Priority: optional
Section: python
Installed-Size: 175
Maintainer: Ubuntu Developers <ubuntu-devel-discuss@lists.ubuntu.com>
Architecture: all
Source: distribute
Version: 0.6.24-1ubuntu1
Replaces: python2.3-setuptools, python2.4-setuptools
Provides: python2.6-setuptools, python2.7-setuptools
Depends: python (>= 2.6), python (<< 2.8)
Suggests: python-distribute, python-distribute-doc
Conflicts: python-setuptools (<< 0.6c8-3), python2.3-setuptools (<< 0.6b2), python2.4-setuptools (<< 0.6b2)
Description: Package Discovery and Resource Access using pkg_resources
  The pkg_resources module provides an API for Python libraries to
  access their resource files, and for extensible applications and
  frameworks to automatically discover plugins.  It also provides
  runtime support for using C extensions that are inside zipfile-format
  eggs, support for merging packages that have separately-distributed
  modules or subpackages, and APIs for managing Python's current
  "working set" of active packages.
Original-Maintainer: Matthias Klose <doko@debian.org>
Homepage: http://packages.python.org/distribute
Python-Version: 2.6, 2.7`;

    const result = parseFile(input);

    expect(result.length).toBe(2);

    const p1 = result[0];
    const p2 = result[1];

    expect(p1.name).toBe("libws-commons-util-java");
    expect(p1.description.synopsis).toBe(
      "Common utilities from the Apache Web Services Project"
    );
    expect(p1.description.description)
      .toBe(`This is a small collection of utility classes, that allow high
performance XML processing based on SAX.`);

    expect(p2.name).toBe("python-pkg-resources");
    expect(p2.description.synopsis).toBe(
      "Package Discovery and Resource Access using pkg_resources"
    );
    expect(p2.description.description)
      .toBe(`The pkg_resources module provides an API for Python libraries to
access their resource files, and for extensible applications and
frameworks to automatically discover plugins.  It also provides
runtime support for using C extensions that are inside zipfile-format
eggs, support for merging packages that have separately-distributed
modules or subpackages, and APIs for managing Python's current
"working set" of active packages.`);
  });
});