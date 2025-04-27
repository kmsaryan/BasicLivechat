import React from 'react';
import TechnicianChat from './TechnicianChat';
import Header from '../components/Header';
import '../styles/Technician.css'; // Updated import

const TechnicianPage = () => {
    return (
        <div className="technician-page">
            <Header />
            <TechnicianChat />
        </div>
    );
};

export default TechnicianPage;
