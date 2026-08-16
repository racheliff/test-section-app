'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';

interface Project {
  id: string;
  code: string;
  name: string;
  createdAt: string;
}

export default function HomePage() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [showNewForm, setShowNewForm] = useState(false);
  const [newProject, setNewProject] = useState({ name: '', code: '' });

  useEffect(() => {
    fetchProjects();
  }, []);

  const fetchProjects = async () => {
    try {
      const res = await fetch('/api/projects');
      const data = await res.json();
      if (Array.isArray(data)) {
        setProjects(data);
      } else {
        console.error('Invalid response:', data);
        setProjects([]);
      }
    } catch (error) {
      console.error('Error fetching projects:', error);
      setProjects([]);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateProject = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch('/api/projects', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newProject),
      });
      if (res.ok) {
        setNewProject({ name: '', code: '' });
        setShowNewForm(false);
        fetchProjects();
      }
    } catch (error) {
      console.error('Error creating project:', error);
    }
  };

  if (loading) {
    return (
      <div dir="rtl" className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-lg text-gray-600">טוען...</div>
      </div>
    );
  }

  return (
    <div dir="rtl" className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-6xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold text-gray-800">פרויקטים</h1>
          <button
            onClick={() => setShowNewForm(true)}
            className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition-colors"
          >
            + הוסף פרויקט
          </button>
        </div>

        {showNewForm && (
          <div className="bg-white rounded-xl shadow-lg p-6 mb-8">
            <h2 className="text-xl font-semibold mb-4">פרויקט חדש</h2>
            <form onSubmit={handleCreateProject} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  קוד פרויקט
                </label>
                <input
                  type="text"
                  value={newProject.code}
                  onChange={(e) => setNewProject({ ...newProject, code: e.target.value })}
                  className="w-full p-2 border border-gray-300 rounded-lg"
                  placeholder="לדוגמה: PRJ-002"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  שם הפרויקט
                </label>
                <input
                  type="text"
                  value={newProject.name}
                  onChange={(e) => setNewProject({ ...newProject, name: e.target.value })}
                  className="w-full p-2 border border-gray-300 rounded-lg"
                  placeholder="לדוגמה: פרויקט מגורים - תל אביב"
                  required
                />
              </div>
              <div className="flex gap-3">
                <button
                  type="submit"
                  className="bg-green-600 text-white px-6 py-2 rounded-lg hover:bg-green-700"
                >
                  שמור
                </button>
                <button
                  type="button"
                  onClick={() => setShowNewForm(false)}
                  className="bg-gray-300 text-gray-700 px-6 py-2 rounded-lg hover:bg-gray-400"
                >
                  ביטול
                </button>
              </div>
            </form>
          </div>
        )}

        {projects.length === 0 ? (
          <div className="text-center py-12 bg-white rounded-xl shadow">
            <p className="text-gray-500 text-lg">אין פרויקטים עדיין</p>
            <p className="text-gray-400 mt-2">לחץ על &quot;הוסף פרויקט&quot; כדי להתחיל</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {projects.map((project) => (
              <Link
                key={project.id}
                href={`/projects/${project.id}`}
                className="bg-white rounded-xl shadow-lg p-6 hover:shadow-xl transition-shadow cursor-pointer border-2 border-transparent hover:border-blue-500"
              >
                <div className="text-sm text-blue-600 font-medium mb-2">{project.code}</div>
                <h2 className="text-xl font-semibold text-gray-800 mb-4">{project.name}</h2>
                <div className="text-sm text-gray-500">
                  נוצר: {new Date(project.createdAt).toLocaleDateString('he-IL')}
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
