import React, { useContext, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { AuthContext } from '../context/AuthContext';
import Navbar from '../components/Navbar';

export default function Profile() {
  const { user, setUser } = useContext(AuthContext);
  const [profile, setProfile] = useState(null);
  const [weight, setWeight] = useState('');
  const [height, setHeight] = useState('');
  const [goal, setGoal] = useState('Maintain');
  const [photoUploading, setPhotoUploading] = useState(false);
  const [mealsList, setMealsList] = useState([]);
  
  // Real active peers fetched from backend
  const [friendsList, setFriendsList] = useState([]);
  const [stats, setStats] = useState({ meals: 0, likes: 0, friends: 0, streak: 1 });
  
  const navigate = useNavigate();

  useEffect(() => {
    const fetchProfileDetails = async () => {
      try {
        const profileRes = await axios.get('/api/auth/profile', {
          headers: { Authorization: `Bearer ${user.token}` },
        });
        setProfile(profileRes.data);
        setWeight(profileRes.data.weight);
        setHeight(profileRes.data.height);
        setGoal(profileRes.data.goal);

        const postsRes = await axios.get('/api/posts', {
          headers: { Authorization: `Bearer ${user.token}` },
        });
        const myPosts = postsRes.data.filter((p) => p.user?._id === user._id);
        setMealsList(myPosts);
        
        const totalLikes = myPosts.reduce((acc, p) => acc + (p.likes?.length || 0), 0);

        // Fetch real registered active peers from database
        const friendsRes = await axios.get('/api/auth/friends', {
          headers: { Authorization: `Bearer ${user.token}` },
        });
        setFriendsList(friendsRes.data);

        setStats({
          meals: myPosts.length,
          likes: totalLikes,
          friends: friendsRes.data.length,
          streak: profileRes.data.streakCount || 1
        });
      } catch (err) {
        console.error('Error loading profile metadata.', err);
      }
    };
    fetchProfileDetails();
  }, [user.token, user._id]);

  const handleUpdate = async (e) => {
    e.preventDefault();
    try {
      const { data } = await axios.put('/api/auth/profile', { weight, height, goal }, {
        headers: { Authorization: `Bearer ${user.token}` },
      });
      setProfile(data);
      alert('Profile metadata updated successfully.');
    } catch (err) {
      console.error(err);
    }
  };

  const handlePhotoUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setPhotoUploading(true);
    const formData = new FormData();
    formData.append('profilePhoto', file);

    try {
      const { data } = await axios.post('/api/auth/profile/upload', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
          Authorization: `Bearer ${user.token}`,
        },
      });
      setProfile((prev) => ({ ...prev, profilePhoto: data.profilePhoto }));
      
      const updatedUser = { ...user, profilePhoto: data.profilePhoto };
      localStorage.setItem('user', JSON.stringify(updatedUser));
      setUser(updatedUser);
      
      alert('Profile picture updated successfully.');
    } catch (err) {
      console.error(err);
      alert('Photo upload failed.');
    } finally {
      setPhotoUploading(false);
    }
  };

  const handleExportPDF = () => {
    window.print();
  };

  if (!profile) return <p style={{ textAlign: 'center', marginTop: '40px', fontSize: '13px', color: '#d9c4c8' }}>Loading profile...</p>;

  return (
    <div className="main-wrapper">
      <Navbar />
      <div className="app-container">
        
        {/* FIXED: Unwanted layouts and duplicate duplicate profile sheets eliminated */}
        <div className="print-report-only">
          <div className="print-header">
            <h1 style={{ color: '#800020' }}>MacroMate Complete Nutrition Report</h1>
            <p>Generated: {new Date().toDateString()}</p>
          </div>
          
          <div className="print-meta-grid">
            <div>
              <p><strong>Client Name:</strong> {profile.name}</p>
              <p><strong>Active Goal:</strong> {profile.goal}</p>
            </div>
            <div>
              <p><strong>Healthy Score:</strong> {profile.healthyScore}</p>
              <p><strong>Active Streak Count:</strong> {profile.streakCount}</p>
            </div>
          </div>

          <h3 style={{ color: '#800020', marginBottom: '10px' }}>Daily Meal Progression History</h3>
          <table className="print-table">
            <thead>
              <tr>
                <th>Food Item</th>
                <th>Type</th>
                <th>Calories</th>
                <th>Protein</th>
                <th>Carbs</th>
                <th>Fat</th>
                <th>Fiber</th>
                <th>Sugar</th>
                <th>Vitamins</th>
                <th>Minerals</th>
              </tr>
            </thead>
            <tbody>
              {mealsList.map((m, idx) => (
                <tr key={idx}>
                  <td>{m.foodName}</td>
                  <td>{m.mealType}</td>
                  <td>{m.calories} kcal</td>
                  <td>{m.protein}g</td>
                  <td>{m.carbs}g</td>
                  <td>{m.fat}g</td>
                  <td>{m.fiber}g</td>
                  <td>{m.sugar}g</td>
                  <td>{m.vitamins}</td>
                  <td>{m.minerals}</td>
                </tr>
              ))}
            </tbody>
          </table>

          <div style={{ marginTop: '30px', borderTop: '1px solid #800020', paddingTop: '10px' }}>
            <h4 style={{ color: '#800020' }}>AI Advisor Goal Assessment</h4>
            <p style={{ fontSize: '12px', lineHeight: '1.4', marginTop: '6px' }}>
              Consistency stands high with a total healthy score of {profile.healthyScore}. Adjust daily carbohydrate tracking as defined by the {profile.goal} parameters.
            </p>
          </div>
        </div>

        {/* Profile Card View */}
        <div className="profile-card">
          
          <div className="profile-header-details">
            <img src={profile.profilePhoto} alt="Profile" className="profile-avatar-large" />
            <div className="profile-metadata">
              <h3 className="profile-user-name">{profile.name}</h3>
              <p className="profile-user-email">{profile.email}</p>
              <label style={{
                fontSize: '10px',
                fontWeight: '700',
                color: '#C2185B',
                cursor: 'pointer',
                border: '1px solid #C2185B',
                padding: '3px 8px',
                borderRadius: '4px',
                marginTop: '4px',
                display: 'inline-block'
              }}>
                {photoUploading ? 'Uploading...' : 'Update Picture'}
                <input type="file" accept="image/*" onChange={handlePhotoUpload} style={{ display: 'none' }} />
              </label>
            </div>
          </div>

          <div className="stats-grid">
            <div className="stat-item">
              <span className="stat-val">{stats.meals}</span>
              <span className="stat-label">Total Meals</span>
            </div>
            <div className="stat-item">
              <span className="stat-val">{stats.likes}</span>
              <span className="stat-label">Total Likes</span>
            </div>
            <div className="stat-item">
              <span className="stat-val">{stats.friends}</span>
              <span className="stat-label">Friends</span>
            </div>
            <div className="stat-item">
              <span className="stat-val">{stats.streak}</span>
              <span className="stat-label">Streak Days</span>
            </div>
          </div>

          <form onSubmit={handleUpdate} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
            <div className="form-group">
              <label className="form-label">Weight (kg)</label>
              <input
                type="number"
                value={weight}
                onChange={(e) => setWeight(e.target.value)}
                className="input-field"
              />
            </div>

            <div className="form-group">
              <label className="form-label">Height (cm)</label>
              <input
                type="number"
                value={height}
                onChange={(e) => setHeight(e.target.value)}
                className="input-field"
              />
            </div>

            <div className="form-group">
              <label className="form-label">Active Goal Tracker</label>
              <select
                value={goal}
                onChange={(e) => setGoal(e.target.value)}
                className="input-field"
              >
                <option value="Loss">Weight Loss</option>
                <option value="Gain">Weight Gain</option>
                <option value="Muscle">Muscle Gain</option>
                <option value="Maintain">Maintain Weight</option>
              </select>
            </div>

            <button type="submit" className="btn-primary">Save Profile</button>
          </form>

          <div style={{ borderTop: '1px solid #f1e4e8', paddingTop: '14px' }}>
            <button onClick={handleExportPDF} className="btn-secondary" style={{ width: '100%' }}>
              Export Nutrition Report (PDF)
            </button>
          </div>

          {/* FIXED: Dynamic Friends Comparisons connected securely to backend */}
          <div className="active-friends-section">
            <p className="form-label" style={{ marginBottom: '4px' }}>Active Peers</p>
            {friendsList.length === 0 ? (
              <p style={{ fontSize: '11px', color: '#d9c4c8' }}>No peers found on platform.</p>
            ) : (
              friendsList.map((friend) => (
                <div key={friend._id} className="friend-item">
                  <div className="friend-left">
                    <img src={friend.profilePhoto} alt="" className="friend-avatar" />
                    <div className="friend-details">
                      <span className="friend-name">{friend.name}</span>
                      <span className="friend-status">
                        <span className="friend-active-dot"></span>
                        Streak: {friend.streakCount || 1}
                      </span>
                    </div>
                  </div>
                  {/* Redirects to comparison panel */}
                  <button onClick={() => navigate(`/compare/${friend._id}`)} className="btn-water-select" style={{ fontSize: '10px', padding: '4px 8px' }}>
                    Compare
                  </button>
                </div>
              ))
            )}
          </div>

        </div>
      </div>
    </div>
  );
}