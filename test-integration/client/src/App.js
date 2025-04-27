import React from 'react';
import './App.css';

// Import LiveChat components
import { LiveChat, LiveChatProvider } from '../../frontend/src/livechat';
import '../../frontend/src/livechat/styles/livechat.css';

// Custom theme
const myTheme = {
  'primary-color': '#4CAF50',
  'bubble-own-color': '#81C784',
  'border-radius': '8px',
};

function App() {
  return (
    <div className="App">
      <header className="App-header">
        <h1>Test Integration Project</h1>
        <p>This demonstrates using the Live Chat as a submodule</p>
      </header>

      <main>
        <LiveChatProvider>
          <LiveChat 
            theme={myTheme}
            serverUrl="http://localhost:5001"
            defaultRoom="test-room"
            showTechnicianButton={true}
          />
        </LiveChatProvider>
      </main>
    </div>
  );
}

export default App;
