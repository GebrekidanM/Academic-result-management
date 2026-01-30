import React, { useEffect, useState } from 'react';
import reportCardService from '../services/reportCardService';

const HighScorers = () => {
  const [data, setData] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const academicYear = '2018';

  useEffect(() => {
    const fetchHighScorers = async () => {
      try {
        const res = await reportCardService.getHighScorer(academicYear);

        const grouped = res.data.reduce((acc, student) => {
          if (!acc[student.gradeLevel]) acc[student.gradeLevel] = [];
          acc[student.gradeLevel].push(student);
          return acc;
        }, {});

        setData(grouped);
      } catch (err) {
        setError('Failed to load high scorers');
      } finally {
        setLoading(false);
      }
    };

    fetchHighScorers();
  }, []);

  if (loading) return <p>Loading high scorers...</p>;
  if (error) return <p style={{ color: 'red' }}>{error}</p>;

  return (
    <div style={{ padding: 20, fontFamily: 'Arial, sans-serif' }}>

      {/* PRINT STYLES */}
      <style>
        {`
          @media print {
            body {
              background: white;
            }
            button {
              display: none !important;
            }
            .grade-card {
              page-break-after: always;
              box-shadow: none !important;
            }
            table {
              font-size: 12px;
            }
            th {
              background: #eee !important;
            }
          }
        `}
      </style>

      {/* PRINT BUTTON */}
      <button
        onClick={() => window.print()}
        style={{
          background: '#1e40af',
          color: '#fff',
          border: 'none',
          padding: '10px 18px',
          borderRadius: 6,
          cursor: 'pointer',
          marginBottom: 20
        }}
      >
        🖨️ Print Report
      </button>

      {/* HEADER */}
      <div style={{ textAlign: 'center', marginBottom: 30 }}>
        <h2>High Scorer Students Report</h2>
        <p>Academic Year: {academicYear}</p>
        <p>School Name: __________________________</p>
      </div>

      {Object.keys(data).map(grade => (
        <div
          key={grade}
          className="grade-card"
          style={{
            background: '#fff',
            padding: 20,
            marginBottom: 40,
            borderRadius: 8,
            boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
          }}
        >
          <h3 style={{ marginBottom: 10 }}>Grade {grade}</h3>

          <table
            style={{
              width: '100%',
              borderCollapse: 'collapse',
              textAlign: 'center'
            }}
          >
            <thead>
              <tr>
                {[
                  '#',
                  'Photo',
                  'Student Name',
                  'Gender',
                  'S1 Avg',
                  'S1 Rank',
                  'S2 Avg',
                  'S2 Rank',
                  'Overall Avg',
                  'Overall Rank'
                ].map(h => (
                  <th
                    key={h}
                    style={{
                      border: '1px solid #ccc',
                      padding: 8,
                      background: '#f3f4f6'
                    }}
                  >
                    {h}
                  </th>
                ))}
              </tr>
            </thead>

            <tbody>
              {data[grade].map((s, index) => (
                <tr key={s._id}>
                  <td style={cell}>{index + 1}</td>
                  <td style={cell}>
                    {s.photoUrl ? (
                      <img
                        src={s.photoUrl}
                        alt={s.fullName}
                        style={{
                          width: 40,
                          height: 40,
                          borderRadius: '50%'
                        }}
                      />
                    ) : '—'}
                  </td>
                  <td style={cell}>{s.fullName}</td>
                  <td style={cell}>{s.gender}</td>
                  <td style={cell}>{s.sem1.avg}</td>
                  <td style={cell}>{s.sem1.rank}</td>
                  <td style={cell}>{s.sem2.avg}</td>
                  <td style={cell}>{s.sem2.rank}</td>
                  <td style={cell}><strong>{s.overall.avg}</strong></td>
                  <td style={cell}><strong>{s.overall.rank}</strong></td>
                </tr>
              ))}
            </tbody>
          </table>

          {/* SIGNATURE */}
          <div style={{ marginTop: 40, textAlign: 'right' }}>
            <p>__________________________</p>
            <p>Director / Principal</p>
          </div>
        </div>
      ))}
    </div>
  );
};

const cell = {
  border: '1px solid #ccc',
  padding: 8
};

export default HighScorers;
