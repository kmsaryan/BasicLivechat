import React from 'react';
import '../styles/FileUpload.css';

const FileUpload = ({ onFileUpload, accept = "*" }) => {
  const handleFileChange = (event) => {
    const file = event.target.files && event.target.files[0]; // Ensure file exists
    if (file && onFileUpload) {
      // Pass the actual file object to the parent component
      onFileUpload(file);
    } else {
      console.warn("No file selected or invalid file input.");
    }
  };

  return (
    <div className="file-upload">
      <label className="file-upload-label">
        <input
          type="file"
          className="file-input"
          onChange={handleFileChange}
          accept={accept}
        />
        <span className="file-button">📎</span>
      </label>
    </div>
  );
};

export default FileUpload;
