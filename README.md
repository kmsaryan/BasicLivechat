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
- **Video Call Support**: Placeholder for future WebRTC-based video call integration.

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

## Environment Variables

To configure the application, create a `.env` file in the root directory and add the necessary environment variables.
```
REACT_APP_FRONTEND_PORT=3000
BACKEND_PORT=5000

```
---


### 3. Technician Connect

The **Technician Connect** feature allows users to connect to a support technician. Here's how it works:

1. **User Request**: The user clicks the "Connect to Technician" button in the chat interface.
2. **Backend Logic**: The backend assigns an available technician to the user. This can be extended to include a queue system or technician availability status.
3. **Real-Time Updates**: The connection status is updated in real-time using Socket.IO.
4. **Chat Session**: Once connected, the user and technician can exchange messages.

---

### 4. Additional Requirements

To ensure the chat system works seamlessly, the following are required:

1. **Database**:
   - SQLite is used for development.
   - Tables:
     - `messages`: Stores chat messages.
     - `files`: Stores file metadata.

2. **File Storage**:
   - Files are uploaded to the `uploads/` directory.
   - Ensure the directory exists and has write permissions.

3. **WebSocket Support**:
   - The server uses Socket.IO for real-time communication.
   - Ensure WebSocket support is enabled in your environment.

4. **Video Call Integration** (Optional):
   - For video calls, integrate a WebRTC-based solution.

---

### 5. API Endpoints

#### Chat Messages
- **GET** `/chat/messages`: Fetch all chat messages.
- **POST** `/chat/messages`: Save a new message.

#### File Upload/Download
- **POST** `/file/upload`: Upload a file.
- **GET** `/file/download/:id`: Download a file by ID.

---

### 6. Customization

You can customize the chat interface by editing the CSS file located at:
```
frontend/src/styles.css
```

---

### 7. Future Enhancements

- **Video Call Integration**: Add WebRTC for video calls.
- **Technician Availability**: Implement a queue system for technician assignment.
- **Cloud Storage**: Store files in cloud storage for scalability.

---

## Integration Guide

### 1. Import LiveChat Into Another Project

1. First, install the package:
   ```bash
   npm install your-livechat-package-name
   ```

2. Import and use the LiveChat component:
   ```jsx
   import { LiveChat, LiveChatProvider, defaultTheme } from 'your-livechat-package-name';
   import 'your-livechat-package-name/dist/styles/livechat.css';
   
   // Custom theme (optional)
   const myTheme = {
     'primary-color': '#4CAF50', // green theme
     'bubble-own-color': '#81C784'
   };
   
   function App() {
     return (
       <LiveChatProvider>
         <div className="app">
           <h1>My Website</h1>
           <LiveChat 
             theme={myTheme} 
             serverUrl="http://localhost:5000"
             showTechnicianButton={true} 
           />
         </div>
       </LiveChatProvider>
     );
   }
   ```

### 2. Customization Options

#### Theme Customization

You can customize the look and feel by passing a theme object:

```jsx
const myTheme = {
  'primary-color': '#8E44AD', // purple
  'secondary-color': '#F3F4F6',
  'bubble-own-color': '#9B59B6',
  'text-inverse-color': '#FFFFFF',
  // Add any other CSS variables to override
};

<LiveChat theme={myTheme} />
```

#### Behavioral Customization

The LiveChat component accepts the following props:

| Prop | Type | Description |
|------|------|-------------|
| `theme` | Object | Theme customization object |
| `serverUrl` | String | WebSocket server URL |
| `defaultRoom` | String | Chat room ID (default: 'chat-room') |
| `showTechnicianButton` | Boolean | Show/hide technician connect button |
| `technician` | Boolean | Force technician mode |
| `onSendMessage` | Function | Callback when message is sent |
| `onFileUpload` | Function | Callback when file is uploaded |
| `customRender` | Function | Completely custom rendering function |

#### Advanced: Custom Rendering

For complete control, use the `customRender` prop:

```jsx
<LiveChat
  customRender={({ isTechnician, handleConnect, ChatWindow, TechnicianChat }) => (
    <div className="my-custom-layout">
      {isTechnician ? (
        <div className="tech-container">
          <h2>Support Dashboard</h2>
          <TechnicianChat />
        </div>
      ) : (
        <div className="customer-container">
          <h2>Need help?</h2>
          <ChatWindow />
          <button onClick={handleConnect}>Get Technical Support</button>
        </div>
      )}
    </div>
  )}
/>
```

### 3. Using as a Git Submodule

If you want to integrate the Live Chat system while maintaining the ability to receive updates and make local modifications, you can use Git submodules.

#### Adding as a Submodule

1. Navigate to your project's root directory:
   ```bash
   cd your-project-root
   ```

2. Add the Live Chat repository as a submodule:
   ```bash
   git submodule add https://github.com/username/Livechattril.git libs/livechat
   git commit -m "Add Live Chat as a submodule"
   ```

3. Initialize and update the submodule:
   ```bash
   git submodule update --init --recursive
   ```

#### Installing Dependencies

1. Install the submodule's dependencies:
   ```bash
   cd libs/livechat
   npm install
   cd frontend
   npm install
   ```

#### Importing Components

You can import components directly from the submodule:

```jsx
// In your React application
import { LiveChat, LiveChatProvider } from './libs/livechat/frontend/src/livechat';
import './libs/livechat/frontend/src/livechat/styles/livechat.css';

function App() {
  return (
    <LiveChatProvider>
      <div className="my-app">
        {/* Your app content */}
        <LiveChat 
          serverUrl="http://localhost:5000"
          theme={{
            'primary-color': '#4CAF50',
            'bubble-own-color': '#81C784'
          }}
        />
      </div>
    </LiveChatProvider>
  );
}
```

#### Running the Backend

1. Start the Live Chat backend:
   ```bash
   cd libs/livechat
   npm start
   ```

2. You can also integrate the backend into your own Express server:
   ```javascript
   // In your server.js
   const express = require('express');
   const http = require('http');
   const app = express();
   const server = http.createServer(app);
   
   // Import live chat backend setup
   const setupLiveChat = require('./libs/livechat/backend/setup');
   
   // Your other middleware and routes
   app.use(express.json());
   
   // Setup live chat with your server instance
   setupLiveChat(server, app, {
     corsOrigin: 'http://localhost:3000',
     apiPrefix: '/api/chat'
   });
   
   // Start server
   server.listen(5000, () => {
     console.log('Server running on http://localhost:5000');
   });
   ```

#### Updating the Submodule

To get the latest updates from the Live Chat repository:

```bash
cd libs/livechat
git pull origin main
cd ../..
git add libs/livechat
git commit -m "Update Live Chat submodule"
```

#### Best Practices

- Don't make changes directly in the submodule unless you plan to contribute back to the original project.
- Consider forking the Live Chat repository if you need to make significant customizations.
- Use the provided theme and props system for customization rather than modifying the source files.

---

## Using Live Chat as a Submodule

You can integrate the Live Chat system into your main project as a Git submodule.

### Steps to Add as a Submodule

1. Navigate to your project's root directory:
   ```bash
   cd your-project-root
   ```

2. Add the Live Chat repository as a submodule:
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

### Importing Components

You can import components directly from the submodule:

```jsx
import { LiveChat, LiveChatProvider } from './libs/livechat/frontend/src/livechat';
import './libs/livechat/frontend/src/livechat/styles/livechat.css';

function App() {
  return (
    <LiveChatProvider>
      <LiveChat serverUrl="http://localhost:5000" />
    </LiveChatProvider>
  );
}
```

---

## License

This project is licensed under the MIT License. See the LICENSE file for details.