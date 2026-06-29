import React, { useEffect, useState, useContext } from 'react';
import axios from 'axios';
import { Chart as ChartJS, CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend } from 'chart.js';
import { Line } from 'react-chartjs-2';
import { AuthContext } from '../context/AuthContext';
import Navbar from '../components/Navbar';

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend);

// Recommendation Targets Mapping depending on selected Goal
const goalTargetsMap = {
  Loss: { calories: 1800, protein: 130, carbs: 200, fat: 50, water: 3000 },
  Gain: { calories: 2800, protein: 150, carbs: 350, fat: 80, water: 3500 },
  Muscle: { calories: 2500, protein: 180, carbs: 280, fat: 70, water: 4000 },
  Maintain: { calories: 2200, protein: 140, carbs: 250, fat: 65, water: 2500 },
};

export default function Dashboard() {
  const { user } = useContext(AuthContext);
  const [profile, setProfile] = useState(null);
  
  // Custom Water Logs
  const [waterCount, setWaterCount] = useState(0);
  const [customWater, setCustomWater] = useState('');
  
  // Analytics State Configurations
  const [selectedMetric, setSelectedMetric] = useState('calories');
  const [selectedInterval, setSelectedInterval] = useState('Weekly');
  const [analyticsData, setAnalyticsData] = useState([1800, 2100, 1950, 2200, 1850, 2050, 1900]);
  
  // Daily Tracking Summaries
  const [dailyStats, setDailyStats] = useState({ calories: 0, protein: 0, carbs: 0, fat: 0 });

  useEffect(() => {
    const fetchDashboardMetrics = async () => {
      try {
        const profileRes = await axios.get('/api/auth/profile', {
          headers: { Authorization: `Bearer ${user.token}` },
        });
        setProfile(profileRes.data);
        setWaterCount(profileRes.data.waterLogs);

        const postsRes = await axios.get('/api/posts', {
          headers: { Authorization: `Bearer ${user.token}` },
        });
        
        // Calculate dynamic daily outputs
        const todayPosts = postsRes.data.filter((p) => {
          const postDate = new Date(p.createdAt).toDateString();
          const currentDate = new Date().toDateString();
          return postDate === currentDate;
        });

        const daySum = todayPosts.reduce((acc, p) => ({
          calories: acc.calories + p.calories,
          protein: acc.protein + p.protein,
          carbs: acc.carbs + p.carbs,
          fat: acc.fat + p.fat,
        }), { calories: 0, protein: 0, carbs: 0, fat: 0 });

        setDailyStats(daySum);

        // Dynamically structure dataset progressions depending on intervals
        const metricValues = postsRes.data.map(p => p[selectedMetric] || 0);
        if (metricValues.length > 0) {
          setAnalyticsData(metricValues.slice(-7));
        }
      } catch (err) {
        console.error('Error fetching metrics', err);
      }
    };
    fetchDashboardMetrics();
  }, [user.token, selectedMetric, selectedInterval]);

  const handleWaterIncrement = async (amountVal) => {
    try {
      const { data } = await axios.post('/api/posts/water', { amount: amountVal }, {
        headers: { Authorization: `Bearer ${user.token}` },
      });
      setWaterCount(data.waterLogs);
    } catch (err) {
      console.error(err);
    }
  };

  const handleCustomWaterSubmit = (e) => {
    e.preventDefault();
    const amountVal = parseInt(customWater);
    if (!amountVal || isNaN(amountVal)) return;
    handleWaterIncrement(amountVal);
    setCustomWater('');
  };

  const activeGoal = profile?.goal || 'Maintain';
  const targets = goalTargetsMap[activeGoal];

  // Progress Bar Calculations
  const calcPercent = (curr, target) => {
    const percent = Math.round((curr / target) * 100);
    return percent > 100 ? 100 : percent;
  };

  const chartData = {
    labels: selectedInterval === 'Weekly' ? ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'] : ['W1', 'W2', 'W3', 'W4'],
    datasets: [
      {
        label: `${selectedMetric.toUpperCase()} Progression`,
        data: analyticsData,
        borderColor: '#800020',
        backgroundColor: '#C2185B',
        tension: 0.1,
      },
    ],
  };

  return (
    <div className="main-wrapper">
      <Navbar />
      <div className="app-container dashboard-grid">
        
        {/* Dynamic Interactive Target Progress Panel */}
        <div className="panel-card">
          <h3 className="panel-title">Active Goals Tracker ({activeGoal})</h3>
          <div className="goal-progress-card">
            
            <div className="goal-progress-row">
              <div className="goal-progress-header">
                <span>Calories</span>
                <span>{dailyStats.calories} / {targets.calories} kcal</span>
              </div>
              <div className="goal-progress-outer">
                <div className="goal-progress-inner" style={{ width: `${calcPercent(dailyStats.calories, targets.calories)}%` }}></div>
              </div>
            </div>

            <div className="goal-progress-row">
              <div className="goal-progress-header">
                <span>Protein</span>
                <span>{dailyStats.protein}g / {targets.protein}g</span>
              </div>
              <div className="goal-progress-outer">
                <div className="goal-progress-inner" style={{ width: `${calcPercent(dailyStats.protein, targets.protein)}%` }}></div>
              </div>
            </div>

            <div className="goal-progress-row">
              <div className="goal-progress-header">
                <span>Water Intake</span>
                <span>{waterCount}ml / {targets.water}ml</span>
              </div>
              <div className="goal-progress-outer">
                <div className="goal-progress-inner" style={{ width: `${calcPercent(waterCount, targets.water)}%` }}></div>
              </div>
            </div>

          </div>
        </div>

        {/* Dynamic Analytics & Parameter Selection Tabs */}
        <div className="panel-card">
          <h3 className="panel-title">Nutrition Analytics</h3>
          
          <div style={{ display: 'flex', gap: '6px', marginBottom: '10px' }}>
            <select value={selectedMetric} onChange={(e) => setSelectedMetric(e.target.value)} className="input-field" style={{ padding: '6px 10px', fontSize: '11px' }}>
              <option value="calories">Calories</option>
              <option value="protein">Protein</option>
              <option value="carbs">Carbohydrates</option>
              <option value="fat">Fat</option>
              <option value="fiber">Fiber</option>
              <option value="sugar">Sugar</option>
            </select>

            <select value={selectedInterval} onChange={(e) => setSelectedInterval(e.target.value)} className="input-field" style={{ padding: '6px 10px', fontSize: '11px' }}>
              <option value="Daily">Daily</option>
              <option value="Weekly">Weekly</option>
              <option value="Monthly">Monthly</option>
            </select>
          </div>

          <div style={{ height: '220px' }}>
            <Line data={chartData} options={{ responsive: true, maintainAspectRatio: false }} />
          </div>
        </div>

        {/* Hydration Tracker */}
        <div className="panel-card">
          <h3 className="panel-title">Fluid Hydration Logs</h3>
          <div className="water-tracker-container">
            <div className="water-logger-row">
              <span className="water-metrics">Logged: {waterCount} ml</span>
              <span style={{ fontSize: '11px', fontWeight: '700', color: '#64748b' }}>
                Remaining: {targets.water - waterCount > 0 ? targets.water - waterCount : 0} ml
              </span>
            </div>

            <div className="water-options-row">
              {[100, 200, 250, 500, 750, 1000].map((vol) => (
                <button key={vol} onClick={() => handleWaterIncrement(vol)} className="btn-water-select">
                  {vol >= 1000 ? `${vol / 1000}L` : `${vol}ml`}
                </button>
              ))}
            </div>

            <form onSubmit={handleCustomWaterSubmit} className="water-custom-row">
              <input
                type="number"
                placeholder="Custom Volume (ml)"
                value={customWater}
                onChange={(e) => setCustomWater(e.target.value)}
                className="input-field"
                style={{ fontSize: '12px', padding: '6px 12px' }}
              />
              <button type="submit" className="btn-primary" style={{ padding: '6px 14px', fontSize: '11px' }}>Log</button>
            </form>
          </div>
        </div>

        {/* Heatmap Matrix with color-distinction details */}
        <div className="panel-card">
          <h3 className="panel-title">Nutrition Matrix Heatmap</h3>
          <div className="calendar-heatmap">
            <div className="heatmap-day day-balanced">1</div>
            <div className="heatmap-day day-balanced">2</div>
            <div className="heatmap-day day-average">3</div>
            <div className="heatmap-day day-poor">4</div>
            <div className="heatmap-day day-balanced">5</div>
            <div className="heatmap-day day-empty">6</div>
            <div className="heatmap-day day-empty">7</div>
            <div className="heatmap-day day-balanced">8</div>
            <div className="heatmap-day day-average">9</div>
            <div className="heatmap-day day-poor">10</div>
            <div className="heatmap-day day-balanced">11</div>
            <div className="heatmap-day day-balanced">12</div>
          </div>
          <div style={{ display: 'flex', gap: '10px', marginTop: '12px', justifyContent: 'center' }}>
            <span style={{ fontSize: '10px', fontWeight: '700', color: '#047857' }}>■ Balanced</span>
            <span style={{ fontSize: '10px', fontWeight: '700', color: '#ea580c' }}>■ Average</span>
            <span style={{ fontSize: '10px', fontWeight: '700', color: '#b91c1c' }}>■ Poor</span>
          </div>
        </div>

      </div>
    </div>
  );
}