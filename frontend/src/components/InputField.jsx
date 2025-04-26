import React from 'react';

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
