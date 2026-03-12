import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";

export default function ActivityList() {
  const [activities, setActivities] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editingParams, setEditingParams] = useState(null);
  const [formParams, setFormParams] = useState(null);
  const [isCreating, setIsCreating] = useState(false);
  const navigate = useNavigate();

  const userId = localStorage.getItem("userId");

  useEffect(() => {
    if (!userId) {
      navigate("/signin");
      return;
    }
    fetchActivities();
  }, [userId]);

  const fetchActivities = async () => {
    try {
      const res = await fetch(`http://localhost:5000/api/activities?user_id=${userId}`);
      if (res.ok) {
        setActivities(await res.json());
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (act) => {
    setEditingParams(act);
    setFormParams({ ...act });
  };

  const handleCancel = () => {
    setEditingParams(null);
    setIsCreating(false);
    setFormParams(null);
  };

  const handleCreateNew = () => {
    setIsCreating(true);
    setFormParams({
      name: "",
      description: "",
      duration: 1,
      physicality: 1,
      sociability: 1,
      importance: 3,
    });
  };

  const handleDelete = async (id) => {
    try {
      const res = await fetch(`http://localhost:5000/api/activities/${id}`, {
        method: "DELETE",
      });
      if (res.ok) fetchActivities();
    } catch (e) {
      console.error(e);
    }
  };

  const handleSave = async (e) => {
    e.preventDefault();
    if (isCreating) {
      try {
        const res = await fetch(`http://localhost:5000/api/activities?user_id=${userId}`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(formParams),
        });
        if (res.ok) {
          fetchActivities();
          handleCancel();
        }
      } catch (e) {}
    } else {
      try {
        const res = await fetch(`http://localhost:5000/api/activities/${editingParams.id}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(formParams),
        });
        if (res.ok) {
          fetchActivities();
          handleCancel();
        }
      } catch (e) {}
    }
  };

  if (loading) return <div className="p-8">Loading activities...</div>;

  return (
    <div className="min-h-screen bg-gray-400 text-white">
      {/* Header Navigation */}
      <nav className="bg-gray-600 p-4 flex justify-between items-center">
        <div className="w-20 h-8 bg-gray-300 rounded"></div>
        <div className="flex gap-6">
          <button className="hover:text-gray-200" onClick={() => window.location.href = '/home'}>Home</button>
          <button className="hover:text-gray-200" onClick={() => window.location.href = '/tracker'}>Tracker</button>
          <button className="hover:text-gray-200 underline" onClick={() => window.location.href = '/activity-list'}>Activity List</button>
          <button className="bg-white text-gray-600 px-4 py-1 rounded" onClick={() => { localStorage.removeItem('userId'); window.location.href = '/signin'; }}>
            Log out
          </button>
        </div>
      </nav>

      <div className="max-w-6xl mx-auto flex gap-8 py-12 px-4">
        {/* Sidebar */}
        <div className="w-48 shrink-0 border-r border-gray-500 pr-4">
          <ul className="space-y-4">
            <li>
              <button className="text-gray-200 hover:text-white">Interests</button>
            </li>
            <li>
              <span className="font-bold border-l-4 border-white pl-2">Activity List</span>
            </li>
          </ul>
        </div>
        
        {/* Main List */}
        <div className="flex-1">
          <div className="flex justify-start items-center mb-6">
            <button
              onClick={handleCreateNew}
              className="bg-gray-200 text-gray-800 px-4 py-2 rounded font-medium hover:bg-white transition-colors"
            >
              Crate Custom Activity
            </button>
          </div>
          
          <div className="grid grid-cols-1 gap-4">
            {activities.map((act) => (
              <div key={act.id} className="bg-gray-300 text-gray-800 p-4 rounded flex justify-between items-center shadow">
                <div className="flex-1 mr-4">
                  <h3 className="text-xl font-semibold mb-1">{act.name}</h3>
                  <p className="text-gray-600 text-sm mb-2">{act.description}</p>
                </div>
                <div className="flex gap-2 shrink-0">
                  <button onClick={() => handleEdit(act)} className="bg-blue-500 text-white px-3 py-1 rounded hover:bg-blue-600 transition-colors">Personalise</button>
                  <button onClick={() => handleDelete(act.id)} className="bg-red-500 text-white px-3 py-1 rounded hover:bg-red-600 transition-colors">Remove</button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Editor Modal */}
      {(editingParams || isCreating) && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-white text-gray-800 rounded-lg shadow-xl w-full max-w-md p-6 relative">
            <button onClick={handleCancel} className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 text-2xl leading-none">&times;</button>
            <h2 className="text-2xl font-bold mb-6">{isCreating ? "New Activity" : "Edit Activity"}</h2>
            <form onSubmit={handleSave} className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">Name</label>
                <input required type="text" value={formParams.name} onChange={(e) => setFormParams({...formParams, name: e.target.value})} className="w-full border border-gray-300 rounded p-2 focus:outline-none focus:border-blue-500" />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Description</label>
                <input type="text" value={formParams.description} onChange={(e) => setFormParams({...formParams, description: e.target.value})} className="w-full border border-gray-300 rounded p-2 focus:outline-none focus:border-blue-500" />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1">Duration (1-5)</label>
                  <input type="number" min="1" max="5" value={formParams.duration} onChange={(e) => setFormParams({...formParams, duration: parseInt(e.target.value)})} className="w-full border border-gray-300 rounded p-2" />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Physicality (1-5)</label>
                  <input type="number" min="1" max="5" value={formParams.physicality} onChange={(e) => setFormParams({...formParams, physicality: parseInt(e.target.value)})} className="w-full border border-gray-300 rounded p-2" />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Sociability (1-5)</label>
                  <input type="number" min="1" max="5" value={formParams.sociability} onChange={(e) => setFormParams({...formParams, sociability: parseInt(e.target.value)})} className="w-full border border-gray-300 rounded p-2" />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Weighting (1-5)</label>
                  <input type="number" min="1" max="5" value={formParams.importance} onChange={(e) => setFormParams({...formParams, importance: parseInt(e.target.value)})} className="w-full border border-gray-300 rounded p-2" />
                </div>
              </div>
              
              <div className="mt-8 flex justify-end gap-3">
                <button type="button" onClick={handleCancel} className="px-4 py-2 text-gray-600 border border-gray-300 rounded hover:bg-gray-100">Cancel</button>
                <button type="submit" className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700">
                  {isCreating ? "Create" : "Save Changes"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}