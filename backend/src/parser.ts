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

// define fields that use other parser than parseSimpleValue
const PARSERS: Record<string, Parser<Description>> = {
  Description: parseDescription,
};

interface Field<T> {
  name: string;
  value: T;
}

export const parseField = (
  s: string
): [Field<string | Description>, string] => {
  const [name, rest] = parseName(s);
  const parseValue = PARSERS[name] ?? parseSimpleValue;
  const [value, rest2] = parseValue(rest);
  return [{ name, value }, rest2];
};

export const parseParagraph = (
  paragraph: string
): Record<string, string | Description> => {
  let output: Record<string, string | Description> = {};
  let value = paragraph;

  while (value.trim().length > 0) {
    const [{ name, value: fieldValue }, rest] = parseField(value);
    output[name] = fieldValue;
    value = rest;
  }

  // TODO:
  // - check for duplicate keys
  // - handle comments

  return output;
};
