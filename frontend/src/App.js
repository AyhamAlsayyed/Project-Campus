import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import LandingPage from './pages/landingpage/LandingPage';
import Login from './pages/authentication/login';
import Signup from './pages/authentication/signup';
import ProfilePage from './pages/profilePage/profilepage';
import Homepage from './pages/homepage/Homepage';



function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<LandingPage />} />
        <Route path="/login" element={<Login />} />
        <Route path="/signup" element={<Signup />} />
        <Route path="*" element={<Navigate to="/" replace />} />
        <Route path="/home" element={<Homepage />} />
        <Route path="/profile" element={<ProfilePage />} />
      </Routes>
    </BrowserRouter>

  );
}

export default App;
