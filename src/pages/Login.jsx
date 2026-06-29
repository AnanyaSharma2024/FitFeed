import React, { useState, useContext } from 'react';
import { AuthContext } from '../context/AuthContext';
import { useNavigate, Link } from 'react-router-dom';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const { login } = useContext(AuthContext);
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await login(email, password);
      navigate('/');
    } catch (err) {
      alert('Login credentials invalid. Please try again.');
    }
  };

  return (
    <div className="auth-screen">
      <form onSubmit={handleSubmit} className="auth-card">
        <h2 className="auth-title">Login to FitFeed 🚀</h2>
        
        <div className="form-group">
          <label className="form-label">Email Address</label>
          <input 
            type="email" 
            placeholder="Enter your email" 
            value={email} 
            onChange={e => setEmail(e.target.value)} 
            className="input-field"
            required 
          />
        </div>

        <div className="form-group">
          <label className="form-label">Password</label>
          <input 
            type="password" 
            placeholder="Enter your password" 
            value={password} 
            onChange={e => setPassword(e.target.value)} 
            className="input-field"
            required 
          />
        </div>

        <button type="submit" className="btn-primary">Login</button>
        <p style={{ textAlign: 'center', fontSize: '12px', color: '#64748b' }}>
          Don't have an account? <Link to="/signup">Sign Up</Link>
        </p>
      </form>
    </div>
  );
}