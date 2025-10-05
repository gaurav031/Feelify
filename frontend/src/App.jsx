import { Box, Container } from "@chakra-ui/react";
import { Navigate, Route, Routes, useLocation } from "react-router-dom";
import UserPage from "./pages/UserPage";
import PostPage from "./pages/PostPage";
import Header from "./components/Header";
import HomePage from "./pages/HomePage";
import AuthPage from "./pages/AuthPage";
import { useRecoilValue } from "recoil";
import userAtom from "./atoms/userAtom";
import UpdateProfilePage from "./pages/UpdateProfilePage";
import CreatePost from "./components/CreatePost";
import ChatPage from "./pages/ChatPage";
import { SettingsPage } from "./pages/SettingsPage";
import UserSearch from "./pages/UserSearch"; // Import UserSearch
import Notifications from "./pages/NotificationPage";
import StoryModalPage from "./pages/StoryModalPage";
import FollowersFollowingPage from "./pages/FollowersFollowingPage";
import VideoFeedPage from "./pages/VideoFeedPage";
import AdminDashboard from "./pages/AdminDashboardPage";
import ManageUsers from "./components/ManageUsers";
import ManagePosts from "./components/ManagePosts";
import ForgotPassword from "./components/ForgotPassword";

function App() {
    const user = useRecoilValue(userAtom);
    const { pathname } = useLocation();

    return (
        <Box position={"relative"} w='full'>
            <Container maxW={pathname === "/" ? { base: "620px", md: "900px" } : "620px"}>
                <Header />
                <Routes>
                    <Route path='/' element={user ? <HomePage /> : <Navigate to='/auth' />} />
                    <Route path='/auth' element={!user ? <AuthPage /> : <Navigate to='/' />} />
                    <Route path='/forgot-password' element={!user ? <ForgotPassword /> : <Navigate to='/forgot-password' />} />

                    <Route path='/update' element={user ? <UpdateProfilePage /> : <Navigate to='/auth' />} />
                    <Route path='/search' element={<UserSearch />} /> {/* UserSearch route */}
                    <Route path='/:username' element={<UserPage />} />
                    <Route path='/:username/post/:pid' element={<PostPage />} />
                    <Route path='/chat' element={user ? <ChatPage /> : <Navigate to={"/auth"} />} />
                    <Route path='/:username/followerlist' element={user ? <FollowersFollowingPage /> : <Navigate to={"/auth"} />} />
                    <Route path='/settings' element={user ? <SettingsPage /> : <Navigate to={"/auth"} />} />

                    <Route path='/notifications' element={user ? <Notifications /> : <Navigate to={"/auth"} />} />
                    <Route path="/story-viewer" element={user ? <StoryModalPage /> : <Navigate to={"/auth"} />} />
                    <Route path="/video" element={user ? <VideoFeedPage /> : <Navigate to={"/auth"} />} />


                    <Route path="/admin" element={<AdminDashboard />}>
                        <Route path="users" element={<ManageUsers />} />
                        <Route path="posts" element={<ManagePosts />} />
                    </Route>

                </Routes>
            </Container>
        </Box>
    );
}

export default App;
