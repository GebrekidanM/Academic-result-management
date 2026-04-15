import React from 'react';

const StandardCertificate = ({ students, semester, awardDate, academicYear, grade }) => {
    return (
        <div className="flex flex-col items-center gap-10 bg-gray-200 py-10">
            <style>{`
                @import url('https://fonts.googleapis.com/css2?family=Montserrat:wght@400;700;900&family=Inter:wght@400;700;800&family=Noto+Sans+Ethiopic:wght@400;700&display=swap');
                
                .print-page-standard {
                    width: 297mm; height: 210mm; page-break-after: always;
                    background-color: #f3f4f6; position: relative; overflow: hidden;
                    display: flex; items: center; justify-content: center;
                }
                .inner-content {
                    width: 92%; height: 88%;
                    background: white; border-radius: 30px;
                    position: relative; z-index: 10;
                    box-shadow: 0 0 40px rgba(0,0,0,0.05);
                    display: flex; flex-direction: column; align-items: center;
                    padding: 40px; text-align: center;
                }
                .font-main { font-family: 'Inter', sans-serif; }
                .font-amharic { font-family: 'Noto Sans Ethiopic', sans-serif; }
                
                @media print {
                    body { margin: 0; }
                    .print-page-standard { shadow: none; margin: 0; -webkit-print-color-adjust: exact; }
                }
            `}</style>

            {students.map((student) => (
                <div key={student.studentId} className="print-page-standard shadow-2xl">
                    
                    {/* BACKGROUND BLOBS (Based on image) */}
                    {/* Top Left Blobs */}
                    <svg className="absolute top-0 left-0 w-80 h-80" viewBox="0 0 200 200" xmlns="http://www.w3.org/2000/svg">
                        <path fill="#2B4C7E" d="M44.7,-76.4C58.3,-69.2,69.8,-57.4,77.3,-43.8C84.8,-30.2,88.2,-15.1,87.3,-0.5C86.4,14.1,81.1,28.1,72.9,40.4C64.7,52.7,53.5,63.2,40.4,70.9C27.3,78.6,12.2,83.4,-2.8,88.2C-17.8,93.1,-37.8,98,-52.1,91.2C-66.4,84.4,-75,65.8,-80.7,48.8C-86.4,31.8,-89.2,16.4,-88.4,1.4C-87.6,-13.6,-83.1,-28.1,-75.4,-41.2C-67.6,-54.3,-56.6,-66,-43.7,-73.6C-30.8,-81.1,-16.1,-84.6,-0.4,-83.9C15.3,-83.2,31.1,-83.5,44.7,-76.4Z" transform="translate(40 40)" />
                        <circle cx="20" cy="100" r="15" fill="#FFD166" />
                    </svg>

                    {/* Top Right Blobs */}
                    <svg className="absolute top-0 right-0 w-96 h-96" viewBox="0 0 200 200" xmlns="http://www.w3.org/2000/svg">
                        <path fill="#E94E77" d="M40,-69.2C51.7,-61.1,61,-50.2,68.2,-37.9C75.4,-25.6,80.5,-12.8,81.8,0.7C83.1,14.2,80.6,28.4,73.5,40.8C66.3,53.1,54.5,63.7,41.2,70.1C27.9,76.5,13.1,78.7,-1.5,81.3C-16.1,83.9,-31.4,86.9,-44.7,82.4C-58,77.9,-69.4,65.8,-76.7,52C-84,38.2,-87.3,22.7,-88.4,7C-89.5,-8.7,-88.4,-24.5,-81.4,-37.8C-74.4,-51.1,-61.5,-61.8,-47.9,-68.9C-34.3,-76,-17.1,-79.5,-1.1,-77.6C14.9,-75.7,28.3,-77.3,40,-69.2Z" transform="translate(160 40)" />
                    </svg>

                    {/* Bottom Blobs */}
                    <svg className="absolute bottom-0 right-0 w-80 h-64" viewBox="0 0 200 200" xmlns="http://www.w3.org/2000/svg">
                        <path fill="#2B4C7E" d="M47.5,-63.4C61.4,-52.7,72.4,-38.4,78.2,-22.3C84,-6.2,84.7,11.7,78.7,27.1C72.8,42.4,60.2,55.1,45.5,64.2C30.8,73.3,13.9,78.8,-2.4,82.9C-18.7,87.1,-37.4,89.8,-52.1,82.4C-66.8,75.1,-77.4,57.7,-82.9,40.1C-88.5,22.4,-88.9,4.4,-85.1,-11.9C-81.2,-28.3,-73.1,-43.1,-60.8,-54.2C-48.5,-65.4,-32,-72.9,-16.1,-74.9C-0.1,-76.8,15.8,-73.3,47.5,-63.4Z" transform="translate(150 160)" />
                        <path fill="#FFD166" d="M20,150 Q40,120 70,140 T120,130" stroke="#FFD166" strokeWidth="20" strokeLinecap="round" />
                    </svg>
                    
                    <svg className="absolute bottom-0 left-0 w-64 h-64" viewBox="0 0 200 200" xmlns="http://www.w3.org/2000/svg">
                         <path fill="#06D6A0" d="M35,-47.2C46.1,-40.1,56.5,-30.9,62.8,-19.1C69.1,-7.4,71.3,7,67.7,20C64.1,33,54.7,44.7,42.8,53C30.8,61.3,16.4,66.2,1.3,64.4C-13.8,62.6,-28.5,54.1,-40.8,43.6C-53.1,33.1,-63,20.6,-66.1,6.5C-69.3,-7.7,-65.6,-23.5,-56.3,-34.7C-47,-45.9,-32,-52.4,-18.4,-56.4C-4.7,-60.4,7.6,-61.8,18.4,-56.4C29.2,-51,35,-47.2,35,-47.2Z" transform="translate(40 160)" />
                    </svg>

                    {/* MAIN CONTENT BOX */}
                    <div className="inner-content">
                        
                        {/* Title Section */}
                        <div className="mt-10">
                            <h1 className="text-7xl font-main font-extrabold text-black tracking-tighter uppercase mb-0">CERTIFICATE</h1>
                            <p className="text-xl font-main font-bold text-gray-800 tracking-[0.4em] uppercase">OF ACHIEVEMENT</p>
                        </div>

                        {/* Proudly Presented Badge */}
                        <div className="mt-12 bg-[#2B4C7E] text-white px-10 py-3 rounded-full text-sm font-bold tracking-widest uppercase">
                            This certificate is proudly presented to
                        </div>

                        {/* Name Section */}
                        <div className="mt-8 w-full">
                            <h2 className="text-7xl font-main font-black text-black uppercase tracking-tight mb-2">
                                {student.fullName}
                            </h2>
                            <div className="w-1/2 h-0.5 bg-gray-300 mx-auto"></div>
                        </div>

                        {/* Description Section */}
                        <div className="mt-8 max-w-4xl px-10">
                            <p className="text-gray-600 font-main text-lg leading-relaxed">
                                Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. 
                                achieving <span className="font-bold text-black">{student.rank === 1 ? '1st' : student.rank === 2 ? '2nd' : '3rd'} Place</span> in <strong>{grade}</strong> with <strong>{student.avg}%</strong>.
                            </p>
                            <p className="mt-4 text-gray-500 font-amharic text-lg leading-relaxed">
                                በ{academicYear} ዓ.ም በነበረው የትምህርት ዘመን <span className="font-bold text-[#2B4C7E]">{student.rank}ኛ ደረጃ</span> በመውጣት ላመጣው/ችው ውጤት።
                            </p>
                        </div>

                        {/* Footer Section */}
                        <div className="mt-auto w-full flex justify-between items-end px-16 mb-6">
                            
                            {/* Date Field */}
                            <div className="text-center w-64">
                                <div className="border-b-2 border-gray-400 pb-1 font-bold text-lg">{awardDate}</div>
                                <p className="mt-2 text-xs font-bold text-gray-500 uppercase tracking-widest">Date</p>
                            </div>

                            {/* Center Rank Seal */}
                            <div className="relative">
                                <svg width="140" height="140" viewBox="0 0 100 100">
                                    <path fill="#FFD166" d="M50 5 L58 35 L88 35 L64 54 L72 84 L50 65 L28 84 L36 54 L12 35 L42 35 Z" />
                                    <circle cx="50" cy="50" r="32" fill="#2B4C7E" />
                                    <circle cx="50" cy="50" r="28" fill="none" stroke="#FFD166" strokeWidth="1" strokeDasharray="2" />
                                    <text x="50" y="44" textAnchor="middle" fill="white" fontSize="8" fontWeight="bold" fontFamily="Arial">BEST</text>
                                    <text x="50" y="54" textAnchor="middle" fill="white" fontSize="12" fontWeight="black" fontFamily="Arial">AWARD</text>
                                    <text x="50" y="65" textAnchor="middle" fill="#FFD166" fontSize="14" fontWeight="black" fontFamily="Arial">{student.rank}</text>
                                </svg>
                            </div>

                            {/* Signature Field */}
                            <div className="text-center w-64">
                                <div className="h-8 border-b-2 border-gray-400 flex items-center justify-center italic text-gray-400 font-serif">
                                    Signature
                                </div>
                                <p className="mt-2 text-xs font-bold text-gray-500 uppercase tracking-widest">Signature</p>
                            </div>
                        </div>
                    </div>
                </div>
            ))}
        </div>
    );
};

export default StandardCertificate;