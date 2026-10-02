import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Login from './pages/Login';
import ChatApp from './pages/ChatApp';

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Login />} />
        <Route path="/app" element={<ChatApp />} />
      </Routes>
    </BrowserRouter>
  );
}