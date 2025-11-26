import React from 'react'
import {Link} from 'react-router-dom'
import ActionCard from './ActionCard'

function IsStaff({profileData}) {

  return (
    <div className="space-y-8">
                <h2 className="text-3xl font-bold text-gray-800">Teacher Dashboard</h2>
                <p className="text-lg text-gray-600 m-0">Welcome, {profileData.fullName}!</p>
                <Link to="/profile" state={{profileData}} className="text-gray-400 italic font-bold">Change Username and password</Link>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mt-6">
                    {profileData.homeroomGrade && (
                        <ActionCard to="/roster" title={`My Homeroom: ${profileData.homeroomGrade}`} description="Generate the comprehensive yearly roster for your class." />
                    )}
                    {profileData.subjectsTaught?.map(assignment => (
                        assignment.subject &&
                        <ActionCard 
                            key={assignment.subject._id}
                            to="/subject-roster"
                            title={assignment.subject.name}
                            description={`View detailed mark list for ${assignment.subject.gradeLevel}.`}
                            state={{ subjectId: assignment.subject._id }}
                        />
                    ))}
                </div>
                {profileData.subjectsTaught?.length === 0 && !profileData.homeroomGrade && (
                    <p>You have not been assigned any duties yet. Please contact an administrator.</p>
                )}
            </div>
  )
}

export default IsStaff