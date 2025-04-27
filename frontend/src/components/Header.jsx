import React from 'react';
import { Link } from 'react-router-dom';

const Header = () => {
    return (
        <header className="header">
            <h1>Live Chat</h1>
            <nav>
                <Link to="/">User</Link>
                <Link to="/technician">Technician</Link>
            </nav>
        </header>
    );
};

export default Header;
