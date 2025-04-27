import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import UserPage from './pages/UserPage';
import TechnicianPage from './pages/TechnicianPage';

const App = () => {
    return (
        <Router>
            <Routes>
                <Route path="/" element={<UserPage />} />
                <Route path="/technician" element={<TechnicianPage />} />
            </Routes>
        </Router>
    );
};

export default App;
