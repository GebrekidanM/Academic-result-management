import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import studentService from '../services/studentService';

const GradeEntryPage = () => {
  const { classId } = useParams();
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchStudents = async () => {
      try {
        const response = await studentService.getStudents(classId);
        // Important: We need to ensure each student has a 'grades' object
        // for react-hook-form to work correctly.
        const studentsWithGrades = response.data.map(s => ({
          ...s,
          grades: s.grades || { sem1: {}, sem2: {} } // Ensure grades object exists
        }));
        setStudents(studentsWithGrades);
      } catch (err) {
        console.error("Failed to fetch students:", err);
        setError('Failed to load students. Is the server running?');
      } finally {
        setLoading(false);
      }
    };

    fetchStudents();
  }, [classId]);

  if (loading) return <div>Loading class data...</div>;
  if (error) return <div style={{ color: 'red' }}>{error}</div>;

  return (
    <div style={{ padding: '20px' }}>
      {students.length > 0 ? (
        <GradeEntrySheet students={students} classId={classId} />
      ) : (
        <h2>No students found for class {classId}.</h2>
      )}
    </div>
  );
};

export default GradeEntryPage;