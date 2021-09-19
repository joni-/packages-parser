export type PackageName = string;

export interface Package {
  name: PackageName;
  description: Description;
  depends: Reference[];
  dependants: Reference[];
}

export interface Reference {
  name: string;
  installed: boolean;
  alternatives: Omit<Reference, "alternatives">[];
}

export interface Description {
  synopsis: string;
  description: string;
}
