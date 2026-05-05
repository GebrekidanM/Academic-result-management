import React, {useState, useEffect} from 'react';
import { useTranslation } from 'react-i18next';
import scheduleService from '../services/scheduleService';

const DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'];
const PERIODS = [1, 2, 3, 4, 5, 6, 7];

const ScheduleForClass = ({gradeLevel}) => {
    const { t } = useTranslation();
    const [scheduleData,setscheduleData] = useState()

    useEffect(()=>{
        const getSchedule = async ()=>{
            try {
                const res = await scheduleService.getForAClass(gradeLevel)
                setscheduleData(res.data)
            } catch (error) {
                console.log(error)  
            }
        }
        getSchedule()

    },[])
    // Helper to find a subject for a specific day and period
    const getSubject = (day, period) => {
        return scheduleData?.find(s => s.dayOfWeek === day && s.period === period);
    };

    return (
        <div className="overflow-x-auto bg-white rounded-2xl shadow-sm border border-slate-100">
            <table className="w-full text-center border-collapse">
                <thead>
                    <tr className="bg-slate-50">
                        <th className="p-4 text-[10px] font-black text-slate-400 uppercase">Period</th>
                        {DAYS.map(day => (
                            <th key={day} className="p-4 text-[10px] font-black text-slate-400 uppercase">{t(day)}</th>
                        ))}
                    </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                    {PERIODS.map(period => (
                        <tr key={period} className="hover:bg-slate-50 transition-colors">
                            <td className="p-4 font-black text-slate-600">{period}</td>
                            {DAYS.map(day => {
                                const item = getSubject(day, period);
                                return (
                                    <td key={day} className="p-2 border-l border-slate-100">
                                        {item ? (
                                            <div className="bg-indigo-50 border border-indigo-100 p-2 rounded-lg flex flex-col items-center shadow-sm">
                                                <span className='text-indigo-800 font-black text-[10px] uppercase'>
                                                    {item.subject?.name || 'N/A'}
                                                </span>
                                                <span className='text-indigo-500 font-bold text-[9px]'>
                                                    {/* Use fullName or whatever field name matches your User model */}
                                                    {item.teacher?.fullName || item.teacher?.name || 'TBA'}
                                                </span>
                                            </div>
                                        ) : (
                                            <span className="text-slate-200 text-xs">-</span>
                                        )}
                                    </td>
                                );
                            })}
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );
};

export default ScheduleForClass;