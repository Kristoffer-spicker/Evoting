import { BrowserRouter as Router, Routes, Route } from 'react-router-dom'
import {Login, ScanQR, CastVote, SeekConfirm, Ballot, Confirmation, AfterVote, Help } from './pages'

function App() {
  return (
    <Router>
      <div className="App">
        <Routes>
          <Route path="/" element={<Login />} />
          <Route path="/scanqr" element={<ScanQR />} />
          <Route path="/castvote" element={<CastVote />} />
          <Route path="/seekconfirm" element={<SeekConfirm />} />
          <Route path="/ballot" element={<Ballot />} />
          <Route path="/confirmation" element={<Confirmation />} />
          <Route path="/aftervote" element={<AfterVote />} />
          <Route path="/help" element={<Help />} />
        </Routes>
      </div>
    </Router>
  )
}

export default App