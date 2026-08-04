'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';

interface Project {
  id: string;
  code: string;
  name: string;
  createdAt: string;
}

interface Professional {
  id: string;
  category: string;
  role: string;
  name: string;
  company: string | null;
  phone: string | null;
  email: string | null;
}

const PROFESSIONAL_ROLES = [
  'מנהל פרויקט מטעם המזמין',
  'מנהל פרויקט מטעם הפיקוח',
  'מנהל פרויקט מטעם הקבלן',
  'מהנדס ביצוע',
  'מנהל עבודה',
  'מנהל אבטחת איכות',
  'מנהל בקרת איכות',
];

const CONSULTANT_ROLES = [
  'חשמל',
  'קרקע',
  'בטיחות',
];

export default function ProjectDetailPage() {
  const params = useParams();
  const [project, setProject] = useState<Project | null>(null);
  const [professionals, setProfessionals] = useState<Professional[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddProfessional, setShowAddProfessional] = useState(false);
  const [showAddConsultant, setShowAddConsultant] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [newProfessional, setNewProfessional] = useState({
    role: '',
    name: '',
    company: '',
    phone: '',
    email: '',
  });

  useEffect(() => {
    if (params.id) {
      fetchData();
    }
  }, [params.id]);

  const fetchData = async () => {
    try {
      const [projectRes, professionalsRes] = await Promise.all([
        fetch(`/api/projects/${params.id}`),
        fetch(`/api/projects/${params.id}/professionals`),
      ]);

      if (projectRes.ok) {
        setProject(await projectRes.json());
      }
      if (professionalsRes.ok) {
        setProfessionals(await professionalsRes.json());
      }
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleAddProfessional = async (category: string) => {
    if (!newProfessional.role || !newProfessional.name) return;

    try {
      const res = await fetch(`/api/projects/${params.id}/professionals`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...newProfessional,
          category,
        }),
      });

      if (res.ok) {
        const created = await res.json();
        setProfessionals(prev => [...prev, created]);
        setNewProfessional({ role: '', name: '', company: '', phone: '', email: '' });
        setShowAddProfessional(false);
        setShowAddConsultant(false);
      }
    } catch (error) {
      console.error('Error adding professional:', error);
    }
  };

  const handleUpdateProfessional = async (id: string, data: Partial<Professional>) => {
    try {
      const res = await fetch(`/api/professionals/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });

      if (res.ok) {
        const updated = await res.json();
        setProfessionals(prev => prev.map(p => p.id === id ? updated : p));
        setEditingId(null);
      }
    } catch (error) {
      console.error('Error updating professional:', error);
    }
  };

  const handleDeleteProfessional = async (id: string) => {
    if (!confirm('האם למחוק?')) return;

    try {
      const res = await fetch(`/api/professionals/${id}`, {
        method: 'DELETE',
      });

      if (res.ok) {
        setProfessionals(prev => prev.filter(p => p.id !== id));
      }
    } catch (error) {
      console.error('Error deleting professional:', error);
    }
  };

  const professionalsList = professionals.filter(p => p.category === 'professional');
  const consultantsList = professionals.filter(p => p.category === 'consultant');

  if (loading) {
    return (
      <div dir="rtl" className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-lg text-gray-600">טוען...</div>
      </div>
    );
  }

  if (!project) {
    return (
      <div dir="rtl" className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-800 mb-4">פרויקט לא נמצא</h1>
          <Link href="/" className="text-blue-600 hover:underline">
            חזור לדף הבית
          </Link>
        </div>
      </div>
    );
  }

  const renderProfessionalRow = (person: Professional) => {
    const isEditing = editingId === person.id;

    if (isEditing) {
      return (
        <tr key={person.id} className="border-b border-gray-100">
          <td className="py-3 px-4">
            <input
              type="text"
              defaultValue={person.role}
              onBlur={(e) => handleUpdateProfessional(person.id, { ...person, role: e.target.value })}
              className="w-full px-2 py-1 border border-gray-300 rounded text-sm"
            />
          </td>
          <td className="py-3 px-4">
            <input
              type="text"
              defaultValue={person.name}
              onBlur={(e) => handleUpdateProfessional(person.id, { ...person, name: e.target.value })}
              className="w-full px-2 py-1 border border-gray-300 rounded text-sm"
            />
          </td>
          <td className="py-3 px-4">
            <input
              type="text"
              defaultValue={person.company || ''}
              onBlur={(e) => handleUpdateProfessional(person.id, { ...person, company: e.target.value })}
              className="w-full px-2 py-1 border border-gray-300 rounded text-sm"
            />
          </td>
          <td className="py-3 px-4">
            <input
              type="tel"
              defaultValue={person.phone || ''}
              onBlur={(e) => handleUpdateProfessional(person.id, { ...person, phone: e.target.value })}
              className="w-full px-2 py-1 border border-gray-300 rounded text-sm"
            />
          </td>
          <td className="py-3 px-4">
            <input
              type="email"
              defaultValue={person.email || ''}
              onBlur={(e) => handleUpdateProfessional(person.id, { ...person, email: e.target.value })}
              className="w-full px-2 py-1 border border-gray-300 rounded text-sm"
            />
          </td>
          <td className="py-3 px-4">
            <button
              onClick={() => setEditingId(null)}
              className="text-blue-600 hover:underline text-sm"
            >
              סיום
            </button>
          </td>
        </tr>
      );
    }

    return (
      <tr key={person.id} className="border-b border-gray-100 hover:bg-gray-50">
        <td className="py-3 px-4 font-medium text-gray-800">{person.role}</td>
        <td className="py-3 px-4 text-gray-800">{person.name}</td>
        <td className="py-3 px-4 text-gray-600">{person.company || '-'}</td>
        <td className="py-3 px-4 text-gray-600">{person.phone || '-'}</td>
        <td className="py-3 px-4 text-gray-600">{person.email || '-'}</td>
        <td className="py-3 px-4">
          <div className="flex gap-2">
            <button
              onClick={() => setEditingId(person.id)}
              className="text-blue-600 hover:underline text-sm"
            >
              עריכה
            </button>
            <button
              onClick={() => handleDeleteProfessional(person.id)}
              className="text-red-600 hover:underline text-sm"
            >
              מחיקה
            </button>
          </div>
        </td>
      </tr>
    );
  };

  return (
    <div dir="rtl" className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-5xl mx-auto">
        <Link href="/" className="text-blue-600 hover:underline mb-6 inline-block">
          ← חזור לרשימת הפרויקטים
        </Link>

        <div className="bg-white rounded-xl shadow-lg p-8 mb-8">
          <div className="text-sm text-blue-600 font-medium mb-2">{project.code}</div>
          <h1 className="text-3xl font-bold text-gray-800 mb-2">{project.name}</h1>
          <div className="text-gray-500">
            נוצר: {new Date(project.createdAt).toLocaleDateString('he-IL')}
          </div>
        </div>

        <h2 className="text-xl font-semibold text-gray-700 mb-6">בחר תיק:</h2>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-12">
          <Link
            href={`/projects/${project.id}/building`}
            className="bg-white rounded-xl shadow-lg p-8 hover:shadow-xl transition-all cursor-pointer border-2 border-transparent hover:border-blue-500 group"
          >
            <div className="text-center">
              <div className="w-20 h-20 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4 group-hover:bg-blue-200 transition-colors">
                <svg className="w-10 h-10 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                </svg>
              </div>
              <h3 className="text-2xl font-bold text-gray-800 mb-2">תיק מבנה</h3>
              <p className="text-gray-500">מפרטים, פרקים ובדיקות למבנה</p>
            </div>
          </Link>

          <Link
            href={`/projects/${project.id}/development`}
            className="bg-white rounded-xl shadow-lg p-8 hover:shadow-xl transition-all cursor-pointer border-2 border-transparent hover:border-green-500 group"
          >
            <div className="text-center">
              <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4 group-hover:bg-green-200 transition-colors">
                <svg className="w-10 h-10 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" />
                </svg>
              </div>
              <h3 className="text-2xl font-bold text-gray-800 mb-2">תיק פיתוח</h3>
              <p className="text-gray-500">מפרטים, פרקים ובדיקות לפיתוח</p>
            </div>
          </Link>
        </div>

        {/* Professionals Section */}
        <div className="bg-white rounded-xl shadow-lg p-6 mb-8">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-xl font-semibold text-gray-700">בעלי מקצוע</h2>
            <button
              onClick={() => {
                setShowAddProfessional(true);
                setShowAddConsultant(false);
                setNewProfessional({ role: '', name: '', company: '', phone: '', email: '' });
              }}
              className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors text-sm"
            >
              + הוסף בעל מקצוע
            </button>
          </div>

          {showAddProfessional && (
            <div className="bg-gray-50 rounded-lg p-4 mb-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">תפקיד *</label>
                  <select
                    value={newProfessional.role}
                    onChange={(e) => setNewProfessional({ ...newProfessional, role: e.target.value })}
                    className="w-full p-2 border border-gray-300 rounded-lg"
                  >
                    <option value="">בחר תפקיד...</option>
                    {PROFESSIONAL_ROLES.map(role => (
                      <option key={role} value={role}>{role}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">שם *</label>
                  <input
                    type="text"
                    value={newProfessional.name}
                    onChange={(e) => setNewProfessional({ ...newProfessional, name: e.target.value })}
                    className="w-full p-2 border border-gray-300 rounded-lg"
                    placeholder="שם מלא"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">חברה</label>
                  <input
                    type="text"
                    value={newProfessional.company}
                    onChange={(e) => setNewProfessional({ ...newProfessional, company: e.target.value })}
                    className="w-full p-2 border border-gray-300 rounded-lg"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">טלפון</label>
                  <input
                    type="tel"
                    value={newProfessional.phone}
                    onChange={(e) => setNewProfessional({ ...newProfessional, phone: e.target.value })}
                    className="w-full p-2 border border-gray-300 rounded-lg"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">אימייל</label>
                  <input
                    type="email"
                    value={newProfessional.email}
                    onChange={(e) => setNewProfessional({ ...newProfessional, email: e.target.value })}
                    className="w-full p-2 border border-gray-300 rounded-lg"
                  />
                </div>
              </div>
              <div className="flex gap-3">
                <button
                  onClick={() => handleAddProfessional('professional')}
                  className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 text-sm"
                >
                  הוסף
                </button>
                <button
                  onClick={() => setShowAddProfessional(false)}
                  className="bg-gray-300 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-400 text-sm"
                >
                  ביטול
                </button>
              </div>
            </div>
          )}

          {professionalsList.length === 0 ? (
            <p className="text-gray-500 text-center py-8">אין בעלי מקצוע</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="text-right py-3 px-4 font-semibold text-gray-600">תפקיד</th>
                    <th className="text-right py-3 px-4 font-semibold text-gray-600">שם</th>
                    <th className="text-right py-3 px-4 font-semibold text-gray-600">חברה</th>
                    <th className="text-right py-3 px-4 font-semibold text-gray-600">טלפון</th>
                    <th className="text-right py-3 px-4 font-semibold text-gray-600">אימייל</th>
                    <th className="w-24"></th>
                  </tr>
                </thead>
                <tbody>
                  {professionalsList.map(renderProfessionalRow)}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Consultants Section */}
        <div className="bg-white rounded-xl shadow-lg p-6">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-xl font-semibold text-gray-700">יועצים</h2>
            <button
              onClick={() => {
                setShowAddConsultant(true);
                setShowAddProfessional(false);
                setNewProfessional({ role: '', name: '', company: '', phone: '', email: '' });
              }}
              className="bg-purple-600 text-white px-4 py-2 rounded-lg hover:bg-purple-700 transition-colors text-sm"
            >
              + הוסף יועץ
            </button>
          </div>

          {showAddConsultant && (
            <div className="bg-gray-50 rounded-lg p-4 mb-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">תחום *</label>
                  <select
                    value={newProfessional.role}
                    onChange={(e) => setNewProfessional({ ...newProfessional, role: e.target.value })}
                    className="w-full p-2 border border-gray-300 rounded-lg"
                  >
                    <option value="">בחר תחום...</option>
                    {CONSULTANT_ROLES.map(role => (
                      <option key={role} value={role}>{role}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">שם *</label>
                  <input
                    type="text"
                    value={newProfessional.name}
                    onChange={(e) => setNewProfessional({ ...newProfessional, name: e.target.value })}
                    className="w-full p-2 border border-gray-300 rounded-lg"
                    placeholder="שם מלא"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">חברה</label>
                  <input
                    type="text"
                    value={newProfessional.company}
                    onChange={(e) => setNewProfessional({ ...newProfessional, company: e.target.value })}
                    className="w-full p-2 border border-gray-300 rounded-lg"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">טלפון</label>
                  <input
                    type="tel"
                    value={newProfessional.phone}
                    onChange={(e) => setNewProfessional({ ...newProfessional, phone: e.target.value })}
                    className="w-full p-2 border border-gray-300 rounded-lg"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">אימייל</label>
                  <input
                    type="email"
                    value={newProfessional.email}
                    onChange={(e) => setNewProfessional({ ...newProfessional, email: e.target.value })}
                    className="w-full p-2 border border-gray-300 rounded-lg"
                  />
                </div>
              </div>
              <div className="flex gap-3">
                <button
                  onClick={() => handleAddProfessional('consultant')}
                  className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 text-sm"
                >
                  הוסף
                </button>
                <button
                  onClick={() => setShowAddConsultant(false)}
                  className="bg-gray-300 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-400 text-sm"
                >
                  ביטול
                </button>
              </div>
            </div>
          )}

          {consultantsList.length === 0 ? (
            <p className="text-gray-500 text-center py-8">אין יועצים</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="text-right py-3 px-4 font-semibold text-gray-600">תחום</th>
                    <th className="text-right py-3 px-4 font-semibold text-gray-600">שם</th>
                    <th className="text-right py-3 px-4 font-semibold text-gray-600">חברה</th>
                    <th className="text-right py-3 px-4 font-semibold text-gray-600">טלפון</th>
                    <th className="text-right py-3 px-4 font-semibold text-gray-600">אימייל</th>
                    <th className="w-24"></th>
                  </tr>
                </thead>
                <tbody>
                  {consultantsList.map(renderProfessionalRow)}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
