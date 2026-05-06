import React, { useState, useEffect } from 'react';
import classService from '../services/classService';

const ClassStreamSelector = ({ 
    selectedClass, 
    onClassChange, 
    selectedStream, 
    onStreamChange, 
    required = false,
    showAllStreamsOption = false,
    labelClass = "block text-gray-700 text-sm font-bold mb-2",
    selectClass = "shadow appearance-none border rounded-lg w-full py-3 px-4 text-gray-700 leading-tight focus:outline-none focus:ring-2 focus:ring-pink-500"
}) => {
    const [classes, setClasses] = useState([]);
    const [streams, setStreams] = useState([]);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        fetchClasses();
    }, []);

    useEffect(() => {
        if (selectedClass) {
            fetchStreams(selectedClass);
        } else {
            setStreams([]);
        }
    }, [selectedClass]);

    const fetchClasses = async () => {
        try {
            setLoading(true);
            const response = await classService.getClasses();
            setClasses(response.data.data || []);
        } catch (error) {
            console.error("Error fetching classes:", error);
        } finally {
            setLoading(false);
        }
    };

    const fetchStreams = async (classId) => {
        try {
            const response = await classService.getStreamsByClass(classId);
            setStreams(response.data.data || []);
        } catch (error) {
            console.error("Error fetching streams:", error);
        }
    };

    return (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
                <label className={labelClass}>Class {required && <span className="text-red-500">*</span>}</label>
                <select 
                    value={selectedClass || ''} 
                    onChange={(e) => onClassChange(e.target.value)}
                    className={selectClass}
                    required={required}
                    disabled={loading}
                >
                    <option value="">Select Class</option>
                    {classes.map(cls => (
                        <option key={cls._id} value={cls._id}>{cls.className}</option>
                    ))}
                </select>
            </div>

            <div>
                <label className={labelClass}>Stream {required && !showAllStreamsOption && <span className="text-red-500">*</span>}</label>
                <select 
                    value={selectedStream || ''} 
                    onChange={(e) => onStreamChange(e.target.value)}
                    className={selectClass}
                    required={required && !showAllStreamsOption}
                    disabled={!selectedClass || streams.length === 0}
                >
                    <option value="">{showAllStreamsOption ? "All Streams" : "Select Stream"}</option>
                    {/* Explicit "all" option only if we want to distinguish from "not selected" */}
                    {streams.map(str => (
                        <option key={str._id} value={str._id}>{str.streamName}</option>
                    ))}
                </select>
                {!selectedClass && <p className="text-xs text-gray-500 mt-1">Select a class first</p>}
                {selectedClass && streams.length === 0 && <p className="text-xs text-orange-500 mt-1">No streams available</p>}
            </div>
        </div>
    );
};

export default ClassStreamSelector;
