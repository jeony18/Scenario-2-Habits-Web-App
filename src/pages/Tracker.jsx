import React, { useState, useEffect } from "react";

const DAYS_OF_WEEK = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];

export default function Tracker() {
  const [logs, setLogs] = useState([]);
  const [activities, setActivities] = useState([]);
  const [loading, setLoading] = useState(true);

  const userId = localStorage.getItem("userId");

  useEffect(() => {
    if (!userId) {
      window.location.href = "/signin";
      return;
    }
    fetchData();
  }, [userId]);

  const fetchData = async () => {
    try {
      const [logsRes, actsRes] = await Promise.all([
        fetch(`http://localhost:5000/api/logs?user_id=${userId}`),
        fetch(`http://localhost:5000/api/activities?user_id=${userId}`)
      ]);
      if (logsRes.ok && actsRes.ok) {
        setLogs(await logsRes.json());
        setActivities(await actsRes.json());
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <div className="min-h-screen bg-gray-400 p-8 text-white">Loading tracker...</div>;
  }

  // Pre-process Data: Create a matrix of Habit x Days
  // rows = [{ activity: "Weight lifting", days: { 0: true, 2: false ... } }]
  
  // Actually, let's just make it dynamic.
  // Each row is an activity. columns are Monday...Sunday (0..6)
  
  // Only display habits that have been logged OR just display all user's habits? 
  // Let's display all user habits.
  
  return (
    <div className="min-h-screen bg-gray-400 text-white">
      {/* Header Navigation */}
      <nav className="bg-gray-600 p-4 flex justify-between items-center">
        <div className="w-20 h-8 bg-gray-300 rounded"></div>
        <div className="flex gap-6">
          <button className="hover:text-gray-200" onClick={() => window.location.href = '/home'}>Home</button>
          <button className="hover:text-gray-200 underline" onClick={() => window.location.href = '/tracker'}>Tracker</button>
          <button className="hover:text-gray-200" onClick={() => window.location.href = '/activity-list'}>Activity List</button>
          <button className="bg-white text-gray-600 px-4 py-1 rounded" onClick={() => { localStorage.removeItem('userId'); window.location.href = '/signin'; }}>
            Log out
          </button>
        </div>
      </nav>

      <div className="max-w-6xl mx-auto py-12 px-4">
        <h2 className="text-4xl font-bold mb-12" style={{ fontFamily: 'monospace' }}>Your progress so far...</h2>

        <div className="overflow-x-auto">
          <table className="w-full text-center border-collapse text-gray-800" style={{ border: '4px solid black' }}>
            <thead>
              <tr className="bg-gray-300 border-b-4 border-black">
                <th className="p-4 border-r-4 border-black font-semibold">Habit</th>
                {DAYS_OF_WEEK.map((day, i) => (
                  <th key={day} className={`p-4 font-semibold ${i !== DAYS_OF_WEEK.length - 1 ? 'border-r-4 border-black' : ''}`}>
                    {day}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {activities.map((act) => {
                const activityLogs = logs.filter(l => l.activityId === act.id);
                const hasLogsThisWeek = dayIndex => activityLogs.some(l => l.dayOfWeek === dayIndex);
                
                return (
                  <tr key={act.id} className="bg-gray-300 border-b-4 border-black font-medium">
                    <td className="p-4 border-r-4 border-black text-left">{act.name}</td>
                    {DAYS_OF_WEEK.map((day, i) => (
                      <td key={day} className={`p-4 ${i !== DAYS_OF_WEEK.length - 1 ? 'border-r-4 border-black' : ''}`}>
                        {hasLogsThisWeek(i) ? (
                          <span className="text-black text-2xl font-bold">✓</span>
                        ) : null}
                      </td>
                    ))}
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}