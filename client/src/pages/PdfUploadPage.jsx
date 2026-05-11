import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import classService from '../services/classService';
import gradeService from '../services/gradeService';

const PdfUploadPage = () => {
    const { t } = useTranslation();
    const [classes, setClasses] = useState([]);
    const [streams, setStreams] = useState([]);
    const [selectedClass, setSelectedClass] = useState('');
    const [selectedStream, setSelectedStream] = useState('');
    const [testPeriod, setTestPeriod] = useState('Mid Term');
    const [file, setFile] = useState(null);
    const [loading, setLoading] = useState(false);
    const [message, setMessage] = useState({ text: '', type: '' });

    const testPeriods = [
        { label: 'Beginning of Term (BOT)', value: 'Beginning of Term' },
        { label: 'Mid Term (MT)',            value: 'Mid Term'          },
        { label: 'End of Term (EOT)',        value: 'End of Term'       },
    ];

    useEffect(() => {
        const fetchClasses = async () => {
            try {
                const res = await classService.getClasses();
                setClasses(res.data.data);
            } catch (err) {
                console.error("Error fetching classes:", err);
            }
        };
        fetchClasses();
    }, []);

    useEffect(() => {
        if (selectedClass) {
            const fetchStreams = async () => {
                try {
                    const res = await classService.getStreamsByClass(selectedClass);
                    setStreams(res.data.data);
                } catch (err) {
                    console.error("Error fetching streams:", err);
                }
            };
            fetchStreams();
        } else {
            setStreams([]);
        }
    }, [selectedClass]);

    const handleFileChange = (e) => {
        setFile(e.target.files[0]);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!file || !selectedClass || !selectedStream || !testPeriod) {
            setMessage({ text: 'Please fill all fields and select a file.', type: 'error' });
            return;
        }

        setLoading(true);
        setMessage({ text: '', type: '' });

        const formData = new FormData();
        formData.append('pdf', file);
        formData.append('classId', selectedClass);
        formData.append('streamId', selectedStream);
        formData.append('testPeriod', testPeriod);

        try {
            const res = await gradeService.uploadPdfGrades(formData);
            const { successCount, skipCount, totalExtracted } = res.data.data || {};
            const detail = (successCount !== undefined)
                ? ` (${successCount} saved, ${skipCount} skipped out of ${totalExtracted} extracted)`
                : '';
            setMessage({ text: res.data.message + detail, type: 'success' });
        } catch (err) {
            setMessage({ 
                text: err.response?.data?.message || 'Error uploading PDF. Please check the file format.', 
                type: 'error' 
            });
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-slate-50 p-6 md:p-12">
            <div className="max-w-3xl mx-auto">
                <div className="bg-white rounded-3xl shadow-xl shadow-slate-200/50 border border-slate-100 overflow-hidden">
                    <div className="bg-indigo-600 p-8 text-white">
                        <h1 className="text-3xl font-black mb-2 flex items-center gap-3">
                            📄 {t('upload_pdf_marks') || 'Upload Marks from PDF'}
                        </h1>
                        <p className="text-indigo-100 font-medium">
                            Automatically extract and upload student marks per stream.
                        </p>
                    </div>

                    <form onSubmit={handleSubmit} className="p-8 space-y-6">
                        {message.text && (
                            <div className={`p-4 rounded-2xl border flex items-center gap-3 animate-fade-in ${
                                message.type === 'success' 
                                ? 'bg-emerald-50 border-emerald-100 text-emerald-700' 
                                : 'bg-rose-50 border-rose-100 text-rose-700'
                            }`}>
                                <span className="text-xl">{message.type === 'success' ? '✅' : '⚠️'}</span>
                                <p className="font-bold text-sm">{message.text}</p>
                            </div>
                        )}

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="space-y-2">
                                <label className="text-xs font-black text-slate-400 uppercase tracking-widest ml-1">
                                    {t('test_period') || 'Test Period'}
                                </label>
                                <select
                                    value={testPeriod}
                                    onChange={(e) => setTestPeriod(e.target.value)}
                                    className="w-full bg-slate-50 border-2 border-slate-100 p-4 rounded-2xl focus:border-indigo-500 outline-none transition-all font-bold text-slate-700"
                                    required
                                >
                                    {testPeriods.map(tp => (
                                        <option key={tp.value} value={tp.value}>{tp.label}</option>
                                    ))}
                                </select>
                            </div>

                            <div className="space-y-2">
                                <label className="text-xs font-black text-slate-400 uppercase tracking-widest ml-1">
                                    {t('select_class') || 'Select Class'}
                                </label>
                                <select
                                    value={selectedClass}
                                    onChange={(e) => setSelectedClass(e.target.value)}
                                    className="w-full bg-slate-50 border-2 border-slate-100 p-4 rounded-2xl focus:border-indigo-500 outline-none transition-all font-bold text-slate-700"
                                    required
                                >
                                    <option value="">-- {t('choose_class') || 'Choose Class'} --</option>
                                    {classes.map(c => (
                                        <option key={c._id} value={c._id}>{c.className}</option>
                                    ))}
                                </select>
                            </div>

                            <div className="space-y-2">
                                <label className="text-xs font-black text-slate-400 uppercase tracking-widest ml-1">
                                    {t('select_stream') || 'Select Stream'}
                                </label>
                                <select
                                    value={selectedStream}
                                    onChange={(e) => setSelectedStream(e.target.value)}
                                    className="w-full bg-slate-50 border-2 border-slate-100 p-4 rounded-2xl focus:border-indigo-500 outline-none transition-all font-bold text-slate-700"
                                    required
                                    disabled={!selectedClass}
                                >
                                    <option value="">-- {t('choose_stream') || 'Choose Stream'} --</option>
                                    {streams.map(s => (
                                        <option key={s._id} value={s._id}>{s.streamName}</option>
                                    ))}
                                </select>
                            </div>

                            <div className="space-y-2">
                                <label className="text-xs font-black text-slate-400 uppercase tracking-widest ml-1">
                                    {t('pdf_file') || 'PDF File'}
                                </label>
                                <div className="relative">
                                    <input
                                        type="file"
                                        accept=".pdf"
                                        onChange={handleFileChange}
                                        className="hidden"
                                        id="pdf-upload"
                                        required
                                    />
                                    <label
                                        htmlFor="pdf-upload"
                                        className="w-full bg-slate-50 border-2 border-dashed border-slate-200 p-4 rounded-2xl hover:border-indigo-400 cursor-pointer flex items-center justify-between transition-all group"
                                    >
                                        <span className={`font-bold text-sm ${file ? 'text-indigo-600' : 'text-slate-400'}`}>
                                            {file ? file.name : (t('select_file') || 'Select PDF File')}
                                        </span>
                                        <span className="bg-indigo-50 text-indigo-600 p-2 rounded-xl group-hover:bg-indigo-100 transition-colors">
                                            📁
                                        </span>
                                    </label>
                                </div>
                            </div>
                        </div>

                        <div className="pt-4">
                            <button
                                type="submit"
                                disabled={loading}
                                className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-black py-5 rounded-2xl shadow-xl shadow-indigo-100 transition-all active:scale-[0.98] disabled:opacity-50 flex items-center justify-center gap-3 text-lg"
                            >
                                {loading ? (
                                    <>
                                        <div className="w-5 h-5 border-4 border-white/30 border-t-white rounded-full animate-spin" />
                                        {t('processing') || 'Processing PDF...'}
                                    </>
                                ) : (
                                    <>
                                        🚀 {t('start_upload') || 'Start Upload & Extract'}
                                    </>
                                )}
                            </button>
                        </div>
                    </form>

                    <div className="bg-slate-50 p-6 border-t border-slate-100">
                        <h4 className="text-xs font-black text-slate-400 uppercase tracking-widest mb-3 ml-1">💡 Tips</h4>
                        <ul className="text-xs text-slate-500 space-y-2 font-medium">
                            <li className="flex gap-2"><span>🔹</span> Ensure the student names in the PDF exactly match the names in the system.</li>
                            <li className="flex gap-2"><span>🔹</span> Subject names should be clearly visible in the header row of the PDF table.</li>
                            <li className="flex gap-2"><span>🔹</span> The system will automatically skip students it cannot identify.</li>
                        </ul>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default PdfUploadPage;
