import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import './App.css'
import './index.css'
import LandingPage from './pages/landingpage/LandingPage';
import Login from './pages/authentication/login';
import Signup from './pages/authentication/signup';
import ProfilePage from './pages/profilePage/profilepage';
import Homepage from './pages/homepage/Homepage';
import Communities from './pages/communities/communities';
import ProtectedRoute from "./components/auth/protectedRoute";
import CommunityPage from './pages/communityPage/communityPage'
import ChatsPage from './pages/chatsPage/chatsPage';
import FriendsPage from './pages/FriendsPage/FriendsPage';
import FollowedPages from './pages/followedPages/followedPages';
import JoinedCommunities from './pages/joinedCommunities/joinedCommunities';
import Universities from "./pages/universtities/universities";
import EventsPage from "./pages/eventsPage/eventsPage";
import SearchResultsPage from './pages/searchResultPage/searchResults.jsx'
import Subscriptions from "./pages/subscriptions/subscriptions";
import Settings from "./pages/settingsPage/Settings.jsx";
import PageEventsPage from "./pages/pageEventsProfilePage/PageEvents.jsx";

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
        <Route path="/profile/:userId" element={
          <ProtectedRoute>
            <ProfilePage type="user" />
          </ProtectedRoute>
        } />
        <Route path="/page/:userId" element={
          <ProtectedRoute>
            <ProfilePage type="page" />
          </ProtectedRoute>
        } />

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

        <Route
          path="/profile/:userId/friends"
          element={
            <ProtectedRoute>
              <FriendsPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/profile/:userId/pages"
          element={
            <ProtectedRoute>
              <FollowedPages />
            </ProtectedRoute>
          }
        />
        <Route
          path="/profile/:userId/communities"
          element={
            <ProtectedRoute>
              <JoinedCommunities />
            </ProtectedRoute>
          }
        />
        <Route
          path="/Universities"
          element={
            <ProtectedRoute>
              <Universities />
            </ProtectedRoute>
          }
        />
        <Route
          path="/events"
          element={
            <ProtectedRoute>
              <EventsPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/search"
          element={
            <ProtectedRoute>
              <SearchResultsPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/subscriptions"
          element={
            <ProtectedRoute>
              <Subscriptions />
            </ProtectedRoute>
          }
        />
        <Route
          path="/pages"
          element={
            <ProtectedRoute>
              <FollowedPages />
            </ProtectedRoute>
          }
        />
        <Route
          path="/settings"
          element={
            <ProtectedRoute>
              <Settings />
            </ProtectedRoute>
          }
        />
        <Route
          path="/profile/:userId/pageEvents"
          element={
            <ProtectedRoute>
              <PageEventsPage />
            </ProtectedRoute>
          }
        />

        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>

  );
}

export default App;
