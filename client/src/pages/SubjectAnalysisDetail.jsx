import React, { useEffect, useState } from 'react'
import { useLocation } from 'react-router-dom';
import analyticsService from '../services/analyticsService';

function SubjectAnalysisDetail() {
    const { state } = useLocation();
    const [assessment, setAssessment] = useState("")
    const [analysis,setAnalysis] = useState(null)

    
    useEffect(()=>{
        const QueryAssessmentAnalysis = async ()=>{
            const res = await analyticsService.aGradeAnalysis({assessment,academicYear:state.year})
            console.log(res)
            if(res.data){
                console.log("res",res.data)
                setAnalysis(res.data)
            }
        }

        if(assessment){
            QueryAssessmentAnalysis()
        }

    },[assessment])

    const inputStyle = "w-full border p-3 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400";

  return (
    <div>
        <div className=''>
            <label className='mb-3'>Select Assessment: </label>

            <select className={inputStyle} onChange={(e)=>setAssessment(e.target.value)}>
                <option value="">Select Assessment</option>
                {state?.assessmentTypes && state.assessmentTypes.map(as=>(
                    <option key={as._id} value={as.name}>{as.name}</option>
                ))}
            </select>
        </div>
    </div>
  )
}

export default SubjectAnalysisDetail