import React from 'react';

const PrimaryCertificate = ({ students, awardDate, academicYear, grade }) => {
    
    // Geometric Tile Component matching the image pattern
    const Tile = ({ bgColor, circlePos = '', circleColor = 'white' }) => {
        const roundedClass = {
            'tl': 'rounded-tl-full',
            'tr': 'rounded-tr-full',
            'bl': 'rounded-bl-full',
            'br': 'rounded-br-full',
        }[circlePos] || '';

        return (
            <div className={`w-12 h-12 ${bgColor} relative overflow-hidden`}>
                {circlePos && (
                    <div className={`absolute w-10 h-10 border-[6px] border-${circleColor} ${roundedClass} 
                        ${circlePos === 'tl' ? '-top-1 -left-1' : ''}
                        ${circlePos === 'tr' ? '-top-1 -right-1' : ''}
                        ${circlePos === 'bl' ? '-bottom-1 -left-1' : ''}
                        ${circlePos === 'br' ? '-bottom-1 -right-1' : ''}
                    `}></div>
                )}
            </div>
        );
    };

    // The Corner Mosaic Pattern from the image
    const CornerPattern = () => (
        <div className="grid grid-cols-3 grid-rows-3 gap-0">
            <Tile bgColor="bg-[#b91c1c]" circlePos="br" /> {/* Red */}
            <Tile bgColor="bg-[#f59e0b]" circlePos="br" /> {/* Orange */}
            <Tile bgColor="bg-white" />
            
            <Tile bgColor="bg-[#facc15]" />               {/* Yellow */}
            <Tile bgColor="bg-[#b91c1c]" circlePos="br" />
            <Tile bgColor="bg-[#1e3a8a]" circlePos="br" /> {/* Blue */}
            
            <Tile bgColor="bg-[#b91c1c]" circlePos="br" />
            <Tile bgColor="bg-[#1e3a8a]" />
            <Tile bgColor="bg-white" />
        </div>
    );

    return (
        <div className="flex flex-col items-center gap-10 bg-gray-200 py-10">
            <style>{`
                @import url('https://fonts.googleapis.com/css2?family=Cinzel:wght@700&family=Libre+Baskerville:ital,wght@0,400;0,700;1,400&family=Montserrat:wght@400;700;900&display=swap');
                
                .print-page-primary {
                    width: 297mm; height: 210mm; page-break-after: always;
                    background-color: white; position: relative; overflow: hidden;
                    display: flex; flex-direction: column; align-items: center;
                }
                .font-title { font-family: 'Montserrat', sans-serif; }
                .font-serif-name { font-family: 'Libre Baskerville', serif; }
                .font-amharic { font-family: 'Noto Sans Ethiopic', sans-serif; }
                
                @media print {
                    body { margin: 0; background: none; }
                    .print-page-primary { shadow: none; margin: 0; }
                }
            `}</style>

            {students.map((student) => (
                <div key={student.studentId} className="print-page-primary shadow-2xl relative">
                    
                    {/* Corner Patterns */}
                    <div className="absolute top-0 left-0">
                        <CornerPattern />
                    </div>
                    <div className="absolute bottom-0 right-0 rotate-180">
                        <CornerPattern />
                    </div>

                    {/* Logo Area */}
                    <div className="mt-16 flex items-center gap-2">
                        <div className="w-8 h-8 bg-[#1e3a8a] rounded-full flex items-center justify-center">
                            <span className="text-white text-[10px] font-bold">★</span>
                        </div>
                        <span className="font-title font-bold text-[#1e3a8a] tracking-widest text-sm uppercase">EXCELLENCE SCHOOL</span>
                    </div>

                    {/* Main Titles */}
                    <div className="mt-12 text-center">
                        <h1 className="text-7xl font-title font-bold text-[#d97706] tracking-[0.1em] leading-none">CERTIFICATE</h1>
                        <div className="flex items-center justify-center gap-4 mt-2">
                            <div className="h-[2px] w-12 bg-[#1e3a8a]"></div>
                            <h2 className="text-xl font-title font-black text-[#1e3a8a] tracking-[0.3em] uppercase">OF ACHIEVEMENT</h2>
                            <div className="h-[2px] w-12 bg-[#1e3a8a]"></div>
                        </div>
                    </div>

                    {/* Name Section */}
                    <div className="mt-16 text-center w-full px-40">
                        <h3 className="text-6xl font-serif-name text-[#1e3a8a] italic mb-2 px-10 border-b-2 border-[#1e3a8a] inline-block min-w-[500px]">
                            {student.fullName}
                        </h3>
                    </div>

                    {/* Description Text */}
                    <div className="mt-10 text-center max-w-4xl px-20">
                        <p className="text-gray-600 text-lg leading-relaxed font-medium">
                            This certificate is awarded to acknowledge that <strong>{student.fullName}</strong> has achieved 
                            an outstanding academic standing of <strong>{student.rank === 1 ? '1st' : student.rank === 2 ? '2nd' : '3rd'} Place</strong> 
                            in <strong>{grade}</strong> with an average of <strong>{student.avg}%</strong>.
                        </p>
                        <p className="text-gray-500 font-amharic text-lg mt-4 leading-relaxed">
                            በ{academicYear} ዓ.ም የትምህርት ዘመን በ<span className="font-bold text-[#1e3a8a]">{grade}</span> ክፍል 
                            <span className="mx-1 font-bold">{student.rank}ኛ ደረጃ</span> በመውጣት ላስመዘገቡት ውጤት።
                        </p>
                        <p className="mt-6 font-title font-bold text-[#1e3a8a] text-sm">Date: {awardDate}</p>
                    </div>

                    {/* Signatures Footer */}
                    <div className="mt-auto mb-20 w-full px-48 flex justify-between items-end">
                        <div className="text-center">
                            <div className="w-48 h-12 flex items-center justify-center">
                                <span className="font-serif italic text-2xl text-[#1e3a8a] opacity-70">Signature</span>
                            </div>
                            <div className="w-56 h-[1.5px] bg-gray-400"></div>
                            <p className="mt-2 font-title font-bold text-[#1e3a8a] text-xs uppercase">Class Teacher</p>
                        </div>

                        {/* Rank Seal (Bonus) */}
                        <div className="relative bottom-[-10px]">
                             <div className="w-20 h-20 bg-[#f59e0b] rounded-full border-4 border-white shadow-lg flex flex-col items-center justify-center">
                                <span className="text-white text-[10px] font-bold">RANK</span>
                                <span className="text-white text-3xl font-black leading-none">{student.rank}</span>
                             </div>
                        </div>

                        <div className="text-center">
                            <div className="w-48 h-12 flex items-center justify-center">
                                <span className="font-serif italic text-2xl text-[#1e3a8a] opacity-70">Signature</span>
                            </div>
                            <div className="w-56 h-[1.5px] bg-gray-400"></div>
                            <p className="mt-2 font-title font-bold text-[#1e3a8a] text-xs uppercase">School Director</p>
                        </div>
                    </div>

                </div>
            ))}
        </div>
    );
};

export default PrimaryCertificate;