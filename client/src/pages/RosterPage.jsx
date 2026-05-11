import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import rosterService from '../services/rosterService';
import authService from '../services/authService';
import configService from '../services/configService';
import { Link } from 'react-router-dom';
import ClassStreamSelector from '../components/ClassStreamSelector';

const RosterPage = () => {
    const { t } = useTranslation();
    const [currentUser] = useState(authService.getCurrentUser());
    const [classId, setClassId]   = useState(currentUser.homeroomClass?._id || currentUser.homeroomClass || '');
    const [streamId, setStreamId] = useState(currentUser.homeroomStream?._id || currentUser.homeroomStream || '');
    const [academicYear, setAcademicYear] = useState('2026');
    const [rosterData, setRosterData]     = useState(null);
    const [error, setError]   = useState(null);
    const [loading, setLoading] = useState(false);
    const [homeroomTeacher, setHomeroomTeacher] = useState('');
    const [schoolName, setSchoolName] = useState('');
    const [className, setClassName]   = useState('');
    const [streamName, setStreamName] = useState('');

    // Load school name from config
    useEffect(() => {
        configService.getConfig().then(res => {
            if (res.data?.data?.schoolName) setSchoolName(res.data.data.schoolName);
        }).catch(() => {});
    }, []);

    // Auto-load for homeroom teachers
    useEffect(() => {
        if (currentUser.role === 'teacher' && currentUser.homeroomClass) {
            handleGenerateRoster();
        }
    }, []);

    const handleGenerateRoster = async (e) => {
        if (e) e.preventDefault();
        if (!classId) { setError(t('error') || 'Select a class'); return; }
        setLoading(true); setError(null); setRosterData(null);
        try {
            const response = await rosterService.getRoster({ classId, streamId, academicYear });
            setRosterData(response.data);
            setHomeroomTeacher(response.data.homeroomTeacherName);
            setClassName(response.data.className || '');
            setStreamName(response.data.streamName || '');
        } catch (err) {
            setError(err.response?.data?.message || t('error'));
        } finally {
            setLoading(false);
        }
    };

    const handlePrint = () => {
        const tableToPrint = document.getElementById('rosterTable');
        if (!tableToPrint) return;
        const printWindow = window.open('', '', 'height=800,width=1400');
        printWindow.document.write(`
            <html><head><title>${t('roster')}</title>
            <style>
                @page { size: A3 landscape; margin: 8mm; }
                body { font-family: Arial, sans-serif; font-size: 7pt; }
                table { width: 100%; border-collapse: collapse; }
                th, td { border: 1px solid #999; padding: 2px 3px; text-align: center; vertical-align: middle; }
                .name-col { text-align: left; }
                .subj-header { background: #1e3a8a; color: white; }
                .period-header { background: #3b82f6; color: white; font-size: 6pt; }
                .avg-cell { background: #dbeafe; font-weight: bold; }
                .overall-avg { background: #fef9c3; font-weight: bold; }
                .rank-cell { background: #fde68a; font-weight: bold; }
                .footer { margin-top: 20px; display: flex; justify-content: space-between; font-size: 10px; font-weight: bold; }
            </style></head><body>
            <div style="text-align:center;margin-bottom:10px;border-bottom:2px solid #000;padding-bottom:6px">
                <h2 style="margin:0">${schoolName || t('app_name') || 'School'}</h2>
                <p style="margin:2px 0">${className}${streamName ? ' — Stream ' + streamName : ''}</p>
                <p style="margin:2px 0">${t('roster')} — ${academicYear}</p>
                <p style="margin:2px 0">${t('homeroom_teacher_label') || 'Homeroom Teacher'}: ${homeroomTeacher}</p>
            </div>
            ${tableToPrint.outerHTML}
            <div class="footer">
                <div>${t('teacher_comment') || 'Teacher'}:__________________</div>
                <div>${t('director_sign') || 'Director'}:__________________</div>
                <div>${t('date') || 'Date'}:__________________</div>
            </div>
            </body></html>`);
        printWindow.document.close();
        setTimeout(() => { printWindow.focus(); printWindow.print(); printWindow.close(); }, 800);
    };

    // Display name as "Surname FirstName" — reverse word order
    const displayName = (fullName) => {
        if (!fullName) return '';
        const parts = fullName.trim().split(/\s+/);
        if (parts.length === 1) return parts[0];
        return [parts[parts.length - 1], ...parts.slice(0, -1)].join(' ');
    };

    // Sort roster by reversed display name A-Z
    const sortedRoster = rosterData
        ? [...rosterData.roster].sort((a, b) =>
            displayName(a.fullName).localeCompare(displayName(b.fullName))
          )
        : [];
    const textInput = "shadow-sm border rounded-lg py-2 px-3 w-full focus:ring-blue-500 focus:border-blue-500 text-sm";
    const thBase    = "border border-gray-400 text-xs font-bold uppercase align-middle p-1";
    const tdBase    = "border border-gray-300 text-xs align-middle p-1 text-center";

    const periods = rosterData?.testPeriods || [
        { key: 'BOT', label: 'BOT' },
        { key: 'MT',  label: 'MT'  },
        { key: 'EOT', label: 'EOT' },
    ];

    return (
        <div className="bg-gray-100 min-h-screen p-4 font-sans">
            <div className="bg-white p-6 rounded-lg shadow-md max-w-full overflow-hidden">

                <h2 className="text-2xl font-bold text-gray-800 mb-4 border-b pb-2">
                    📋 {t('yearly_roster') || 'Class Roster'}
                    {schoolName && <span className="ml-3 text-base font-normal text-gray-500">— {schoolName}</span>}
                    {className && <span className="ml-2 text-base font-normal text-gray-500">| {className}{streamName ? ` — ${streamName}` : ''}</span>}
                </h2>

                {/* ── Filter form ── */}
                <div className="p-4 bg-gray-50 rounded-lg border border-gray-200 mb-6">
                    <form onSubmit={handleGenerateRoster} className="flex flex-wrap gap-4 items-end">
                        <div className="flex-1 grid grid-cols-1 md:grid-cols-2 gap-4 min-w-[280px]">
                            <ClassStreamSelector
                                selectedClass={classId}
                                onClassChange={setClassId}
                                selectedStream={streamId}
                                onStreamChange={setStreamId}
                                required={true}
                                showAllStreamsOption={true}
                            />
                        </div>
                        <div>
                            <label className="block text-xs font-bold text-gray-500 uppercase mb-1">
                                {t('academic_year')}
                            </label>
                            <input
                                type="text"
                                value={academicYear}
                                onChange={e => setAcademicYear(e.target.value)}
                                className={textInput}
                                style={{ width: 90 }}
                            />
                        </div>
                        <button
                            type="submit"
                            disabled={loading}
                            className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-5 rounded-lg transition-colors disabled:opacity-50"
                        >
                            {loading ? t('loading') : t('generate_roster') || 'Generate'}
                        </button>
                        {rosterData && (
                            <button
                                type="button"
                                onClick={handlePrint}
                                className="bg-gray-700 hover:bg-gray-800 text-white font-bold py-2 px-4 rounded-lg"
                            >
                                🖨️ {t('print_roster') || 'Print'}
                            </button>
                        )}
                    </form>
                </div>

                {error && <p className="text-red-500 text-center mb-4 font-bold">{error}</p>}

                {/* ── Roster table ── */}
                {rosterData && (
                    <div className="overflow-x-auto border border-gray-300 rounded-lg">
                        <table id="rosterTable" className="min-w-full text-xs divide-y divide-gray-200">
                            <thead>
                                {/* Row 1: Subject group headers */}
                                <tr className="bg-slate-800 text-white">
                                    <th rowSpan={2} className={`${thBase} bg-slate-800 text-white w-8`}>#</th>
                                    <th rowSpan={2} className={`${thBase} bg-slate-800 text-white text-left min-w-[160px]`}>
                                        {t('full_name')}
                                    </th>
                                    <th rowSpan={2} className={`${thBase} bg-slate-800 text-white w-6`}>G</th>

                                    {rosterData.subjects.map(subj => (
                                        <th
                                            key={subj}
                                            colSpan={4}
                                            className={`${thBase} bg-blue-800 text-white`}
                                        >
                                            {subj}
                                        </th>
                                    ))}

                                    <th rowSpan={2} className={`${thBase} bg-yellow-600 text-white min-w-[50px]`}>
                                        Avg
                                    </th>
                                    <th rowSpan={2} className={`${thBase} bg-yellow-700 text-white min-w-[40px]`}>
                                        Rank
                                    </th>
                                </tr>

                                {/* Row 2: BOT / MT / EOT / Avg per subject */}
                                <tr className="bg-blue-100">
                                    {rosterData.subjects.map(subj => (
                                        <React.Fragment key={subj}>
                                            {periods.map(p => (
                                                <th key={p.key} className={`${thBase} bg-blue-200 text-blue-900 w-10`}>
                                                    {p.label}
                                                </th>
                                            ))}
                                            <th className={`${thBase} bg-indigo-200 text-indigo-900 w-12`}>Avg</th>
                                        </React.Fragment>
                                    ))}
                                </tr>
                            </thead>

                            <tbody className="bg-white divide-y divide-gray-100">
                                {sortedRoster.map((student, idx) => (
                                    <tr key={student._id} className={idx % 2 === 0 ? 'bg-white' : 'bg-slate-50'}>
                                        <td className={`${tdBase} text-gray-400`}>{idx + 1}</td>
                                        <td className={`${tdBase} text-left font-bold text-gray-800 pl-2`}>
                                            <Link to={`/students/${student._id}`} className="hover:text-blue-600">
                                                {displayName(student.fullName)}
                                            </Link>
                                        </td>
                                        <td className={tdBase}>{student.gender?.charAt(0)}</td>

                                        {rosterData.subjects.map(subj => {
                                            const scores = student.subjectScores?.[subj] || {};
                                            const avg    = student.subjectAverages?.[subj];
                                            return (
                                                <React.Fragment key={subj}>
                                                    {periods.map(p => (
                                                        <td key={p.key} className={`${tdBase} text-gray-700`}>
                                                            {scores[p.key] !== null && scores[p.key] !== undefined
                                                                ? scores[p.key]
                                                                : <span className="text-gray-300">—</span>}
                                                        </td>
                                                    ))}
                                                    <td className={`${tdBase} font-bold text-indigo-700 bg-indigo-50`}>
                                                        {typeof avg === 'number' ? avg : '—'}
                                                    </td>
                                                </React.Fragment>
                                            );
                                        })}

                                        <td className={`${tdBase} font-black text-yellow-700 bg-yellow-50`}>
                                            {student.overallAverage > 0 ? student.overallAverage : '—'}
                                        </td>
                                        <td className={`${tdBase} font-black text-white bg-slate-700`}>
                                            {student.overallRank}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>

                            {/* Footer: period averages across all students */}
                            <tfoot>
                                <tr className="bg-gray-100 border-t-2 border-gray-400">
                                    <td colSpan={3} className={`${tdBase} font-black text-gray-600 text-right pr-2`}>
                                        Class Avg
                                    </td>
                                    {rosterData.subjects.map(subj => {
                                        // Compute class average per period per subject
                                        const periodAvgs = {};
                                        periods.forEach(p => {
                                            const vals = sortedRoster
                                                .map(st => st.subjectScores?.[subj]?.[p.key])
                                                .filter(v => v !== null && v !== undefined);
                                            periodAvgs[p.key] = vals.length
                                                ? (vals.reduce((a, b) => a + b, 0) / vals.length).toFixed(1)
                                                : '—';
                                        });
                                        const subjAvgs = sortedRoster
                                            .map(st => st.subjectAverages?.[subj])
                                            .filter(v => typeof v === 'number');
                                        const subjClassAvg = subjAvgs.length
                                            ? (subjAvgs.reduce((a, b) => a + b, 0) / subjAvgs.length).toFixed(1)
                                            : '—';
                                        return (
                                            <React.Fragment key={subj}>
                                                {periods.map(p => (
                                                    <td key={p.key} className={`${tdBase} font-bold text-gray-600`}>
                                                        {periodAvgs[p.key]}
                                                    </td>
                                                ))}
                                                <td className={`${tdBase} font-black text-indigo-700 bg-indigo-50`}>
                                                    {subjClassAvg}
                                                </td>
                                            </React.Fragment>
                                        );
                                    })}
                                    <td className={`${tdBase} font-black text-yellow-700 bg-yellow-50`}>
                                        {(() => {
                                            const avgs = sortedRoster
                                                .map(st => st.overallAverage)
                                                .filter(v => v > 0);
                                            return avgs.length
                                                ? (avgs.reduce((a, b) => a + b, 0) / avgs.length).toFixed(1)
                                                : '—';
                                        })()}
                                    </td>
                                    <td className={tdBase}></td>
                                </tr>
                            </tfoot>
                        </table>
                    </div>
                )}

                {/* Legend */}
                {rosterData && (
                    <div className="mt-3 flex gap-4 text-xs text-gray-500 font-medium">
                        <span className="flex items-center gap-1">
                            <span className="w-3 h-3 bg-blue-200 rounded inline-block"></span> BOT = Beginning of Term
                        </span>
                        <span className="flex items-center gap-1">
                            <span className="w-3 h-3 bg-blue-200 rounded inline-block"></span> MT = Mid Term
                        </span>
                        <span className="flex items-center gap-1">
                            <span className="w-3 h-3 bg-blue-200 rounded inline-block"></span> EOT = End of Term
                        </span>
                        <span className="flex items-center gap-1">
                            <span className="w-3 h-3 bg-indigo-200 rounded inline-block"></span> Avg = Subject Average
                        </span>
                    </div>
                )}
            </div>
        </div>
    );
};

export default RosterPage;
