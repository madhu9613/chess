import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Layout from './components/Layout';
import Home from './pages/Home';
import LocalPlay from './pages/LocalPlay';
import Practice from './pages/Practice';
import Analysis from './pages/Analysis';
import Multiplayer from './pages/Multiplayer';
import WatchLive from './pages/WatchLive';
import AuthPage from './pages/AuthPage';
import AuthCallback from './pages/AuthCallback';

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/auth" element={<AuthPage />} />
        <Route path="/auth/callback" element={<AuthCallback />} />
        <Route
          path="*"
          element={
            <Layout>
              <Routes>
                <Route path="/" element={<Home />} />
                <Route path="/local" element={<LocalPlay />} />
                <Route path="/practice" element={<Practice />} />
                <Route path="/analysis" element={<Analysis />} />
                <Route path="/multiplayer" element={<Multiplayer />} />
                <Route path="/watch" element={<WatchLive />} />
              </Routes>
            </Layout>
          }
        />
      </Routes>
    </Router>
  );
}

export default App;