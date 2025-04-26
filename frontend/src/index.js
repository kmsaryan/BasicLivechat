import React from 'react';
import { createRoot } from 'react-dom/client'; // Updated import
import App from './App';
import './styles.css';

// Set the backend API base URL dynamically
const backendBaseUrl = `http://localhost:${process.env.REACT_APP_BACKEND_PORT || 5000}`;
console.log(`Backend API Base URL: ${backendBaseUrl}`);

// Updated to use createRoot
const root = createRoot(document.getElementById('root'));
root.render(<App />);
