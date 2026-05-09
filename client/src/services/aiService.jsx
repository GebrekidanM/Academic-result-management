import api from "./api";

const generateSemesterInsight = (data) => {
  return api.post("/ai/semester-insight", data);

};

const getSavedSemesterInsight = (params) => {
  return api.get("/ai/semester-insight", { params });
};


const aiService = {generateSemesterInsight,getSavedSemesterInsight};

export default aiService;