import React from 'react';

const ReportCoverPage = ({ studentInfo, schoolInfo ,getReportTitle}) => {
    const studentName = studentInfo?.fullName || "Student Name";
    const studentId = studentInfo?.studentId || "ID-001";
    const grade = studentInfo?.classId || "Grade --";
    const year = studentInfo?.academicYear || new Date().getFullYear();

    return (
        <div className="w-[297mm] h-[210mm] bg-white relative flex overflow-hidden text-slate-800 font-sans print-break">
            {/* --- FONTS & SHAPES --- */}
            <style>{`
                @import url('https://fonts.googleapis.com/css2?family=Oswald:wght@400;600;700&family=Montserrat:wght@300;400;600;700;800&display=swap');
                .cover-diagonal-shape { clip-path: polygon(35% 0%, 100% 0%, 100% 100%, 0% 100%); }
                .year-badge-shape { clip-path: polygon(0 0, 100% 0, 95% 100%, 5% 100%); }
                @media print {
                    .bg-navy-dark { background-color: #0B1120 !important; -webkit-print-color-adjust: exact; }
                    .bg-cyan-light { background-color: #CFF0F6 !important; -webkit-print-color-adjust: exact; }
                    .text-cyan-bold { color: #06b6d4 !important; -webkit-print-color-adjust: exact; }
                    .bg-black-badge { background-color: #000000 !important; color: white !important; -webkit-print-color-adjust: exact; }
                }
            `}</style>

            {/* === LEFT PANEL (BACK COVER) === */}
            <div className="w-1/2 h-full bg-[#0B1120] bg-navy-dark text-white flex flex-col justify-center items-center p-12 text-center relative z-20">
                <div className="w-38 h-38 mb-6 bg-white rounded-full flex items-center justify-center overflow-hidden shadow-2xl">
                    <img src={schoolInfo.logo} alt="Logo" className="w-full h-full object-cover " />
                </div>
                <h1 className="text-3xl font-montserrat font-bold tracking-widest leading-snug mb-2 uppercase">{schoolInfo.name}</h1>
                <div className="w-12 h-1 bg-[#06b6d4] my-6 rounded"></div>
                <p className="text-sm font-montserrat font-light opacity-80 leading-relaxed mb-12 max-w-sm mx-auto">
                    "Empowering the next generation with knowledge, character, and excellence."
                </p>
                <div className="text-xs font-montserrat font-medium opacity-70 space-y-3">
                    <div className="flex items-center justify-center gap-2"><span className="text-[#06b6d4]">📍</span> <span>{schoolInfo.address}</span></div>
                    <div className="flex items-center justify-center gap-2"><span className="text-[#06b6d4]">📞</span> <span>{schoolInfo.phone}</span></div>
                    <div className="flex items-center justify-center gap-2"><span className="text-[#06b6d4]">✉️</span> <span>{schoolInfo.email}</span></div>
                    <div className="flex items-center justify-center gap-2"><span className="text-[#06b6d4]">🌐</span> <span>{schoolInfo.website}</span></div>
                </div>
            </div>

            {/* === RIGHT PANEL (FRONT COVER) === */}
            <div className="w-1/2 h-full bg-white relative relative z-10 overflow-hidden">
                <div className="absolute top-0 right-0 w-[60%] h-full bg-[#CFF0F6] bg-cyan-light cover-diagonal-shape z-0"></div>
                <div className="relative z-10 h-full flex flex-col pt-24 pr-16 pl-8 text-right">
                    <h3 className="text-sm font-montserrat font-bold text-[#06b6d4] text-cyan-bold uppercase tracking-[0.3em] mb-2">Official Transcript</h3>
                    <div className="flex flex-col items-end">
                        <h1 className="text-6xl font-oswald font-bold text-[#0f172a] leading-tight mb-2">
                            {getReportTitle()}<br/>
                            <span className="text-[#06b6d4]">CARD</span>
                        </h1>
                    </div>
                    <div className="mt-6 flex justify-end">
                        <div className="bg-black bg-black-badge text-white font-oswald font-bold text-2xl px-10 py-2 year-badge-shape shadow-xl transform rotate-[-2deg]">{year}</div>
                    </div>
                    <div className="mt-auto mb-20 flex flex-col items-end">
                        <p className="text-[10px] text-gray-500 font-bold uppercase tracking-widest mb-2">Prepared For</p>
                        <div className="flex flex-col items-end border-r-4 border-[#06b6d4] pr-4">
                            <h2 className="text-4xl font-montserrat font-bold text-[#0f172a] mb-1">{studentName}</h2>
                            <p className="text-sm font-bold text-gray-500 font-mono tracking-wide">ID: {studentId}</p>
                            <p className="text-sm font-bold text-[#06b6d4] text-cyan-bold uppercase tracking-wide">{grade}</p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ReportCoverPage;