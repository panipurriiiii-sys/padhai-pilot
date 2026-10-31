import { apiClient, ApiError } from '../src/services/api/client';
import { studentService } from '../src/services/api/studentService';
import { teacherService } from '../src/services/api/teacherService';
import { authService } from '../src/services/api/authService';
import { isStaffRole } from '../src/lib/format';

type FetchMock = jest.Mock<Promise<Partial<Response>>, [string, RequestInit?]>;

const okJson = (body: unknown, status = 200): Partial<Response> => ({
  ok: status < 400,
  status,
  json: async () => body,
});

let fetchMock: FetchMock;
const lastCall = () => {
  const [url, init] = fetchMock.mock.calls[fetchMock.mock.calls.length - 1];
  return { url: url.replace('https://padhai-pilot.vercel.app/api', ''), method: init?.method ?? 'GET', init };
};

beforeEach(() => {
  fetchMock = jest.fn();
  (globalThis as unknown as { fetch: FetchMock }).fetch = fetchMock;
  apiClient.setAuthToken(null);
  apiClient.setUnauthorizedHandler(null);
});

describe('student service calls the real server routes', () => {
  const cases: Array<[string, () => Promise<unknown>, string, string]> = [
    ['dashboard', () => studentService.getDashboard(), 'GET', '/student/dashboard'],
    ['profile', () => studentService.getProfile(), 'GET', '/student/profile'],
    ['diary', () => studentService.getDiary(), 'GET', '/student/diary'],
    ['timetable', () => studentService.getTimetable(), 'GET', '/student/timetable'],
    ['attendance', () => studentService.getAttendance(), 'GET', '/student/attendance'],
    ['correction', () => studentService.requestAttendanceCorrection({ date: '2026-10-01', reason: 'x' }), 'POST', '/student/attendance/correction-request'],
    ['assignments', () => studentService.getAssignments(), 'GET', '/student/assignments'],
    ['submit assignment', () => studentService.submitAssignment('a1', { content: 'x' }), 'POST', '/student/assignments/a1/submit'],
    ['tests', () => studentService.getTests(), 'GET', '/student/tests'],
    ['test details', () => studentService.getTestDetails('t1'), 'GET', '/student/tests/t1'],
    ['submit test', () => studentService.submitTest('t1', []), 'POST', '/student/tests/t1/attempt'],
    ['results', () => studentService.getResults(), 'GET', '/student/results'],
    ['materials', () => studentService.getMaterials(), 'GET', '/student/materials'],
    ['fees', () => studentService.getFees(), 'GET', '/student/fees'],
    ['queries', () => studentService.getQueries(), 'GET', '/student/queries'],
    ['ask', () => studentService.askQuery({ subject: 's', questionText: 'q' }), 'POST', '/student/queries'],
    ['tasks', () => studentService.getStudyTasks(), 'GET', '/student/study-tasks'],
    ['join batch', () => studentService.joinBatch('CODE'), 'POST', '/student/join-batch'],
    ['notifications', () => studentService.getNotifications(), 'GET', '/assessment/student/notifications'],
  ];

  it.each(cases)('%s', async (_name, call, method, path) => {
    fetchMock.mockResolvedValue(okJson([]));
    await call();
    expect(lastCall()).toMatchObject({ method, url: path });
  });
});

describe('teacher service calls the real server routes', () => {
  const cases: Array<[string, () => Promise<unknown>, string, string]> = [
    ['dashboard', () => teacherService.getDashboard(), 'GET', '/teacher/dashboard'],
    ['batches', () => teacherService.getBatches(), 'GET', '/teacher/batches'],
    ['roster', () => teacherService.getRoster('b1'), 'GET', '/teacher/batches/b1/students'],
    ['get attendance', () => teacherService.getAttendance('b1', '2026-10-31'), 'GET', '/teacher/attendance/b1/2026-10-31'],
    ['save attendance', () => teacherService.saveAttendance({ batchId: 'b1', date: '2026-10-31', records: [] }), 'POST', '/teacher/attendance'],
    ['marks draft', () => teacherService.saveMarksDraft({} as never), 'POST', '/assessment/draft'],
    ['publish', () => teacherService.publishAssessment('as1'), 'POST', '/assessment/as1/publish'],
    ['grade', () => teacherService.gradeSubmission('s1', { marksObtained: 5 }), 'POST', '/teacher/assignments/submissions/s1/grade'],
    ['invitations', () => teacherService.getInvitations(), 'GET', '/teacher/invitations'],
    ['revoke', () => teacherService.revokeInvitation('C-1'), 'POST', '/teacher/invitations/C-1/revoke'],
    ['diaries', () => teacherService.getDiaries(), 'GET', '/tuition/diaries'],
    ['leaves', () => teacherService.getLeaves(), 'GET', '/tuition/leaves'],
    ['salaries', () => teacherService.getSalaries(), 'GET', '/tuition/salaries'],
  ];

  it.each(cases)('%s', async (_name, call, method, path) => {
    fetchMock.mockResolvedValue(okJson([]));
    await call();
    expect(lastCall()).toMatchObject({ method, url: path });
  });

  it('does not expose owner-only operations on mobile', () => {
    const exposed = Object.keys(teacherService);
    for (const forbidden of ['generateSalary', 'recordPayment', 'reviewLeave', 'createFaculty', 'getFaculties', 'getFees']) {
      expect(exposed).not.toContain(forbidden);
    }
  });
});

describe('failures surface as errors, never as invented data', () => {
  it('network failure rejects instead of returning sample data', async () => {
    fetchMock.mockRejectedValue(new Error('Network request failed'));
    await expect(studentService.getDashboard()).rejects.toBeInstanceOf(ApiError);
    await expect(teacherService.getDashboard()).rejects.toBeInstanceOf(ApiError);
  });

  it('a server error carries the server message', async () => {
    fetchMock.mockResolvedValue(okJson({ message: 'Role "STUDENT" does not have privilege' }, 403));
    await expect(teacherService.getBatches()).rejects.toMatchObject({ statusCode: 403 });
  });

  it('list endpoints never turn a malformed response into fake rows', async () => {
    fetchMock.mockResolvedValue(okJson({ unexpected: true }));
    await expect(studentService.getResults()).resolves.toEqual([]);
  });
});

describe('session handling', () => {
  it('sends the bearer token on authenticated calls', async () => {
    fetchMock.mockResolvedValue(okJson({}));
    apiClient.setAuthToken('tok_123');
    await studentService.getProfile();
    expect((lastCall().init?.headers as Record<string, string>).Authorization).toBe('Bearer tok_123');
  });

  it('signs the user out when the server rejects the token', async () => {
    const onUnauthorized = jest.fn();
    apiClient.setUnauthorizedHandler(onUnauthorized);
    apiClient.setAuthToken('expired');
    fetchMock.mockResolvedValue(okJson({ message: 'Invalid or expired authentication token.' }, 401));
    await expect(studentService.getDashboard()).rejects.toBeInstanceOf(ApiError);
    expect(onUnauthorized).toHaveBeenCalledTimes(1);
  });

  it('a failed login does not trigger the sign-out handler', async () => {
    const onUnauthorized = jest.fn();
    apiClient.setUnauthorizedHandler(onUnauthorized);
    apiClient.setAuthToken('something');
    fetchMock.mockResolvedValue(okJson({ message: 'Invalid email address or password.' }, 401));
    await expect(authService.login({ email: 'a@b.c', password: 'x' })).rejects.toBeInstanceOf(ApiError);
    expect(onUnauthorized).not.toHaveBeenCalled();
  });

  it('demo login is unavailable in release builds and never fabricates a session', async () => {
    const g = globalThis as unknown as { __DEV__: boolean };
    const original = g.__DEV__;
    g.__DEV__ = false;
    try {
      await expect(authService.loginDemoStudent()).rejects.toThrow(/not available/i);
      await expect(authService.loginDemoTeacher()).rejects.toThrow(/not available/i);
      expect(fetchMock).not.toHaveBeenCalled();
    } finally {
      g.__DEV__ = original;
    }
  });
});

describe('mobile is for students and faculty only', () => {
  it('refuses a platform admin session and keeps no token', async () => {
    fetchMock.mockResolvedValue(
      okJson({ token: 'admin_tok', user: { id: 'u', email: 'a@b.c', name: 'A', role: 'SUPER_ADMIN', instituteId: 'x' } }),
    );
    await expect(authService.login({ email: 'a@b.c', password: 'secret-pass' })).rejects.toThrow(/students and faculty/);
    expect(apiClient.getAuthToken()).toBeNull();
  });

  it('accepts a faculty session and stores the token', async () => {
    fetchMock.mockResolvedValue(
      okJson({ token: 't', user: { id: 'u', email: 'a@b.c', name: 'A', role: 'FACULTY', instituteId: 'x' } }),
    );
    const s = await authService.login({ email: 'a@b.c', password: 'secret-pass' });
    expect(s.user.role).toBe('FACULTY');
    expect(apiClient.getAuthToken()).toBe('t');
  });
});

describe('role routing', () => {
  it('treats every staff role as a teacher-portal user and students as students', () => {
    for (const r of ['TEACHER', 'FACULTY', 'TUITION_OWNER', 'INSTITUTE_MANAGER']) expect(isStaffRole(r)).toBe(true);
    expect(isStaffRole('STUDENT')).toBe(false);
    expect(isStaffRole('SUPER_ADMIN')).toBe(false);
    expect(isStaffRole(undefined)).toBe(false);
  });
});
