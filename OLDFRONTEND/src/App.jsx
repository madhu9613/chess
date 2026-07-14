// src/App.jsx
import React from 'react';
import Board from './components/Board/Board.jsx';
import MultiplayerGame from './pages/MultiplayerGame.jsx';
import Layout from './components/Layout.jsx';
import LocalPlay from './pages/LocalPlay.jsx';
import { Route, Routes } from 'react-router-dom';

const App = () => {
  return (
    <div className="min-h-screen grid overflow-hidden bg-black">
      <Routes>
        <Route path="/"
         element={
          <Layout showSidebar>
            <div className='flex justify-center items-center'> 
                 <Board/>
            </div>
             
          </Layout>
         
         }
        />
        <Route path='/playlocal'

          element={
            <Layout showSidebar>

              <LocalPlay />
            </Layout>
          }
        />

        <Route path='/playonline'
        element={
        <Layout showSidebar>
          <MultiplayerGame/>

        </Layout>
        }/>




      </Routes>



    </div>
  );
};

export default App;
