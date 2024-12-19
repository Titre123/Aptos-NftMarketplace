import React from 'react';
import { BrowserRouter as Router, Route, Routes } from 'react-router-dom'; // Changed Switch to Routes
import Navbar from './components/NavBar';
import MintingPage from './pages/MintingPage';
import MarketplacePage from './pages/MarketView';
import UserNFTsPage from './pages/MyNFTs';
import AdminPage from './pages/AdminPage';

function App() {
  return (
    <Router>
      <div className="App">
        <Navbar />
        <Routes> {/* Changed Switch to Routes */}
          <Route path="/" element={<MarketplacePage />} /> {/* Changed component to element */}
          <Route path="/mint" element={<MintingPage />} /> {/* Changed component to element */}
          <Route path="/my-nfts" element={<UserNFTsPage />} /> {/* Changed component to element */}
          <Route path="/admin" element={<AdminPage />} /> {/* Changed component to element */}
        </Routes> {/* Changed Switch to Routes */}
      </div>
    </Router>
  );
}

export default App;
