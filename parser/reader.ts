import { readFile as legacyReadFile } from "fs";
import { promisify } from "util";
import { Paragraph, parseFile } from "./parser";

// readFile from fs/promises would be preferred but for some reason next.js
// had problems with it as it tried to import it client-side.
const readFile = promisify(legacyReadFile);

let cache: Paragraph[] | null = null;

export const listPackages = async (): Promise<Paragraph[]> => {
  if (cache !== null) {
    console.log("serving from cache");
    return cache;
  }

  const path = "./status.real";
  const data = await readFile(path, { encoding: "utf8" });
  cache = parseFile(data);
  return cache;
};

export const findPackage = async (name: string): Promise<Paragraph> => {
  const paragraphs = await listPackages();
  const value = paragraphs.find((v) => v.name === name);

  if (!value) {
    throw new Error(`Package ${name} not found.`);
  }

  return value;
};
