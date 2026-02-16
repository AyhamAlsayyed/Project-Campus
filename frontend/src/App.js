import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import LandingPage from './components/landingpage/LandingPage';
import Login from './components/authentication/login';
import Signup from './components/authentication/signup';

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<LandingPage />} />
        <Route path="/login" element={<Login />} />
        <Route path="/signup" element={<Signup />} />
         <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>

  );
}

export default App;
