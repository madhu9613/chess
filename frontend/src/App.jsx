// src/App.jsx
import React from 'react';
import Board from './components/Board/Board.jsx';
import MultiplayerGame from './pages/MultiplayerGame.jsx';
import Layout from './components/Layout.jsx';

const App = () => {
  return (
    <div className="min-h-screen grid overflow-hidden bg-black">
      <Layout showSidebar>

 <MultiplayerGame />
      </Layout>

     
    </div>
  );
};

export default App;
