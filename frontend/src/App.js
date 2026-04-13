import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import LandingPage from './pages/landingpage/LandingPage';
import Login from './pages/authentication/login';
import Signup from './pages/authentication/signup';
import ProfilePage from './pages/profilePage/profilepage';
import Homepage from './pages/homepage/Homepage';
import Communities from './pages/communities/communities';
import ProtectedRoute from "./components/auth/protectedRoute";
import CommunityPage from './pages/communityPage/communityPage'
import ChatsPage from './pages/chatsPage/chatsPage';



function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<LandingPage />} />
        <Route path="/login" element={<Login />} />
        <Route path="/signup" element={<Signup />} />
        <Route
          path="/home"
          element={
            <ProtectedRoute>
              <Homepage />
            </ProtectedRoute>
          }
        />

        <Route
          path="/profile/:userId"
          element={
            <ProtectedRoute>
              <ProfilePage />
            </ProtectedRoute>
          }
        />

        <Route
          path="/communities"
          element={
            <ProtectedRoute>
              <Communities />
            </ProtectedRoute>
          }
        />

        <Route
          path="/communities/:id"
          element={
            <ProtectedRoute>
              <CommunityPage />
            </ProtectedRoute>
          }
        />

        <Route
          path="/chats"
          element={
            <ProtectedRoute>
              <ChatsPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/chats/:chatId"
          element={
            <ProtectedRoute>
              <ChatsPage />
            </ProtectedRoute>
          }
        />


        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>

  );
}

export default App;
