/**
 * Functions related to parsing the packages file.
 *
 * Each parser has common interface. It will take the unconsumed paragraph as input,
 * try to parse desired value from the beginning of the input and return the parsed
 * value and the leftover input that can be fed to the next parser.
 */

type ParseResult = [string, string];

const parseUntil =
  (target: string, failIfNoMatch = true) =>
  (input: string): ParseResult => {
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

export const parseName = (input: string): ParseResult => {
  const [name, rest] = parseUntil(":")(input);
  // TODO: validate that name conforms the specification
  return [name, rest];
};

export const parseSimpleValue = (input: string): ParseResult => {
  const [value, rest] = parseUntilNewLine(input);
  return [value.trim(), rest];
};

const isContinuationLine = (s: string) => s.length > 0 && s[0] === " ";

export const parseMultilineValue = (input: string): ParseResult => {
  let [value, rest] = parseUntilNewLine(input);

  if (isContinuationLine(rest)) {
    const [value2, rest2] = parseMultilineValue(rest);
    value = value.trim() + "\n" + value2;
    rest = rest2;
  }

  return [value.trim(), rest];
};

export const parseParagraph = (paragraph: string): Record<string, string> => {
  let output: Record<string, string> = {};
  let value = paragraph;

  while (value.trim().length > 0) {
    const [name, rest] = parseName(value);
    const [fieldValue, rest2] = parseSimpleValue(rest);
    output[name] = fieldValue;
    value = rest2;
  }

  // TODO:
  // - check for duplicate keys
  // - handle comments

  return output;
};
