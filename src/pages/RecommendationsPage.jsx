export default function RecommendationsPage({ userPreferences, recommendations, isLoading, onBack }) {
  // Helper to map 1-5 scale back to words
  const getDescriptor = (val) => {
    if (val <= 2) return "Low";
    if (val === 3) return "Medium";
    return "High";
  };

  const getDuration = (slots) => {
    const map = {1: "15mins", 2: "30mins", 3: "1 hour", 4: "1.5 hours", 5: "2+ hours"};
    return map[slots] || "30mins";
  };

  const getEmoji = (name) => {
    const emojis = {
      "Morning Jog": "🏃", "Read a Book": "📖", "Team Basketball": "🏀",
      "Meditation": "🧘", "Cook a New Recipe": "🍳", "Call a Friend": "📞",
      "Gym Session": "🏋️", "Board Game Night": "🎲", "Yoga": "🧘‍♀️",
      "Volunteer Work": "🤝", "Journaling": "📓", "Group Hike": "🥾"
    };
    return emojis[name] || "⭐";
  };

  if (isLoading || !recommendations) {
    return (
      <div className="min-h-screen bg-brand-bg text-brand-text flex items-center justify-center">
        <h2 className="text-2xl animate-pulse">Finding the best matches...</h2>
      </div>
    );
  }

  const handleStartActivity = async (activityId) => {
    try {
      const response = await fetch("http://localhost:5000/api/log", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ activityId }),
      });
      if (response.ok) {
        window.location.href = '/tracker';
      }
    } catch (error) {
      console.error("Error logging activity:", error);
    }
  };

  const topRec = recommendations.topRecommendation;
  const alts = recommendations.alternatives || [];

  if (!topRec) {
    return (
      <div className="min-h-screen bg-brand-bg text-brand-text flex flex-col items-center justify-center">
        <h2 className="text-2xl mb-4">No activities found for your current inputs.</h2>
        <button onClick={onBack} className="bg-brand-btn hover:opacity-90 text-brand-btn-text px-6 py-2 rounded-lg">← Go Back</button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-brand-bg text-brand-text">
      {/* Header Navigation */}
      <nav className="bg-brand-nav p-4 flex justify-between items-center">
        <div className="text-2xl font-bold tracking-wider cursor-pointer" onClick={() => window.location.href = '/home'}>Habitly</div>
        <div className="flex gap-6">
          <button className="hover:text-brand-muted" onClick={() => window.location.href = '/home'}>Home</button>
          <button className="hover:text-brand-muted" onClick={() => window.location.href = '/tracker'}>Tracker</button>
          <button className="hover:text-brand-muted" onClick={() => window.location.href = '/activity-list'}>Activity List</button>
          <button className="bg-brand-btn text-brand-btn-text px-4 py-1 rounded" onClick={() => { localStorage.removeItem('userId'); window.location.href = '/signin'; }}>
            Log out
          </button>
        </div>
      </nav>

      {/* Main Content */}
      <div className="max-w-6xl mx-auto py-12 px-4">
        <h2 className="text-4xl font-light mb-12">Your recommendations</h2>

        {/* Top Recommendation and Alternatives Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Top Recommendation - Spans 2 rows */}
          <div className="bg-brand-surface text-brand-text p-8 rounded-lg lg:row-span-2 flex flex-col border border-brand-border">
            <h3 className="text-lg font-bold mb-4">Top Recommendation</h3>

            <div className="flex gap-4 mb-6">
              <div className="text-6xl">{getEmoji(topRec.name)}</div>
              <div className="flex-1">
                <h4 className="font-bold text-xl mb-2">{topRec.name}</h4>
                <p className="text-xs space-y-1">
                  <div>
                    <strong>Duration:</strong> {getDuration(topRec.duration)} |{" "}
                    <strong>Energy:</strong> {getDescriptor(topRec.physicality)} |{" "}
                    <strong>Social:</strong> {getDescriptor(topRec.sociability)}
                  </div>
                </p>
              </div>
            </div>

            <p className="text-sm mb-6 flex-grow">{topRec.description}</p>

            <div className="bg-brand-bg p-4 rounded mb-6 border border-brand-border">
              <h5 className="font-semibold text-sm mb-2">Why this for you?</h5>
              <p className="text-xs">Based on your preferences, this activity is a great fit. It matches your requested physical energy ({getDescriptor(userPreferences.physicalEnergy)}) and social battery ({getDescriptor(userPreferences.socialBattery)}).</p>
            </div>

            <button 
              onClick={() => handleStartActivity(topRec.id)}
              className="w-full bg-brand-btn hover:opacity-90 text-brand-btn-text px-6 py-2 rounded font-medium transition mt-auto"
            >
              Start Activity
            </button>
          </div>

          {/* Alternatives */}
          {alts.map((alt, index) => (
            <div key={index} className="bg-brand-surface text-brand-text p-6 rounded-lg flex flex-col border border-brand-border">
              <h4 className="text-lg font-bold mb-3">{alt.name} <span className="ml-2">{getEmoji(alt.name)}</span></h4>
              <p className="text-xs mb-3">
                <strong>Duration:</strong> {getDuration(alt.duration)} |{" "}
                <strong>Energy:</strong> {getDescriptor(alt.physicality)} |{" "}
                <strong>Social:</strong> {getDescriptor(alt.sociability)}
              </p>
              <p className="text-sm mb-4 flex-grow">{alt.description}</p>
              <button 
                onClick={() => handleStartActivity(alt.id)}
                className="w-full bg-brand-btn hover:opacity-90 text-brand-btn-text px-6 py-2 rounded font-medium transition mt-auto"
              >
                Start Activity
              </button>
            </div>
          ))}
        </div>

        {/* Back Button */}
        <div className="mt-12 text-center">
          <button
            onClick={onBack}
            className="bg-brand-surface hover:bg-brand-border text-brand-text px-6 py-2 rounded-lg transition border border-brand-border"
          >
            ← Back
          </button>
        </div>
      </div>
    </div>
  );
}

