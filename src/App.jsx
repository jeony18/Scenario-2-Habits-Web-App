import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import SignIn from './pages/SignIn'
import SignUp from './pages/SignUp'
import { useState } from "react";
import HomePage from "./components/HomePage";
import RecommendationsPage from "./components/RecommendationsPage";

function App() {
  const [currentPage, setCurrentPage] = useState("home");
  const [userPreferences, setUserPreferences] = useState(null);

  const handleGetActivities = (preferences) => {
    setUserPreferences(preferences);
    setCurrentPage("recommendations");
  };

  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Navigate to="/signin" replace />} />
        <Route path="/signin" element={<SignIn />} />
        <Route path="/signup" element={<SignUp />} />
      </Routes>
    </BrowserRouter>
  )
    <div>
      {currentPage === "home" ? (
        <HomePage onGetActivities={handleGetActivities} />
      ) : (
        <RecommendationsPage
          userPreferences={userPreferences}
          onBack={() => setCurrentPage("home")}
        />
      )}
    </div>
  );
}

export default App

export default App;
