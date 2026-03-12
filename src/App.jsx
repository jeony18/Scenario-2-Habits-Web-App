import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import SignIn from './pages/SignIn'
import SignUp from './pages/SignUp'
import { useState } from "react";
import HomePage from "./pages/HomePage";
import RecommendationsPage from "./pages/RecommendationsPage";
import ActivityList from "./pages/ActivityList";
import Tracker from "./pages/Tracker";

function MainFlow() {
  const [currentPage, setCurrentPage] = useState("home");
  const [userPreferences, setUserPreferences] = useState(null);
  const [recommendations, setRecommendations] = useState(null);
  const [isLoading, setIsLoading] = useState(false);

  const handleGetActivities = async (preferences) => {
    setUserPreferences(preferences);
    setIsLoading(true);
    setCurrentPage("recommendations");

    try {
      const payload = {
        ...preferences,
        userId: localStorage.getItem("userId")
      };
      const response = await fetch("http://localhost:5000/api/recommend", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });
      const data = await response.json();
      setRecommendations(data);
    } catch (error) {
      console.error("Error fetching recommendations:", error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div>
      {currentPage === "home" ? (
        <HomePage onGetActivities={handleGetActivities} />
      ) : (
        <RecommendationsPage
          userPreferences={userPreferences}
          recommendations={recommendations}
          isLoading={isLoading}
          onBack={() => setCurrentPage("home")}
        />
      )}
    </div>
  );
}

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Navigate to="/signin" replace />} />
        <Route path="/signin" element={<SignIn />} />
        <Route path="/signup" element={<SignUp />} />
        <Route path="/home" element={<MainFlow />} />
        <Route path="/activity-list" element={<ActivityList />} />
        <Route path="/tracker" element={<Tracker />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
