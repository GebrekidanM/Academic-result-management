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
    <div style={{ padding: 24, background: '#f5f7fb', minHeight: '100vh' }}>
      <h2 style={{ marginBottom: 20 }}>
        🏆 High Scorer Students — {academicYear}
      </h2>

      {Object.keys(data).map(grade => (
        <div
          key={grade}
          style={{
            background: '#fff',
            borderRadius: 12,
            padding: 20,
            marginBottom: 30,
            boxShadow: '0 4px 12px rgba(0,0,0,0.08)'
          }}
        >
          <h3 style={{ marginBottom: 16 }}>Grade {grade}</h3>

          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ background: '#f0f2f5' }}>
                  {[
                    '#',
                    'Student',
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
                        textAlign: 'left',
                        padding: '10px 8px',
                        fontWeight: 600,
                        fontSize: 14
                      }}
                    >
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>

              <tbody>
                {data[grade].map((s, index) => {
                  const isTop = s.overall.rank === 1;

                  return (
                    <tr
                      key={s._id}
                      style={{
                        background: isTop ? '#fff8e1' : 'transparent',
                        borderBottom: '1px solid #eee'
                      }}
                    >
                      <td style={{ padding: 8 }}>{index + 1}</td>

                      <td style={{ padding: 8 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                          <img
                            src={s.photoUrl || '/avatar.png'}
                            alt={s.fullName}
                            width={40}
                            height={40}
                            style={{ borderRadius: '50%', objectFit: 'cover' }}
                          />
                          <div>
                            <div style={{ fontWeight: 600 }}>{s.fullName}</div>
                            <small style={{ color: '#777' }}>{s.studentId}</small>
                          </div>
                        </div>
                      </td>

                      <td style={{ padding: 8 }}>{s.gender}</td>
                      <td style={{ padding: 8 }}>{s.sem1.avg}</td>
                      <td style={{ padding: 8 }}>{s.sem1.rank}</td>
                      <td style={{ padding: 8 }}>{s.sem2.avg}</td>
                      <td style={{ padding: 8 }}>{s.sem2.rank}</td>

                      <td style={{ padding: 8, fontWeight: 700 }}>
                        {s.overall.avg}
                      </td>

                      <td style={{ padding: 8, fontWeight: 700 }}>
                        {isTop ? '🥇' : s.overall.rank}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      ))}
    </div>
  );
};

export default HighScorers;
