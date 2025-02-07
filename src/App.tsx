import React from 'react';
import ChatPanel from './components/ChatPanel';

const App: React.FC = () => {
  console.log('App component rendering');
  return (
    <div className="app">
      <h1>Chat Test App</h1>
      <div className="panels-container">
        <ChatPanel panelId="1" />
        <ChatPanel panelId="2" />
      </div>
    </div>
  );
};

export default App;