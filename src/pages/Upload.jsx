import React, { useState, useContext } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import Navbar from '../components/Navbar';

export default function Upload() {
  const [image, setImage] = useState(null);
  const [preview, setPreview] = useState(null);
  const [mealType, setMealType] = useState('Breakfast');
  const [caption, setCaption] = useState('');
  const [uploading, setUploading] = useState(false);
  const { user } = useContext(AuthContext);
  const navigate = useNavigate();

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setImage(file);
      setPreview(URL.createObjectURL(file));
    }
  };

  const handleUpload = async (e) => {
    e.preventDefault();
    if (!image) return alert('Please upload an image first');

    setUploading(true);
    const formData = new FormData();
    formData.append('image', image);
    formData.append('mealType', mealType);
    formData.append('caption', caption);

    try {
      await axios.post('/api/posts', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
          Authorization: `Bearer ${user.token}`,
        },
      });
      navigate('/');
    } catch (err) {
      console.error(err);
      alert('AI analysis module failed.');
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="main-wrapper">
      <Navbar />
      <div className="app-container">
        <form onSubmit={handleUpload} className="upload-card">
          <h2 style={{ textAlign: 'center', fontSize: '18px', fontWeight: '800', color: '#800020' }}>Meal Diagnostics</h2>
          
          <div className="upload-zone" onClick={() => document.getElementById('fileInput').click()}>
            {preview ? (
              <img src={preview} alt="Preview" className="upload-preview" />
            ) : (
              <div>
                <span style={{ fontSize: '28px', color: '#800020' }}>Camera</span>
                <p style={{ fontSize: '12px', color: '#6b5a5e', marginTop: '8px' }}>Select photo or take a picture</p>
              </div>
            )}
            <input type="file" accept="image/*" onChange={handleFileChange} className="hidden" id="fileInput" style={{ display: 'none' }} />
          </div>

          <div className="form-group">
            <label className="form-label">Meal Category</label>
            <select
              value={mealType}
              onChange={(e) => setMealType(e.target.value)}
              className="input-field"
            >
              <option>Breakfast</option>
              <option>Lunch</option>
              <option>Dinner</option>
              <option>Snack</option>
            </select>
          </div>

          <div className="form-group">
            <label className="form-label">Meal Description</label>
            <textarea
              placeholder="What are you eating?"
              value={caption}
              onChange={(e) => setCaption(e.target.value)}
              className="input-field"
              style={{ height: '80px', resize: 'none' }}
            />
          </div>

          <button type="submit" disabled={uploading} className="btn-primary">
            {uploading ? 'Analyzing logs...' : 'Analyze Meal'}
          </button>
        </form>
      </div>
    </div>
  );
}