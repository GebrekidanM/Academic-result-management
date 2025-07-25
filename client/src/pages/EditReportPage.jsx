// src/pages/EditReportPage.js
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import behavioralReportService from '../services/behavioralReportService';

const EditReportPage = () => {
    const { reportId } = useParams();
    const navigate = useNavigate();

    // State to hold the form data. Initialize as null until we fetch data.
    const [reportData, setReportData] = useState(null);
    const [error, setError] = useState(null);

    // 1. Fetch the existing report data when the component loads
    useEffect(() => {
        const fetchReport = async () => {
            try {
                const response = await behavioralReportService.getReportById(reportId);
                setReportData(response.data.data);
            } catch (err) {
                setError('Failed to load the report data.');
            }
        };
        fetchReport();
    }, [reportId]);

    // 2. Generic handler for simple text inputs
    const handleChange = (e) => {
        const { name, value } = e.target;
        setReportData({ ...reportData, [name]: value });
    };
    
    // Handler specifically for the evaluations array
    const handleEvaluationChange = (index, value) => {
        const newEvaluations = [...reportData.evaluations];
        newEvaluations[index].result = value;
        setReportData({ ...reportData, evaluations: newEvaluations });
    };

    // 3. Handle the form submission
    const handleSubmit = async (e) => {
        e.preventDefault();
        setError(null);
        try {
            await behavioralReportService.updateReport(reportId, reportData);
            alert('Report updated successfully!');
            // Navigate back to the student's detail page
            navigate(`/students/${reportData.student}`);
        } catch (err) {
            setError('Failed to update report.');
        }
    };

    // Show a loading message until the data is fetched
    if (!reportData) return <p>Loading report for editing...</p>;
    if (error) return <p style={{ color: 'red' }}>{error}</p>

    return (
        <div>
            <h2>Edit Behavioral & Skills Assessment</h2>
            <form onSubmit={handleSubmit}>
                <p><strong>Editing Report for Semester:</strong> {reportData.semester}, {reportData.academicYear}</p>
                <hr/>
                
                <h3>Evaluations</h3>
                {reportData.evaluations.map((evaluation, index) => (
                    <div key={index}>
                        <label>{evaluation.area}: </label>
                        <select value={evaluation.result} onChange={(e) => handleEvaluationChange(index, e.target.value)}>
                            <option value="E">E - Excellent</option>
                            <option value="VG">VG - Very Good</option>
                            <option value="G">G - Good</option>
                            <option value="NI">NI - Needs Improvement</option>
                        </select>
                    </div>
                ))}
                
                <hr/>

                <div>
                    <label>Teacher's Comment:</label>
                    <textarea
                        name="teacherComment"
                        value={reportData.teacherComment}
                        onChange={handleChange}
                        rows="4" style={{ width: '100%' }}
                    />
                </div>
                 <div>
                    <label>Overall Conduct:</label>
                    <input
                        type="text"
                        name="conduct"
                        value={reportData.conduct}
                        onChange={handleChange}
                    />
                </div>

                <button type="submit">Update Report</button>
                {error && <p style={{ color: 'red' }}>{error}</p>}
            </form>
        </div>
    );
};

export default EditReportPage;