import React, { useEffect, useState, useContext } from 'react';
import { useParams, Link } from 'react-router-dom';
import axios from 'axios';
import { Chart as ChartJS, CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend } from 'chart.js';
import { Line } from 'react-chartjs-2';
import { AuthContext } from '../context/AuthContext';
import Navbar from '../components/Navbar';

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend);

export default function Compare() {
  const { id } = useParams(); // Selected Friend ID
  const { user } = useContext(AuthContext);
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchComparisonData = async () => {
      try {
        const { data } = await axios.get(`/api/posts/compare/${id}`, {
          headers: { Authorization: `Bearer ${user.token}` },
        });
        setData(data);
      } catch (err) {
        console.error('Error fetching comparative analysis dataset.', err);
      } finally {
        setLoading(false);
      }
    };
    fetchComparisonData();
  }, [id, user.token]);

  if (loading) return <p style={{ textAlign: 'center', marginTop: '40px', fontSize: '13px', color: '#d9c4c8' }}>Analyzing comparative metrics...</p>;
  if (!data) return <p style={{ textAlign: 'center', marginTop: '40px', fontSize: '13px', color: '#d9c4c8' }}>Peer comparative data not found.</p>;

  // Metric Calculation Aggregates
  const friendPosts = data.friend.posts || [];
  const userPosts = data.user.posts || [];

  const getStats = (postsList) => {
    if (postsList.length === 0) return { calories: 0, protein: 0, carbs: 0, fat: 0, fiber: 0 };
    return {
      calories: Math.round(postsList.reduce((acc, p) => acc + p.calories, 0) / postsList.length),
      protein: Math.round(postsList.reduce((acc, p) => acc + p.protein, 0) / postsList.length),
      carbs: Math.round(postsList.reduce((acc, p) => acc + p.carbs, 0) / postsList.length),
      fat: Math.round(postsList.reduce((acc, p) => acc + p.fat, 0) / postsList.length),
      fiber: Math.round(postsList.reduce((acc, p) => acc + p.fiber, 0) / postsList.length),
    };
  };

  const friendStats = getStats(friendPosts);
  const userStats = getStats(userPosts);

  // Line chart plotting calories of user vs friend over last 5 posts
  const chartData = {
    labels: ['Post 1', 'Post 2', 'Post 3', 'Post 4', 'Post 5'],
    datasets: [
      {
        label: 'My Calories',
        data: userPosts.slice(0, 5).map(p => p.calories).reverse(),
        borderColor: '#C2185B',
        backgroundColor: 'rgba(194, 24, 91, 0.2)',
        tension: 0.2
      },
      {
        label: `${data.friend.profile.name}'s Calories`,
        data: friendPosts.slice(0, 5).map(p => p.calories).reverse(),
        borderColor: '#ffffff',
        backgroundColor: 'rgba(255, 255, 255, 0.2)',
        tension: 0.2
      }
    ]
  };

  const renderComparisonBar = (label, userVal, friendVal, maxLimit) => {
    const userPercent = (userVal / maxLimit) * 100 > 100 ? 100 : (userVal / maxLimit) * 100;
    const friendPercent = (friendVal / maxLimit) * 100 > 100 ? 100 : (friendVal / maxLimit) * 100;

    return (
      <div className="compare-stat-row">
        <div className="compare-stat-label-bar">
          <span>{label}</span>
          <span>My Stats: {userVal} vs {friendVal} (Friend)</span>
        </div>
        <div className="compare-stat-bars-container">
          <div className="compare-bar-track">
            <div className="compare-bar-fill" style={{ width: `${userPercent}%`, backgroundColor: '#C2185B' }}></div>
          </div>
          <div className="compare-bar-track">
            <div className="compare-bar-fill" style={{ width: `${friendPercent}%`, backgroundColor: '#ffffff' }}></div>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="main-wrapper">
      <Navbar />
      <div className="app-container comparison-grid">
        
        <Link to="/profile" className="btn-secondary" style={{ width: 'fit-content', fontSize: '11px', padding: '6px 12px' }}>
          Back to Profile
        </Link>

        {/* Head-to-Head Profiles Block */}
        <div className="comparison-header-row">
          <div className="compare-profile-block">
            <img src={user.profilePhoto} alt="" className="compare-avatar" />
            <span style={{ fontSize: '12px', fontWeight: '800' }}>Me</span>
            <span style={{ fontSize: '10px', color: '#d9c4c8' }}>Streak: {user.streakCount || 1}</span>
          </div>
          
          <span className="compare-vs-badge">VS</span>

          <div className="compare-profile-block">
            <img src={data.friend.profile.profilePhoto} alt="" className="compare-avatar" />
            <span style={{ fontSize: '12px', fontWeight: '800' }}>{data.friend.profile.name}</span>
            <span style={{ fontSize: '10px', color: '#d9c4c8' }}>Streak: {data.friend.profile.streakCount || 1}</span>
          </div>
        </div>

        {/* Dynamic Comparison Progression Metrics */}
        <div className="panel-card">
          <h3 className="panel-title">Nutrition Comparison (Daily Avg)</h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
            {renderComparisonBar('Calories (kcal)', userStats.calories, friendStats.calories, 3000)}
            {renderComparisonBar('Protein (g)', userStats.protein, friendStats.protein, 200)}
            {renderComparisonBar('Carbohydrates (g)', userStats.carbs, friendStats.carbs, 400)}
            {renderComparisonBar('Fat (g)', userStats.fat, friendStats.fat, 100)}
            {renderComparisonBar('Fiber (g)', userStats.fiber, friendStats.fiber, 50)}
            {renderComparisonBar('Water Intake (ml)', data.user.posts.length > 0 ? user.waterLogs : 0, data.friend.profile.waterLogs, 4000)}
          </div>
        </div>

        {/* Consistency Index Comparisons */}
        <div className="panel-card">
          <h3 className="panel-title">Consistency Index Overview</h3>
          <div style={{ display: 'flex', justifyContent: 'space-around', textAlign: 'center', marginTop: '10px' }}>
            <div>
              <p style={{ fontSize: '10px', color: '#d9c4c8', textTransform: 'uppercase' }}>My Score</p>
              <h4 style={{ fontSize: '24px', fontWeight: '900', color: '#C2185B' }}>{user.healthyScore || 50}</h4>
            </div>
            <div style={{ borderLeft: '1px solid #4d001d' }}></div>
            <div>
              <p style={{ fontSize: '10px', color: '#d9c4c8', textTransform: 'uppercase' }}>{data.friend.profile.name}'s Score</p>
              <h4 style={{ fontSize: '24px', fontWeight: '900', color: '#ffffff' }}>{data.friend.profile.healthyScore || 50}</h4>
            </div>
          </div>
        </div>

        {/* Historical Calorie Chart Comparison */}
        <div className="panel-card">
          <h3 className="panel-title">Historical Calorie Logs Progression</h3>
          <div style={{ height: '200px' }}>
            <Line data={chartData} options={{ responsive: true, maintainAspectRatio: false }} />
          </div>
        </div>

      </div>
    </div>
  );
}