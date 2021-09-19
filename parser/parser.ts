/**
 * Functions related to parsing the packages file.
 *
 * Each parser has common interface. It will take the unconsumed paragraph as input,
 * try to parse desired value from the beginning of the input and return the parsed
 * value and the leftover input that can be fed to the next parser.
 */

import { findDuplicates, isEmpty, trim, uniqBy } from "../util";
import { failure, isFailure, map, Result, success } from "./result";
import { Description, Package, PackageName } from "./types";

type ParseResult<T> = Result<[T, string]>;
type Parser<T> = (input: string) => ParseResult<T>;

const mapResult = <T, Z>(
  f: (value: T) => Z,
  result: ParseResult<T>
): ParseResult<Z> => map(([value, rest]) => [f(value), rest], result);

interface Dependency {
  name: string;
  alternatives: string[];
}

type FieldName = string;

interface Field<T> {
  name: FieldName;
  value: T;
}

interface Paragraph {
  name: PackageName;
  description: Description;
  depends: Dependency[];
}

const parseUntil =
  (target: string, failIfNoMatch = true) =>
  (input: string): ParseResult<string> => {
    const i = input.indexOf(target);

    if (i === -1 && !failIfNoMatch) {
      return success([input.trim(), ""]);
    } else if (i === -1 && failIfNoMatch) {
      return failure(`No match for ${target} in ${input}`);
    }

    const value = input.substring(0, i);
    const rest = input.substring(i + 1);
    return success([value, rest]);
  };

const parseLine = parseUntil("\n", false);

const charRange = (from: number, to: number): string[] =>
  Array(to - from + 1)
    .fill(null)
    .map((_, i) => String.fromCharCode(from + i));

const disallowedStartingChars = [0x0023, 0x002d];
const allowedChars = [
  charRange(0x0021, 0x0039),
  charRange(0x003b, 0x007e),
].flat();

export const parseName = (input: string): ParseResult<FieldName> => {
  const result = parseUntil(":")(input);

  if (isFailure(result)) {
    return result;
  }

  const [name, rest] = result.value;

  if (isEmpty(name)) {
    return failure(`Field name cannot be empty`);
  }

  const allCharsAllowed = name.split("").every((c) => allowedChars.includes(c));
  const validFirstChar = !disallowedStartingChars.includes(name.charCodeAt(0));

  if (!allCharsAllowed || !validFirstChar) {
    return failure(`Invalid field name ${name}`);
  }

  return success([name, rest]);
};

const parseSimpleValue = (input: string): ParseResult<string> => {
  return mapResult(trim, parseLine(input));
};

const isContinuationLine = (s: string) => s.length > 0 && s[0] === " ";

const parseMultilineValue = (input: string): ParseResult<string[]> => {
  let result1 = parseLine(input);

  if (isFailure(result1)) {
    return result1;
  }

  let [value, rest] = result1.value;
  let lines = [value];

  if (isContinuationLine(rest)) {
    const result2 = parseMultilineValue(rest);

    if (isFailure(result2)) {
      return result2;
    }

    const [value2, rest2] = result2.value;
    lines = lines.concat(value2);
    rest = rest2;
  }

  return success([lines, rest]);
};

const isParagraphLine = (line: string) =>
  !line.startsWith(" ") && !isEmpty(line);

const parseDescription = (input: string): ParseResult<Description> => {
  const result = parseMultilineValue(input);

  if (isFailure(result)) {
    return result;
  }

  const [value, rest] = result.value;

  if (isEmpty(value)) {
    return failure(
      `Could not parse description from "${input}". Description was empty.`
    );
  }

  const synopsis = value[0].trim();
  const description = value
    .slice(1)
    .map((line) => {
      // Single space and full stop is the only way to render a blank line
      if (line === " .") {
        return "\n\n";
      }

      // Keep the whitespace as is if the line starts with two or more spaces
      if (line.startsWith("  ")) {
        return line + "\n";
      }

      // Line is part of a paragraph
      return line.trim();
    })
    .map((line, i, lines) => {
      // Setup spaces between paragraph components
      const isLastLine = i === lines.length - 1;
      if (!isLastLine && isParagraphLine(line)) {
        const nextLine = lines[i + 1];
        if (isParagraphLine(nextLine)) {
          return line + " ";
        }
      }
      return line;
    })
    .join("");

  return success([{ synopsis, description }, rest]);
};

const removeVersion = (s: string) => s.split(" ")[0];

export const parseDependencies = (input: string): ParseResult<Dependency[]> => {
  const result = parseSimpleValue(input);
  return mapResult((value) => {
    const dependencies = value
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

    return uniqBy((v) => v.name, dependencies).sort((a, b) =>
      a.name.localeCompare(b.name)
    );
  }, result);
};

const alphanumeric = [
  charRange("a".charCodeAt(0), "z".charCodeAt(0)),
  charRange("0".charCodeAt(0), "9".charCodeAt(0)),
].flat();

const allowedPackageNameChars = alphanumeric.concat(["+", "-", "."]);

const parsePackageField = (input: string): ParseResult<PackageName> => {
  const result = parseSimpleValue(input);

  if (isFailure(result)) {
    return result;
  }

  const [name, rest] = result.value;

  const validLength = name.length >= 2;
  const alphanumericStart = alphanumeric.includes(name[0]);
  const allCharsAllowed = name
    .split("")
    .every((c) => allowedPackageNameChars.includes(c));

  if (!validLength || !alphanumericStart || !allCharsAllowed) {
    return failure(`Invalid package name ${name}`);
  }

  return success([name, rest]);
};

// define fields that use other parser than parseSimpleValue
const PARSERS: Record<
  string,
  Parser<Description | Dependency[] | PackageName>
> = {
  Description: parseDescription,
  Depends: parseDependencies,
  Package: parsePackageField,
};

export const parseField = (
  input: string
): ParseResult<Field<string | Description | Dependency[]>> => {
  const nameResult = parseName(input);

  if (isFailure(nameResult)) {
    return nameResult;
  }

  const [name, rest] = nameResult.value;

  // Parse until the end of the line so we can get the next line and use it to
  // determine what parser to use for parsing the value.
  const tempResult = parseLine(rest);

  if (isFailure(tempResult)) {
    return tempResult;
  }

  const [_, nextLine] = tempResult.value;

  const defaultParser = isContinuationLine(nextLine)
    ? parseMultilineValue
    : parseSimpleValue;
  const parseValue = (PARSERS[name] ?? defaultParser) as Parser<
    string | Description | Dependency[]
  >;

  const valueResult = parseValue(rest);

  if (isFailure(valueResult)) {
    return valueResult;
  }
  const [value, rest2] = valueResult.value;

  return success([{ name, value }, rest2]);
};

export const parseParagraph = (paragraph: string): Result<Paragraph> => {
  let value = paragraph;
  let fields: Field<string | Description | Dependency[]>[] = [];

  while (!isEmpty(value)) {
    const result = parseField(value);

    if (isFailure(result)) {
      return result;
    }

    const [field, rest] = result.value;
    fields.push(field);
    value = rest;
  }

  const duplicates = findDuplicates((field) => field.name, fields);
  if (!isEmpty(duplicates)) {
    return failure(`Duplicate keys found: ${duplicates.join(", ")}`);
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
    return failure(`Missing Package definition: ${paragraph}`);
  }

  return success({
    name: pkg.value,
    description: {
      synopsis: description.value.synopsis,
      description: description.value.description,
    },
    depends: depends?.value ?? [],
  });
};

export const parseFile = (input: string): Result<Package[]> => {
  const parts = input.split("\n\n");
  let paragraphs: Paragraph[] = [];

  for (const part of parts.filter((p) => !isEmpty(p))) {
    const result = parseParagraph(part);
    if (isFailure(result)) {
      return result;
    }
    paragraphs.push(result.value);
  }

  paragraphs.sort((a, b) => a.name.localeCompare(b.name));

  const installedPackages = new Set(paragraphs.map((v) => v.name));

  const dependants = paragraphs.reduce<Record<string, string[]>>((deps, p) => {
    p.depends.forEach((d) => {
      if (!deps[d.name]) {
        deps[d.name] = [];
      }
      deps[d.name].push(p.name);
    });
    return deps;
  }, {});

  return success(
    paragraphs.map(({ name, description, depends }) => ({
      name,
      description,
      depends: depends.map((dependency) => ({
        name: dependency.name,
        installed: installedPackages.has(dependency.name),
        alternatives: dependency.alternatives.map((altName) => ({
          name: altName,
          installed: installedPackages.has(altName),
        })),
      })),
      dependants:
        dependants[name]?.map((dependantName) => ({
          name: dependantName,
          installed: installedPackages.has(dependantName),
          alternatives: [],
        })) ?? [],
    }))
  );
};
