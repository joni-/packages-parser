import { readFile as legacyReadFile } from "fs";
import { promisify } from "util";
import { parseFile } from "./parser";
import { Package } from "./types";

// readFile from fs/promises would be preferred but for some reason next.js
// had problems with it as it tried to import it client-side.
const readFile = promisify(legacyReadFile);

let cache: Package[] | null = null;

export const listPackages = async (): Promise<Package[]> => {
  if (cache !== null) {
    return cache;
  }

  const path = "./status.real";
  const data = await readFile(path, { encoding: "utf8" });
  cache = parseFile(data);
  return cache;
};

export const findPackage = async (name: string): Promise<Package> => {
  const packages = await listPackages();
  const value = packages.find((v) => v.name === name);

  if (!value) {
    throw new Error(`Package ${name} not found.`);
  }

  return value;
};
