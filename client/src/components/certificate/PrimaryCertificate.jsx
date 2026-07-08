import React from 'react';
import { useTranslation } from 'react-i18next';
import { schoolInfoData } from '../../shared/utils/schoolInfoData';

const getRankNumber = (rankStr) => {
    if (!rankStr) return 0;
    const parts = String(rankStr).split('/');
    return parseInt(parts[0].trim(), 10) || 0;
};

const PrimaryCertificate = ({ students, awardDate, academicYear, grade }) => {
    const { t } = useTranslation();

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
        <div className="flex flex-col items-center gap-10 bg-gray-200 py-10 print:bg-white print:py-0">
            <style>{`
                /* ⚠️ ማስተካከያ 1፦ የአማርኛውን Noto Sans Ethiopic ፎንት በደህንነት እዚህ ጋር አስመጥተነዋል [2] */
                @import url('https://fonts.googleapis.com/css2?family=Cinzel:wght@700&family=Libre+Baskerville:ital,wght@0,400;0,700;1,400&family=Montserrat:wght@400;700;900&family=Noto+Sans+Ethiopic:wght@400;700&display=swap');
                
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
                    .print-page-primary { shadow: none; margin: 0; -webkit-print-color-adjust: exact; }
                }
            `}</style>

            {students && students.map((student) => {
                const rankNum = getRankNumber(student.rank);
                const englishRankStr = rankNum === 1 ? '1st' : rankNum === 2 ? '2nd' : rankNum === 3 ? '3rd' : `${rankNum}th`;

                return (
                    <div key={student.studentId || student._id} className="print-page-primary shadow-2xl relative">
                        
                        {/* Corner Patterns */}
                        <div className="absolute top-0 left-0 no-print">
                            <CornerPattern />
                        </div>
                        <div className="absolute bottom-0 right-0 rotate-180 no-print">
                            <CornerPattern />
                        </div>

                        {/* ⚠️ ማስተካከያ 2፦ ከርዕሱ በላይ የትምህርት ቤቱን ስም እና አርማ (Logo) ማገናኘት [2] */}
                        <div className="mt-14 flex flex-col items-center gap-3 no-print">
                            <img src={schoolInfoData.logo} alt="School Logo" className="w-30 h-30 object-contain rounded-full border border-slate-200" />
                            <span className="font-title font-bold text-[#1e3a8a] tracking-wider text-3xl uppercase">
                                {schoolInfoData.name}
                            </span>
                        </div>

                        {/* Main Titles */}
                        <div className="mt-6 text-center">
                            <h1 className="text-4xl font-title font-bold text-[#d97706] tracking-[0.1em] leading-none">CERTIFICATE</h1>
                            <div className="flex items-center justify-center gap-4 mt-2">
                                <div className="h-[2px] w-12 bg-[#1e3a8a]"></div>
                                <h2 className="text-sm font-title font-black text-[#1e3a8a] tracking-[0.3em] uppercase">OF ACHIEVEMENT</h2>
                                <div className="h-[2px] w-12 bg-[#1e3a8a]"></div>
                            </div>
                        </div>

                        {/* Name Section */}
                        <div className="mt-12 text-center w-full px-40">
                            <h3 className="text-5xl font-serif-name text-[#1e3a8a] italic mb-2 px-10 border-b-2 border-[#1e3a8a] inline-block min-w-[500px]">
                                {student.fullName}
                            </h3>
                        </div>

                        <div className="grid grid-cols-2 gap-8 w-full max-w-5xl px-12 mt-4 flex-1">
                            <div className="text-left pr-6 border-r border-gray-350 flex flex-col justify-center">
                                    <p className="text-gray-500 font-amharic text-base leading-relaxed">
                                        ይህ የላቀ ውጤት ማረጋገጫ ምስክር ወረቀት በ{academicYear} የትምህርት ዘመን በ<span className="font-bold text-[#2B4C7E]">{grade}</span> ውስጥ <span className="font-bold text-[#2B4C7E]">{rankNum}ኛ ደረጃ</span> በመውጣት {student.gender === "Male" ? "ላመጣው" : "ላመጣችው"} <strong>{student.avg}%</strong> ውጤት የተሰጠ ነው።
                                    </p>
                                </div>

                            {/* ቀኝ ጎን፦ እንግሊዝኛ ጽሁፍ (Left-Aligned) [2] */}
                            <div className="text-left pl-6 flex flex-col justify-center">
                                <p className="text-gray-600 text-sm leading-relaxed font-medium">
                                    This certificate is awarded to acknowledge that <strong>{student.fullName}</strong> has achieved 
                                    an outstanding academic standing of <strong>{englishRankStr} Place</strong> in <strong>{grade}</strong> with an average of <strong>{student.avg}%</strong>.
                                </p>
                            </div>
                        </div>

                        {/* Signatures Footer */}
                        <div className="mt-auto mb-10 w-full px-48 flex justify-between items-end">
                            <div className="text-center">
                                <div className="w-48 h-8 flex items-center justify-center"/>
                                <div className="w-56 h-[1.5px] bg-gray-400"></div>
                                <p className="mt-2 font-title font-bold text-[#02091d] text-2xs">Homeroom Teacher</p>
                            </div>

                            {/* Rank Seal */}
                            <div className="relative bottom-[-10px]">
                                 <div className="w-16 h-16 bg-[#f59e0b] rounded-full border-4 border-white shadow-lg flex flex-col items-center justify-center">
                                    <span className="text-white text-[8px] font-bold">RANK</span>
                                    <span className="text-white text-2xl font-black leading-none">{rankNum}</span>
                                 </div>
                            </div>

                            <div className="text-center">
                                <div className="w-48 h-8 flex items-center justify-center"/>
                                <div className="w-56 h-[1.5px] bg-gray-400"/>
                                <p className="mt-2 font-title font-bold text-2xs text-[#02091d]">School Director</p>
                            </div>
                        </div>

                    </div>
                );
            })}
        </div>
    );
};

export default PrimaryCertificate;