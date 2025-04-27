# Live Chat System

## Overview

The Live Chat System is a reusable, customizable module designed for real-time communication between users and support technicians. It includes features like real-time messaging, file sharing, and technician connection, with a focus on modularity and ease of integration.

---

## Directory Structure

```
/home/madhav/Livechattril
├── backend
│   ├── server.js               # Main server file
│   ├── database.js             # SQLite database setup
│   └── routes                  # API routes
│       ├── chat.js             # Chat-related API endpoints
│       └── file.js             # File upload/download API endpoints
├── frontend
│   ├── public
│   │   └── index.html          # HTML template for the React app
│   ├── src
│   │   ├── components          # React components
│   │   │   ├── ChatWindow.jsx  # Main chat window component
│   │   │   ├── MessageList.jsx # Displays chat messages
│   │   │   ├── InputField.jsx  # Input field for typing messages
│   │   │   ├── SendButton.jsx  # Button to send messages
│   │   │   ├── SuggestionsSection.jsx # Dynamic suggestions
│   │   │   ├── VideoCallButton.jsx    # Button to initiate video calls
│   │   │   ├── TechnicianConnect.jsx # Handles technician connection
│   │   │   ├── Header.jsx      # Header component
│   │   │   └── Footer.jsx      # Footer component
│   │   ├── App.js              # Main React app entry point
│   │   ├── index.js            # React DOM rendering
│   │   └── styles.css          # CSS for styling the chat interface
├── package.json                # Project metadata and dependencies
└── README.md                   # Documentation
```

---

## Features

- **Real-Time Messaging**: Enables instant communication using Socket.IO.
- **File Sharing**: Allows users to upload and download files during the chat.
- **Technician Connect**: Connects users to available support technicians.
- **Customizable UI**: Modify the chat interface using the provided CSS file.
- **Video Call Support**: WebRTC-based video call integration.

---

## How to Use

### 1. Installation

1. Clone the repository:
   ```bash
   git clone <repository-url>
   cd Livechattril
   ```

2. Install dependencies:
   ```bash
   npm install
   cd frontend && npm install
   ```

---

### 2. Running the Application

1. Start the backend server:
   ```bash
   npm start
   ```

2. Start the frontend client:
   ```bash
   cd frontend
   npm start
   ```

3. Open your browser and navigate to:
   ```
   http://localhost:3000
   ```

---

### 3. Using LiveChat in Your Project

You can integrate the LiveChat system into your project by importing it as a submodule or copying the relevant files.

#### Option 1: Add as a Git Submodule

1. Navigate to your project's root directory:
   ```bash
   cd your-project-root
   ```

2. Add the LiveChat repository as a submodule:
   ```bash
   git submodule add https://github.com/username/Livechattril.git libs/livechat
   git commit -m "Add Live Chat as a submodule"
   ```

3. Initialize and update the submodule:
   ```bash
   git submodule update --init --recursive
   ```

4. Install dependencies:
   ```bash
   cd libs/livechat
   npm install
   cd frontend
   npm install
   ```

#### Option 2: Copy Files

1. Copy the `frontend/src/components`, `frontend/src/styles`, and `backend` directories into your project.
2. Update your project to include the necessary dependencies (see `package.json`).

---

### 4. Customization

#### Theme Customization

You can customize the look and feel by passing a theme object:

```jsx
const myTheme = {
  'primary-color': '#4CAF50', // green
  'bubble-own-color': '#81C784',
  'text-color': '#333333',
};

<LiveChat theme={myTheme} />
```

#### Behavioral Customization

The LiveChat component accepts the following props:

| Prop                  | Type     | Description                                   |
|-----------------------|----------|-----------------------------------------------|
| `theme`               | Object   | Theme customization object                   |
| `serverUrl`           | String   | WebSocket server URL                         |
| `defaultRoom`         | String   | Chat room ID (default: 'chat-room')          |
| `showTechnicianButton`| Boolean  | Show/hide technician connect button          |
| `technician`          | Boolean  | Force technician mode                        |
| `onSendMessage`       | Function | Callback when a message is sent              |
| `onFileUpload`        | Function | Callback when a file is uploaded             |
| `customRender`        | Function | Completely custom rendering function         |

#### Advanced: Custom Rendering

For complete control, use the `customRender` prop:

```jsx
<LiveChat
  customRender={({ isTechnician, handleConnect, ChatWindow, TechnicianChat }) => (
    <div className="my-custom-layout">
      {isTechnician ? (
        <TechnicianChat />
      ) : (
        <ChatWindow />
      )}
    </div>
  )}
/>
```

---

## Environment Variables

To configure the application, create a `.env` file in the root directory and add the necessary environment variables:
```
REACT_APP_FRONTEND_PORT=3000
BACKEND_PORT=5000
```

---

## License

This project is licensed under the MIT License. See the LICENSE file for details.