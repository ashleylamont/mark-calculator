export interface IAssessment {
  name: string;
  weight: number;
  mark: number;
  markKnown: boolean;
}

export interface IGrade {
  name: string;
  abbreviation: string;
  minMark: number;
}
