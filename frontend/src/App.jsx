import { useState } from 'react'
import reactLogo from './assets/react.svg'
import viteLogo from '/vite.svg'
import './App.css'


// src/App.jsx
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import Dashboard from "./pages/Dashboard";

function Home() {
  return (
    <div className="flex justify-center items-center h-screen bg-gray-100">
      <a
        href="http://54.157.28.13:3000/api/login"
        className="bg-black text-white px-6 py-3 rounded-lg shadow-md"
      >
        Login with GitHub
      </a>
    </div>
  );
}

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/dashboard" element={<Dashboard />} />
      </Routes>
    </Router>
  );
}

export default App;

