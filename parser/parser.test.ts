import {
  parseDependencies,
  parseField,
  parseFile,
  parseName,
  parseParagraph,
} from "./parser";
import { isFailure, Result } from "./result";
import { Description, Package } from "./types";

const getValue = <T>(result: Result<T>): T => {
  if (isFailure(result)) {
    fail(`Expected ${result} to be Success`);
  } else {
    return result.value;
  }
};

describe("parseName", () => {
  it("parses correct attribute name", () => {
    const [name, _] = getValue(parseName("Package: libws-commons-util-java"));
    expect(name).toBe("Package");
  });

  it.each(["#foo", "-foo", `foo😀bar`])("should fail on name %s", (name) => {
    const result = parseName(`${name}: value`);
    expect(isFailure(result)).toBeTruthy();
  });
});

describe("parseField", () => {
  describe("simple field", () => {
    it("works", () => {
      const [{ name, value }, _] = getValue(
        parseField("Package: libws-commons-util-java\n")
      );
      expect(name).toBe("Package");
      expect(value).toBe("libws-commons-util-java");
    });

    describe("Package field", () => {
      it.each(["", "a", "aBC", "foo,", "+foo"])(
        "should fail on invalid package name %s",
        (pkg) => {
          const result = parseField(`Package: ${pkg}`);
          expect(isFailure(result)).toBeTruthy();
        }
      );
    });
  });

  describe("multiline field", () => {
    it("description", () => {
      const input = `Description: Common utilities from the Apache Web Services Project
 This is a small collection of utility classes, that allow high
 performance XML processing based on SAX.
 .
 Testing
 123
 .
 Hello `;

      const [{ name, value }, _] = getValue(parseField(input));
      const description = value as Description;

      expect(name).toBe("Description");
      expect(description.synopsis).toBe(
        "Common utilities from the Apache Web Services Project"
      );
      expect(description.description)
        .toEqual(`This is a small collection of utility classes, that allow high performance XML processing based on SAX.

Testing 123

Hello`);
    });
  });
});

describe("parseDependencies", () => {
  describe("without alternatives", () => {
    it("single dependency", () => {
      const [value, _] = getValue(parseDependencies(" debconf (>= 0.5) "));
      expect(value).toStrictEqual([{ name: "debconf", alternatives: [] }]);
    });

    it("multiple dependencies", () => {
      const [value, _] = getValue(
        parseDependencies(
          " bsh (= 2.0b4-12build1), libgcj-common (>> 1:4.1.1-13), libc6 (>= 2.2.5), libgcc1 (>= 1:4.1.1), libgcj-bc (>= 4.4.5-1~)"
        )
      );
      expect(value).toStrictEqual([
        { name: "bsh", alternatives: [] },
        { name: "libc6", alternatives: [] },
        { name: "libgcc1", alternatives: [] },
        { name: "libgcj-bc", alternatives: [] },
        { name: "libgcj-common", alternatives: [] },
      ]);
    });
  });

  describe("with alternatives", () => {
    it("single dependency", () => {
      const [value, _] = getValue(
        parseDependencies(
          " default-jre-headless | java2-runtime-headless | java5-runtime-headless | java6-runtime-headless "
        )
      );
      expect(value).toStrictEqual([
        {
          name: "default-jre-headless",
          alternatives: [
            "java2-runtime-headless",
            "java5-runtime-headless",
            "java6-runtime-headless",
          ],
        },
      ]);
    });

    it("multiple dependencies", () => {
      const [value, _] = getValue(
        parseDependencies(
          " default-jre-headless | java2-runtime-headless | java5-runtime-headless | java6-runtime-headless,bsh (= 2.0b4-12build1) "
        )
      );
      expect(value).toStrictEqual([
        { name: "bsh", alternatives: [] },
        {
          name: "default-jre-headless",
          alternatives: [
            "java2-runtime-headless",
            "java5-runtime-headless",
            "java6-runtime-headless",
          ],
        },
      ]);
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

    const result = getValue(parseParagraph(paragraph));

    expect(result.name).toBe("libws-commons-util-java");
    expect(result.description.synopsis).toBe(
      "Common utilities from the Apache Web Services Project"
    );
    expect(result.description.description).toBe(
      `This is a small collection of utility classes, that allow high performance XML processing based on SAX.`
    );
  });

  it("fails on duplicate keys", () => {
    const paragraph = `
Package: libws-commons-util-java
Description: Common utilities from the Apache Web Services Project
 This is a small collection of utility classes, that allow high
 performance XML processing based on SAX.
Package: duplicate key
`.trim();

    const result = parseParagraph(paragraph);
    expect(isFailure(result)).toBeTruthy();
  });
});

describe("parseFile", () => {
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
Depends: python (>= 2.6), python (<< 2.8), lsb-release
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
Python-Version: 2.6, 2.7

Package: lsb-release
Status: install ok installed
Multi-Arch: foreign
Priority: extra
Section: misc
Installed-Size: 111
Maintainer: Ubuntu Developers <ubuntu-devel-discuss@lists.ubuntu.com>
Architecture: all
Source: lsb
Version: 4.0-0ubuntu20.2
Depends: python2.7, libc, python (>= 2.7.1-0ubuntu2), python (<< 2.8)
Recommends: apt
Suggests: lsb
Description: Linux Standard Base version reporting utility
 The Linux Standard Base (http://www.linuxbase.org/) is a standard
 core system that third-party applications written for Linux can
 depend upon.
 .
 The lsb-release command is a simple tool to help identify the Linux
 distribution being used and its compliance with the Linux Standard Base.
 LSB conformance will not be reported unless the required metapackages are
 installed.
 .
 While it is intended for use by LSB packages, this command may also
 be useful for programmatically distinguishing between a pure Debian
 installation and derived distributions.
Homepage: http://www.linux-foundation.org/en/LSB
Original-Maintainer: Chris Lawrence <lawrencc@debian.org>
`;

  let p1: Package;
  let p2: Package;
  let p3: Package;

  beforeEach(() => {
    const result = getValue(parseFile(input));
    expect(result.length).toBe(3);
    p1 = result[0];
    p2 = result[1];
    p3 = result[2];
  });

  it("sorts packages by name", () => {
    expect(p1.name).toBe("libws-commons-util-java");
    expect(p2.name).toBe("lsb-release");
    expect(p3.name).toBe("python-pkg-resources");
  });

  it("sorts dependencies by name", () => {
    const getDependencyNames = (p: Package) => p.depends.map((v) => v.name);
    expect(getDependencyNames(p1)).toStrictEqual([]);
    expect(getDependencyNames(p2)).toStrictEqual([
      "libc",
      "python",
      "python2.7",
    ]);
    expect(getDependencyNames(p3)).toStrictEqual(["lsb-release", "python"]);
  });

  it("parses dependants", () => {
    const getDependantNames = (p: Package) => p.dependants.map((v) => v.name);
    expect(getDependantNames(p1)).toStrictEqual([]);
    expect(getDependantNames(p2)).toStrictEqual(["python-pkg-resources"]);
    expect(getDependantNames(p3)).toStrictEqual([]);
  });
});
