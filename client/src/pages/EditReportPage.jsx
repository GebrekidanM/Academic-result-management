import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import behavioralReportService from '../services/behavioralReportService';

const EditReportPage = () => {
    const { reportId } = useParams();
    const navigate = useNavigate();

    // --- State Management ---
    const [reportData, setReportData] = useState(null);
    const [error, setError] = useState(null);
    const [loading, setLoading] = useState(true);

    // --- Data Fetching ---
    useEffect(() => {
        behavioralReportService.getReportById(reportId)
            .then(response => {
                setReportData(response.data.data);
            })
            .catch(err => {
                setError('Failed to load the report data.');
            })
            .finally(() => {
                setLoading(false); // Initial page load is complete
            });
    }, [reportId]);

    // --- Event Handlers (Your logic is perfect) ---
    const handleChange = (e) => {
        const { name, value } = e.target;
        setReportData({ ...reportData, [name]: value });
    };
    
    const handleEvaluationChange = (index, value) => {
        const newEvaluations = [...reportData.evaluations];
        newEvaluations[index].result = value;
        setReportData({ ...reportData, evaluations: newEvaluations });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError(null);
        try {
            await behavioralReportService.updateReport(reportId, reportData);
            alert('Report updated successfully!');
            navigate(`/students/${reportData.student}`);
        } catch (err) {
            setError('Failed to update report.');
        } finally {
            setLoading(false);
        }
    };

    // --- Render Logic ---
    if (loading && !reportData) return <p className="text-center text-lg mt-8">Loading report for editing...</p>;
    if (error) return <p className="text-center text-red-500 mt-8">{error}</p>;
    if (!reportData) return null; // Don't render the form until data is loaded

    // --- Tailwind CSS class strings ---
    const selectInput = "shadow border rounded-lg w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:ring-2 focus:ring-pink-500";
    const textInput = "shadow appearance-none border rounded-lg w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:ring-2 focus:ring-pink-500";
    const textAreaInput = `${textInput} h-24 resize-y`;
    const submitButton = `w-full bg-pink-500 hover:bg-pink-600 text-white font-bold py-3 px-4 rounded-lg focus:outline-none focus:shadow-outline transition-colors duration-200 ${loading ? 'opacity-50 cursor-not-allowed' : ''}`;

    return (
        <div className="bg-white p-6 rounded-lg shadow-md max-w-4xl mx-auto">
            <h2 className="text-2xl font-bold text-gray-800 mb-1">Edit Behavioral & Skills Assessment</h2>
            <p className="text-lg text-gray-500 mb-4">
                Editing Report for <strong>{reportData.semester}</strong>, {reportData.academicYear}
            </p>
            <Link to={`/students/${reportData.student}`} className="text-pink-500 hover:underline mb-6 block">
                &larr; Back to Student Details
            </Link>
            
            <form onSubmit={handleSubmit}>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    {/* --- Left Column: Evaluation Traits --- */}
                    <div>
                        <h3 className="text-xl font-bold text-gray-800 mb-4 border-b pb-2">Evaluations</h3>
                        <div className="space-y-4">
                            {reportData.evaluations.map((evaluation, index) => (
                                <div key={index} className="grid grid-cols-2 items-center">
                                    <label className="font-medium text-gray-700">{evaluation.area}:</label>
                                    <select value={evaluation.result} onChange={(e) => handleEvaluationChange(index, e.target.value)} className={selectInput}>
                                        <option value="E">E - Excellent</option>
                                        <option value="VG">VG - Very Good</option>
                                        <option value="G">G - Good</option>
                                        <option value="NI">NI - Needs Improvement</option>
                                    </select>
                                </div>
                            ))}
                        </div>
                    </div>
                    {/* --- Right Column: Comments and Conduct --- */}
                    <div className="space-y-6">
                        <div>
                            <h3 className="text-xl font-bold text-gray-800 mb-4 border-b pb-2">Teacher's Comment</h3>
                            <label htmlFor="teacherComment" className="sr-only">Teacher's Comment</label>
                            <textarea
                                id="teacherComment"
                                name="teacherComment"
                                value={reportData.teacherComment || ''}
                                onChange={handleChange}
                                className={textAreaInput}
                                placeholder="Enter your comments here..."
                            />
                        </div>
                        <div>
                             <h3 className="text-xl font-bold text-gray-800 mb-4 border-b pb-2">Overall Conduct</h3>
                            <label htmlFor="conduct" className="sr-only">Overall Conduct</label>
                            <input
                                id="conduct"
                                type="text"
                                name="conduct"
                                value={reportData.conduct || ''}
                                onChange={handleChange}
                                className={textInput}
                            />
                        </div>
                    </div>
                </div>

                <div className="mt-8">
                    <button type="submit" className={submitButton} disabled={loading}>
                        {loading ? 'Saving Changes...' : 'Update Report'}
                    </button>
                </div>
                {error && <p className="text-red-500 text-center mt-4">{error}</p>}
            </form>
        </div>
    );
};

export default EditReportPage;