import React from 'react';
import { useTranslation } from 'react-i18next';

const ParentStudentProfile = ({ student }) => {
    const { t } = useTranslation();

    if (!student) return null;

    const infoCardClass = "bg-white border border-slate-100 rounded-2xl shadow-sm p-6";
    const gridClass = "grid grid-cols-1 md:grid-cols-2 gap-6";
    const labelClass = "text-xs font-bold text-slate-400 uppercase tracking-wider block mb-1";
    const valueClass = "text-sm font-bold text-slate-800";

    return (
        <div className="space-y-6 animate-fade-in">
            
            <div>
                <h3 className="text-2xl font-black text-slate-800">👤 {t('student_profile') || 'Student Profile'}</h3>
                <p className="text-sm text-slate-500 mt-1">Detailed demographic and family registration information</p>
            </div>

            <div className={infoCardClass}>
                <h4 className="text-md font-black text-slate-700 border-b pb-3 mb-4 flex items-center gap-2">
                    <span>📝</span> {t('personal_info') || 'Personal Information'}
                </h4>
                <div className={gridClass}>
                    <div>
                        <span className={labelClass}>{t('full_name')}</span>
                        <span className="text-lg font-black text-slate-800">{student.fullName}</span>
                    </div>
                    <div>
                        <span className={labelClass}>{t('id_no')}</span>
                        <span className="text-lg font-mono font-black text-indigo-600">{student.studentId}</span>
                    </div>
                    <div>
                        <span className={labelClass}>{t('gender')}</span>
                        <span className={valueClass}>{t(student.gender) || student.gender}</span>
                    </div>
                    <div>
                        <span className={labelClass}>{t('dob') || 'Date of Birth'}</span>
                        <span className={valueClass}>
                            {student.dateOfBirth ? new Date(student.dateOfBirth).toLocaleDateString() : '-'}
                        </span>
                    </div>
                    <div>
                        <span className={labelClass}>{t('registration_year') || 'Registration Year'}</span>
                        <span className={valueClass}>{student.year} E.C.</span>
                    </div>
                    <div>
                        <span className={labelClass}>{t('status')}</span>
                        <span className={`inline-flex px-2.5 py-0.5 rounded-full text-xs font-bold border ${
                            student.status === 'Active' 
                                ? 'bg-green-50 text-green-700 border-green-200' 
                                : 'bg-red-50 text-red-700 border-red-200'
                        }`}>
                            {t(student.status.toLowerCase()) || student.status}
                        </span>
                    </div>
                </div>
            </div>

            <div className={infoCardClass}>
                <h4 className="text-md font-black text-slate-700 border-b pb-3 mb-4 flex items-center gap-2">
                    <span>👪</span> {t('family_info') || 'Family Information'}
                </h4>
                <div className={gridClass}>
                    <div>
                        <span className={labelClass}>{t('parent_name')} (Mother)</span>
                        <span className={valueClass}>{student.motherName || '-'}</span>
                    </div>
                    <div>
                        <span className={labelClass}>{t('contact')} (Mother)</span>
                        <span className={valueClass}>{student.motherContact || '-'}</span>
                    </div>
                    <div>
                        <span className={labelClass}>{t('contact')} (Father)</span>
                        <span className={valueClass}>{student.fatherContact || '-'}</span>
                    </div>
                </div>
            </div>

            <div className="bg-white border border-slate-100 rounded-2xl shadow-sm p-6">
                <h4 className="text-md font-black text-slate-700 border-b pb-3 mb-3 flex items-center gap-2">
                    <span>🏥</span> {t('health_status')}
                </h4>
                <div className={`p-4 rounded-xl border leading-relaxed text-sm font-semibold ${
                    student.healthStatus && student.healthStatus !== 'No known conditions'
                        ? 'bg-red-50 border-red-100 text-red-700'
                        : 'bg-slate-50 border-slate-100 text-slate-600'
                }`}>
                    {student.healthStatus}
                </div>
            </div>

            {(student.transferLetterUrl || student.certificateUrl || student.nationalIdUrl) && (
                <div className={infoCardClass}>
                    <h4 className="text-md font-black text-slate-700 border-b pb-3 mb-4 flex items-center gap-2">
                        <span>📂</span> {t('student_attachments') || 'Scanned Attachments'}
                    </h4>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                        {student.transferLetterUrl && (
                            <a href={student.transferLetterUrl} target="_blank" rel="noopener noreferrer" className="flex items-center justify-between p-4 bg-slate-50 border rounded-xl hover:bg-slate-100 transition-all font-bold text-xs text-slate-700">
                                <span>📄 {t('transfer_letter') || 'Transfer Letter'}</span>
                                <span className="text-pink-600">View &rarr;</span>
                            </a>
                        )}
                        {student.certificateUrl && (
                            <a href={student.certificateUrl} target="_blank" rel="noopener noreferrer" className="flex items-center justify-between p-4 bg-slate-50 border rounded-xl hover:bg-slate-100 transition-all font-bold text-xs text-slate-700">
                                <span>🎓 {t('prev_certificate') || 'Report Card'}</span>
                                <span className="text-pink-600">View &rarr;</span>
                            </a>
                        )}
                        {student.nationalIdUrl && (
                            <a href={student.nationalIdUrl} target="_blank" rel="noopener noreferrer" className="flex items-center justify-between p-4 bg-slate-50 border rounded-xl hover:bg-slate-100 transition-all font-bold text-xs text-slate-700">
                                <span>🪪 {t('national_id') || 'National ID / Birth Cert.'}</span>
                                <span className="text-pink-600">View &rarr;</span>
                            </a>
                        )}
                    </div>
                </div>
            )}

            {student.academicHistory && student.academicHistory.length > 0 && (
                <div className={infoCardClass}>
                    <h4 className="text-md font-black text-slate-700 border-b pb-3 mb-4 flex items-center gap-2">
                        <span>📜</span> {t('academic_history') || 'Academic History'}
                    </h4>
                    <div className="space-y-3">
                        {student.academicHistory.map((history, idx) => (
                            <div key={idx} className="flex justify-between items-center p-3 bg-slate-50 rounded-xl border border-slate-100 text-xs font-semibold">
                                <span className="text-slate-500 font-mono">{history.year} E.C.</span>
                                <span className="text-slate-800 font-bold">{history.gradeAtThatTime}</span>
                                <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                                    history.statusAtEnd === 'Completed' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
                                }`}>
                                    {history.statusAtEnd}
                                </span>
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
};

export default ParentStudentProfile;