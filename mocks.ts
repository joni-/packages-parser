import { Paragraph } from "./parser/parser";

export const paragraph1: Paragraph = {
  name: "libws-commons-util-java",
  description: {
    synopsis: "Common utilities from the Apache Web Services Project",
    description: `This is a small collection of utility classes, that allow high
performance XML processing based on SAX.`,
  },
  depends: [],
  dependants: [],
};

export const paragraph2: Paragraph = {
  name: "python-pkg-resources",
  description: {
    synopsis: "Package Discovery and Resource Access using pkg_resources",
    description: `The pkg_resources module provides an API for Python libraries to
access their resource files, and for extensible applications and
frameworks to automatically discover plugins.  It also provides
runtime support for using C extensions that are inside zipfile-format
eggs, support for merging packages that have separately-distributed
modules or subpackages, and APIs for managing Python's current
"working set" of active packages.`,
  },
  depends: [
    { name: "tcpd", installed: true, alternatives: [] },
    { name: "libbsf-java", installed: false, alternatives: [] },
    { name: "libaspectj-java", installed: true, alternatives: [] },
    {
      name: "debconf",
      installed: false,
      alternatives: [
        { name: "debconf-2.0", installed: true, alternatives: [] },
        { name: "libaspectj-java", installed: false, alternatives: [] },
        { name: "tcpd", installed: true, alternatives: [] },
      ],
    },
  ],
  dependants: [
    { name: "libtext-wrapi18n-perl", installed: false, alternatives: [] },
    {
      name: "java-common",
      installed: true,
      alternatives: [
        { name: "debconf-2.0", installed: true, alternatives: [] },
      ],
    },
  ],
};

export const paragraphs: Paragraph[] = [paragraph1, paragraph2];
