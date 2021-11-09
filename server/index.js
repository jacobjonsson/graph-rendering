const express = require("express");
const app = express();

let data = {
  root_id: "1",
  filter: {
    1: {
      id: "1",
      parameter: "accommodation.size",
      value: "20",
      operator: "<",
      status: "idle",
      children: ["2", "3"],
    },
    2: {
      id: "2",
      parameter: "main.applicant.age",
      value: "20",
      operator: "<",
      status: "idle",
      children: ["4", "5"],
    },
    4: {
      id: "4",
      parameter: "main.applicant.income",
      value: "2000",
      operator: "<",
      status: "idle",
      children: [],
    },
    5: {
      id: "5",
      parameter: "co.applicant.income",
      value: "2000",
      operator: "<",
      status: "idle",
      children: [],
    },
    3: {
      id: "3",
      parameter: "co.applicant.age",
      value: "18",
      operator: "<",
      status: "idle",
      children: ["6"],
    },
    6: {
      id: "6",
      parameter: "applied_loan_amount",
      value: "1000",
      operator: "<",
      status: "idle",
      children: ["7", "8", "9"],
    },
    7: {
      id: "7",
      parameter: "co.applicant.age",
      value: "18",
      operator: "<",
      status: "idle",
      children: [],
    },
    8: {
      id: "8",
      parameter: "co.applicant.age",
      value: "18",
      operator: "<",
      status: "idle",
      children: [],
    },
    9: {
      id: "9",
      parameter: "co.applicant.age",
      value: "18",
      operator: "<",
      status: "idle",
      children: [],
    },
  },
};

app.get("/api/filters", (req, res) => {
  console.log("GET /api/filters");
  res.status(200).json(data);
});

app.post("/api/filters", (req, res) => {
  console.log("POST /api/filters");
  let data = req.body;
  res.status(201).json(data);
});

app.listen(3001, () => {
  console.log("Server is running on port 3001");
});
