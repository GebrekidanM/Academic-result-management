import api from "./api";

const generateSemesterInsight = (data) => {
  return api.post("/ai/semester-insight", data);
};

const getSavedSemesterInsight = (params) => {
  return api.get("/ai/semester-insight", { params });
};

const askSemesterQuestion = (data) => api.post("/ai/ask-question", data);

const aiService = {
  generateSemesterInsight,
  getSavedSemesterInsight,
  askSemesterQuestion
};

export default aiService;