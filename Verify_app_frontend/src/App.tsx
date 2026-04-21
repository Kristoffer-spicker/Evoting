import React, { useEffect } from 'react'
import { BrowserRouter as Router, Routes, Route, useLocation } from 'react-router-dom'
import { Landing, Registration, Login, TrueIdentifier, MainMenu, QRCode, AllIdentifiers, VerifyVote, Complete, Help } from '@/pages'

function ScrollToTop() {
  const { pathname } = useLocation();
  
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [pathname]);
  
  return null;
}

export function App(): React.JSX.Element {
  return (
    <Router>
      <ScrollToTop />
      <Routes>
        <Route path="/" element={<Landing />} />
        <Route path="/register" element={<Registration />} />
        <Route path="/login" element={<Login />} />
        <Route path="/true-identifier" element={<TrueIdentifier />} />
        <Route path="/main-menu" element={<MainMenu />} />
        <Route path="/qr-code" element={<QRCode />} />
        <Route path="/all-identifiers" element={<AllIdentifiers />} />
        <Route path="/verify-vote" element={<VerifyVote />} />
        <Route path="/complete" element={<Complete />} />
        <Route path="/help" element={<Help />} />
      </Routes>
    </Router>
  )
}

export default App
