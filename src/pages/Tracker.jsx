import React, { useState, useEffect } from "react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  PolarAngleAxis,
  PolarGrid,
  PolarRadiusAxis,
  Radar,
  RadarChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

const DAYS_OF_WEEK = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];

const DAY_ABBR = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

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
    return <div className="min-h-screen bg-brand-bg p-8 text-brand-text">Loading tracker...</div>;
  }

  const now = new Date();
  const oneWeekAgo = new Date(now);
  oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);

  const weeklyLogs = logs.filter((log) => {
    const timestamp = new Date(log.timestamp);
    return !Number.isNaN(timestamp.getTime()) && timestamp >= oneWeekAgo;
  });

  const activityMap = activities.reduce((acc, act) => {
    acc[act.id] = act;
    return acc;
  }, {});

  const dayCounts = weeklyLogs.reduce((acc, log) => {
    const day = log.dayOfWeek;
    if (typeof day === "number" && day >= 0 && day <= 6) {
      acc[day] += 1;
    }
    return acc;
  }, [0, 0, 0, 0, 0, 0, 0]);

  const weeklyBarData = DAY_ABBR.map((day, idx) => ({
    day,
    count: dayCounts[idx],
  }));

  const completedActivities = weeklyLogs
    .map((log) => activityMap[log.activityId])
    .filter(Boolean);

  const safeAverage = (values) => {
    if (!values.length) return 0;
    return Number((values.reduce((sum, n) => sum + n, 0) / values.length).toFixed(2));
  };

  const radarData = [
    { metric: "Physical", value: safeAverage(completedActivities.map((a) => a.physicality)) },
    { metric: "Social", value: safeAverage(completedActivities.map((a) => a.sociability)) },
    { metric: "Duration", value: safeAverage(completedActivities.map((a) => a.duration)) },
    { metric: "Importance", value: safeAverage(completedActivities.map((a) => a.importance)) },
  ];

  const logsByActivity = weeklyLogs.reduce((acc, log) => {
    const key = log.activityId;
    acc[key] = (acc[key] || 0) + 1;
    return acc;
  }, {});

  const topActivityEntry = Object.entries(logsByActivity).sort((a, b) => b[1] - a[1])[0];
  const topActivityName = topActivityEntry ? (activityMap[Number(topActivityEntry[0])]?.name || "Unknown") : "None yet";

  const activeDaysCount = dayCounts.filter((count) => count > 0).length;
  const uniqueActivitiesCount = new Set(weeklyLogs.map((log) => log.activityId)).size;
  
  return (
    <div className="min-h-screen bg-brand-bg text-brand-text">
      <nav className="bg-brand-nav p-4 flex justify-between items-center">
        <div className="text-2xl font-bold tracking-wider cursor-pointer" onClick={() => window.location.href = '/home'}>Habitly</div>
        <div className="flex gap-6">
          <button className="hover:text-brand-muted" onClick={() => window.location.href = '/home'}>Home</button>
          <button className="hover:text-brand-muted underline" onClick={() => window.location.href = '/tracker'}>Tracker</button>
          <button className="hover:text-brand-muted" onClick={() => window.location.href = '/activity-list'}>Activity List</button>
          <button className="bg-brand-btn text-brand-btn-text px-4 py-1 rounded" onClick={() => { localStorage.removeItem('userId'); window.location.href = '/signin'; }}>
            Log out
          </button>
        </div>
      </nav>

      <div className="max-w-6xl mx-auto py-12 px-4">
        <h2 className="text-4xl font-bold mb-12" style={{ fontFamily: 'monospace' }}>Your progress so far...</h2>

        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4 mb-8">
          <div className="bg-brand-surface text-brand-text rounded-lg p-4 shadow">
            <p className="text-xs uppercase tracking-widest text-brand-muted">Logs this week</p>
            <p className="text-3xl font-bold mt-2">{weeklyLogs.length}</p>
          </div>
          <div className="bg-brand-surface text-brand-text rounded-lg p-4 shadow">
            <p className="text-xs uppercase tracking-widest text-brand-muted">Active days</p>
            <p className="text-3xl font-bold mt-2">{activeDaysCount} / 7</p>
          </div>
          <div className="bg-brand-surface text-brand-text rounded-lg p-4 shadow">
            <p className="text-xs uppercase tracking-widest text-brand-muted">Unique activities</p>
            <p className="text-3xl font-bold mt-2">{uniqueActivitiesCount}</p>
          </div>
          <div className="bg-brand-surface text-brand-text rounded-lg p-4 shadow">
            <p className="text-xs uppercase tracking-widest text-brand-muted">Most repeated</p>
            <p className="text-lg font-semibold mt-2 truncate">{topActivityName}</p>
          </div>
        </div>

        <div className="grid grid-cols-1 xl:grid-cols-2 gap-6 mb-8">
          <div className="bg-brand-surface text-brand-text rounded-lg p-4 shadow">
            <h3 className="text-lg font-semibold mb-3">Activity Volume by Day</h3>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={weeklyBarData} margin={{ top: 8, right: 8, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="day" />
                  <YAxis allowDecimals={false} />
                  <Tooltip />
                  <Bar dataKey="count" fill="#a16207" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="bg-brand-surface text-brand-text rounded-lg p-4 shadow">
            <h3 className="text-lg font-semibold mb-3">Weekly Balance Profile</h3>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <RadarChart cx="50%" cy="50%" outerRadius="72%" data={radarData}>
                  <PolarGrid />
                  <PolarAngleAxis dataKey="metric" />
                  <PolarRadiusAxis angle={30} domain={[0, 5]} />
                  <Radar name="Average" dataKey="value" stroke="#292524" fill="#292524" fillOpacity={0.4} />
                  <Tooltip />
                </RadarChart>
              </ResponsiveContainer>
            </div>
            <p className="text-xs text-brand-muted mt-2">Scale: 0 to 5, using your completed activities from the last 7 days.</p>
          </div>
        </div>

        <div className="overflow-x-auto">
          <h3 className="text-xl font-semibold mb-3">Weekly Habit Matrix</h3>
          <table className="w-full text-center border-collapse text-brand-text" style={{ border: '4px solid #292524' }}>
            <thead>
              <tr className="bg-brand-surface border-b-4 border-brand-text">
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
                const activityLogs = weeklyLogs.filter((l) => l.activityId === act.id);
                const hasLogsThisWeek = dayIndex => activityLogs.some(l => l.dayOfWeek === dayIndex);
                
                return (
                  <tr key={act.id} className="bg-brand-surface border-b-4 border-brand-border font-medium">
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