import React, { useState } from "react";
import { useEffect } from "react";
import assessmentTypeService from "../services/assessmentTypeService";
//get this year
const ThisYear = ()=>{
    const date = new Date().getFullYear();
    if(date > 8){
        let newyear = null;
        return newyear = date - 7;
    }
    let newyear = null;

    return newyear = date - 8;
}

function SubjectAnalysisForm() {
  const [gradeLevel, setGradeLevel] = useState("");
  const [assessmentType, setAssessmentType] = useState(null);
  const [assessment,setAssessment] = useState({
    name:'',
    month:''
  })
  const [year, setYear] = useState(ThisYear());
  
  useEffect(()=>{
    const getAllAss = async ()=>{
        const res = await assessmentTypeService.getAllAssessments()

        setAssessmentType(res.data)
    }
    getAllAss()
  },[])
  
  console.log(assessment)

  const handleGenerate = (e) => {
    e.preventDefault();
    console.log({
      gradeLevel,
      assessmentType,
      year,
    });

    
    // axios.post("/api/analysis/generate", { gradeLevel, assessmentType, year })
  };

  const inputStyle =
    "w-full border p-3 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400";

  return (
    <div className="max-w-xl mx-auto bg-white shadow p-6 rounded-lg mt-10">
      <h1 className="text-2xl font-bold mb-6 text-gray-800">
        Subject Analysis Generator
      </h1>

      <form onSubmit={handleGenerate} className="space-y-6">
        
        {/* Select Grade Level */}
        <div>
          <label className="block font-semibold mb-1 text-gray-700">
            Select Grade Level
          </label>
          <input 
            type="text" 
            placeholder="Grade 2A"
            className={inputStyle} 
            value={gradeLevel} 
            onChange={(e)=>setGradeLevel(e.target.value)}
            required
          /> 
        </div>

        {/* Insert Assessment Type */}
        <div>
          
          <select
              name="assessmentType"
              className={inputStyle}
              onChange={(e) => {
                  const selected = assessmentType.find(a => a._id === e.target.value);
                  if (selected) {
                      setAssessment({
                          name: selected.name,
                          month: selected.month
                      });
                  }
              }}
            >
              <option value="">Select assessment type</option>

              {assessmentType?.map(as => (
                <option value={as._id} key={as._id}>
                  {as.name} - {as.month}
                </option>
              ))}
            </select>

        </div>

        {/* Year */}
        <div>
          <label className="block font-semibold mb-1 text-gray-700">Year</label>
          <input
            type="text"
            placeholder="2024"
            className={inputStyle}
            value={year}
            onChange={(e) => setYear(e.target.value)}
            required
          />
        </div>

        {/* Generate Button */}
        <button
          type="submit"
          className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 rounded-lg"
        >
          Generate All Subject Analysis
        </button>
      </form>
    </div>
  );
}

export default SubjectAnalysisForm;
