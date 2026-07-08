import React from 'react';
import { useTranslation } from 'react-i18next';
import { schoolInfoData } from '../../shared/utils/schoolInfoData';

const ProfessionalCertificate = ({ recipients, type = 'teacher', awardDate, academicYear}) => {
    const { t } = useTranslation();

    const theme = type === 'teacher' 
        ? {
            primary: '#064e3b', 
            accent: '#059669',
            bgBlob: '#047857',
            titleColor: '#047857',
            badgeText: 'Teacher of the Year Award'
          }
        : {
            primary: '#1e293b',
            accent: '#475569',
            bgBlob: '#334155',
            titleColor: '#2b4c7e',
            badgeText: 'Honorary Partner Recognition'
          };

    return (
        <div className="flex flex-col items-center gap-10 bg-gray-200 py-10 print:bg-white print:py-0">
            <style>{`
                @import url('https://fonts.googleapis.com/css2?family=Montserrat:wght@400;750;900&family=Playfair+Display:ital,wght@0,700;1,700&family=Noto+Sans+Ethiopic:wght@400;750&display=swap');
                
                .print-page-prof {
                    width: 297mm; height: 210mm; page-break-after: always;
                    background-color: #f8fafc; position: relative; overflow: hidden;
                    display: flex; items: center; justify-content: center;
                }
                .inner-content-prof {
                    width: 93%; height: 90%;
                    background: white; border-radius: 20px;
                    border: 3px double #d97706; /* Gold double border */
                    position: relative; z-index: 10;
                    box-shadow: 0 0 40px rgba(0,0,0,0.04);
                    display: flex; flex-direction: column; align-items: center;
                    padding: 35px; text-align: center;
                }
                .font-title { font-family: 'Montserrat', sans-serif; }
                .font-serif-name { font-family: 'Playfair Display', serif; }
                .font-amharic { font-family: 'Noto Sans Ethiopic', sans-serif; }
                
                @media print {
                    body { margin: 0; }
                    .print-page-prof { shadow: none; margin: 0; -webkit-print-color-adjust: exact; }
                }
            `}</style>

            {recipients && recipients.map((person) => {
                return (
                    <div key={person._id || person.id} className="print-page-prof shadow-2xl">
                        
                        {/* ELEGANT GEOMETRIC BACKGROUND CORNERS */}
                        <div className="absolute top-0 left-0 w-32 h-32 border-t-8 border-l-8" style={{ borderColor: '#d97706' }}></div>
                        <div className="absolute top-0 right-0 w-32 h-32 border-t-8 border-r-8" style={{ borderColor: '#d97706' }}></div>
                        <div className="absolute bottom-0 left-0 w-32 h-32 border-b-8 border-l-8" style={{ borderColor: '#d97706' }}></div>
                        <div className="absolute bottom-0 right-0 w-32 h-32 border-b-8 border-r-8" style={{ borderColor: '#d97706' }}></div>

                        {/* LIGHT WATERMARK IN BACKGROUND */}
                        <div className="absolute inset-0 opacity-[0.02] flex items-center justify-center pointer-events-none">
                            <span className="text-9xl font-black select-none">{schoolInfoData.name}</span>
                        </div>

                        {/* MAIN CONTENT BOX */}
                        <div className="inner-content-prof my-auto">
                            
                            {/* School Header */}
                            <div className="flex items-center flex-col gap-3 mb-2 no-print">
                                <img src={schoolInfoData.logo} alt="School Logo" className="w-30 h-30 object-contain rounded-full border border-slate-200" />
                                <span className="text-xl font-title font-black uppercase tracking-widest text-slate-500">
                                    {schoolInfoData.name}
                                </span>
                            </div>

                            {/* Main Award Title */}
                            <div className="mt-4">
                                <h1 className="text-5xl font-title font-black tracking-widest uppercase mb-1" style={{ color: '#d97706' }}>
                                    {type === 'teacher' ? 'CERTIFICATE OF EXCELLENCE' : 'CERTIFICATE OF APPRECIATION'}
                                </h1>
                                <p className="text-xs font-title font-bold tracking-[0.4em] uppercase text-slate-400">
                                    {type === 'teacher' ? 'IN TEACHING & MENTORSHIP' : 'FOR EXEMPLARY PARTNERSHIP'}
                                </p>
                            </div>

                            {/* Award Category Badge */}
                            <div className="mt-6 text-white px-8 py-2 rounded-md text-xs font-bold tracking-widest uppercase shadow-sm" style={{ backgroundColor: theme.primary }}>
                                {theme.badgeText}
                            </div>

                            {/* Name Section */}
                            <div className="mt-6 w-full">
                                <h2 className="text-4xl font-serif-name font-bold italic text-slate-800 mb-2">
                                    {person.fullName}
                                </h2>
                                <div className="w-1/3 h-[1px] bg-slate-200 mx-auto"></div>
                            </div>

                            {/* Bilingual Description Section */}
                            <div className="grid grid-cols-2 gap-8 w-full max-w-5xl px-12 mt-6 flex-1">
                                
                                {/* ⚠️ ግራ ጎን፦ አማርኛ (Right-aligned, bordered) [2] */}
                                <div className="text-left pr-8 border-r border-slate-200 flex flex-col justify-center">
                                    {type === 'teacher' ? (
                                        <p className="text-slate-500 font-amharic text-sm leading-relaxed">
                                            ይህ የላቀ አፈጻጸም ምስክር ወረቀት በ <b>{academicYear}</b> ዓ/ም የትምህርት ዘመን ላሳዩት ከፍተኛ የመማር ማስተማር ጥረት፣ ለተማሪዎች ላደረጉት አርአያነት ያለው ድጋፍ እና ለትምህርት ቤታችን ዕድገት ላበረከቱት ታላቅ አስተዋጽኦ በታላቅ ምስጋና የተሰጠ ነው።
                                        </p>
                                    ) : (
                                        <p className="text-slate-500 font-amharic text-sm leading-relaxed">
                                            ይህ የክብር አጋርነት ምስክር ወረቀት በ <b>{academicYear}</b> ዓ/ም የትምህርት ዘመን ለትምህርት ቤታችን ዕድገት ላደረጉት የማይተካ ድጋፍ፣ ላሳዩት ታማኝ አጋርነት እና ለላቀ የበጎ አድራጎት አስተዋጽኦ በታላቅ ክብር የተሰጠ ነው።
                                        </p>
                                    )}
                                </div>

                                {/* ⚠️ ቀኝ ጎን፦ እንግሊዝኛ (Left-aligned) [2] */}
                                <div className="text-left pl-8 flex flex-col justify-center">
                                    {type === 'teacher' ? (
                                        <p className="text-slate-600 font-title text-sm leading-relaxed font-medium">
                                            This certificate is proudly awarded to acknowledge their outstanding commitment to educational excellence, inspirational student mentorship, and invaluable dedication to the growth of our school community during the <b>{academicYear}</b> E.C academic year.
                                        </p>
                                    ) : (
                                        <p className="text-slate-600 font-title text-sm leading-relaxed font-medium">
                                            This certificate is proudly presented to express our heartfelt appreciation for their invaluable partnership, generous support, and dedicated contribution to the development and success of our institution during the <b>{academicYear}</b> E.C academic year.
                                        </p>
                                    )}
                                </div>
                            </div>

                            {/* Footer Section */}
                            <div className="mt-auto w-full flex justify-between items-end px-16 mb-4">
                                
                                {/* Date */}
                                <div className="text-center w-60">
                                    <div className="border-b border-slate-300 pb-1 font-bold text-sm text-slate-700">{awardDate}</div>
                                    <p className="mt-2 text-[9px] font-bold text-slate-400 uppercase tracking-widest">Date Issued</p>
                                </div>

                                {/* Gold Center Seal (Badge of Honor) */}
                                <div className="relative">
                                    <svg width="100" height="100" viewBox="0 0 100 100">
                                        <path fill="#d97706" d="M50 5 L58 35 L88 35 L64 54 L72 84 L50 65 L28 84 L36 54 L12 35 L42 35 Z" />
                                        <circle cx="50" cy="50" r="30" fill={theme.primary} />
                                        <circle cx="50" cy="50" r="26" fill="none" stroke="#d97706" strokeWidth="1" strokeDasharray="2" />
                                        <text x="50" y="46" textAnchor="middle" fill="white" fontSize="6" fontWeight="bold" fontFamily="Arial">SEAL OF</text>
                                        <text x="50" y="56" textAnchor="middle" fill="#d97706" fontSize="10" fontWeight="black" fontFamily="Arial">HONOR</text>
                                    </svg>
                                </div>

                                {/* Signature */}
                                <div className="text-center w-60">
                                    <div className="h-6 border-b border-slate-300 flex items-center justify-center italic text-slate-400 font-serif text-sm"/>
                                    <p className="mt-2 text-[9px] font-bold text-slate-400 uppercase tracking-widest">Principal / Director</p>
                                </div>
                            </div>
                        </div>
                    </div>
                );
            })}
        </div>
    );
};

export default ProfessionalCertificate;