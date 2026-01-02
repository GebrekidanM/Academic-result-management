import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import libraryService from '../services/libraryService';
import authService from '../services/authService';

const LibraryPage = () => {
    const { t } = useTranslation();
    const [currentUser] = useState(authService.getCurrentUser());
    // --- Data State ---
    const [resources, setResources] = useState([]);
    const [filteredResources, setFilteredResources] = useState([]);
    const [loading, setLoading] = useState(true);
    
    // --- Filter State ---
    const [filterGrade, setFilterGrade] = useState('');
    const [filterSubject, setFilterSubject] = useState('');
    const [searchTerm, setSearchTerm] = useState('');

    // --- Upload Form State ---
    const [showUpload, setShowUpload] = useState(false);
    const [uploading, setUploading] = useState(false);
    const [uploadData, setUploadData] = useState({ 
        title: '', 
        type: 'Book', 
        gradeLevel: '', 
        subject: '', 
        file: null,    
        cover: null    
    });

    // --- 1. LOAD DATA ---
    useEffect(() => {
        const fetchLib = async () => {
            try {
                const res = await libraryService.getAll();
                setResources(res.data.data);
                setFilteredResources(res.data.data);
            } catch (err) { 
                console.error("Error loading library:", err); 
            } 
            finally { 
                setLoading(false); 
            }
        };
        fetchLib();
    }, []);

    // --- 2. FILTER LOGIC ---
    useEffect(() => {
        let result = resources;

        // Filter by Grade
        if (filterGrade) {
            result = result.filter(r => r.gradeLevel === filterGrade);
        }
        
        // Filter by Subject
        if (filterSubject) {
            result = result.filter(r => r.subject.toLowerCase().includes(filterSubject.toLowerCase()));
        }
        
        // Filter by Search Title
        if (searchTerm) {
            result = result.filter(r => r.title.toLowerCase().includes(searchTerm.toLowerCase()));
        }

        setFilteredResources(result);
    }, [filterGrade, filterSubject, searchTerm, resources]);

    // --- 3. UPLOAD HANDLER ---
    const handleUpload = async (e) => {
        e.preventDefault();
        
        // Validation
        if (!uploadData.file) {
            alert("Please select a main document file (PDF).");
            return;
        }

        const formData = new FormData();
        
        // Append Text Fields
        formData.append('title', uploadData.title);
        formData.append('type', uploadData.type);
        formData.append('gradeLevel', uploadData.gradeLevel);
        formData.append('subject', uploadData.subject);
        
        // Append Files (Must match backend: .fields([{name: 'file'}, {name: 'cover'}]))
        formData.append('file', uploadData.file);
        
        if (uploadData.cover) {
            formData.append('cover', uploadData.cover);
        }

        setUploading(true);
        try {
            const res = await libraryService.upload(formData);
            // Add new item to top of list
            const newResource = res.data.data;
            setResources([newResource, ...resources]);
            
            // Reset Form
            setShowUpload(false);
            setUploadData({ title: '', type: 'Book', gradeLevel: '', subject: '', file: null, cover: null });
            alert(t('success_save'));
        } catch (err) {
            console.error(err);
            alert(t('error') || "Upload failed.");
        } finally {
            setUploading(false);
        }
    };

    // --- 4. DELETE HANDLER ---
    const handleDelete = async (id) => {
        if(!window.confirm(t('delete_confirm') || "Delete this file?")) return;
        try {
            await libraryService.remove(id);
            setResources(resources.filter(r => r._id !== id));
        } catch(err) { 
            alert(t('error')); 
        }
    };

    // --- HELPER: Resolve URL ---
    // Handles if the URL is absolute (Cloudinary) or relative (Local)
    const getFileUrl = (path) => {
        if (!path) return '#';
        if (path.startsWith('http')) return path; 
        const SERVER_URL = process.env.REACT_APP_API_URL || 'http://localhost:5001'; 
        return `${SERVER_URL}${path}`;
    };

    const canUpload = ['admin', 'teacher', 'staff'].includes(currentUser?.role);

    return (
        <div className="p-6 bg-gray-50 min-h-screen font-sans">
            
            {/* Header */}
            <div className="flex flex-col md:flex-row justify-between items-center mb-6 gap-4">
                <h2 className="text-3xl font-bold text-gray-800">📚 {t('school_library')}</h2>
                {canUpload && (
                    <button 
                        onClick={() => setShowUpload(!showUpload)} 
                        className="bg-blue-600 text-white px-4 py-2 rounded-lg font-bold hover:bg-blue-700 transition-colors shadow-md flex items-center gap-2"
                    >
                        <span>{showUpload ? '−' : '+'}</span> {t('upload_resource')}
                    </button>
                )}
            </div>

            {/* Filters Bar */}
            <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-200 mb-8 flex flex-wrap gap-4 items-center">
                <div className="flex-grow min-w-[200px]">
                    <input 
                        type="text" 
                        placeholder={t('search_title')} 
                        value={searchTerm} 
                        onChange={e => setSearchTerm(e.target.value)} 
                        className="w-full border border-gray-300 p-2 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none" 
                    />
                </div>
                <select 
                    value={filterGrade} 
                    onChange={e => setFilterGrade(e.target.value)} 
                    className="border border-gray-300 p-2 rounded-lg bg-gray-50 focus:ring-2 focus:ring-blue-500 outline-none"
                >
                    <option value="">{t('all_grades')}</option>
                    {[1,2,3,4,5,6,7,8,9,10,11,12].map(g => (
                        <option key={g} value={`Grade ${g}`}>Grade {g}</option>
                    ))}
                    <option value="KG 1">KG 1</option>
                    <option value="KG 2">KG 2</option>
                </select>
                <input 
                    type="text" 
                    placeholder={t('filter_subject')} 
                    value={filterSubject} 
                    onChange={e => setFilterSubject(e.target.value)} 
                    className="border border-gray-300 p-2 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none" 
                />
            </div>

            {/* Upload Form */}
            {showUpload && (
                <div className="bg-blue-50 p-6 rounded-xl border border-blue-200 mb-8 animate-fade-in shadow-inner">
                    <h3 className="font-bold text-lg mb-4 text-blue-900 border-b border-blue-200 pb-2">{t('upload_new_material')}</h3>
                    <form onSubmit={handleUpload} className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        
                        {/* Text Inputs */}
                        <div className="space-y-4">
                            <div>
                                <label className="block text-xs font-bold text-gray-600 uppercase mb-1">Title</label>
                                <input type="text" required className="w-full border p-2 rounded-lg" value={uploadData.title} onChange={e => setUploadData({...uploadData, title: e.target.value})} placeholder="e.g. Biology Chapter 1" />
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-xs font-bold text-gray-600 uppercase mb-1">Type</label>
                                    <select className="w-full border p-2 rounded-lg bg-white" value={uploadData.type} onChange={e => setUploadData({...uploadData, type: e.target.value})}>
                                        <option>Book</option>
                                        <option>Teacher Note</option>
                                        <option>Worksheet</option>
                                        <option>Other</option>
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-gray-600 uppercase mb-1">{t('grade')}</label>
                                    <input type="text" required className="w-full border p-2 rounded-lg" value={uploadData.gradeLevel} onChange={e => setUploadData({...uploadData, gradeLevel: e.target.value})} placeholder="e.g. Grade 4" />
                                </div>
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-gray-600 uppercase mb-1">{t('subject')}</label>
                                <input type="text" required className="w-full border p-2 rounded-lg" value={uploadData.subject} onChange={e => setUploadData({...uploadData, subject: e.target.value})} placeholder="e.g. Mathematics" />
                            </div>
                        </div>

                        {/* File Inputs */}
                        <div className="space-y-4">
                            {/* Cover Image */}
                            <div>
                                <label className="block text-xs font-bold text-gray-600 uppercase mb-1">Cover Image (Optional)</label>
                                <label className="flex flex-col items-center justify-center w-full h-24 border-2 border-dashed border-blue-300 rounded-lg cursor-pointer bg-white hover:bg-blue-50 transition">
                                    <div className="flex flex-col items-center justify-center pt-2 pb-2">
                                        <p className="text-sm text-gray-500">{uploadData.cover ? "✅ Cover Selected" : "🖼️ Click to upload cover"}</p>
                                    </div>
                                    <input type="file" accept="image/*" className="hidden" onChange={e => setUploadData({...uploadData, cover: e.target.files[0]})} />
                                </label>
                            </div>

                            {/* Main Document */}
                            <div>
                                <label className="block text-xs font-bold text-gray-600 uppercase mb-1">Document (PDF) *</label>
                                <label className="flex flex-col items-center justify-center w-full h-24 border-2 border-dashed border-green-400 rounded-lg cursor-pointer bg-white hover:bg-green-50 transition">
                                    <div className="flex flex-col items-center justify-center pt-2 pb-2">
                                        <p className="text-sm text-gray-500">{uploadData.file ? `✅ ${uploadData.file.name}` : "📄 Click to upload PDF"}</p>
                                    </div>
                                    <input type="file" accept="application/pdf, image/*" required className="hidden" onChange={e => setUploadData({...uploadData, file: e.target.files[0]})} />
                                </label>
                            </div>
                        </div>

                        <button type="submit" disabled={uploading} className="md:col-span-2 w-full bg-green-600 text-white py-3 rounded-lg font-bold hover:bg-green-700 shadow-md transition-all disabled:opacity-50">
                            {uploading ? t('uploading') : t('submit_upload')}
                        </button>
                    </form>
                </div>
            )}

            {/* --- RESOURCE GRID --- */}
            {loading ? (
                <div className="flex justify-center items-center h-64">
                    <p className="text-lg text-gray-500 animate-pulse">{t('loading')}</p>
                </div>
            ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
                    {filteredResources.map(item => (
                        <div key={item._id} className="bg-white rounded-xl shadow-md border border-gray-100 overflow-hidden hover:shadow-2xl hover:-translate-y-1 transition-all duration-300 flex flex-col group h-full">
                            
                            {/* Preview Area (Cover) */}
                            <div className="h-48 bg-gray-200 relative overflow-hidden flex items-center justify-center">
                                {item.coverUrl ? (
                                    <img 
                                        src={getFileUrl(item.coverUrl)} 
                                        alt={item.title} 
                                        className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110" 
                                    />
                                ) : (
                                    <span className="text-6xl opacity-30 select-none">
                                        {item.type === 'Book' ? '📖' : item.type === 'Teacher Note' ? '📝' : '📄'}
                                    </span>
                                )}
                                
                                {/* Overlay Type Badge */}
                                <div className="absolute top-2 right-2 px-2 py-1 bg-black/70 backdrop-blur-sm text-white text-[10px] font-bold rounded uppercase shadow-sm">
                                    {item.type}
                                </div>
                            </div>
                            
                            {/* Details Area */}
                            <div className="p-5 flex-1 flex flex-col">
                                <div className="mb-2">
                                    <span className="text-[10px] font-bold text-blue-600 bg-blue-50 px-2 py-0.5 rounded border border-blue-100 uppercase">
                                        {item.subject}
                                    </span>
                                </div>
                                
                                <h3 className="font-bold text-gray-900 text-lg leading-snug mb-1 line-clamp-2" title={item.title}>
                                    {item.title}
                                </h3>
                                
                                <p className="text-xs text-gray-500 font-medium mb-4">{item.gradeLevel}</p>
                                
                                <div className="mt-auto border-t border-gray-100 pt-3">
                                    <div className="flex justify-between items-center text-[10px] text-gray-400 mb-3">
                                        <span>User: {item.uploadedBy?.fullName?.split(' ')[0] || 'Admin'}</span>
                                        <span>{new Date(item.createdAt).toLocaleDateString()}</span>
                                    </div>
                                    
                                    <div className="flex gap-2">
                                        <a 
                                            href={getFileUrl(item.fileUrl)} 
                                            target="_blank" 
                                            rel="noopener noreferrer"
                                            className="flex-1 bg-blue-600 text-white text-center py-2 rounded-lg font-bold text-sm hover:bg-blue-700 shadow-sm transition-colors flex items-center justify-center gap-2"
                                        >
                                            <span>👀</span> {t('read')}
                                        </a>
                                        
                                        {(currentUser?.role === 'admin' || currentUser?._id === item.uploadedBy?._id) && (
                                            <button 
                                                onClick={() => handleDelete(item._id)} 
                                                className="px-3 bg-red-50 text-red-500 rounded-lg hover:bg-red-100 border border-red-200 transition-colors"
                                                title="Delete"
                                            >
                                                🗑️
                                            </button>
                                        )}
                                    </div>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}
            
            {/* Empty State */}
            {!loading && filteredResources.length === 0 && (
                <div className="text-center py-20">
                    <div className="text-6xl mb-4">📂</div>
                    <p className="text-gray-500 text-lg font-medium">No resources found.</p>
                    <p className="text-gray-400 text-sm">Try adjusting your filters or upload a new book.</p>
                </div>
            )}
        </div>
    );
};

export default LibraryPage;