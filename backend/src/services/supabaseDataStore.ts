import {
  academicClasses,
  academicYears,
  attendanceRecords,
  exams,
  feePayments,
  feeStructures,
  guardians,
  invoices,
  marks,
  receipts,
  schools,
  streams,
  students,
  subjects,
  users,
} from '../data/demoData.js';
import { supabase, isSupabaseEnabled } from '../config/supabase.js';

const tableName = (collectionName: string) => collectionName.replace(/[A-Z]/g, (letter) => `_${letter.toLowerCase()}`);
const toCamelCase = (value: string) => value.replace(/_([a-z])/g, (_match, letter: string) => letter.toUpperCase());
const toSnakeCase = (value: string) => value.replace(/[A-Z]/g, (letter) => `_${letter.toLowerCase()}`);
const toAppRow = <T>(row: Record<string, unknown>) => Object.fromEntries(
  Object.entries(row).map(([key, value]) => [toCamelCase(key), value]),
) as T;
const toDatabaseRow = (row: Record<string, unknown>) => Object.fromEntries(
  Object.entries(row).map(([key, value]) => [toSnakeCase(key), value]),
);

const seedCollection = async <T extends { id: string }>(collectionName: string, fallback: T[]): Promise<T[]> => {
  if (!isSupabaseEnabled || !supabase) {
    return fallback;
  }

  const table = tableName(collectionName);
  const { data, error } = await supabase.from(table).select('*');

  if (error) {
    console.warn(`Supabase fetch failed for ${collectionName}:`, error.message);
    return fallback;
  }

  if (data && data.length > 0) {
    return data.map((row) => toAppRow<T>(row as Record<string, unknown>));
  }

  const { error: insertError } = await supabase.from(table).upsert(fallback.map((item) => toDatabaseRow(item as Record<string, unknown>)), {
    onConflict: 'id',
  });

  if (insertError) {
    console.warn(`Supabase seed failed for ${collectionName}:`, insertError.message);
  }

  return fallback;
};

export const writeCollection = async <T extends { id: string }>(collectionName: string, items: T[]) => {
  if (!isSupabaseEnabled || !supabase) {
    return items;
  }

  const { error } = await supabase.from(tableName(collectionName)).upsert(items.map((item) => toDatabaseRow(item as Record<string, unknown>)), {
    onConflict: 'id',
  });

  if (error) {
    throw new Error(`Supabase write failed for ${collectionName}: ${error.message}`);
  }

  return items;
};

export const listCollection = async <T extends { id: string }>(collectionName: string, fallback: T[]) =>
  seedCollection<T>(collectionName, fallback);

export const getSchools = async () => seedCollection<typeof schools[number]>('schools', schools);
export const getUsers = async () => seedCollection<typeof users[number]>('users', users);
export const getStudents = async () => seedCollection<typeof students[number]>('students', students);
export const getGuardians = async () => seedCollection<typeof guardians[number]>('guardians', guardians);
export const getAcademicYears = async () => seedCollection<typeof academicYears[number]>('academicYears', academicYears);
export const getAcademicClasses = async () => seedCollection<typeof academicClasses[number]>('academicClasses', academicClasses);
export const getStreams = async () => seedCollection<typeof streams[number]>('streams', streams);
export const getSubjects = async () => seedCollection<typeof subjects[number]>('subjects', subjects);
export const getAttendanceRecords = async () =>
  seedCollection<typeof attendanceRecords[number]>('attendanceRecords', attendanceRecords);
export const getExams = async () => seedCollection<typeof exams[number]>('exams', exams);
export const getMarks = async () => seedCollection<typeof marks[number]>('marks', marks);
export const getFeeStructures = async () => seedCollection<typeof feeStructures[number]>('feeStructures', feeStructures);
export const getInvoices = async () => seedCollection<typeof invoices[number]>('invoices', invoices);
export const getFeePayments = async () => seedCollection<typeof feePayments[number]>('feePayments', feePayments);
export const getReceipts = async () => seedCollection<typeof receipts[number]>('receipts', receipts);

export const ensureSupabaseSeeded = async () => {
  if (!isSupabaseEnabled || !supabase) {
    return;
  }

  await Promise.all([
    getSchools(),
    getUsers(),
    getStudents(),
    getGuardians(),
    getAcademicYears(),
    getAcademicClasses(),
    getStreams(),
    getSubjects(),
    getAttendanceRecords(),
    getExams(),
    getMarks(),
    getFeeStructures(),
    getInvoices(),
    getFeePayments(),
    getReceipts(),
  ]);
};

export const ensureFirebaseSeeded = ensureSupabaseSeeded;
