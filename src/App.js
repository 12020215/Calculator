import { HashRouter as Router, Route, Routes } from 'react-router-dom';
import Calculator from './components/Calculator/Calculator';
import Exchangerate from './components/Exchangerate/Exchangerate';

function App() {
  return (
    <Router basename="/Calculator">
      <Routes>
        <Route path="/Calculator" element={<Calculator />} />
        <Route path="/Exchangerate" element={<Exchangerate />} />
      </Routes>
    </Router>
  );
}

export default App;
