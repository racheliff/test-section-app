'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';

interface ChecklistItem {
  id: string;
  workStage: string;
  description: string;
  responsible: string;
  name: string | null;
  signature: string | null;
  date: string | null;
  notes: string | null;
  status: string;
  sortOrder: number;
  imageUrl: string | null;
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
  projectChapter: {
    project: {
      name: string;
      code: string;
      logoUrl: string | null;
    };
    chapter: {
      code: string;
      name: string;
    };
  };
}

export default function PrintChecklistPage() {
  const params = useParams();
  const [checklist, setChecklist] = useState<Checklist | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchChecklist();
  }, []);

  const fetchChecklist = async () => {
    try {
      const res = await fetch(`/api/checklists/${params.checklistId}`);
      const data = await res.json();
      setChecklist(data);
    } catch (error) {
      console.error('Error fetching checklist:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!loading && checklist) {
      setTimeout(() => {
        window.print();
      }, 500);
    }
  }, [loading, checklist]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-xl">טוען...</div>
      </div>
    );
  }

  if (!checklist) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-xl text-red-500">רשימת תיוג לא נמצאה</div>
      </div>
    );
  }

  const groupedItems = checklist.items.reduce((acc, item) => {
    if (!acc[item.workStage]) {
      acc[item.workStage] = [];
    }
    acc[item.workStage].push(item);
    return acc;
  }, {} as Record<string, ChecklistItem[]>);

  const stageOrder = ['בקרה מקדימה', 'בקרה שוטפת', 'אישור לפני מסירה'];
  const stageNumbers: Record<string, number> = {
    'בקרה מקדימה': 1,
    'בקרה שוטפת': 2,
    'אישור לפני מסירה': 3,
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'ok': return 'תקין';
      case 'not_ok': return 'לא תקין';
      case 'na': return 'לא רלוונטי';
      case 'corrected': return 'תוקן';
      default: return 'טרם נבדק';
    }
  };

  const formatDate = (dateStr: string | null) => {
    if (!dateStr) return '';
    const date = new Date(dateStr);
    return date.toLocaleDateString('he-IL');
  };

  const totalItems = checklist.items.length;
  const completedItems = checklist.items.filter(i => i.status === 'ok' || i.status === 'corrected').length;
  const openIssues = checklist.items.filter(i => i.status === 'not_ok').length;
  const completionPercent = totalItems > 0 ? Math.round((completedItems / totalItems) * 100) : 0;

  return (
    <>
      <style jsx global>{`
        @media print {
          @page {
            size: A4;
            margin: 10mm;
          }
          body {
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
          }
          .no-print {
            display: none !important;
          }
        }
        body {
          direction: rtl;
          font-family: Arial, sans-serif;
        }
      `}</style>

      <div className="no-print fixed top-4 left-4 z-50">
        <button
          onClick={() => window.print()}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
        >
          הדפס PDF
        </button>
        <button
          onClick={() => window.history.back()}
          className="px-4 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600 mr-2"
        >
          חזור
        </button>
      </div>

      <div className="max-w-[210mm] mx-auto bg-white p-6 text-sm">
        {/* Header */}
        <div className="border-b-2 border-blue-600 pb-4 mb-4">
          {/* Logo */}
          {checklist.projectChapter.project.logoUrl && (
            <div className="flex justify-center mb-4">
              <img
                src={checklist.projectChapter.project.logoUrl}
                alt="לוגו"
                className="h-16 object-contain"
              />
            </div>
          )}

          {/* Title */}
          <h1 className="text-xl font-bold text-center text-blue-700 mb-4">
            רשימת תיוג - {checklist.projectChapter.chapter.name} פרק {checklist.projectChapter.chapter.code}
          </h1>

          {/* Form number */}
          <div className="flex justify-between text-xs mb-4">
            <span>מס׳ דוח: {checklist.projectChapter.chapter.code}</span>
          </div>

          {/* Info Grid */}
          <div className="grid grid-cols-4 gap-2 text-xs">
            <div className="flex gap-1">
              <span className="font-bold">מס׳ דוח:</span>
              <span>{checklist.projectChapter.chapter.code}</span>
            </div>
            <div className="flex gap-1">
              <span className="font-bold">פרויקט:</span>
              <span>{checklist.projectChapter.project.name}</span>
            </div>
            <div className="flex gap-1">
              <span className="font-bold">קבלן:</span>
              <span>{checklist.mainContractor || '-'}</span>
            </div>
            <div className="flex gap-1">
              <span className="font-bold">מבנה/אזור:</span>
              <span>{checklist.building || '-'}</span>
            </div>

            <div className="flex gap-1">
              <span className="font-bold">מיקום העבודה:</span>
              <span>{checklist.location || '-'}</span>
            </div>
            <div className="flex gap-1">
              <span className="font-bold">סוג העבודה:</span>
              <span>{checklist.elementType || '-'}</span>
            </div>
            <div className="flex gap-1">
              <span className="font-bold">תאריך פתיחת רת״ג:</span>
              <span>{formatDate(checklist.openDate)}</span>
            </div>
            <div className="flex gap-1">
              <span className="font-bold">תוכנית / פרט:</span>
              <span>{checklist.planNumber || '-'}</span>
            </div>
          </div>
        </div>

        {/* Checklist Sections */}
        {stageOrder.map((stageName) => {
          const items = groupedItems[stageName];
          if (!items || items.length === 0) return null;

          return (
            <div key={stageName} className="mb-6">
              <h2 className="text-base font-bold text-blue-700 mb-2 border-b border-gray-300 pb-1">
                פרק {stageNumbers[stageName]} - {stageName}
              </h2>

              <table className="w-full border-collapse text-xs">
                <thead>
                  <tr className="bg-gray-100">
                    <th className="border border-gray-300 p-1 w-8 text-center">#</th>
                    <th className="border border-gray-300 p-1 text-right">נקודת בדיקה</th>
                    <th className="border border-gray-300 p-1 w-16 text-center">סטטוס</th>
                    <th className="border border-gray-300 p-1 w-24 text-center">הערות</th>
                    <th className="border border-gray-300 p-1 w-16 text-center">תאריך</th>
                    <th className="border border-gray-300 p-1 w-16 text-center">מאשר</th>
                  </tr>
                </thead>
                <tbody>
                  {items.map((item, idx) => (
                    <tr key={item.id} className={idx % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                      <td className="border border-gray-300 p-1 text-center">
                        {stageNumbers[stageName]}.{idx + 1}
                      </td>
                      <td className="border border-gray-300 p-1">{item.description}</td>
                      <td className="border border-gray-300 p-1 text-center">
                        <span className={`px-1 py-0.5 rounded text-xs ${
                          item.status === 'ok' ? 'bg-green-100 text-green-800' :
                          item.status === 'not_ok' ? 'bg-red-100 text-red-800' :
                          item.status === 'corrected' ? 'bg-blue-100 text-blue-800' :
                          item.status === 'na' ? 'bg-gray-100 text-gray-600' :
                          'bg-yellow-100 text-yellow-800'
                        }`}>
                          {getStatusText(item.status)}
                        </span>
                      </td>
                      <td className="border border-gray-300 p-1 text-center text-xs">
                        {item.notes || '-'}
                      </td>
                      <td className="border border-gray-300 p-1 text-center">
                        {formatDate(item.date)}
                      </td>
                      <td className="border border-gray-300 p-1 text-center">
                        {item.signature ? (
                          <img src={item.signature} alt="חתימה" className="h-6 mx-auto" />
                        ) : item.name || '-'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          );
        })}

        {/* Images Section */}
        {checklist.items.some(item => item.imageUrl) && (
          <div className="mb-6 page-break-before">
            <h2 className="text-base font-bold text-blue-700 mb-2 border-b border-gray-300 pb-1">
              תמונות מצורפות
            </h2>
            <div className="grid grid-cols-2 gap-4">
              {checklist.items.filter(item => item.imageUrl).map((item) => (
                <div key={item.id} className="border border-gray-300 rounded p-2">
                  <p className="text-xs font-bold mb-1">{item.description}</p>
                  <img
                    src={item.imageUrl!}
                    alt={item.description}
                    className="w-full h-32 object-cover rounded"
                  />
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Summary */}
        <div className="border-t-2 border-blue-600 pt-4 mt-6">
          <h2 className="text-base font-bold text-blue-700 mb-2">תוצאת הבקרה:</h2>
          <div className="grid grid-cols-4 gap-4 text-xs">
            <div className="text-center p-2 bg-gray-100 rounded">
              <div className="font-bold">הערות מסכמות:</div>
              <div>-</div>
            </div>
            <div className="text-center p-2 bg-gray-100 rounded">
              <div className="font-bold">אחוז השלמה:</div>
              <div>{completionPercent}%</div>
            </div>
            <div className="text-center p-2 bg-gray-100 rounded">
              <div className="font-bold">ליקויים פתוחים:</div>
              <div>{openIssues}</div>
            </div>
            <div className="text-center p-2 bg-gray-100 rounded">
              <div className="font-bold">ליקויים שנסגרו:</div>
              <div>{checklist.items.filter(i => i.status === 'corrected').length}</div>
            </div>
          </div>

          {/* Signatures */}
          <div className="grid grid-cols-3 gap-8 mt-6 text-center text-xs">
            <div className="border-t border-gray-400 pt-2">
              <div className="font-bold">קבלן</div>
            </div>
            <div className="border-t border-gray-400 pt-2">
              <div className="font-bold">בקרת איכות</div>
            </div>
            <div className="border-t border-gray-400 pt-2">
              <div className="font-bold">פיקוח</div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
