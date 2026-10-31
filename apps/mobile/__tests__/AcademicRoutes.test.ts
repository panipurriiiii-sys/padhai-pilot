import { apiClient } from '../src/services/api/client';
import { teacherService } from '../src/services/api/teacherService';

type FetchMock = jest.Mock<Promise<Partial<Response>>, [string, RequestInit?]>;
let fetchMock: FetchMock;

const call = () => {
  const [url, init] = fetchMock.mock.calls[fetchMock.mock.calls.length - 1];
  return {
    url: url.replace(apiClient.getBaseUrl(), ''),
    method: init?.method,
    body: init?.body ? JSON.parse(String(init.body)) : undefined,
  };
};

beforeEach(() => {
  fetchMock = jest.fn().mockResolvedValue({ ok: true, status: 200, json: async () => [] });
  (globalThis as unknown as { fetch: FetchMock }).fetch = fetchMock;
});

// Routes per docs/LOCAL_API_ROUTES.md (api-core).
describe('academic core routes', () => {
  const cases: Array<[string, () => Promise<unknown>, string, string, unknown?]> = [
    ['edit batch', () => teacherService.updateBatch('b1', { name: 'X', room: null }), 'PATCH', '/teacher/batches/b1', { name: 'X', room: null }],
    ['promote batch', () => teacherService.promoteBatch('b1', { targetBatchId: 'b2' }), 'POST', '/teacher/batches/b1/promote', { targetBatchId: 'b2' }],
    ['list codes', () => teacherService.getInvitations('b1'), 'GET', '/teacher/invitations?batchId=b1'],
    ['create code', () => teacherService.createInvitation({ batchId: 'b1', maxUses: 50 }), 'POST', '/teacher/invitations', { batchId: 'b1', maxUses: 50 }],
    ['clear expiry', () => teacherService.updateInvitation('c1', { expiresAt: null }), 'PATCH', '/teacher/invitations/c1', { expiresAt: null }],
    ['revoke code', () => teacherService.revokeInvitation('c1'), 'POST', '/teacher/invitations/c1/revoke'],
    ['reactivate code', () => teacherService.reactivateInvitation('c1'), 'POST', '/teacher/invitations/c1/reactivate'],
    ['list timetable', () => teacherService.getTimetable('b1'), 'GET', '/teacher/timetable?batchId=b1'],
    ['create slot', () => teacherService.createSlot('b1', { subject: 'Maths', dayOfWeek: 'MONDAY', startTime: '16:00', endTime: '17:00' }), 'POST', '/teacher/batches/b1/timetable'],
    ['update slot', () => teacherService.updateSlot('s1', { room: 'R2' }), 'PATCH', '/teacher/timetable/s1', { room: 'R2' }],
    ['delete slot', () => teacherService.deleteSlot('s1'), 'DELETE', '/teacher/timetable/s1'],
    ['post broadcast', () => teacherService.createAnnouncement({ batchId: 'b1', title: 'T', content: 'C' }), 'POST', '/teacher/announcements'],
    ['delete broadcast', () => teacherService.deleteAnnouncement('a1'), 'DELETE', '/teacher/announcements/a1'],
  ];

  it.each(cases.map((c) => ({ name: c[0], run: c[1], method: c[2], url: c[3], body: c[4] })))('$name', async ({ run, method, url, body }) => {
    await run();
    const last = call();
    expect(last.method).toBe(method);
    expect(last.url).toBe(url);
    if (body !== undefined) expect(last.body).toEqual(body);
  });
});
