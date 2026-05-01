import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Layout from './components/Layout';
import Home from './pages/Home';
import LocalPlay from './pages/LocalPlay';
import Practice from './pages/Practice';

function App() {
  return (
    <Router>
      <Layout>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/local" element={<LocalPlay />} />
          <Route path="/practice" element={<Practice />} />
        </Routes>
      </Layout>
    </Router>
  );
}

export default App;