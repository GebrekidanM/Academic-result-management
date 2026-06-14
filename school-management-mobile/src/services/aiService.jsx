import api from "./api";

const generateSemesterInsight = (data) => {
  console.log(data)
  return api.post("/ai/semester-insight", data);
};

const getSavedSemesterInsight = (params) => {
  
  return api.get("/ai/semester-insight", { params });
};

const askSemesterQuestion = (data) => api.post("/ai/ask-question", data);
const askBookQuestion = (data) => api.post("/ai/ask-book", data);

const aiService = {
  generateSemesterInsight,
  getSavedSemesterInsight,
  askSemesterQuestion,
  askBookQuestion
};

export default aiService;