import React from 'react'
import {Link} from "react-router-dom"
import ActionCard from './ActionCard'
import StatCard from './StatCard'

function IsAdmin({currentUser,profileData,stats}) {
  return (
        <div className="space-y-8 mb-6">
                <div>
                    <h2 className="text-3xl font-bold text-gray-800">Welcome {currentUser.fullName}</h2>
                    <Link to="/profile" state={{profileData}} className="text-gray-400 italic pb-2 font-bold">Change Username and password</Link>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <StatCard title="Active Students" value={stats?.students ?? '...'} icon={'🎓'} />
                    <StatCard title="Teachers" value={stats?.teachers ?? '...'} icon={'👩‍🏫'} />
                    <StatCard title="Subjects" value={stats?.subjects ?? '...'} icon={'📚'} />
                </div>
                <div>
                    <h3 className="text-xl font-bold text-gray-700 mb-4">Quick Actions</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                        <ActionCard to="/admin/users" title="User Management" description="Add, view, and assign roles/subjects to all users." />
                        <ActionCard to="/subjects" title="Subject Management" description="Define the subjects offered for each grade level." />
                        <ActionCard to="/manage-assessments" title="Assessment Management" description="Set the grading structure and assessments for each subject." />
                        <ActionCard to="/students/import" title="Bulk Import Students" description="Quickly enroll a full class of students from an Excel file." />
                    </div>
                </div>
            </div>

  )
}

export default IsAdmin