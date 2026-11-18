import { BrowserRouter, Routes, Route } from "react-router-dom";
import Landing from "./pages/Landing";
import Login from "./pages/Login";
import ChatApp from "./pages/ChatApp";
import Team from "./pages/Team";
import Profile from "./pages/Profile";            

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Landing />} />
        <Route path="/login" element={<Login />} />
        <Route path="/app" element={<ChatApp />} />
        <Route path="/team" element={<Team />} />
        <Route path="/profile" element={<Profile />} />    

      </Routes>
    </BrowserRouter>
  );
}
