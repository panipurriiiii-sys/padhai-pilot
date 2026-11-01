import { apiClient } from './client';
import type { FacultyMember, CreateFacultyDto } from '@padhai-pilot/shared';

const list = <T>(v: unknown): T[] => (Array.isArray(v) ? (v as T[]) : []);

export const tuitionService = {
  getFaculties: async () => list<FacultyMember>(await apiClient.get<FacultyMember[]>('/tuition/faculties')),
  createFaculty: (dto: CreateFacultyDto) => apiClient.post<FacultyMember>('/tuition/faculties', dto),
};
