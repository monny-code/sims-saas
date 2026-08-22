import { type FormEvent, useEffect, useState } from 'react';
import { apiFetch } from '../lib/api';

type AcademicItem = {
  id: string;
  name?: string;
  studentName?: string;
  code?: string;
  status?: string;
  className?: string;
  date?: string;
  marks?: number;
  grade?: string;
};
type Student = { id: string; firstName: string; lastName: string };
type Exam = { id: string; name: string; academicYearId?: string; term?: string; className?: string; examDate?: string; status?: string };
type AcademicClass = { id: string; name: string; level: string; academicYearId: string };

const AcademicOverview = () => {
  const [subjects, setSubjects] = useState<AcademicItem[]>([]);
  const [attendance, setAttendance] = useState<AcademicItem[]>([]);
  const [marks, setMarks] = useState<AcademicItem[]>([]);
  const [error, setError] = useState('');
  const [students, setStudents] = useState<Student[]>([]);
  const [exams, setExams] = useState<Exam[]>([]);
  const [classes, setClasses] = useState<AcademicClass[]>([]);
  const [streamName, setStreamName] = useState('');
  const [classForm, setClassForm] = useState({ name: '', level: 'Secondary', academicYearId: '' });
  const [examForm, setExamForm] = useState({ name: '', academicYearId: '', term: 'Term 1', className: '', examDate: '' });
  const [attendanceForm, setAttendanceForm] = useState({ studentId: '', date: '', status: 'PRESENT', reason: '' });
  const [markForm, setMarkForm] = useState({ studentId: '', examId: '', subject: '', marks: '', remarks: '' });
  const [saving, setSaving] = useState(false);
  const [subjectForm, setSubjectForm] = useState({ name: '', code: '', category: 'Core' });

  useEffect(() => {
    const load = async () => {
      try {
        const [subjectsRes, attendanceRes, marksRes, studentRes, examRes, classRes] = await Promise.all([
          apiFetch<{ subjects: AcademicItem[] }>('/academics/subjects'),
          apiFetch<{ attendance: AcademicItem[] }>('/academics/attendance'),
          apiFetch<{ marks: AcademicItem[] }>('/academics/marks'),
          apiFetch<{ students: Student[] }>('/students'),
          apiFetch<{ exams: Exam[] }>('/academics/exams'),
          apiFetch<{ classes: AcademicClass[] }>('/academics/classes'),
        ]);
        setSubjects(subjectsRes.subjects);
        setAttendance(attendanceRes.attendance);
        setMarks(marksRes.marks);
        setStudents(studentRes.students);
        setExams(examRes.exams);
        setClasses(classRes.classes);
        setClassForm((current) => ({ ...current, academicYearId: classRes.classes[0]?.academicYearId ?? '' }));
        setExamForm((current) => ({ ...current, academicYearId: classRes.classes[0]?.academicYearId ?? '' }));
      } catch (loadError) {
        setError(loadError instanceof Error ? loadError.message : 'Unable to load academic data.');
      }
    };

    load();
  }, []);

  const createClass = async (event: FormEvent) => {
    event.preventDefault(); setSaving(true); setError('');
    try { const result = await apiFetch<{ class: AcademicClass }>('/academics/classes', { method: 'POST', body: JSON.stringify(classForm) }); setClasses((current) => [...current, result.class]); setClassForm({ ...classForm, name: '' }); }
    catch (err) { setError(err instanceof Error ? err.message : 'Unable to create class.'); } finally { setSaving(false); }
  };

  const createStream = async (event: FormEvent) => {
    event.preventDefault(); setSaving(true); setError('');
    try { await apiFetch('/academics/streams', { method: 'POST', body: JSON.stringify({ name: streamName }) }); setStreamName(''); }
    catch (err) { setError(err instanceof Error ? err.message : 'Unable to create stream.'); } finally { setSaving(false); }
  };

  const createExam = async (event: FormEvent) => {
    event.preventDefault(); setSaving(true); setError('');
    try { const result = await apiFetch<{ exam: Exam }>('/academics/exams', { method: 'POST', body: JSON.stringify(examForm) }); setExams((current) => [...current, result.exam]); setExamForm({ ...examForm, name: '', examDate: '' }); }
    catch (err) { setError(err instanceof Error ? err.message : 'Unable to create exam.'); } finally { setSaving(false); }
  };

  const recordAttendance = async (event: FormEvent) => {
    event.preventDefault();
    setSaving(true);
    setError('');
    try {
      const result = await apiFetch<{ attendance: AcademicItem }>('/academics/attendance', { method: 'POST', body: JSON.stringify(attendanceForm) });
      setAttendance((current) => [...current.filter((item) => item.id !== result.attendance.id), result.attendance]);
      setAttendanceForm({ studentId: '', date: '', status: 'PRESENT', reason: '' });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to save attendance.');
    } finally {
      setSaving(false);
    }
  };

  const recordMark = async (event: FormEvent) => {
    event.preventDefault();
    setSaving(true);
    setError('');
    try {
      const result = await apiFetch<{ mark: AcademicItem }>('/academics/marks', { method: 'POST', body: JSON.stringify({ ...markForm, marks: Number(markForm.marks) }) });
      setMarks((current) => [...current.filter((item) => item.id !== result.mark.id), result.mark]);
      setMarkForm({ studentId: '', examId: '', subject: '', marks: '', remarks: '' });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to save marks.');
    } finally {
      setSaving(false);
    }
  };

  const createSubject = async (event: FormEvent) => {
    event.preventDefault();
    setSaving(true);
    setError('');
    try {
      const result = await apiFetch<{ subject: AcademicItem }>('/academics/subjects', { method: 'POST', body: JSON.stringify(subjectForm) });
      setSubjects((current) => [...current, result.subject]);
      setSubjectForm({ name: '', code: '', category: 'Core' });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to create subject.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 p-6">
      <div className="mx-auto max-w-7xl space-y-6">
        <div>
          <p className="text-sm font-semibold uppercase tracking-[0.2em] text-brand-700">Academic management</p>
          <h1 className="mt-2 text-3xl font-bold text-slate-900">Overview</h1>
        </div>
        {error ? <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">{error}</div> : null}

        <div className="grid gap-6 lg:grid-cols-2">
          <form onSubmit={createClass} className="rounded-2xl border border-slate-200 bg-white p-5 shadow-soft"><h2 className="text-lg font-semibold">Add class</h2><div className="mt-4 grid gap-3 sm:grid-cols-3"><input required minLength={2} placeholder="Class name" value={classForm.name} onChange={(event) => setClassForm({ ...classForm, name: event.target.value })} className="rounded-xl border border-slate-200 px-3 py-2" /><input required placeholder="Level" value={classForm.level} onChange={(event) => setClassForm({ ...classForm, level: event.target.value })} className="rounded-xl border border-slate-200 px-3 py-2" /><input required placeholder="Academic year ID" value={classForm.academicYearId} onChange={(event) => setClassForm({ ...classForm, academicYearId: event.target.value })} className="rounded-xl border border-slate-200 px-3 py-2" /></div><button disabled={saving} className="mt-4 rounded-xl bg-brand-600 px-4 py-2 font-semibold text-white">Create class</button><div className="mt-3 text-sm text-slate-500">{classes.length} classes configured</div></form>
          <form onSubmit={createStream} className="rounded-2xl border border-slate-200 bg-white p-5 shadow-soft"><h2 className="text-lg font-semibold">Add stream</h2><div className="mt-4 flex gap-3"><input required placeholder="Stream name" value={streamName} onChange={(event) => setStreamName(event.target.value)} className="flex-1 rounded-xl border border-slate-200 px-3 py-2" /><button disabled={saving} className="rounded-xl bg-brand-600 px-4 py-2 font-semibold text-white">Create stream</button></div></form>
        </div>

        <form onSubmit={createExam} className="rounded-2xl border border-slate-200 bg-white p-5 shadow-soft"><h2 className="text-lg font-semibold">Create exam</h2><div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-5"><input required minLength={2} placeholder="Exam name" value={examForm.name} onChange={(event) => setExamForm({ ...examForm, name: event.target.value })} className="rounded-xl border border-slate-200 px-3 py-2" /><input required placeholder="Academic year ID" value={examForm.academicYearId} onChange={(event) => setExamForm({ ...examForm, academicYearId: event.target.value })} className="rounded-xl border border-slate-200 px-3 py-2" /><input required placeholder="Term" value={examForm.term} onChange={(event) => setExamForm({ ...examForm, term: event.target.value })} className="rounded-xl border border-slate-200 px-3 py-2" /><input required placeholder="Class name" value={examForm.className} onChange={(event) => setExamForm({ ...examForm, className: event.target.value })} className="rounded-xl border border-slate-200 px-3 py-2" /><input required type="date" value={examForm.examDate} onChange={(event) => setExamForm({ ...examForm, examDate: event.target.value })} className="rounded-xl border border-slate-200 px-3 py-2" /></div><button disabled={saving} className="mt-4 rounded-xl bg-brand-600 px-4 py-2 font-semibold text-white">Create exam</button></form>

        <div className="grid gap-6 lg:grid-cols-2">
          <form onSubmit={createSubject} className="rounded-2xl border border-slate-200 bg-white p-5 shadow-soft">
            <h2 className="text-lg font-semibold">Add subject</h2>
            <div className="mt-4 grid gap-3 sm:grid-cols-3">
              <input required minLength={2} placeholder="Subject name" value={subjectForm.name} onChange={(event) => setSubjectForm({ ...subjectForm, name: event.target.value })} className="rounded-xl border border-slate-200 px-3 py-2" />
              <input required minLength={2} placeholder="Code" value={subjectForm.code} onChange={(event) => setSubjectForm({ ...subjectForm, code: event.target.value })} className="rounded-xl border border-slate-200 px-3 py-2" />
              <input required minLength={2} placeholder="Category" value={subjectForm.category} onChange={(event) => setSubjectForm({ ...subjectForm, category: event.target.value })} className="rounded-xl border border-slate-200 px-3 py-2" />
            </div>
            <button disabled={saving} className="mt-4 rounded-xl bg-brand-600 px-4 py-2 font-semibold text-white disabled:opacity-60">{saving ? 'Saving...' : 'Create subject'}</button>
          </form>
        </div>

        <div className="grid gap-6 lg:grid-cols-2">
          <form onSubmit={recordAttendance} className="rounded-2xl border border-slate-200 bg-white p-5 shadow-soft">
            <h2 className="text-lg font-semibold">Record attendance</h2>
            <div className="mt-4 grid gap-3 sm:grid-cols-2">
              <select required value={attendanceForm.studentId} onChange={(event) => setAttendanceForm({ ...attendanceForm, studentId: event.target.value })} className="rounded-xl border border-slate-200 px-3 py-2"><option value="">Select student</option>{students.map((student) => <option key={student.id} value={student.id}>{student.firstName} {student.lastName}</option>)}</select>
              <input required type="date" value={attendanceForm.date} onChange={(event) => setAttendanceForm({ ...attendanceForm, date: event.target.value })} className="rounded-xl border border-slate-200 px-3 py-2" />
              <select value={attendanceForm.status} onChange={(event) => setAttendanceForm({ ...attendanceForm, status: event.target.value })} className="rounded-xl border border-slate-200 px-3 py-2"><option>PRESENT</option><option>ABSENT</option><option>LATE</option><option>EXCUSED</option></select>
              <input placeholder="Reason (optional)" value={attendanceForm.reason} onChange={(event) => setAttendanceForm({ ...attendanceForm, reason: event.target.value })} className="rounded-xl border border-slate-200 px-3 py-2" />
            </div>
            <button disabled={saving} className="mt-4 rounded-xl bg-brand-600 px-4 py-2 font-semibold text-white disabled:opacity-60">Save attendance</button>
          </form>
          <form onSubmit={recordMark} className="rounded-2xl border border-slate-200 bg-white p-5 shadow-soft">
            <h2 className="text-lg font-semibold">Enter marks</h2>
            <div className="mt-4 grid gap-3 sm:grid-cols-2">
              <select required value={markForm.studentId} onChange={(event) => setMarkForm({ ...markForm, studentId: event.target.value })} className="rounded-xl border border-slate-200 px-3 py-2"><option value="">Select student</option>{students.map((student) => <option key={student.id} value={student.id}>{student.firstName} {student.lastName}</option>)}</select>
              <select required value={markForm.examId} onChange={(event) => setMarkForm({ ...markForm, examId: event.target.value })} className="rounded-xl border border-slate-200 px-3 py-2"><option value="">Select exam</option>{exams.map((exam) => <option key={exam.id} value={exam.id}>{exam.name}</option>)}</select>
              <select required value={markForm.subject} onChange={(event) => setMarkForm({ ...markForm, subject: event.target.value })} className="rounded-xl border border-slate-200 px-3 py-2"><option value="">Select subject</option>{subjects.map((subject) => <option key={subject.id} value={subject.name}>{subject.name}</option>)}</select>
              <input required min="0" max="100" type="number" placeholder="Marks (0-100)" value={markForm.marks} onChange={(event) => setMarkForm({ ...markForm, marks: event.target.value })} className="rounded-xl border border-slate-200 px-3 py-2" />
              <input placeholder="Remarks (optional)" value={markForm.remarks} onChange={(event) => setMarkForm({ ...markForm, remarks: event.target.value })} className="rounded-xl border border-slate-200 px-3 py-2 sm:col-span-2" />
            </div>
            <button disabled={saving} className="mt-4 rounded-xl bg-brand-600 px-4 py-2 font-semibold text-white disabled:opacity-60">Save marks</button>
          </form>
        </div>

        <div className="grid gap-6 md:grid-cols-3">
          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-soft">
            <div className="text-sm text-slate-500">Subjects</div>
            <div className="mt-3 text-3xl font-bold text-slate-900">{subjects.length}</div>
          </div>
          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-soft">
            <div className="text-sm text-slate-500">Attendance records</div>
            <div className="mt-3 text-3xl font-bold text-slate-900">{attendance.length}</div>
          </div>
          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-soft">
            <div className="text-sm text-slate-500">Marks entries</div>
            <div className="mt-3 text-3xl font-bold text-slate-900">{marks.length}</div>
          </div>
        </div>

        <div className="grid gap-6 lg:grid-cols-2">
          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-soft">
            <h2 className="mb-4 text-lg font-semibold text-slate-900">Subjects</h2>
            <ul className="space-y-3 text-sm text-slate-700">
              {subjects.length === 0 ? <li className="text-slate-500">No subjects have been configured.</li> : null}
              {subjects.map((subject) => (
                <li key={subject.id} className="flex items-center justify-between rounded-xl bg-slate-50 px-3 py-2">
                  <span>{subject.name}</span>
                  <span className="rounded-full bg-brand-100 px-2 py-1 text-xs font-medium text-brand-700">{subject.code}</span>
                </li>
              ))}
            </ul>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-soft">
            <h2 className="mb-4 text-lg font-semibold text-slate-900">Latest attendance</h2>
            <ul className="space-y-3 text-sm text-slate-700">
              {attendance.length === 0 ? <li className="text-slate-500">No attendance records yet.</li> : null}
              {attendance.map((record) => (
                <li key={record.id} className="flex items-center justify-between rounded-xl bg-slate-50 px-3 py-2">
                  <span>{record.studentName ?? record.name ?? 'Student'}</span>
                  <span className="rounded-full bg-emerald-100 px-2 py-1 text-xs font-medium text-emerald-700">{record.status}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AcademicOverview;
