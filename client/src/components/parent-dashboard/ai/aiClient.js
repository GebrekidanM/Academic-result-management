import api from "../api";

const generateSemesterInsight=(data)=>api.post("/ai/semester-insight",data);
const generateAnalyticsInsight=(data)=>api.post("/ai/analytics-insight",data);
const generateRiskPrediction=(data)=>api.post("/ai/risk-prediction",data);
const generateReportCardAI=(data)=>api.post("/ai/report-insight",data);

const aiClient={
    generateSemesterInsight,
    generateAnalyticsInsight,
    generateRiskPrediction,
    generateReportCardAI
};

export default aiClient;