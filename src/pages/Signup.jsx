import React, { useState, useContext } from 'react';
import { AuthContext } from '../context/AuthContext';
import { useNavigate, Link } from 'react-router-dom';

export default function Signup() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const { signup } = useContext(AuthContext);
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await signup(name, email, password);
      navigate('/');
    } catch (err) {
      alert('Signup failed. Please try again.');
    }
  };

  return (
    <div className="auth-screen">
      <form onSubmit={handleSubmit} className="auth-card">
        <h2 className="auth-title">Join FitFeed 🥗</h2>
        
        <div className="form-group">
          <label className="form-label">Full Name</label>
          <input 
            type="text" 
            placeholder="Enter full name" 
            value={name} 
            onChange={e => setName(e.target.value)} 
            className="input-field"
            required 
          />
        </div>

        <div className="form-group">
          <label className="form-label">Email Address</label>
          <input 
            type="email" 
            placeholder="Enter email address" 
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
            placeholder="Create password" 
            value={password} 
            onChange={e => setPassword(e.target.value)} 
            className="input-field"
            required 
          />
        </div>

        <button type="submit" className="btn-primary">Create Account</button>
        <p style={{ textAlign: 'center', fontSize: '12px', color: '#64748b' }}>
          Already have an account? <Link to="/login">Login</Link>
        </p>
      </form>
    </div>
  );
}