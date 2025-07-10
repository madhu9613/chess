// src/App.jsx
import React from 'react';
import Board from './components/Board/Board.jsx';

const App = () => {
  return (
    <div className="min-h-screen grid overflow-hidden bg-black">
      <Board />
    </div>
  );
};

export default App;
