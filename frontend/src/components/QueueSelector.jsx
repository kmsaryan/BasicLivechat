import React, { useState } from 'react';

// Remove the dependency on LiveChatContext to avoid the error
const QueueSelector = ({ onSubmit, supportCategories = [] }) => {
  // Default categories if none provided from props
  const defaultCategories = supportCategories.length > 0 ? supportCategories : [
    { id: "tech", name: "Technical Support" },
    { id: "billing", name: "Billing Questions" },
    { id: "general", name: "General Inquiry" }
  ];
  
  const [selectedCategory, setSelectedCategory] = useState('');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [issue, setIssue] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!selectedCategory || !name) return;

    onSubmit({
      category: selectedCategory,
      name,
      email,
      issue,
      userId: `user-${Date.now()}` // Generate a unique ID
    });
  };

  return (
    <div className="queue-selector">
      <h2>Connect with Support</h2>
      <form onSubmit={handleSubmit}>
        <div className="form-group">
          <label>What can we help you with?</label>
          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            required
          >
            <option value="">Select a topic</option>
            {defaultCategories.map(category => (
              <option key={category.id} value={category.id}>{category.name}</option>
            ))}
          </select>
        </div>
          
        <div className="form-group">
          <label>Your Name</label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Enter your name"
            required
          />
        </div>
          
        <div className="form-group">
          <label>Email (optional)</label>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="Enter your email"
          />
        </div>
          
        <div className="form-group">
          <label>Describe your issue</label>
          <textarea
            value={issue}
            onChange={(e) => setIssue(e.target.value)}
            placeholder="Please describe your issue briefly"
            rows="3"
          />
        </div>
          
        <button type="submit" className="join-queue-button">
          Join Support Queue
        </button>
      </form>
    </div>
  );
};

export default QueueSelector;
