import { apiClient } from '../src/services/api/client';
import { documentPaths, financeService } from '../src/services/api/financeService';
import { openPdf } from '../src/lib/pdf';

type FetchMock = jest.Mock<Promise<Partial<Response>>, [string, RequestInit?]>;
let fetchMock: FetchMock;

const last = () => {
  const [url, init] = fetchMock.mock.calls[fetchMock.mock.calls.length - 1];
  return { url: url.replace(apiClient.getBaseUrl(), ''), method: init?.method, body: init?.body ? JSON.parse(String(init.body)) : undefined };
};

beforeEach(() => {
  fetchMock = jest.fn().mockResolvedValue({ ok: true, status: 200, json: async () => [] });
  (globalThis as unknown as { fetch: FetchMock }).fetch = fetchMock;
});

// Routes per docs/LOCAL_API_ROUTES.md (api-finance-docs).
describe('finance, leave and branding routes', () => {
  const rows = [
    { name: 'set fee', run: () => financeService.createStructure('b1', { title: 'T', amount: 500, dueDate: '2026-12-01' }), method: 'POST', url: '/finance/batches/b1/structures' },
    { name: 'ledger', run: () => financeService.getLedger('b1'), method: 'GET', url: '/finance/batches/b1/fees' },
    { name: 'summary', run: () => financeService.getSummary('b1'), method: 'GET', url: '/finance/batches/b1/summary' },
    { name: 'mark payment', run: () => financeService.recordPayment('f1', { amount: 100, paidOn: '2026-11-01', mode: 'CASH' }), method: 'POST', url: '/finance/fees/f1/payments' },
    { name: 'void payment', run: () => financeService.voidPayment('p1', 'typo'), method: 'POST', url: '/finance/payments/p1/void' },
    { name: 'reminders', run: () => financeService.sendReminders({ batchId: 'b1', channels: ['IN_APP'] }), method: 'POST', url: '/finance/reminders/send' },
    { name: 'student fees', run: () => financeService.getStudentLedger(), method: 'GET', url: '/student/finance/fees' },
    { name: 'student apply leave', run: () => financeService.applyStudentLeave({ startDate: '2026-11-02', endDate: '2026-11-03', reason: 'x' }), method: 'POST', url: '/student/leaves' },
    { name: 'student cancel leave', run: () => financeService.cancelStudentLeave('l1'), method: 'POST', url: '/student/leaves/l1/cancel' },
    { name: 'teacher review leave', run: () => financeService.reviewLeave('l1', { status: 'REJECTED', remarks: 'no' }), method: 'PUT', url: '/finance/leaves/l1/review' },
    { name: 'branding', run: () => financeService.getBranding(), method: 'GET', url: '/branding' },
  ];
  it.each(rows)('$name', async ({ run, method, url }) => {
    await run();
    expect(last().method).toBe(method);
    expect(last().url).toBe(url);
  });

  it('builds PDF document paths', () => {
    expect(documentPaths.feeReceipt('p1')).toBe('/documents/fee-receipt/p1');
    expect(documentPaths.attendanceReport({ batchId: 'b1', from: '2026-10-01' })).toBe('/documents/attendance-report?batchId=b1&from=2026-10-01');
  });

  it('openPdf does nothing destructive when signed out', async () => {
    apiClient.setAuthToken(null);
    await expect(openPdf('/documents/fee-receipt/p1', 'x')).resolves.toBeUndefined();
    expect(fetchMock).not.toHaveBeenCalled();
  });
});
