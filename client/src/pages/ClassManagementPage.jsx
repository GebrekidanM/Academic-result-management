import React, { useState, useEffect } from 'react';
import classService from '../services/classService';
import { toast } from 'react-toastify';

const ClassManagementPage = () => {
    const [classes, setClasses] = useState([]);
    const [loading, setLoading] = useState(false);
    
    // Form States
    const [className, setClassName] = useState('');
    const [schoolLevel, setSchoolLevel] = useState('primary');
    const [editingClass, setEditingClass] = useState(null);

    // Stream Form States
    const [selectedClassId, setSelectedClassId] = useState(null);
    const [streams, setStreams] = useState([]);
    const [streamName, setStreamName] = useState('');
    const [editingStream, setEditingStream] = useState(null);

    useEffect(() => {
        fetchClasses();
    }, []);

    const fetchClasses = async () => {
        try {
            setLoading(true);
            const response = await classService.getClasses();
            setClasses(response.data.data || []);
        } catch (error) {
            toast.error("Failed to fetch classes");
        } finally {
            setLoading(false);
        }
    };

    const fetchStreams = async (classId) => {
        try {
            const response = await classService.getStreamsByClass(classId);
            setStreams(response.data.data || []);
            setSelectedClassId(classId);
        } catch (error) {
            toast.error("Failed to fetch streams");
        }
    };

    const handleClassSubmit = async (e) => {
        e.preventDefault();
        try {
            if (editingClass) {
                await classService.updateClass(editingClass._id, { className, schoolLevel });
                toast.success("Class updated");
            } else {
                await classService.createClass({ className, schoolLevel });
                toast.success("Class created");
            }
            setClassName('');
            setSchoolLevel('primary');
            setEditingClass(null);
            fetchClasses();
        } catch (error) {
            toast.error(error.response?.data?.message || "Operation failed");
        }
    };

    const handleClassDelete = async (id) => {
        if (window.confirm("Are you sure? This will remove all associated subjects and students.")) {
            try {
                await classService.deleteClass(id);
                toast.success("Class deleted");
                fetchClasses();
                if (selectedClassId === id) {
                    setSelectedClassId(null);
                    setStreams([]);
                }
            } catch (error) {
                toast.error("Delete failed");
            }
        }
    };

    const handleStreamSubmit = async (e) => {
        e.preventDefault();
        if (!selectedClassId) return;
        try {
            if (editingStream) {
                await classService.updateStream(editingStream._id, { streamName });
                toast.success("Stream updated");
            } else {
                await classService.createStream(selectedClassId, { streamName });
                toast.success("Stream created");
            }
            setStreamName('');
            setEditingStream(null);
            fetchStreams(selectedClassId);
        } catch (error) {
            toast.error(error.response?.data?.message || "Operation failed");
        }
    };

    const handleStreamDelete = async (id) => {
        if (window.confirm("Delete this stream?")) {
            try {
                await classService.deleteStream(id);
                toast.success("Stream deleted");
                fetchStreams(selectedClassId);
            } catch (error) {
                toast.error("Delete failed");
            }
        }
    };

    return (
        <div className="p-6 max-w-6xl mx-auto">
            <h2 className="text-3xl font-black text-gray-800 mb-8 border-b-4 border-pink-500 inline-block">Class & Stream Management</h2>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                
                {/* --- CLASS SECTION --- */}
                <div className="bg-white p-6 rounded-2xl shadow-xl border border-gray-100">
                    <h3 className="text-xl font-bold mb-4 text-pink-600 flex items-center">
                        <span className="bg-pink-100 p-2 rounded-lg mr-2">🏫</span>
                        Classes
                    </h3>

                    <form onSubmit={handleClassSubmit} className="mb-6 flex gap-2">
                        <input 
                            type="text" 
                            placeholder="Class Name (e.g. P1)" 
                            value={className}
                            onChange={(e) => setClassName(e.target.value)}
                            className="flex-1 p-3 border rounded-xl focus:ring-2 focus:ring-pink-500 outline-none"
                            required
                        />
                        <select 
                            value={schoolLevel}
                            onChange={(e) => setSchoolLevel(e.target.value)}
                            className="p-3 border rounded-xl bg-gray-50"
                        >
                            <option value="kg">KG</option>
                            <option value="primary">Primary</option>
                            <option value="High School">High School</option>
                        </select>
                        <button type="submit" className="bg-pink-600 text-white px-6 py-3 rounded-xl font-bold hover:bg-pink-700 transition-colors">
                            {editingClass ? 'Update' : 'Add'}
                        </button>
                    </form>

                    <div className="space-y-3 max-h-[500px] overflow-y-auto pr-2">
                        {loading ? <p>Loading classes...</p> : classes.map(cls => (
                            <div key={cls._id} 
                                className={`p-4 rounded-xl border-2 transition-all cursor-pointer flex justify-between items-center ${selectedClassId === cls._id ? 'border-pink-500 bg-pink-50' : 'border-gray-100 hover:border-gray-200'}`}
                                onClick={() => fetchStreams(cls._id)}
                            >
                                <div>
                                    <p className="font-bold text-lg">{cls.className}</p>
                                    <p className="text-xs text-gray-500 uppercase font-bold tracking-wider">{cls.schoolLevel} Level</p>
                                </div>
                                <div className="flex gap-2">
                                    <button onClick={(e) => { e.stopPropagation(); setEditingClass(cls); setClassName(cls.className); setSchoolLevel(cls.schoolLevel); }} className="text-blue-500 hover:bg-blue-50 p-2 rounded-lg transition-colors">✏️</button>
                                    <button onClick={(e) => { e.stopPropagation(); handleClassDelete(cls._id); }} className="text-red-500 hover:bg-red-50 p-2 rounded-lg transition-colors">🗑️</button>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* --- STREAM SECTION --- */}
                <div className="bg-white p-6 rounded-2xl shadow-xl border border-gray-100">
                    <h3 className="text-xl font-bold mb-4 text-blue-600 flex items-center">
                        <span className="bg-blue-100 p-2 rounded-lg mr-2">🌊</span>
                        Streams {selectedClassId && <span className="ml-2 text-sm font-normal text-gray-400">for {classes.find(c => c._id === selectedClassId)?.className}</span>}
                    </h3>

                    {!selectedClassId ? (
                        <div className="h-64 flex items-center justify-center border-2 border-dashed border-gray-200 rounded-2xl text-gray-400 font-medium italic">
                            Select a class on the left to manage its streams
                        </div>
                    ) : (
                        <>
                            <form onSubmit={handleStreamSubmit} className="mb-6 flex gap-2 animate-fade-in">
                                <input 
                                    type="text" 
                                    placeholder="Stream Name (e.g. A)" 
                                    value={streamName}
                                    onChange={(e) => setStreamName(e.target.value)}
                                    className="flex-1 p-3 border rounded-xl focus:ring-2 focus:ring-blue-500 outline-none"
                                    required
                                />
                                <button type="submit" className="bg-blue-600 text-white px-6 py-3 rounded-xl font-bold hover:bg-blue-700 transition-colors">
                                    {editingStream ? 'Update' : 'Add'}
                                </button>
                                {editingStream && <button type="button" onClick={() => { setEditingStream(null); setStreamName(''); }} className="bg-gray-100 px-4 rounded-xl">Cancel</button>}
                            </form>

                            <div className="grid grid-cols-2 gap-4">
                                {streams.map(str => (
                                    <div key={str._id} className="p-4 bg-gray-50 border border-gray-200 rounded-xl flex justify-between items-center group">
                                        <span className="font-bold text-gray-700 text-lg">{str.streamName}</span>
                                        <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                            <button onClick={() => { setEditingStream(str); setStreamName(str.streamName); }} className="text-blue-500 p-1 hover:bg-white rounded">✏️</button>
                                            <button onClick={() => handleStreamDelete(str._id)} className="text-red-500 p-1 hover:bg-white rounded">🗑️</button>
                                        </div>
                                    </div>
                                ))}
                                {streams.length === 0 && <p className="col-span-2 text-center text-gray-400 italic py-8">No streams defined yet.</p>}
                            </div>
                        </>
                    )}
                </div>

            </div>
        </div>
    );
};

export default ClassManagementPage;
