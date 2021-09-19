import { readFile as legacyReadFile } from "fs";
import { promisify } from "util";
import { parseFile } from "./parser";
import { failure, isFailure, map, Result, success } from "./result";
import { Package } from "./types";

// readFile from fs/promises would be preferred but for some reason next.js
// had problems with it as it tried to import it client-side.
const readFile = promisify(legacyReadFile);

const PACKAGES_FILE_PATH = "./status.real";

let cache: Package[] | null = null;

export const listPackages = async (): Promise<Result<Package[]>> => {
  if (cache !== null) {
    return success(cache);
  }

  try {
    const data = await readFile(PACKAGES_FILE_PATH, { encoding: "utf8" });
    const result = parseFile(data);

    if (isFailure(result)) {
      return result;
    }

    cache = result.value;
    return success(cache);
  } catch (error) {
    return failure(`Couldn't read file ${PACKAGES_FILE_PATH}. ${error}`);
  }
};

export const findPackage = async (
  name: string
): Promise<Result<Package | null>> => {
  const result = await listPackages();
  return map(
    (packages) => packages.find((p) => p.name === name) ?? null,
    result
  );
};
