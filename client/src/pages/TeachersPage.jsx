import React, { useEffect, useState } from 'react';
import userService from '../services/userService';
import { Link } from 'react-router-dom';

function TeachersPage() {
    const [teachers, setTeachers] = useState(null);

    useEffect(() => {
        const getTeachers = async () => {
            const res = await userService.getTeachers();
            setTeachers(res.data);
        };
        getTeachers();
    }, []);

    return (
        <div className="min-h-screen bg-gray-100 p-6">
            <h1 className="text-3xl font-bold text-gray-800 mb-6 text-center">
                Teachers Directory
            </h1>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {teachers && teachers.map(teacher => (
                    <div
                        key={teacher._id}
                        className="bg-white shadow-md rounded-xl p-6 hover:shadow-xl transition-shadow duration-300"
                    >
                        {/* Teacher Name */}
                        <h2 className="text-xl font-semibold text-gray-900 mb-2">
                            {teacher.fullName}
                        </h2>

                        {/* Username */}
                        <p className="text-gray-600 mb-2">
                            <span className="font-medium">Username:</span> {teacher.username}
                        </p>

                        {/* Homeroom Grade */}
                        <p className="text-gray-600 mb-3">
                            <span className="font-medium">Homeroom Grade:</span> {teacher.homeroomGrade || "N/A"}
                        </p>

                        {/* Subjects */}
                        {teacher.subjectsTaught && teacher.subjectsTaught.length > 0 && (
                        <div className="mt-4">
                            <h3 className="text-gray-700 font-medium mb-2">Subjects Taught:</h3>
                            
                            <div className="flex flex-wrap gap-2">
                                {teacher.subjectsTaught.map((item) => (
                                    // Only render if subject exists
                                    item.subject ? (
                                        <Link 
                                            to={'/subject-roster'}
                                            state={{ subjectId: item.subject._id }}
                                            key={item.subject._id} 
                                            className="px-3 py-1 bg-blue-100 text-blue-800 text-sm rounded-full font-medium"
                                        >
                                            {item.subject.name} ({item.subject.gradeLevel})
                                        </Link>
                                    ) : null
                                ))}
                            </div>
                        </div>
                    )}
                    </div>
                ))}

                {!teachers || teachers.length === 0 && (
                    <p className="text-gray-500 col-span-full text-center">No teachers found.</p>
                )}
            </div>
        </div>
    );
}

export default TeachersPage;
