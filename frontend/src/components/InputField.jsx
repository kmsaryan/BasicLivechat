import React from 'react';
import '../styles/InputField.css';

const InputField = ({ value, onChange }) => {
    return (
        <input
            type="text"
            className="input-field"
            value={value}
            onChange={(e) => onChange(e.target.value)}
            placeholder="Type your message..."
        />
    );
};

export default InputField;
