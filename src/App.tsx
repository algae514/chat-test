import React from 'react';
import ChatPanelWithSearch from './components/ChatPanelWithSearch';

const App: React.FC = () => {
  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <h1 className="text-2xl font-bold mb-6 text-gray-800">Chat Test App</h1>
      <table className="w-full border-separate border-spacing-6">
        <tbody>
          <tr>
            <td className="w-1/2 align-top">
              <div className="bg-white rounded-lg shadow-md overflow-hidden h-full">
                <ChatPanelWithSearch panelId="1" />
              </div>
            </td>
            <td className="w-1/2 align-top">
              <div className="bg-white rounded-lg shadow-md overflow-hidden h-full">
                <ChatPanelWithSearch panelId="2" />
              </div>
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  );
};

export default App;