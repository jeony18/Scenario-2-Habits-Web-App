import { useState } from "react";

export default function HomePage({ onGetActivities }) {
  const [timeAvailable, setTimeAvailable] = useState(30);
  const [physicalEnergy, setPhysicalEnergy] = useState(3);
  const [socialBattery, setSocialBattery] = useState(3);

  const weatherCodeToCondition = (code) => {
    if (typeof code !== "number") return "unknown";
    if (code === 0 || code === 1) return "clear";
    if ([2, 3, 45, 48].includes(code)) return "cloudy";
    if ([51, 53, 55, 61, 63, 65, 80, 81, 82].includes(code)) return "rain";
    if ([56, 57, 66, 67, 71, 73, 75, 77, 85, 86].includes(code)) return "snow";
    if ([95, 96, 99].includes(code)) return "storm";
    return "unknown";
  };

  const getCurrentPosition = () =>
    new Promise((resolve, reject) => {
      if (!navigator.geolocation) {
        reject(new Error("Geolocation unavailable"));
        return;
      }
      navigator.geolocation.getCurrentPosition(resolve, reject, {
        enableHighAccuracy: false,
        timeout: 4000,
        maximumAge: 600000,
      });
    });

  const buildContextPayload = async () => {
    const now = new Date();
    const baseContext = {
      hour: now.getHours(),
      isWeekend: now.getDay() === 0 || now.getDay() === 6,
      weather: "unknown",
    };

    try {
      const position = await getCurrentPosition();
      const lat = position.coords.latitude;
      const lon = position.coords.longitude;
      const weatherResponse = await fetch(
        `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current=weather_code`,
      );
      if (!weatherResponse.ok) {
        return baseContext;
      }
      const weatherData = await weatherResponse.json();
      return {
        ...baseContext,
        weather: weatherCodeToCondition(weatherData?.current?.weather_code),
      };
    } catch {
      return baseContext;
    }
  };

  const handleGetActivities = async () => {
    const context = await buildContextPayload();
    onGetActivities({
      timeAvailable,
      physicalEnergy,
      socialBattery,
      context,
    });
  };

  return (
    <div className="min-h-screen bg-gray-400 text-white">
      {/* Header Navigation */}
      <nav className="bg-gray-600 p-4 flex justify-between items-center">
        <div className="text-2xl font-bold tracking-wider cursor-pointer" onClick={() => window.location.href = '/home'}>Habitly</div>
        <div className="flex gap-6">
          <button className="hover:text-gray-200" onClick={() => window.location.href = '/home'}>Home</button>
          <button className="hover:text-gray-200" onClick={() => window.location.href = '/tracker'}>Tracker</button>
          <button className="hover:text-gray-200" onClick={() => window.location.href = '/activity-list'}>Activity List</button>
          <button className="bg-white text-gray-600 px-4 py-1 rounded" onClick={() => { localStorage.removeItem('userId'); window.location.href = '/signin'; }}>
            Log out
          </button>
        </div>
      </nav>

      {/* Main Content */}
      <div className="max-w-2xl mx-auto py-12 px-4">
        <h1 className="text-4xl font-light mb-12 text-center">
          How are you feeling today?
        </h1>

        {/* Sliders Container */}
        <div className="space-y-10">
          {/* Time Available Slider */}
          <div>
            <label className="block text-sm mb-2">Time available</label>
            <div className="flex items-center gap-4">
              <input
                type="range"
                min="15"
                max="120"
                step="1"
                value={timeAvailable}
                onChange={(e) => setTimeAvailable(Number(e.target.value))}
                className="flex-1 h-2 bg-gray-600 rounded-lg appearance-none cursor-pointer"
              />
              <span className="text-sm font-semibold w-16 text-right">{timeAvailable} min</span>
            </div>
            <div className="flex justify-between text-xs mt-2">
              <span>15 minutes</span>
              <span>30 minutes</span>
              <span>1 hour</span>
              <span>2+ hours</span>
            </div>
          </div>

          {/* Physical Energy Slider */}
          <div>
            <label className="block text-sm mb-2">Physical Energy</label>
            <p className="text-xs mb-3 text-gray-200">How active do you feel?</p>
            <div className="flex items-center gap-4">
              <span className="text-2xl">
                {physicalEnergy <= 2 ? "🪫" : physicalEnergy <= 3 ? "🔋" : "⚡"}
              </span>
              <input
                type="range"
                min="1"
                max="5"
                step="1"
                value={physicalEnergy}
                onChange={(e) => setPhysicalEnergy(Number(e.target.value))}
                className="flex-1 h-2 bg-gray-600 rounded-lg appearance-none cursor-pointer"
              />
              <span className="text-sm font-semibold w-6 text-center">{physicalEnergy}</span>
            </div>
            <div className="flex justify-between text-xs mt-2 text-gray-200">
              <span>Low</span>
              <span>High</span>
            </div>
          </div>

          {/* Social Battery Slider */}
          <div>
            <label className="block text-sm mb-2">Social battery</label>
            <p className="text-xs mb-3 text-gray-200">How much do you want human connection?</p>
            <div className="flex items-center gap-4">
              <span className="text-2xl">🔒</span>
              <input
                type="range"
                min="1"
                max="5"
                step="1"
                value={socialBattery}
                onChange={(e) => setSocialBattery(Number(e.target.value))}
                className="flex-1 h-2 bg-gray-600 rounded-lg appearance-none cursor-pointer"
              />
              <span className="text-sm font-semibold w-6 text-center">{socialBattery}</span>
            </div>
            <div className="flex justify-between text-xs mt-2 text-gray-200">
              <span>Alone</span>
              <span>Social</span>
            </div>
          </div>
        </div>

        {/* Button */}
        <div className="flex justify-center mt-12">
          <button
            onClick={handleGetActivities}
            className="bg-gray-600 hover:bg-gray-700 text-white px-8 py-3 rounded-lg font-medium transition"
          >
            Give me activities
          </button>
        </div>
      </div>
    </div>
  );
}
