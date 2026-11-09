import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { tuitionService } from '../services/api/tuitionService';
import type { CreateFacultyDto } from '@padhai-pilot/shared';

const MIN = 60 * 1000;

export const useFaculties = () =>
  useQuery({ queryKey: ['tuition', 'faculties'], queryFn: tuitionService.getFaculties, staleTime: 5 * MIN });

export const useFacultyMutations = () => {
  const qc = useQueryClient();
  return {
    create: useMutation({
      mutationFn: (dto: CreateFacultyDto) => tuitionService.createFaculty(dto),
      onSuccess: () => qc.invalidateQueries({ queryKey: ['tuition', 'faculties'] }),
    }),
  };
};
