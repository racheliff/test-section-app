'use client';

import { useEffect, useState, useRef } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';

interface ChecklistItem {
  id: string;
  workStage: string;
  description: string;
  responsible: string;
  name: string | null;
  signature: string | null;
  date: string | null;
  notes: string | null;
  isCompleted: boolean;
  sortOrder: number;
  status?: string;
  approver?: string;
}

interface Checklist {
  id: string;
  name: string;
  building: string | null;
  elementType: string | null;
  location: string | null;
  planNumber: string | null;
  mainContractor: string | null;
  openDate: string | null;
  closeDate: string | null;
  items: ChecklistItem[];
  projectChapter?: {
    project: { id: string; code: string; name: string };
    chapter: { id: string; code: string; name: string };
  };
}

interface Deficiency {
  id: string;
  description: string;
  location: string;
  action: string;
  responsible: string;
  dueDate: string;
  status: 'open' | 'in_progress' | 'closed';
  closeDate: string;
  approver: string;
  notes: string;
}

interface LabTest {
  id: string;
  testType: string;
  layer: string;
  location: string;
  date: string;
  reportNumber: string;
  result: string;
  notes: string;
}

interface SignatureData {
  name: string;
  role: string;
  dataURL: string;
}

const STATUS_OPTIONS = [
  { value: 'pending', label: 'טרם נבדק', color: 'bg-yellow-100 border-yellow-400 text-yellow-800' },
  { value: 'ok', label: 'תקין', color: 'bg-green-500 border-green-600 text-white' },
  { value: 'not_ok', label: 'לא תקין', color: 'bg-red-500 border-red-600 text-white' },
  { value: 'na', label: 'לא רלוונטי', color: 'bg-gray-400 border-gray-500 text-white' },
  { value: 'corrected', label: 'תוקן', color: 'bg-purple-500 border-purple-600 text-white' },
];

export default function ChecklistDetailPage() {
  const params = useParams();
  const router = useRouter();
  const [checklist, setChecklist] = useState<Checklist | null>(null);
  const [loading, setLoading] = useState(true);
  const [itemStatuses, setItemStatuses] = useState<Record<string, { status: string; date: string; approver: string; notes: string }>>({});
  const [deficiencies, setDeficiencies] = useState<Deficiency[]>([]);
  const [labTests, setLabTests] = useState<LabTest[]>([]);
  const [signatures, setSignatures] = useState<Record<string, SignatureData>>({
    contractor: { name: '', role: '', dataURL: '' },
    qc: { name: '', role: '', dataURL: '' },
    supervision: { name: '', role: '', dataURL: '' },
  });
  const [controlResult, setControlResult] = useState('');
  const [summaryNotes, setSummaryNotes] = useState('');
  const [activeSignature, setActiveSignature] = useState<string | null>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isDrawing, setIsDrawing] = useState(false);

  // Report details
  const [reportNumber, setReportNumber] = useState('');
  const [qcName, setQcName] = useState('');
  const [workManagerName, setWorkManagerName] = useState('');
  const [workLocation, setWorkLocation] = useState('');
  const [workType, setWorkType] = useState('');
  const [soilType, setSoilType] = useState('');
  const [fillMaterialType, setFillMaterialType] = useState('');
  const [performingLab, setPerformingLab] = useState('');

  useEffect(() => {
    fetchChecklist();
  }, [params.checklistId]);

  const fetchChecklist = async () => {
    try {
      const res = await fetch(`/api/checklists/${params.checklistId}`);
      if (res.ok) {
        const data = await res.json();
        setChecklist(data);

        // Initialize item statuses
        const statuses: Record<string, { status: string; date: string; approver: string; notes: string }> = {};
        data.items.forEach((item: ChecklistItem) => {
          statuses[item.id] = {
            status: item.isCompleted ? 'ok' : 'pending',
            date: item.date ? new Date(item.date).toISOString().split('T')[0] : '',
            approver: item.name || '',
            notes: item.notes || '',
          };
        });
        setItemStatuses(statuses);
      }
    } catch (error) {
      console.error('Error fetching checklist:', error);
    } finally {
      setLoading(false);
    }
  };

  const updateItemStatus = (itemId: string, field: string, value: string) => {
    setItemStatuses(prev => ({
      ...prev,
      [itemId]: {
        ...prev[itemId],
        [field]: value,
        ...(field === 'status' && (value === 'ok' || value === 'not_ok' || value === 'corrected') && !prev[itemId]?.date
          ? { date: new Date().toISOString().split('T')[0] }
          : {}),
      },
    }));
  };

  const groupItemsByStage = (items: ChecklistItem[]) => {
    const groups: Record<string, ChecklistItem[]> = {};
    items.forEach(item => {
      if (!groups[item.workStage]) {
        groups[item.workStage] = [];
      }
      groups[item.workStage].push(item);
    });
    return groups;
  };

  const getStats = () => {
    const statuses = Object.values(itemStatuses);
    return {
      total: statuses.length,
      ok: statuses.filter(s => s.status === 'ok').length,
      not_ok: statuses.filter(s => s.status === 'not_ok').length,
      pending: statuses.filter(s => s.status === 'pending').length,
      checked: statuses.filter(s => s.status !== 'pending').length,
    };
  };

  const addDeficiency = () => {
    setDeficiencies(prev => [...prev, {
      id: `def_${Date.now()}`,
      description: '',
      location: '',
      action: '',
      responsible: '',
      dueDate: '',
      status: 'open',
      closeDate: '',
      approver: '',
      notes: '',
    }]);
  };

  const updateDeficiency = (id: string, field: string, value: string) => {
    setDeficiencies(prev => prev.map(d => d.id === id ? { ...d, [field]: value } : d));
  };

  const removeDeficiency = (id: string) => {
    setDeficiencies(prev => prev.filter(d => d.id !== id));
  };

  const addLabTest = () => {
    setLabTests(prev => [...prev, {
      id: `lab_${Date.now()}`,
      testType: '',
      layer: '',
      location: '',
      date: '',
      reportNumber: '',
      result: '',
      notes: '',
    }]);
  };

  const updateLabTest = (id: string, field: string, value: string) => {
    setLabTests(prev => prev.map(t => t.id === id ? { ...t, [field]: value } : t));
  };

  const removeLabTest = (id: string) => {
    setLabTests(prev => prev.filter(t => t.id !== id));
  };

  // Signature canvas functions
  const openSignatureModal = (key: string) => {
    setActiveSignature(key);
  };

  const closeSignatureModal = () => {
    setActiveSignature(null);
    setIsDrawing(false);
  };

  const getCanvasContext = () => {
    const canvas = canvasRef.current;
    if (!canvas) return null;
    const ctx = canvas.getContext('2d');
    if (ctx) {
      ctx.strokeStyle = '#000';
      ctx.lineWidth = 2;
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';
    }
    return ctx;
  };

  const startDrawing = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    const ctx = getCanvasContext();
    if (!canvas || !ctx) return;

    setIsDrawing(true);
    const rect = canvas.getBoundingClientRect();
    let x: number, y: number;

    if ('touches' in e) {
      x = e.touches[0].clientX - rect.left;
      y = e.touches[0].clientY - rect.top;
    } else {
      x = e.clientX - rect.left;
      y = e.clientY - rect.top;
    }

    ctx.beginPath();
    ctx.moveTo(x, y);
  };

  const draw = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    if (!isDrawing) return;
    const canvas = canvasRef.current;
    const ctx = getCanvasContext();
    if (!canvas || !ctx) return;

    const rect = canvas.getBoundingClientRect();
    let x: number, y: number;

    if ('touches' in e) {
      e.preventDefault();
      x = e.touches[0].clientX - rect.left;
      y = e.touches[0].clientY - rect.top;
    } else {
      x = e.clientX - rect.left;
      y = e.clientY - rect.top;
    }

    ctx.lineTo(x, y);
    ctx.stroke();
  };

  const stopDrawing = () => {
    setIsDrawing(false);
  };

  const clearSignature = () => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext('2d');
    if (canvas && ctx) {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
    }
  };

  const saveSignature = () => {
    if (!activeSignature || !canvasRef.current) return;
    const dataURL = canvasRef.current.toDataURL('image/png');
    setSignatures(prev => ({
      ...prev,
      [activeSignature]: { ...prev[activeSignature], dataURL },
    }));
    closeSignatureModal();
  };

  const handleSave = async () => {
    // Save all item statuses
    for (const [itemId, data] of Object.entries(itemStatuses)) {
      try {
        await fetch(`/api/checklist-items/${itemId}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            name: data.approver,
            date: data.date || null,
            notes: data.notes,
            isCompleted: data.status === 'ok' || data.status === 'corrected',
          }),
        });
      } catch (error) {
        console.error('Error saving item:', error);
      }
    }
    alert('הדוח נשמר בהצלחה');
  };

  const handlePrint = () => {
    window.print();
  };

  if (loading) {
    return (
      <div dir="rtl" className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-xl text-gray-600">טוען...</div>
      </div>
    );
  }

  if (!checklist) {
    return (
      <div dir="rtl" className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-800 mb-4">רשימת תיוג לא נמצאה</h1>
          <Link href="/" className="text-blue-600 hover:underline">חזור לדף הבית</Link>
        </div>
      </div>
    );
  }

  const stats = getStats();
  const groupedItems = groupItemsByStage(checklist.items);
  const stageNames = Object.keys(groupedItems);

  return (
    <div dir="rtl" className="min-h-screen bg-gray-100 pb-24">
      {/* Header */}
      <header className="bg-gradient-to-l from-blue-900 to-blue-800 text-white p-4 sticky top-0 z-50 shadow-lg">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-lg font-bold">רשימת תיוג – {checklist.projectChapter?.chapter.name || ''} פרק {checklist.projectChapter?.chapter.code}</h1>
          <div className="text-sm opacity-85 mt-1">
            {checklist.projectChapter?.project.name} | דוח מס׳ {reportNumber || '-'}
          </div>

          {/* Summary Bar */}
          <div className="grid grid-cols-4 gap-2 mt-3">
            <div className="bg-white/10 rounded-lg p-2 text-center">
              <div className="text-lg font-bold">{stats.checked}/{stats.total}</div>
              <div className="text-xs opacity-85">נבדקו</div>
            </div>
            <div className="bg-white/10 rounded-lg p-2 text-center">
              <div className="text-lg font-bold text-green-300">{stats.ok}</div>
              <div className="text-xs opacity-85">תקין</div>
            </div>
            <div className="bg-white/10 rounded-lg p-2 text-center">
              <div className="text-lg font-bold text-red-300">{stats.not_ok}</div>
              <div className="text-xs opacity-85">לא תקין</div>
            </div>
            <div className="bg-white/10 rounded-lg p-2 text-center">
              <div className="text-lg font-bold text-yellow-300">{stats.pending}</div>
              <div className="text-xs opacity-85">טרם נבדק</div>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto p-4 space-y-4">
        {/* Back Link */}
        <Link
          href={`/projects/${params.id}/building/${params.chapterId}`}
          className="text-blue-600 hover:underline inline-block mb-2"
        >
          ← חזור לפרק
        </Link>

        {/* Report Details Card */}
        <div className="bg-white rounded-xl shadow-lg p-5 border border-gray-200">
          <h2 className="text-blue-700 font-semibold text-lg mb-4 pb-2 border-b-2 border-blue-100">פרטי הדוח</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-500 mb-1">מספר דוח</label>
              <input
                type="text"
                value={reportNumber}
                onChange={(e) => setReportNumber(e.target.value)}
                placeholder="נוצר אוטומטית"
                className="w-full p-2 border border-gray-300 rounded-lg text-sm"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-500 mb-1">מבנה/קומה</label>
              <input
                type="text"
                value={checklist.building || ''}
                disabled
                className="w-full p-2 border border-gray-200 rounded-lg text-sm bg-gray-50"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-500 mb-1">קבלן</label>
              <input
                type="text"
                value={checklist.mainContractor || ''}
                disabled
                className="w-full p-2 border border-gray-200 rounded-lg text-sm bg-gray-50"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-500 mb-1">תאריך פתיחה</label>
              <input
                type="date"
                value={checklist.openDate ? new Date(checklist.openDate).toISOString().split('T')[0] : ''}
                disabled
                className="w-full p-2 border border-gray-200 rounded-lg text-sm bg-gray-50"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-500 mb-1">מיקום העבודה</label>
              <input
                type="text"
                value={workLocation}
                onChange={(e) => setWorkLocation(e.target.value)}
                className="w-full p-2 border border-gray-300 rounded-lg text-sm"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-500 mb-1">סוג העבודה</label>
              <select
                value={workType}
                onChange={(e) => setWorkType(e.target.value)}
                className="w-full p-2 border border-gray-300 rounded-lg text-sm"
              >
                <option value="">בחר סוג עבודה</option>
                <option value="חפירה">חפירה</option>
                <option value="מילוי">מילוי</option>
                <option value="הידוק">הידוק</option>
                <option value="פיתוח">פיתוח</option>
                <option value="אחר">אחר</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-500 mb-1">בקר איכות</label>
              <input
                type="text"
                value={qcName}
                onChange={(e) => setQcName(e.target.value)}
                className="w-full p-2 border border-gray-300 rounded-lg text-sm"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-500 mb-1">מנהל עבודה</label>
              <input
                type="text"
                value={workManagerName}
                onChange={(e) => setWorkManagerName(e.target.value)}
                className="w-full p-2 border border-gray-300 rounded-lg text-sm"
              />
            </div>
          </div>
        </div>

        {/* Checklist Stages */}
        {stageNames.map((stageName, stageIndex) => (
          <div key={stageName} className="bg-white rounded-xl shadow-lg p-5 border border-gray-200">
            <h2 className="text-blue-700 font-semibold text-lg mb-4 pb-2 border-b-2 border-blue-100 flex items-center gap-2">
              <span className="bg-blue-900 text-white w-7 h-7 rounded-full flex items-center justify-center text-sm">
                {stageIndex + 1}
              </span>
              {stageName}
            </h2>

            <div className="space-y-4">
              {groupedItems[stageName].map((item, itemIndex) => {
                const itemData = itemStatuses[item.id] || { status: 'pending', date: '', approver: '', notes: '' };
                const isNotOk = itemData.status === 'not_ok';

                return (
                  <div
                    key={item.id}
                    className={`border rounded-xl p-4 ${isNotOk ? 'border-red-400 bg-red-50' : 'border-gray-200 bg-gray-50'}`}
                  >
                    {/* Item Header */}
                    <div className="flex gap-3 items-start mb-3">
                      <div className="bg-blue-900 text-white min-w-[40px] h-7 rounded-full flex items-center justify-center text-sm font-bold">
                        {stageIndex + 1}.{itemIndex + 1}
                      </div>
                      <div className="text-sm leading-relaxed pt-1">{item.description}</div>
                    </div>

                    {/* Status Buttons */}
                    <div className="grid grid-cols-3 md:grid-cols-5 gap-2 mb-3">
                      {STATUS_OPTIONS.map(opt => (
                        <button
                          key={opt.value}
                          onClick={() => updateItemStatus(item.id, 'status', opt.value)}
                          className={`border-2 rounded-lg py-2 px-1 text-xs font-bold transition-all ${
                            itemData.status === opt.value
                              ? opt.color
                              : 'bg-white border-gray-300 text-gray-700 hover:bg-gray-100'
                          }`}
                        >
                          {opt.label}
                        </button>
                      ))}
                    </div>

                    {/* Meta Row */}
                    <div className="grid grid-cols-2 gap-3 mb-3">
                      <div>
                        <label className="block text-xs font-medium text-gray-500 mb-1">תאריך</label>
                        <input
                          type="date"
                          value={itemData.date}
                          onChange={(e) => updateItemStatus(item.id, 'date', e.target.value)}
                          className="w-full p-2 border border-gray-300 rounded-lg text-sm"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-gray-500 mb-1">שם מאשר</label>
                        <input
                          type="text"
                          value={itemData.approver}
                          onChange={(e) => updateItemStatus(item.id, 'approver', e.target.value)}
                          className="w-full p-2 border border-gray-300 rounded-lg text-sm"
                        />
                      </div>
                    </div>

                    {/* Notes */}
                    <div>
                      <label className="block text-xs font-medium text-gray-500 mb-1">
                        הערות {isNotOk && <span className="text-red-600 font-bold">(חובה עבור סטטוס "לא תקין")</span>}
                      </label>
                      <textarea
                        value={itemData.notes}
                        onChange={(e) => updateItemStatus(item.id, 'notes', e.target.value)}
                        placeholder="הערות (לא רלוונטי)"
                        className="w-full p-2 border border-gray-300 rounded-lg text-sm resize-y min-h-[40px]"
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        ))}

        {/* Deficiencies Section */}
        <div className="bg-white rounded-xl shadow-lg p-5 border border-gray-200">
          <h2 className="text-blue-700 font-semibold text-lg mb-4 pb-2 border-b-2 border-blue-100">
            ליקויים / פעולות מתקנות
          </h2>

          {deficiencies.length === 0 ? (
            <p className="text-gray-500 text-sm py-2">לא נרשמו ליקויים או פעולות מתקנות.</p>
          ) : (
            <div className="space-y-4">
              {deficiencies.map((def, idx) => (
                <div key={def.id} className="border border-gray-200 rounded-xl p-4 bg-gray-50 relative">
                  <button
                    onClick={() => removeDeficiency(def.id)}
                    className="absolute left-2 top-2 bg-red-100 text-red-600 border-none rounded-lg px-2 py-1 text-xs font-bold hover:bg-red-200"
                  >
                    ✕ מחק
                  </button>
                  <div className="inline-block bg-blue-900 text-white rounded-lg px-3 py-1 text-xs font-bold mb-3">
                    ליקוי מס׳ {idx + 1}
                  </div>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                    <div className="col-span-2 md:col-span-4">
                      <label className="block text-xs font-medium text-gray-500 mb-1">תיאור הליקוי</label>
                      <textarea
                        value={def.description}
                        onChange={(e) => updateDeficiency(def.id, 'description', e.target.value)}
                        className="w-full p-2 border border-gray-300 rounded-lg text-sm"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-gray-500 mb-1">מיקום</label>
                      <input
                        type="text"
                        value={def.location}
                        onChange={(e) => updateDeficiency(def.id, 'location', e.target.value)}
                        className="w-full p-2 border border-gray-300 rounded-lg text-sm"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-gray-500 mb-1">אחראי</label>
                      <input
                        type="text"
                        value={def.responsible}
                        onChange={(e) => updateDeficiency(def.id, 'responsible', e.target.value)}
                        className="w-full p-2 border border-gray-300 rounded-lg text-sm"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-gray-500 mb-1">תאריך יעד</label>
                      <input
                        type="date"
                        value={def.dueDate}
                        onChange={(e) => updateDeficiency(def.id, 'dueDate', e.target.value)}
                        className="w-full p-2 border border-gray-300 rounded-lg text-sm"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-gray-500 mb-1">סטטוס</label>
                      <select
                        value={def.status}
                        onChange={(e) => updateDeficiency(def.id, 'status', e.target.value)}
                        className="w-full p-2 border border-gray-300 rounded-lg text-sm"
                      >
                        <option value="open">פתוח</option>
                        <option value="in_progress">בטיפול</option>
                        <option value="closed">סגור</option>
                      </select>
                    </div>
                    <div className="col-span-2 md:col-span-4">
                      <label className="block text-xs font-medium text-gray-500 mb-1">פעולה מתקנת</label>
                      <textarea
                        value={def.action}
                        onChange={(e) => updateDeficiency(def.id, 'action', e.target.value)}
                        className="w-full p-2 border border-gray-300 rounded-lg text-sm"
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          <button
            onClick={addDeficiency}
            className="mt-3 bg-blue-600 text-white border-none rounded-lg px-4 py-2 font-bold text-sm hover:bg-blue-700"
          >
            + הוסף ליקוי
          </button>
        </div>

        {/* Lab Tests Section */}
        <div className="bg-white rounded-xl shadow-lg p-5 border border-gray-200">
          <h2 className="text-blue-700 font-semibold text-lg mb-4 pb-2 border-b-2 border-blue-100">
            בדיקות מעבדה
          </h2>

          {labTests.length === 0 ? (
            <p className="text-gray-500 text-sm py-2">לא נרשמו בדיקות מעבדה.</p>
          ) : (
            <div className="space-y-4">
              {labTests.map((test, idx) => (
                <div key={test.id} className="border border-gray-200 rounded-xl p-4 bg-gray-50 relative">
                  <button
                    onClick={() => removeLabTest(test.id)}
                    className="absolute left-2 top-2 bg-red-100 text-red-600 border-none rounded-lg px-2 py-1 text-xs font-bold hover:bg-red-200"
                  >
                    ✕ מחק
                  </button>
                  <div className="inline-block bg-blue-900 text-white rounded-lg px-3 py-1 text-xs font-bold mb-3">
                    בדיקה מס׳ {idx + 1}
                  </div>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                    <div>
                      <label className="block text-xs font-medium text-gray-500 mb-1">סוג בדיקה</label>
                      <input
                        type="text"
                        value={test.testType}
                        onChange={(e) => updateLabTest(test.id, 'testType', e.target.value)}
                        className="w-full p-2 border border-gray-300 rounded-lg text-sm"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-gray-500 mb-1">שכבה</label>
                      <input
                        type="text"
                        value={test.layer}
                        onChange={(e) => updateLabTest(test.id, 'layer', e.target.value)}
                        className="w-full p-2 border border-gray-300 rounded-lg text-sm"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-gray-500 mb-1">מיקום</label>
                      <input
                        type="text"
                        value={test.location}
                        onChange={(e) => updateLabTest(test.id, 'location', e.target.value)}
                        className="w-full p-2 border border-gray-300 rounded-lg text-sm"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-gray-500 mb-1">תאריך</label>
                      <input
                        type="date"
                        value={test.date}
                        onChange={(e) => updateLabTest(test.id, 'date', e.target.value)}
                        className="w-full p-2 border border-gray-300 rounded-lg text-sm"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-gray-500 mb-1">מספר דוח</label>
                      <input
                        type="text"
                        value={test.reportNumber}
                        onChange={(e) => updateLabTest(test.id, 'reportNumber', e.target.value)}
                        className="w-full p-2 border border-gray-300 rounded-lg text-sm"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-gray-500 mb-1">תוצאה</label>
                      <input
                        type="text"
                        value={test.result}
                        onChange={(e) => updateLabTest(test.id, 'result', e.target.value)}
                        className="w-full p-2 border border-gray-300 rounded-lg text-sm"
                      />
                    </div>
                    <div className="col-span-2">
                      <label className="block text-xs font-medium text-gray-500 mb-1">הערות</label>
                      <input
                        type="text"
                        value={test.notes}
                        onChange={(e) => updateLabTest(test.id, 'notes', e.target.value)}
                        className="w-full p-2 border border-gray-300 rounded-lg text-sm"
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          <button
            onClick={addLabTest}
            className="mt-3 bg-blue-600 text-white border-none rounded-lg px-4 py-2 font-bold text-sm hover:bg-blue-700"
          >
            + הוסף בדיקה
          </button>
        </div>

        {/* Control Result */}
        <div className="bg-white rounded-xl shadow-lg p-5 border border-gray-200">
          <h2 className="text-blue-700 font-semibold text-lg mb-4 pb-2 border-b-2 border-blue-100">
            תוצאת הבקרה
          </h2>

          <div className="grid grid-cols-3 gap-3 mb-4">
            {[
              { value: 'approved', label: 'מאושר', color: 'bg-green-500 border-green-600' },
              { value: 'conditional', label: 'מאושר בתנאים', color: 'bg-yellow-500 border-yellow-600' },
              { value: 'not_approved', label: 'לא מאושר', color: 'bg-red-500 border-red-600' },
            ].map(opt => (
              <button
                key={opt.value}
                onClick={() => setControlResult(opt.value)}
                className={`border-2 rounded-lg py-3 px-2 text-sm font-bold transition-all ${
                  controlResult === opt.value
                    ? `${opt.color} text-white`
                    : 'bg-white border-gray-300 text-gray-700 hover:bg-gray-100'
                }`}
              >
                {opt.label}
              </button>
            ))}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-500 mb-1">הערות מסכמות</label>
            <textarea
              value={summaryNotes}
              onChange={(e) => setSummaryNotes(e.target.value)}
              className="w-full p-3 border border-gray-300 rounded-lg text-sm resize-y min-h-[80px]"
            />
          </div>
        </div>

        {/* Signatures */}
        <div className="bg-white rounded-xl shadow-lg p-5 border border-gray-200">
          <h2 className="text-blue-700 font-semibold text-lg mb-4 pb-2 border-b-2 border-blue-100">
            חתימות ואישורים
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {[
              { key: 'contractor', label: '1. קבלן' },
              { key: 'qc', label: '2. בקרת איכות' },
              { key: 'supervision', label: '3. פיקוח' },
            ].map(sig => (
              <div key={sig.key} className="border border-gray-200 rounded-xl p-4">
                <h3 className="font-bold text-sm mb-3">{sig.label}</h3>
                <div className="grid grid-cols-2 gap-2 mb-3">
                  <div>
                    <label className="block text-xs font-medium text-gray-500 mb-1">שם</label>
                    <input
                      type="text"
                      value={signatures[sig.key].name}
                      onChange={(e) => setSignatures(prev => ({
                        ...prev,
                        [sig.key]: { ...prev[sig.key], name: e.target.value },
                      }))}
                      className="w-full p-2 border border-gray-300 rounded-lg text-sm"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-500 mb-1">תפקיד</label>
                    <input
                      type="text"
                      value={signatures[sig.key].role}
                      onChange={(e) => setSignatures(prev => ({
                        ...prev,
                        [sig.key]: { ...prev[sig.key], role: e.target.value },
                      }))}
                      className="w-full p-2 border border-gray-300 rounded-lg text-sm"
                    />
                  </div>
                </div>

                {signatures[sig.key].dataURL ? (
                  <div className="border border-dashed border-gray-300 rounded-lg p-2 bg-white">
                    <img
                      src={signatures[sig.key].dataURL}
                      alt="חתימה"
                      className="h-16 mx-auto object-contain"
                    />
                    <button
                      onClick={() => openSignatureModal(sig.key)}
                      className="w-full mt-2 text-blue-600 text-xs hover:underline"
                    >
                      שנה חתימה
                    </button>
                  </div>
                ) : (
                  <button
                    onClick={() => openSignatureModal(sig.key)}
                    className="w-full py-3 border-2 border-dashed border-gray-300 rounded-lg text-gray-500 text-sm hover:bg-gray-50"
                  >
                    לחץ לחתימה
                  </button>
                )}
              </div>
            ))}
          </div>
        </div>
      </main>

      {/* Action Bar */}
      <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 p-3 flex gap-2 overflow-x-auto z-50 shadow-lg print:hidden">
        <button
          onClick={handleSave}
          className="flex-1 bg-blue-600 text-white border-none rounded-lg py-3 px-4 font-bold text-sm whitespace-nowrap hover:bg-blue-700"
        >
          💾 שמור דוח
        </button>
        <button
          onClick={handlePrint}
          className="flex-1 bg-green-600 text-white border-none rounded-lg py-3 px-4 font-bold text-sm whitespace-nowrap hover:bg-green-700"
        >
          🖨 הדפס / PDF
        </button>
        <button
          onClick={() => router.push(`/projects/${params.id}/building/${params.chapterId}`)}
          className="flex-1 bg-gray-500 text-white border-none rounded-lg py-3 px-4 font-bold text-sm whitespace-nowrap hover:bg-gray-600"
        >
          חזור
        </button>
      </div>

      {/* Signature Modal */}
      {activeSignature && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-2xl p-6 w-full max-w-md">
            <h3 className="text-lg font-bold text-gray-800 mb-4">חתימה</h3>
            <div className="border-2 border-gray-300 rounded-lg mb-4 touch-none">
              <canvas
                ref={canvasRef}
                width={350}
                height={200}
                className="w-full bg-white rounded-lg cursor-crosshair"
                onMouseDown={startDrawing}
                onMouseMove={draw}
                onMouseUp={stopDrawing}
                onMouseLeave={stopDrawing}
                onTouchStart={startDrawing}
                onTouchMove={draw}
                onTouchEnd={stopDrawing}
              />
            </div>
            <div className="flex gap-3 justify-end">
              <button
                onClick={clearSignature}
                className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors"
              >
                נקה
              </button>
              <button
                onClick={closeSignatureModal}
                className="px-4 py-2 bg-gray-300 text-gray-700 rounded-lg hover:bg-gray-400 transition-colors"
              >
                ביטול
              </button>
              <button
                onClick={saveSignature}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                שמור
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
