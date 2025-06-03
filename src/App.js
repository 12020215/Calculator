import { HashRouter as Router, Route, Routes } from 'react-router-dom';
import Calculator from './components/Calculator/Calculator';
import Exchangerate from './components/Exchangerate/Exchangerate';

function App() {
  return (
    <Router>
      <Routes>
        <Route path="Exchangerate" element={<Exchangerate />} />
        <Route path="Calculator" element={<Calculator />} />
      </Routes>
    </Router>
  );
}

export default App;
