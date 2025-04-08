import { useState, useEffect } from 'react';
import Head from 'next/head';
import Chart from 'chart.js/auto';

export default function Dashboard() {
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [courseFilter, setCourseFilter] = useState('all');
  const [courses, setCourses] = useState([]);
  const [academicContext, setAcademicContext] = useState({
    trimester: null,
    week: null,
    unit: null,
    isSummative: false,
    isBreak: false
  });
  
  useEffect(() => {
    fetchData();
  }, []);
  
  async function fetchData() {
    try {
      // Fetch combined data
      const response = await fetch('/api/getData');
      const data = await response.json();
      
      // Add proper null checks and default values
      setStudents(data.students || []);
      setCourses(data.courses || []);
      setAcademicContext(data.academicContext || {
        trimester: null,
        week: null,
        unit: null,
        isSummative: false,
        isBreak: false
      });
      
      setLoading(false);
      
      // Only initialize charts if we have student data
      if (data.students && data.students.length > 0) {
        setTimeout(initializeCharts, 500);
      }
    } catch (error) {
      console.error('Error fetching data:', error);
      setStudents([]);
      setCourses([]);
      setLoading(false);
    }
  }
  
  function initializeCharts() {
    // Make sure students exists before trying to iterate
    if (!students || !students.length) return;
    
    // Create trend chart for each student
    students.forEach(student => {
      if (!student || !student.trendData) return;
      
      const ctx = document.getElementById(`chart-${student.id}`);
      if (ctx && student.trendData.dates && student.trendData.dates.length > 0) {
        new Chart(ctx, {
          type: 'line',
          data: {
            labels: student.trendData.dates,
            datasets: [{
              label: 'Engagement Score',
              data: student.trendData.scores,
              borderColor: getColorForStudent(student),
              tension: 0.1
            }]
          },
          options: {
            scales: {
              y: {
                min: 0,
                max: 10
              }
            },
            plugins: {
              legend: {
                display: false
              }
            }
          }
        });
      }
    });
  }
  
  function getColorForStudent(student) {
    if (!student) return '#28a745'; // Default to green if no student
    const score = student.currentScore;
    if (score <= 2) return '#dc3545'; // Red
    if (score <= 6) return '#ffc107'; // Yellow
    return '#28a745'; // Green
  }
  
  function getStatusText(student) {
    if (!student) return 'Unknown';
    const score = student.currentScore;
    if (score <= 2) return 'Critically Disengaged';
    if (score <= 6) return 'At Risk';
    return 'Engaged';
  }
  
  if (loading) {
    return <div className="loading">Loading...</div>;
  }
  
  return (
    <div className="container">
      <Head>
        <title>Student Engagement Dashboard</title>
        <meta name="description" content="Track student engagement and identify at-risk students" />
        <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/bootstrap@5.1.3/dist/css/bootstrap.min.css" />
      </Head>

      <main className="p-4">
        <h1 className="my-4">Student Engagement Dashboard</h1>
        <h2 className="mb-4">Leadership Core - Year 1</h2>
        
        {/* Academic Context Section - Fixed with proper null checks */}
        <div className="academic-context mb-4">
          <h3>
            {academicContext && academicContext.trimester !== null ? (
              `Trimester ${academicContext.trimester}, Week ${academicContext.week}, Unit ${academicContext.unit}`
            ) : (
              'Academic period not available'
            )}
            {academicContext && academicContext.isSummative && <span className="badge bg-warning ms-2">Summative Week</span>}
            {academicContext && academicContext.isBreak && <span className="badge bg-info ms-2">Break Period</span>}
          </h3>
        </div>
        
        <div className="row">
          {/* Add null check for students array */}
          {students && students.length > 0 ? (
            students.map(student => (
              <div key={student.id} className="col-md-4 mb-4">
                <div 
                  className="card" 
                  style={{ borderLeft: `5px solid ${getColorForStudent(student)}` }}
                >
                  <div className="card-body">
                    <h5 className="card-title">{student.name}</h5>
                    <div className="card-text">
                      <p><strong>Status:</strong> {getStatusText(student)}</p>
                      <p><strong>Overall Score:</strong> {student.currentScore.toFixed(1)}/10</p>
                      <p><strong>Faculty Rating:</strong> {student.facultyScore.toFixed(1)}/10</p>
                      <p><strong>Objective Score:</strong> {student.objectiveScore.toFixed(1)}/10</p>
          
                      {/* Canvas metrics with null checks */}
                      <div className="canvas-metrics mt-2">
                        <div className="d-flex justify-content-between">
                          <small>Attendance: {student.canvasMetrics?.attendance || 'N/A'}/10</small>
                          <small>Assignments: {student.canvasMetrics?.assignments || 'N/A'}/10</small>
                        </div>
                        <div className="d-flex justify-content-between">
                          <small>Engagement: {student.canvasMetrics?.engagement || 'N/A'}/10</small>
                          <small>Grades: {student.canvasMetrics?.grades || 'N/A'}/10</small>
                        </div>
                      </div>
          
                      <p className="mt-2"><strong>Trend:</strong> {student.trend > 0 ? '↑ Improving' : student.trend < 0 ? '↓ Declining' : '→ Stable'}</p>
                      {student.trendData && student.trendData.dates && student.trendData.dates.length > 0 ? (
                        <canvas id={`chart-${student.id}`} width="100" height="50"></canvas>
                      ) : (
                        <p>No rating data available yet</p>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            ))
          ) : (
            <div className="col-12 text-center">
              <p>No student data available</p>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}