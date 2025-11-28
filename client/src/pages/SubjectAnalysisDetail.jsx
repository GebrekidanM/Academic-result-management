import React, { useState } from 'react'
import { useLocation } from 'react-router-dom';

function SubjectAnalysisDetail() {
    const { state } = useLocation();
    const [assessment, setAssessment] = useState("")

    const inputStyle = "w-full border p-3 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400";

  return (
    <div>
        <div>
            <select className={inputStyle} onChange={(e)=>setAssessment(e.target.value)}>
                <option value="">Select Assessment</option>
                {state?.assessmentTypes && state.assessmentTypes.map(as=>(
                    <option key={as._id} value={as.name}>{as.name}-{as.month}</option>
                ))}
            </select>
            
        </div>
    </div>
  )
}

export default SubjectAnalysisDetail