import React from 'react';
import '../styles/UserDetailsPanel.css';

const UserDetailsPanel = ({ userDetails }) => {
  if (!userDetails) {
    return (
      <div className="user-details-panel">
        <p>No user selected</p>
      </div>
    );
  }

  return (
    <div className="user-details-panel">
      <h3>User Details</h3>
      <div className="user-details-content">
        <p><strong>Name:</strong> {userDetails.name || 'Not provided'}</p>
        <p><strong>Category:</strong> {userDetails.category || 'Not specified'}</p>
        {userDetails.email && <p><strong>Email:</strong> {userDetails.email}</p>}
        
        {userDetails.issue && (
          <div className="user-issue">
            <strong>Issue Description:</strong>
            <p className="issue-text">{userDetails.issue}</p>
          </div>
        )}
        
        <p className="timestamp"><strong>Joined Queue:</strong> {new Date(userDetails.joinedAt).toLocaleString()}</p>
      </div>
    </div>
  );
};

export default UserDetailsPanel;
