import React, { useEffect, useState } from 'react';
import { apiClient } from '../lib/api';
import AttendanceTable from '../components/AttendanceTable';
import MarksTable from '../components/MarksTable';

interface ClassInfo { id: string; name: string }
interface SubjectInfo { id: string; title: string }

export default function TeacherDashboard() {
  const [classes, setClasses] = useState<ClassInfo[]>([]);
  const [subjects, setSubjects] = useState<SubjectInfo[]>([]);
  const [selectedClass, setSelectedClass] = useState<string>('');

  useEffect(() => {
    apiClient.get('/teacher/me').then(res => {
      setClasses(res.data.classes || []);
      setSubjects(res.data.subjects || []);
    });
  }, []);

  return (
    <div className="p-4">
      <h1>Teacher Dashboard</h1>
      <div className="mt-4">
        <label>Class:</label>
        <select
          value={selectedClass}
          onChange={e => setSelectedClass(e.target.value)}
          className="ml-2"
        >
          <option value="">-- Select --</option>
          {classes.map(c => (
            <option key={c.id} value={c.id}>{c.name}</option>
          ))}
        </select>
      </div>

      {selectedClass && (
        <div className="mt-6">
          <AttendanceTable classId={selectedClass} />
          <div className="mt-4">
            <MarksTable classId={selectedClass} subjects={subjects} />
          </div>
        </div>
      )}
    </div>
  );
}

