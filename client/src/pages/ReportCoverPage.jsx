import React from 'react';

const ReportCoverPage = ({ student, schoolInfo, academicYear }) => {
    // --- MOCK DATA FOR DISPLAY ---
    const studentName = student?.fullName || "Student Name";
    const studentId = student?.studentId?.length > 10 ? `${student.studentId.substring(0, 8)}...` : student?.studentId || "ID-001";
    const grade = student?.gradeLevel || "12";
    
    // Default School Info if not passed
    const school = schoolInfo || {
        name: "FUTURE GENERATION ACADEMY",
        address: "Addis Ababa, Bole Sub-city",
        phone: "+251 911 23 45 67",
        email: "info@futuregen.edu.et"
    };

    const year = academicYear || new Date().getFullYear();

    return (
        <div className="w-[297mm] h-[210mm] bg-white relative flex overflow-hidden print-break text-slate-800 font-sans">
            
            {/* --- FONTS & SHAPES --- */}
            <style>{`
                @import url('https://fonts.googleapis.com/css2?family=Oswald:wght@300;500;700&family=Montserrat:wght@400;600;700;800&display=swap');
                
                .font-oswald { font-family: 'Oswald', sans-serif; }
                .font-montserrat { font-family: 'Montserrat', sans-serif; }

                /* Geometric Shapes */
                .shape-sidebar { clip-path: polygon(0 0, 75% 0, 100% 50%, 75% 100%, 0 100%); }
                .shape-cyan-accent { clip-path: polygon(0 0, 100% 0, 100% 100%, 0 100%, 25% 50%); }
                .shape-slant { clip-path: polygon(20% 0, 100% 0, 100% 100%, 0% 100%); }
            `}</style>

            {/* === LAYER 1: CYAN ACCENT (Middle Layer) === */}
            <div className="absolute top-0 left-[28%] w-[15%] h-full bg-[#06b6d4] z-10 transform skew-x-12 print:bg-[#06b6d4]"></div>

            {/* === LAYER 2: DARK BLUE SIDEBAR === */}
            <div className="relative z-20 w-[35%] h-full bg-[#0f172a] text-white flex flex-col justify-between py-10 pl-10 pr-16 shape-sidebar print:bg-[#0f172a]">
                <div className="space-y-1">
                    <div className="w-12 h-1 bg-[#06b6d4]"></div>
                    <div className="w-6 h-1 bg-white opacity-40"></div>
                </div>
                <div className="flex flex-col items-start opacity-20">
                    <span className="text-9xl font-oswald font-bold leading-none tracking-tighter text-white opacity-10 -ml-4">{year}</span>
                </div>
                <div className="font-montserrat text-[10px] tracking-wide space-y-3 opacity-90">
                    <div>
                        <p className="text-[#06b6d4] font-bold mb-0.5">LOCATION</p>
                        <p>{school.address}</p>
                    </div>
                    <div>
                        <p className="text-[#06b6d4] font-bold mb-0.5">CONTACT</p>
                        <p>{school.phone}</p>
                    </div>
                </div>
            </div>

            {/* === LAYER 3: RIGHT CONTENT === */}
            <div className="flex-1 h-full relative z-10 flex flex-col pt-12 pr-12 pl-12">
                
                {/* School Header */}
                <div className="text-right border-b-4 border-slate-100 pb-4 mb-8">
                    <h2 className="text-3xl font-montserrat font-extrabold text-[#0f172a] uppercase tracking-tight">{school.name}</h2>
                    <div className="flex justify-end items-center gap-2 mt-1">
                        <div className="h-0.5 w-10 bg-[#06b6d4]"></div>
                        <p className="text-xs font-bold text-slate-400 uppercase tracking-[0.3em]">Official Transcript</p>
                    </div>
                </div>

                {/* Main Title Area */}
                <div className="flex-1 flex flex-col justify-center items-end relative">
                    <div className="text-right mb-10 relative">
                        <h3 className="text-lg font-montserrat font-medium text-[#0891b2] tracking-[0.4em] uppercase mb-1">Performance</h3>
                        <h1 className="text-8xl font-oswald font-bold text-[#0f172a] leading-[0.85]">
                            ANNUAL <br/>
                            <span className="text-[#06b6d4]">REPORT</span>
                        </h1>
                        <div className="absolute -top-6 -left-12 bg-[#0f172a] text-white w-20 h-20 rounded-full flex items-center justify-center font-oswald font-bold text-2xl shadow-xl border-4 border-white transform -rotate-12 print:bg-[#0f172a]">
                            {year}
                        </div>
                    </div>

                    {/* Student Details Box */}
                    <div className="bg-slate-50 w-full max-w-md p-6 border-l-8 border-[#06b6d4] shadow-sm relative overflow-hidden print:bg-slate-50">
                        <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mb-2">Student Information</p>
                        <h2 className="text-3xl font-montserrat font-bold text-slate-800 mb-2 truncate">{studentName}</h2>
                        <div className="grid grid-cols-2 gap-4 text-sm border-t border-slate-200 pt-3">
                            <div>
                                <span className="block text-[10px] text-slate-400 uppercase font-bold">Student ID</span>
                                <span className="font-bold text-slate-700 font-mono">{studentId}</span>
                            </div>
                            <div>
                                <span className="block text-[10px] text-slate-400 uppercase font-bold"></span>
                                <span className="font-bold text-slate-700">{grade}</span>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Footer Decor */}
                <div className="mt-auto h-8 w-2/3 self-end flex gap-1">
                    <div className="flex-1 bg-[#0f172a] shape-slant opacity-10"></div>
                    <div className="w-1/3 bg-[#06b6d4] shape-slant print:bg-[#06b6d4]"></div>
                </div>
            </div>
        </div>
    );
};

export default ReportCoverPage;