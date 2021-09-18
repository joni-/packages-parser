export interface Package {
  name: string;
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
