import api from './api';

class PDFMarksService {
    static async extractMarksFromPDF(file, subjectId, assessmentTypeId) {
        try {
            const formData = new FormData();
            formData.append('pdf', file);
            formData.append('subjectId', subjectId);
            formData.append('assessmentTypeId', assessmentTypeId);

            const response = await api.post(`/pdf/extract-marks`, formData, {
                headers: {
                    'Content-Type': 'multipart/form-data',
                },
                onUploadProgress: (progressEvent) => {
                    const percentCompleted = Math.round((progressEvent.loaded * 100) / progressEvent.total);
                    console.log(`Upload progress: ${percentCompleted}%`);
                },
            });

            if (response.data.success) {
                return {
                    success: true,
                    marks: response.data.marks,
                    message: response.data.message,
                    totalStudents: response.data.totalStudents
                };
            } else {
                throw new Error(response.data.message || 'Failed to extract marks from PDF');
            }
        } catch (error) {
            console.error('PDF marks extraction error:', error);
            throw error;
        }
    }

    static async getPDFMarksHistory() {
        try {
            const response = await api.get(`/pdf/marks-history`);
            return response.data;
        } catch (error) {
            console.error('Error fetching PDF marks history:', error);
            throw error;
        }
    }
}

export default PDFMarksService;
