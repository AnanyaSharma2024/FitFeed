import React, { useContext } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';

export default function Navbar() {
  const { user } = useContext(AuthContext);
  const location = useLocation();

  if (!user) return null;

  return (
    <>
      <nav className="navbar">
        <div className="navbar-content">
          <span className="navbar-logo">FitFeed</span>
          <div className="navbar-actions">
            <img src={user.profilePhoto} alt="" className="profile-avatar-small" />
          </div>
        </div>
      </nav>

      <div className="bottom-nav">
        <div className="bottom-nav-content">
          <Link to="/" className={`bottom-nav-item ${location.pathname === '/' ? 'active' : ''}`}>
            <span>Feed</span>
          </Link>
          <Link to="/upload" className={`bottom-nav-item ${location.pathname === '/upload' ? 'active' : ''}`}>
            <span>Analyze</span>
          </Link>
          <Link to="/dashboard" className={`bottom-nav-item ${location.pathname === '/dashboard' ? 'active' : ''}`}>
            <span>Dashboard</span>
          </Link>
          <Link to="/ai-advisor" className={`bottom-nav-item ${location.pathname === '/ai-advisor' ? 'active' : ''}`}>
            <span>AI Advisor</span>
          </Link>
          <Link to="/profile" className={`bottom-nav-item ${location.pathname === '/profile' ? 'active' : ''}`}>
            <span>Profile</span>
          </Link>
        </div>
      </div>
    </>
  );
}