import React, { useEffect, useState, useContext } from 'react';
import axios from 'axios';
import { io } from 'socket.io-client';
import { AuthContext } from '../context/AuthContext';
import Navbar from '../components/Navbar';

export default function Feed() {
  const [posts, setPosts] = useState([]);
  const { user } = useContext(AuthContext);
  const [commentText, setCommentText] = useState({});

  useEffect(() => {
    const fetchFeed = async () => {
      try {
        const { data } = await axios.get('/api/posts', {
          headers: { Authorization: `Bearer ${user.token}` },
        });
        setPosts(data);
      } catch (err) {
        console.error('Error fetching feed data', err);
      }
    };
    fetchFeed();

    const socket = io(`http://${window.location.hostname}:5001`);

    socket.on('newPost', (newPost) => {
      setPosts((prev) => [newPost, ...prev]);
    });

    socket.on('postUpdated', (updatedPost) => {
      setPosts((prev) => prev.map((p) => (p._id === updatedPost._id ? { ...p, ...updatedPost } : p)));
    });

    return () => socket.disconnect();
  }, [user.token]);

  const handleLike = async (id) => {
    try {
      await axios.post(`/api/posts/${id}/like`, {}, {
        headers: { Authorization: `Bearer ${user.token}` },
      });
    } catch (err) {
      console.error(err);
    }
  };

  const handleCommentSubmit = async (e, id) => {
    e.preventDefault();
    if (!commentText[id]) return;
    try {
      await axios.post(`/api/posts/${id}/comment`, { text: commentText[id] }, {
        headers: { Authorization: `Bearer ${user.token}` },
      });
      setCommentText((prev) => ({ ...prev, [id]: '' }));
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="main-wrapper">
      <Navbar />
      <div className="app-container">
        {posts.map((post) => (
          <div key={post._id} className="feed-card">
            
            {/* Header */}
            <div className="card-header">
              <img src={post.user?.profilePhoto} className="user-avatar" alt="" />
              <div className="header-info">
                <p className="username">{post.user?.name}</p>
                <p className="meal-tag">{post.mealType}</p>
              </div>
            </div>

            {/* Photo */}
            <img src={post.image} className="post-image" alt="Meal" />

            {/* Nutrition Panel */}
            <div className="nutrition-panel">
              <p className="food-title">{post.foodName}</p>
              <div className="macros-grid">
                <div className="macro-box">
                  <span className="macro-value">{post.calories}</span>
                  <span className="macro-label">kcal</span>
                </div>
                <div className="macro-box">
                  <span className="macro-value">{post.protein}g</span>
                  <span className="macro-label">Protein</span>
                </div>
                <div className="macro-box">
                  <span className="macro-value">{post.carbs}g</span>
                  <span className="macro-label">Carbs</span>
                </div>
                <div className="macro-box">
                  <span className="macro-value">{post.fat}g</span>
                  <span className="macro-label">Fat</span>
                </div>
                <div className="macro-box">
                  <span className="macro-value">{post.fiber}g</span>
                  <span className="macro-label">Fiber</span>
                </div>
              </div>
            </div>

            {/* Actions */}
            <div className="card-actions">
              {/* FIXED: Keeping only ❤️ icon on the Like button */}
              <button onClick={() => handleLike(post._id)} className="like-btn">
                <span>❤️</span> <span>{post.likes?.length || 0} Likes</span>
              </button>
            </div>

            {/* Caption */}
            {post.caption && (
              <div className="post-caption">
                <span className="caption-username">{post.user?.name}</span>
                <span>{post.caption}</span>
              </div>
            )}

            {/* Comments Area */}
            <div className="comments-list">
              {post.comments?.map((comment, index) => (
                <p key={index} className="comment-item">
                  <span className="comment-user">{comment.user?.name}</span>
                  <span>{comment.text}</span>
                </p>
              ))}
            </div>

            {/* Add Comment */}
            <form onSubmit={(e) => handleCommentSubmit(e, post._id)} className="comment-form">
              <input
                type="text"
                placeholder="Add a comment..."
                value={commentText[post._id] || ''}
                onChange={(e) => setCommentText({ ...commentText, [post._id]: e.target.value })}
                className="comment-input"
              />
              <button type="submit" className="comment-btn">Post</button>
            </form>
          </div>
        ))}
      </div>
    </div>
  );
}