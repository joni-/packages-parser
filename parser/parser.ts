/**
 * Functions related to parsing the packages file.
 *
 * Each parser has common interface. It will take the unconsumed paragraph as input,
 * try to parse desired value from the beginning of the input and return the parsed
 * value and the leftover input that can be fed to the next parser.
 */

type ParseResult<T> = [T, string];
type Parser<T> = (input: string) => ParseResult<T>;

const parseUntil =
  (target: string, failIfNoMatch = true) =>
  (input: string): ParseResult<string> => {
    const i = input.indexOf(target);

    if (i === -1 && !failIfNoMatch) {
      return [input.trim(), ""];
    } else if (i === -1 && failIfNoMatch) {
      throw new Error(`No match for ${target} in ${input}`);
    }

    const value = input.substring(0, i);
    const rest = input.substring(i + 1);
    return [value, rest];
  };

const parseUntilNewLine = parseUntil("\n", false);

export const parseName = (input: string): ParseResult<string> => {
  const [name, rest] = parseUntil(":")(input);
  // TODO: validate that name conforms the specification
  return [name, rest];
};

const parseSimpleValue = (input: string): ParseResult<string> => {
  const [value, rest] = parseUntilNewLine(input);
  return [value.trim(), rest];
};

const isContinuationLine = (s: string) => s.length > 0 && s[0] === " ";

const parseMultilineValue = (input: string): ParseResult<string> => {
  let [value, rest] = parseUntilNewLine(input);

  if (isContinuationLine(rest)) {
    const [value2, rest2] = parseMultilineValue(rest);
    value = value.trim() + "\n" + value2;
    rest = rest2;
  }

  return [value.trim(), rest];
};

export interface Description {
  synopsis: string;
  description: string;
}

const parseDescription = (input: string): ParseResult<Description> => {
  const [value, rest] = parseMultilineValue(input);
  const [synopsis, description] = parseUntilNewLine(value);
  return [{ synopsis, description }, rest];
};

interface Dependency {
  name: string;
  alternatives: string[];
}

const trim = (s: string) => s.trim();
const removeVersion = (s: string) => s.split(" ")[0];

// note: if there are duplicated values, keeps the last occurrence
const uniqBy = <T>(getKey: (v: T) => string, input: T[]): T[] => {
  const xs = input.reduce((acc: Record<string, T>, current) => {
    const k = getKey(current);
    acc[k] = current;
    return acc;
  }, {});
  return Object.values(xs);
};

export const parseDependencies = (input: string): ParseResult<Dependency[]> => {
  const [value, rest] = parseSimpleValue(input);

  const depends = value
    .split(",")
    .map((pkg) => {
      const alternatives = pkg.split("|").map(trim);
      const name = alternatives[0];
      return { name, alternatives: alternatives.slice(1) };
    })
    .map((pkg) => ({
      name: removeVersion(pkg.name),
      alternatives: pkg.alternatives.map(removeVersion),
    }));

  const xs = uniqBy((v) => v.name, depends);
  const sorted = xs.sort((a, b) => a.name.localeCompare(b.name));
  return [sorted, rest];
};

// define fields that use other parser than parseSimpleValue
const PARSERS: Record<string, Parser<Description> | Parser<Dependency[]>> = {
  Description: parseDescription,
  Depends: parseDependencies,
};

interface Field<T> {
  name: string;
  value: T;
}

export const parseField = (
  input: string
): [Field<string | Description | Dependency[]>, string] => {
  const [name, rest] = parseName(input);
  const [_, nextLine] = parseUntilNewLine(rest);
  const defaultParser = isContinuationLine(nextLine)
    ? parseMultilineValue
    : parseSimpleValue;
  const parseValue = PARSERS[name] ?? defaultParser;
  const [value, rest2] = parseValue(rest);
  return [{ name, value }, rest2];
};

export interface Reference {
  name: string;
  installed: boolean;
  alternatives: Omit<Reference, "alternatives">[];
}
interface Paragraph {
  name: string;
  description: Description;
  depends: Dependency[];
}

export const parseParagraph = (paragraph: string): Paragraph => {
  let value = paragraph;
  let fields: Field<string | Description | Dependency[]>[] = [];

  while (value.trim().length > 0) {
    const [field, rest] = parseField(value);
    fields.push(field);
    value = rest;
  }

  const duplicates = findDuplicates(fields);
  if (duplicates.length > 0) {
    throw new Error(`Duplicate keys found: ${duplicates.join(", ")}`);
  }

  // TODO: find a better way for finding the known fields without type casting..
  const pkg = fields.find((v) => v.name === "Package") as
    | Field<string>
    | undefined;
  const description = fields.find(
    (v) => v.name === "Description"
  ) as Field<Description>;
  const depends = fields.find((v) => v.name === "Depends") as
    | Field<Dependency[]>
    | undefined;

  if (!pkg) {
    throw new Error("Missing Package definition: " + paragraph);
  }

  // TODO:
  // - handle comments

  return {
    name: pkg.value,
    description: {
      synopsis: description.value.synopsis,
      description: description.value.description,
    },
    depends: depends?.value ?? [],
  };
};

const findDuplicates = (fields: Field<unknown>[]): string[] => {
  const counts = fields
    .map((v) => v.name)
    .reduce((keys: Record<string, number>, k) => {
      keys[k] = (keys[k] ?? 0) + 1;
      return keys;
    }, {});

  const duplicateKeys = Object.entries(counts)
    .filter(([_, count]) => count > 1)
    .map(([k, _]) => k);

  return duplicateKeys;
};

export const parseFile = (input: string): Package[] => {
  const parts = input.split("\n\n");
  const data = parts
    .filter((part) => part.trim().length > 0)
    .map(parseParagraph);
  data.sort((a, b) => a.name.localeCompare(b.name));

  const installed = new Set(data.map((v) => v.name));

  const dependants = data.reduce((deps: Record<string, string[]>, p) => {
    p.depends.forEach((d) => {
      if (!deps[d.name]) {
        deps[d.name] = [];
      }
      deps[d.name].push(p.name);
    });
    return deps;
  }, {});

  return data.map(({ name, description, depends }) => ({
    name,
    description,
    depends: depends.map((value) => ({
      name: value.name,
      installed: installed.has(value.name),
      alternatives: value.alternatives.map((v) => ({
        name: v,
        installed: installed.has(v),
      })),
    })),
    dependants:
      dependants[name]?.map((value) => ({
        name: value,
        installed: installed.has(value),
        alternatives: [],
      })) ?? [],
  }));
};

export interface Package {
  name: string;
  description: Description;
  depends: Reference[];
  dependants: Reference[];
}
