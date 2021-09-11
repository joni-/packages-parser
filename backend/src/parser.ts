/**
 * Functions related to parsing the packages file.
 *
 * Each parser has common interface. It will take the unconsumed paragraph as input,
 * try to parse desired value from the beginning of the input and return the parsed
 * value and the leftover input that can be fed to the next parser.
 */

type ParseResult = [string, string];

export const parseName = (input: string): ParseResult => {
  const i = input.indexOf(":");
  const name = input.substring(0, i);
  const rest = input.substring(i + 1);

  // TODO: validate that name conforms the specification
  return [name, rest];
};

export const parseSimpleValue = (input: string): ParseResult => {
  const i = input.indexOf("\n");

  // Last line of paragraph will not have new line. Use the entire line as value.
  if (i === -1) {
    return [input.trim(), ""];
  }

  const value = input.substring(0, i).trim();
  const rest = input.substring(i + 1);
  return [value, rest];
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
