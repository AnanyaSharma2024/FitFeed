import React, { useState, useEffect, useRef, useContext } from 'react';
import axios from 'axios';
import { AuthContext } from '../context/AuthContext';
import Navbar from '../components/Navbar';

export default function AIAdvisor() {
  const { user } = useContext(AuthContext);
  const [chatHistory, setChatHistory] = useState([
    { sender: 'assistant', text: 'Ask nutrition questions or current workout optimizations.' }
  ]);
  const [chatInput, setChatInput] = useState('');
  const [isThinking, setIsThinking] = useState(false);
  const chatScrollerRef = useRef(null);

  const suggestedQuestions = [
    'Optimal post-workout meal?',
    'What is my recommended carbohydrate limit?',
    'Analyze my current high-protein targets.',
    'List muscle gain meal variations.'
  ];

  useEffect(() => {
    if (chatScrollerRef.current) {
      chatScrollerRef.current.scrollTop = chatScrollerRef.current.scrollHeight;
    }
  }, [chatHistory, isThinking]);

  const handleQuerySubmit = async (textVal) => {
    if (!textVal.trim()) return;

    const userMsg = { sender: 'user', text: textVal };
    setChatHistory((prev) => [...prev, userMsg]);
    setIsThinking(true);

    try {
      const { data } = await axios.post('/api/posts/chat', { message: textVal }, {
        headers: { Authorization: `Bearer ${user.token}` },
      });
      setChatHistory((prev) => [...prev, { sender: 'assistant', text: data.reply }]);
    } catch (err) {
      setChatHistory((prev) => [...prev, { sender: 'assistant', text: 'AI query returned error status.' }]);
    } finally {
      setIsThinking(false);
    }
  };

  return (
    <div className="main-wrapper">
      <Navbar />
      <div className="app-container">
        <div className="panel-card" style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
          <h2 className="panel-title" style={{ fontSize: '14px', margin: 0 }}>Dedicated AI Advisor</h2>
          
          <div className="ai-history-scroller" ref={chatScrollerRef}>
            {chatHistory.map((msg, index) => (
              <div key={index} className={`dialogue-bubble bubble-${msg.sender}`}>
                {msg.text}
              </div>
            ))}
            {isThinking && (
              <div className="ai-loading-bubble">
                Thinking<span className="loading-dots-anim">...</span>
              </div>
            )}
          </div>

          <div className="ai-suggested-row">
            {suggestedQuestions.map((q, idx) => (
              <button key={idx} onClick={() => { setChatInput(q); }} className="suggested-item">
                {q}
              </button>
            ))}
          </div>

          <form onSubmit={(e) => { e.preventDefault(); handleQuerySubmit(chatInput); setChatInput(''); }} className="ai-form-inputs">
            <input
              type="text"
              placeholder="Ask MacroMate Advisor..."
              value={chatInput}
              onChange={(e) => setChatInput(e.target.value)}
              className="input-field"
            />
            <button type="submit" className="btn-primary" style={{ padding: '0 20px' }}>
              Send
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}