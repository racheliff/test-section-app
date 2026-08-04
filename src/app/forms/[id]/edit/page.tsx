"use client";

import { useState, useEffect, useRef } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { TestSectionWithRelations } from "@/lib/types";

const PARTICIPANT_ROLES = ["יועץ", "פיקוח", "קבלן", "בקרת איכות", "קבלן משנה"];

interface SelectedFile {
  name: string;
  size: number;
  type: string;
  status: "uploading" | "uploaded" | "error" | "existing";
  filepath?: string;
}

interface FormData {
  date: string;
  sectionName: string;
  participants: { role: string; name: string; company: string; phone: string }[];
  crewMembers: { name: string; role: string }[];
  locationDescription: string;
  structure: string;
  crossSections: string;
  descriptionNotes: string;
  executionSteps: string;
  equipment: { name: string; quantity: number; notes: string }[];
  tests: { testType: string; requirement: string; result: string; certificateNumber: string; status: string }[];
  attachments: { filename: string; filepath: string; filesize: number; mimetype: string }[];
  qualityControlApproval: boolean;
  supervisionApproval: boolean;
  status: "passed" | "failed" | "pending";
  summaryNotes: string;
}

export default function EditFormPage() {
  const params = useParams();
  const router = useRouter();
  const id = params.id as string;
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [formNumber, setFormNumber] = useState("");
  const [projectChapter, setProjectChapter] = useState<TestSectionWithRelations["projectChapter"] | null>(null);
  const [selectedFiles, setSelectedFiles] = useState<SelectedFile[]>([]);

  const [formData, setFormData] = useState<FormData>({
    date: "",
    sectionName: "",
    participants: PARTICIPANT_ROLES.map((role) => ({ role, name: "", company: "", phone: "" })),
    crewMembers: [{ name: "", role: "" }],
    locationDescription: "",
    structure: "",
    crossSections: "",
    descriptionNotes: "",
    executionSteps: "",
    equipment: [{ name: "", quantity: 1, notes: "" }],
    tests: [{ testType: "", requirement: "", result: "", certificateNumber: "", status: "" }],
    attachments: [],
    qualityControlApproval: false,
    supervisionApproval: false,
    status: "passed",
    summaryNotes: "",
  });

  useEffect(() => {
    if (id) fetchForm();
  }, [id]);

  const fetchForm = async () => {
    try {
      const response = await fetch(`/api/test-sections/${id}`);
      if (!response.ok) throw new Error("Failed to fetch");
      const data: TestSectionWithRelations = await response.json();

      setFormNumber(data.formNumber);
      setProjectChapter(data.projectChapter || null);

      setSelectedFiles(
        data.attachments.map((a) => ({
          name: a.filename,
          size: a.filesize,
          type: a.mimetype,
          status: "existing" as const,
          filepath: a.filepath,
        }))
      );

      const mappedParticipants = PARTICIPANT_ROLES.map((role) => {
        const existing = data.participants.find((p) => p.role === role);
        return {
          role,
          name: existing?.name || "",
          company: existing?.company || "",
          phone: existing?.phone || "",
        };
      });

      setFormData({
        date: new Date(data.date).toISOString().split("T")[0],
        sectionName: data.sectionName,
        participants: mappedParticipants,
        crewMembers: data.crewMembers.length > 0
          ? data.crewMembers.map((c) => ({ name: c.name, role: c.role || "" }))
          : [{ name: "", role: "" }],
        locationDescription: data.locationDescription || "",
        structure: data.structure || "",
        crossSections: data.crossSections || "",
        descriptionNotes: data.descriptionNotes || "",
        executionSteps: data.executionSteps || "",
        equipment: data.equipment.length > 0
          ? data.equipment.map((e) => ({ name: e.name, quantity: e.quantity, notes: e.notes || "" }))
          : [{ name: "", quantity: 1, notes: "" }],
        tests: data.tests.length > 0
          ? data.tests.map((t) => ({
              testType: t.testType,
              requirement: t.requirement || "",
              result: t.result || "",
              certificateNumber: t.certificateNumber || "",
              status: t.status || "",
            }))
          : [{ testType: "", requirement: "", result: "", certificateNumber: "", status: "" }],
        attachments: data.attachments.map((a) => ({
          filename: a.filename,
          filepath: a.filepath,
          filesize: a.filesize,
          mimetype: a.mimetype,
        })),
        qualityControlApproval: data.qualityControlApproval,
        supervisionApproval: data.supervisionApproval,
        status: data.status as "passed" | "failed" | "pending",
        summaryNotes: data.summaryNotes || "",
      });
    } catch (error) {
      console.error("Error fetching form:", error);
      alert("שגיאה בטעינת הטופס");
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const response = await fetch(`/api/test-sections/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      if (!response.ok) throw new Error("Failed to save");

      router.push(`/forms/${id}`);
    } catch (error) {
      console.error("Error saving form:", error);
      alert("שגיאה בשמירת הטופס");
    } finally {
      setSaving(false);
    }
  };

  const updateFormData = <K extends keyof FormData>(field: K, value: FormData[K]) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const updateParticipant = (index: number, field: "name" | "company" | "phone", value: string) => {
    setFormData((prev) => ({
      ...prev,
      participants: prev.participants.map((p, i) => (i === index ? { ...p, [field]: value } : p)),
    }));
  };

  const addCrewMember = () => setFormData((prev) => ({ ...prev, crewMembers: [...prev.crewMembers, { name: "", role: "" }] }));
  const removeCrewMember = (index: number) => setFormData((prev) => ({ ...prev, crewMembers: prev.crewMembers.filter((_, i) => i !== index) }));
  const updateCrewMember = (index: number, field: "name" | "role", value: string) => {
    setFormData((prev) => ({ ...prev, crewMembers: prev.crewMembers.map((c, i) => (i === index ? { ...c, [field]: value } : c)) }));
  };

  const addEquipment = () => setFormData((prev) => ({ ...prev, equipment: [...prev.equipment, { name: "", quantity: 1, notes: "" }] }));
  const removeEquipment = (index: number) => setFormData((prev) => ({ ...prev, equipment: prev.equipment.filter((_, i) => i !== index) }));
  const updateEquipment = (index: number, field: "name" | "quantity" | "notes", value: string | number) => {
    setFormData((prev) => ({ ...prev, equipment: prev.equipment.map((e, i) => (i === index ? { ...e, [field]: value } : e)) }));
  };

  const addTest = () => setFormData((prev) => ({ ...prev, tests: [...prev.tests, { testType: "", requirement: "", result: "", certificateNumber: "", status: "" }] }));
  const removeTest = (index: number) => setFormData((prev) => ({ ...prev, tests: prev.tests.filter((_, i) => i !== index) }));
  const updateTest = (index: number, field: "testType" | "requirement" | "result" | "certificateNumber" | "status", value: string) => {
    setFormData((prev) => ({ ...prev, tests: prev.tests.map((t, i) => (i === index ? { ...t, [field]: value } : t)) }));
  };

  if (loading) {
    return (
      <div dir="rtl" className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-lg text-gray-600">טוען...</div>
      </div>
    );
  }

  return (
    <div dir="rtl" className="min-h-screen bg-gray-50 pb-24">
      {/* Header */}
      <header className="sticky top-0 bg-white shadow z-50 px-4 py-4">
        <div className="max-w-4xl mx-auto flex justify-between items-center">
          <div>
            <Link href={`/forms/${id}`} className="text-sm text-blue-600 hover:underline">
              ← ביטול וחזרה
            </Link>
            <h1 className="text-xl font-bold text-gray-800">עריכת טופס {formNumber}</h1>
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 py-6 space-y-6">
        {/* Basic Info */}
        <section className="bg-white rounded-xl shadow-lg p-6">
          <h2 className="font-semibold text-lg mb-4 text-blue-600">פרטי הטופס</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {projectChapter && (
              <>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">פרויקט</label>
                  <div className="px-3 py-2.5 bg-gray-100 rounded-lg text-gray-700">
                    {projectChapter.project.name}
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">פרק</label>
                  <div className="px-3 py-2.5 bg-gray-100 rounded-lg text-gray-700">
                    {projectChapter.chapter.code} - {projectChapter.chapter.name}
                  </div>
                </div>
              </>
            )}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">תאריך</label>
              <input
                type="date"
                value={formData.date}
                onChange={(e) => updateFormData("date", e.target.value)}
                className="w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div className="sm:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">שם קטע הניסוי</label>
              <input
                type="text"
                value={formData.sectionName}
                onChange={(e) => updateFormData("sectionName", e.target.value)}
                className="w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>
        </section>

        {/* Participants */}
        <section className="bg-white rounded-xl shadow-lg p-6">
          <h2 className="font-semibold text-lg mb-4 text-blue-600">משתתפים</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {formData.participants.map((participant, index) => (
              <div key={participant.role} className="bg-gray-50 rounded-lg p-4">
                <div className="text-sm font-semibold text-blue-600 mb-3">{participant.role}</div>
                <div className="space-y-2">
                  <input
                    type="text"
                    placeholder="שם"
                    value={participant.name}
                    onChange={(e) => updateParticipant(index, "name", e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                  <input
                    type="text"
                    placeholder="חברה"
                    value={participant.company}
                    onChange={(e) => updateParticipant(index, "company", e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                  <input
                    type="tel"
                    placeholder="טלפון"
                    value={participant.phone}
                    onChange={(e) => updateParticipant(index, "phone", e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Crew Members */}
        <section className="bg-white rounded-xl shadow-lg p-6">
          <h2 className="font-semibold text-lg mb-4 text-blue-600">צוות ביצוע</h2>
          <div className="space-y-3">
            {formData.crewMembers.map((crew, index) => (
              <div key={index} className="flex gap-3 items-center">
                <input
                  type="text"
                  placeholder="שם עובד"
                  value={crew.name}
                  onChange={(e) => updateCrewMember(index, "name", e.target.value)}
                  className="flex-1 px-3 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <input
                  type="text"
                  placeholder="תפקיד"
                  value={crew.role}
                  onChange={(e) => updateCrewMember(index, "role", e.target.value)}
                  className="flex-1 px-3 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <button
                  onClick={() => removeCrewMember(index)}
                  className="w-10 h-10 flex items-center justify-center bg-red-100 text-red-600 rounded-lg hover:bg-red-200 transition-colors"
                >
                  ×
                </button>
              </div>
            ))}
          </div>
          <button
            onClick={addCrewMember}
            className="w-full mt-4 py-3 border-2 border-dashed border-gray-300 rounded-lg text-blue-600 font-medium hover:bg-blue-50 transition-colors"
          >
            + הוסף עובד
          </button>
        </section>

        {/* Description */}
        <section className="bg-white rounded-xl shadow-lg p-6">
          <h2 className="font-semibold text-lg mb-4 text-blue-600">תיאור</h2>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">תיאור ומיקום</label>
              <textarea
                rows={4}
                value={formData.locationDescription}
                onChange={(e) => updateFormData("locationDescription", e.target.value)}
                className="w-full px-3 py-2.5 border border-gray-300 rounded-lg resize-y focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">מבנה</label>
              <textarea
                rows={3}
                value={formData.structure}
                onChange={(e) => updateFormData("structure", e.target.value)}
                className="w-full px-3 py-2.5 border border-gray-300 rounded-lg resize-y focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">חתכים</label>
              <textarea
                rows={3}
                value={formData.crossSections}
                onChange={(e) => updateFormData("crossSections", e.target.value)}
                className="w-full px-3 py-2.5 border border-gray-300 rounded-lg resize-y focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">הערות</label>
              <textarea
                rows={2}
                value={formData.descriptionNotes}
                onChange={(e) => updateFormData("descriptionNotes", e.target.value)}
                className="w-full px-3 py-2.5 border border-gray-300 rounded-lg resize-y focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>
        </section>

        {/* Execution Steps */}
        <section className="bg-white rounded-xl shadow-lg p-6">
          <h2 className="font-semibold text-lg mb-4 text-blue-600">שלבי ביצוע</h2>
          <textarea
            rows={10}
            value={formData.executionSteps}
            onChange={(e) => updateFormData("executionSteps", e.target.value)}
            className="w-full px-3 py-2.5 border border-gray-300 rounded-lg resize-y focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </section>

        {/* Equipment */}
        <section className="bg-white rounded-xl shadow-lg p-6">
          <h2 className="font-semibold text-lg mb-4 text-blue-600">ציוד</h2>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b-2 border-gray-200">
                  <th className="text-right py-3 px-2 font-medium text-gray-600">ציוד</th>
                  <th className="text-right py-3 px-2 font-medium text-gray-600 w-24">כמות</th>
                  <th className="text-right py-3 px-2 font-medium text-gray-600">הערות</th>
                  <th className="w-12"></th>
                </tr>
              </thead>
              <tbody>
                {formData.equipment.map((item, index) => (
                  <tr key={index} className="border-b border-gray-100">
                    <td className="py-3 px-2">
                      <input
                        type="text"
                        placeholder="שם הציוד"
                        value={item.name}
                        onChange={(e) => updateEquipment(index, "name", e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </td>
                    <td className="py-3 px-2">
                      <input
                        type="number"
                        min="1"
                        value={item.quantity}
                        onChange={(e) => updateEquipment(index, "quantity", parseInt(e.target.value) || 1)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </td>
                    <td className="py-3 px-2">
                      <input
                        type="text"
                        placeholder="הערות"
                        value={item.notes}
                        onChange={(e) => updateEquipment(index, "notes", e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </td>
                    <td className="py-3 px-2">
                      <button
                        onClick={() => removeEquipment(index)}
                        className="w-8 h-8 flex items-center justify-center bg-red-100 text-red-600 rounded-lg hover:bg-red-200 transition-colors"
                      >
                        ×
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <button
            onClick={addEquipment}
            className="w-full mt-4 py-3 border-2 border-dashed border-gray-300 rounded-lg text-blue-600 font-medium hover:bg-blue-50 transition-colors"
          >
            + הוסף ציוד
          </button>
        </section>

        {/* Tests */}
        <section className="bg-white rounded-xl shadow-lg p-6">
          <h2 className="font-semibold text-lg mb-4 text-blue-600">בדיקות</h2>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b-2 border-gray-200">
                  <th className="text-right py-3 px-2 font-medium text-gray-600">סוג</th>
                  <th className="text-right py-3 px-2 font-medium text-gray-600">דרישה</th>
                  <th className="text-right py-3 px-2 font-medium text-gray-600">תוצאה</th>
                  <th className="text-right py-3 px-2 font-medium text-gray-600">תעודה</th>
                  <th className="text-right py-3 px-2 font-medium text-gray-600">סטטוס</th>
                  <th className="w-12"></th>
                </tr>
              </thead>
              <tbody>
                {formData.tests.map((test, index) => (
                  <tr key={index} className="border-b border-gray-100">
                    <td className="py-3 px-2">
                      <select
                        value={test.testType}
                        onChange={(e) => updateTest(index, "testType", e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                      >
                        <option value="">בחר...</option>
                        <option value="density">צפיפות</option>
                        <option value="cbr">CBR</option>
                        <option value="proctor">פרוקטור</option>
                        <option value="gradation">גרנולומטריה</option>
                        <option value="other">אחר</option>
                      </select>
                    </td>
                    <td className="py-3 px-2">
                      <input
                        type="text"
                        placeholder="≥98%"
                        value={test.requirement}
                        onChange={(e) => updateTest(index, "requirement", e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </td>
                    <td className="py-3 px-2">
                      <input
                        type="text"
                        placeholder="99.2%"
                        value={test.result}
                        onChange={(e) => updateTest(index, "result", e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </td>
                    <td className="py-3 px-2">
                      <input
                        type="text"
                        placeholder="T-12345"
                        value={test.certificateNumber}
                        onChange={(e) => updateTest(index, "certificateNumber", e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </td>
                    <td className="py-3 px-2">
                      <select
                        value={test.status}
                        onChange={(e) => updateTest(index, "status", e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                      >
                        <option value="">בחר...</option>
                        <option value="passed">עבר</option>
                        <option value="failed">נכשל</option>
                        <option value="pending">ממתין</option>
                      </select>
                    </td>
                    <td className="py-3 px-2">
                      <button
                        onClick={() => removeTest(index)}
                        className="w-8 h-8 flex items-center justify-center bg-red-100 text-red-600 rounded-lg hover:bg-red-200 transition-colors"
                      >
                        ×
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <button
            onClick={addTest}
            className="w-full mt-4 py-3 border-2 border-dashed border-gray-300 rounded-lg text-blue-600 font-medium hover:bg-blue-50 transition-colors"
          >
            + הוסף בדיקה
          </button>
        </section>

        {/* Attachments */}
        <section className="bg-white rounded-xl shadow-lg p-6">
          <h2 className="font-semibold text-lg mb-4 text-blue-600">מסמכים מצורפים</h2>
          <input
            type="file"
            ref={fileInputRef}
            multiple
            accept=".pdf,.doc,.docx,.xls,.xlsx,.jpg,.jpeg,.png,.gif"
            onChange={async (e) => {
              const files = e.target.files;
              if (!files) return;

              for (const file of Array.from(files)) {
                const tempFile: SelectedFile = {
                  name: file.name,
                  size: file.size,
                  type: file.type,
                  status: "uploading",
                };
                setSelectedFiles((prev) => [...prev, tempFile]);

                try {
                  const uploadData = new FormData();
                  uploadData.append("file", file);

                  const response = await fetch("/api/upload", {
                    method: "POST",
                    body: uploadData,
                  });

                  if (!response.ok) throw new Error("Upload failed");

                  const result = await response.json();

                  setSelectedFiles((prev) =>
                    prev.map((f) =>
                      f.name === file.name && f.status === "uploading"
                        ? { ...f, status: "uploaded", filepath: result.filepath }
                        : f
                    )
                  );

                  setFormData((prev) => ({
                    ...prev,
                    attachments: [
                      ...prev.attachments,
                      {
                        filename: result.filename,
                        filepath: result.filepath,
                        filesize: result.filesize,
                        mimetype: result.mimetype,
                      },
                    ],
                  }));
                } catch (error) {
                  console.error("Upload error:", error);
                  setSelectedFiles((prev) =>
                    prev.map((f) =>
                      f.name === file.name && f.status === "uploading" ? { ...f, status: "error" } : f
                    )
                  );
                }
              }
              e.target.value = "";
            }}
            className="hidden"
          />
          <div
            onClick={() => fileInputRef.current?.click()}
            className="border-2 border-dashed border-gray-300 rounded-xl p-8 text-center cursor-pointer hover:border-blue-500 hover:bg-blue-50 transition-colors"
          >
            <svg className="w-12 h-12 mx-auto mb-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
            </svg>
            <p className="text-gray-600 font-medium">לחץ לבחירת קבצים או גרור לכאן</p>
          </div>

          {selectedFiles.length > 0 && (
            <div className="mt-6 space-y-3">
              <h4 className="font-medium text-gray-700">קבצים ({selectedFiles.length}):</h4>
              {selectedFiles.map((file, index) => (
                <div
                  key={index}
                  className={`flex items-center justify-between rounded-lg p-4 ${
                    file.status === "error" ? "bg-red-50" : "bg-gray-50"
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <span className="text-2xl">
                      {file.status === "uploading" ? "⏳" : file.status === "error" ? "❌" : file.type.includes("pdf") ? "📄" : file.type.includes("image") ? "🖼️" : "📎"}
                    </span>
                    <div>
                      <div className="font-medium text-gray-800">{file.name}</div>
                      <div className="text-sm text-gray-500">
                        {(file.size / 1024).toFixed(1)} KB
                        {file.status === "uploading" && " • מעלה..."}
                        {file.status === "uploaded" && " • הועלה"}
                        {file.status === "existing" && " • קיים"}
                        {file.status === "error" && " • שגיאה"}
                      </div>
                    </div>
                  </div>
                  <button
                    onClick={() => {
                      setSelectedFiles((prev) => prev.filter((_, i) => i !== index));
                      if (file.filepath) {
                        setFormData((prev) => ({
                          ...prev,
                          attachments: prev.attachments.filter((a) => a.filepath !== file.filepath),
                        }));
                      }
                    }}
                    className="w-8 h-8 flex items-center justify-center bg-red-100 text-red-600 rounded-lg hover:bg-red-200 transition-colors"
                  >
                    ×
                  </button>
                </div>
              ))}
            </div>
          )}
        </section>

        {/* Approvals */}
        <section className="bg-white rounded-xl shadow-lg p-6">
          <h2 className="font-semibold text-lg mb-4 text-blue-600">אישורים</h2>
          <div className="space-y-4">
            <label className="flex items-center gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={formData.qualityControlApproval}
                onChange={(e) => updateFormData("qualityControlApproval", e.target.checked)}
                className="w-5 h-5 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
              />
              <span className="text-gray-700">אישור בקרת איכות</span>
            </label>
            <label className="flex items-center gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={formData.supervisionApproval}
                onChange={(e) => updateFormData("supervisionApproval", e.target.checked)}
                className="w-5 h-5 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
              />
              <span className="text-gray-700">אישור פיקוח</span>
            </label>
          </div>
        </section>

        {/* Summary */}
        <section className="bg-white rounded-xl shadow-lg p-6">
          <h2 className="font-semibold text-lg mb-4 text-blue-600">סיכום</h2>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">סטטוס</label>
              <div className="flex gap-4 flex-wrap">
                {[
                  { value: "passed", label: "✓ עבר", bgColor: "bg-green-100", borderColor: "border-green-500", textColor: "text-green-700" },
                  { value: "failed", label: "✗ נכשל", bgColor: "bg-red-100", borderColor: "border-red-500", textColor: "text-red-700" },
                  { value: "pending", label: "⏳ ממתין", bgColor: "bg-yellow-100", borderColor: "border-yellow-500", textColor: "text-yellow-700" },
                ].map((option) => (
                  <label
                    key={option.value}
                    className={`flex items-center gap-2 px-4 py-2 border-2 rounded-xl cursor-pointer transition-all ${
                      formData.status === option.value
                        ? `${option.bgColor} ${option.borderColor} ${option.textColor}`
                        : "border-gray-200 hover:border-gray-400"
                    }`}
                  >
                    <input
                      type="radio"
                      name="status"
                      value={option.value}
                      checked={formData.status === option.value}
                      onChange={(e) => updateFormData("status", e.target.value as "passed" | "failed" | "pending")}
                      className="hidden"
                    />
                    {option.label}
                  </label>
                ))}
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">הערות מסכמות</label>
              <textarea
                rows={4}
                value={formData.summaryNotes}
                onChange={(e) => updateFormData("summaryNotes", e.target.value)}
                className="w-full px-3 py-2.5 border border-gray-300 rounded-lg resize-y focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="fixed bottom-0 left-0 right-0 bg-white shadow-lg border-t border-gray-200 px-4 py-4 z-50">
        <div className="max-w-4xl mx-auto flex justify-between items-center">
          <Link
            href={`/forms/${id}`}
            className="px-6 py-3 rounded-lg bg-gray-100 text-gray-700 font-medium hover:bg-gray-200 transition-colors"
          >
            ביטול
          </Link>
          <button
            onClick={handleSave}
            disabled={saving}
            className="px-6 py-3 rounded-lg bg-green-600 text-white font-medium hover:bg-green-700 transition-colors disabled:opacity-50"
          >
            {saving ? "שומר..." : "שמור שינויים ✓"}
          </button>
        </div>
      </footer>
    </div>
  );
}
