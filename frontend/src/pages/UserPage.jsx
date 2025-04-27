import React from 'react';
import ChatWindow from '../components/ChatWindow';
import Header from '../components/Header';
const UserPage = () => {
    return (
        <div className="user-page">
            <Header />
            <ChatWindow />
        </div>
    );
};

export default UserPage;
