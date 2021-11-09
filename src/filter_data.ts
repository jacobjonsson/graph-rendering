import { RawNode } from "./types";

export const filterData: {
  root_id: string;
  filter: { [key: string]: RawNode };
} = {
  root_id: "1",
  filter: {
    "1": {
      id: "1",
      parameter: "accommodation.size",
      value: "20",
      operator: "<",
      children: ["2", "3"],
    },
    "2": {
      id: "2",
      parameter: "main.applicant.age",
      value: "20",
      operator: "<",
      children: ["4", "5"],
    },
    "4": {
      id: "4",
      parameter: "main.applicant.income",
      value: "2000",
      operator: "<",
      children: [],
    },
    "5": {
      id: "5",
      parameter: "co.applicant.income",
      value: "2000",
      operator: "<",
      children: [],
    },
    "3": {
      id: "3",
      parameter: "co.applicant.age",
      value: "18",
      operator: "<",
      children: ["6"],
    },
    "6": {
      id: "6",
      parameter: "applied_loan_amount",
      value: "1000",
      operator: "<",
      children: ["7", "8", "9"],
    },
    "7": {
      id: "7",
      parameter: "co.applicant.age",
      value: "18",
      operator: "<",
      children: [],
    },
    "8": {
      id: "8",
      parameter: "co.applicant.age",
      value: "18",
      operator: "<",
      children: [],
    },
    "9": {
      id: "9",
      parameter: "co.applicant.age",
      value: "18",
      operator: "<",
      children: [],
    },
  },
};
