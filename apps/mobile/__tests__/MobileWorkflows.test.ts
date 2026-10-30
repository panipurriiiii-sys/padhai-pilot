import { useAuthStore } from '../src/store/useAuthStore';
import { useNavigationStore } from '../src/store/useNavigationStore';
import { studentService } from '../src/services/api/studentService';
import { teacherService } from '../src/services/api/teacherService';
import { authService } from '../src/services/api/authService';

jest.setTimeout(20000);

describe('PadhaiPilot Mobile — Role Architecture & Workflows', () => {
  beforeEach(() => {
    useAuthStore.getState().logout();
    useNavigationStore.getState().setTab('student_dashboard');
  });

  describe('1. Role Detection & Strict Portal Isolation', () => {
    it('should default to Student Experience on initial launch', () => {
      const state = useNavigationStore.getState();
      expect(state.currentTab).toBe('student_dashboard');
    });

    it('should allow authenticating as Student and navigating student tabs only', async () => {
      await useAuthStore.getState().loginDemo();
      const session = useAuthStore.getState().session;

      expect(session).toBeDefined();
      expect(session?.user?.role).toBe('STUDENT');

      // Student can set student tabs
      useNavigationStore.getState().setTab('student_diary');
      expect(useNavigationStore.getState().currentTab).toBe('student_diary');

      useNavigationStore.getState().setTab('student_academics');
      expect(useNavigationStore.getState().currentTab).toBe('student_academics');

      useNavigationStore.getState().setTab('student_results');
      expect(useNavigationStore.getState().currentTab).toBe('student_results');
    });

    it('should allow authenticating as Teacher and switching to Teacher Experience', async () => {
      await useAuthStore.getState().loginDemoTeacher();
      const session = useAuthStore.getState().session;

      expect(session).toBeDefined();
      expect(session?.user?.role).toBe('TEACHER');

      // Teacher can navigate teacher tabs
      useNavigationStore.getState().setTab('teacher_dashboard');
      expect(useNavigationStore.getState().currentTab).toBe('teacher_dashboard');

      useNavigationStore.getState().setTab('teacher_classes');
      expect(useNavigationStore.getState().currentTab).toBe('teacher_classes');

      useNavigationStore.getState().setTab('teacher_attendance');
      expect(useNavigationStore.getState().currentTab).toBe('teacher_attendance');

      useNavigationStore.getState().setTab('teacher_marks');
      expect(useNavigationStore.getState().currentTab).toBe('teacher_marks');
    });

    it('should reset state cleanly on logout', () => {
      useAuthStore.getState().logout();
      expect(useAuthStore.getState().session).toBeNull();
      expect(useAuthStore.getState().isAuthenticated).toBe(false);
    });
  });

  describe('2. Student Mobile API Services', () => {
    it('should fetch student dashboard summary metrics', async () => {
      const dash = await studentService.getDashboard();
      expect(dash.attendancePercentage).toBeGreaterThanOrEqual(0);
      expect(dash.feeStatus).toBeDefined();
      expect(Array.isArray(dash.recentDiaryEntries)).toBe(true);
    });

    it('should fetch daily teaching diary timeline for students', async () => {
      const diary = await studentService.getDiary();
      expect(Array.isArray(diary)).toBe(true);
      expect(diary.length).toBeGreaterThan(0);
      expect(diary[0].topicsCovered).toBeDefined();
      expect(diary[0].facultyName).toBeDefined();
    });

    it('should fetch study material vault items with download URLs', async () => {
      const materials = await studentService.getMaterials();
      expect(Array.isArray(materials)).toBe(true);
      expect(materials.length).toBeGreaterThan(0);
      expect(materials[0].fileUrl).toBeDefined();
    });

    it('should calculate attendance metrics and percentages', async () => {
      const att = await studentService.getAttendance();
      expect(att.totalClasses).toBeGreaterThan(0);
      expect(att.percentage).toBeGreaterThanOrEqual(0);
      expect(Array.isArray(att.records)).toBe(true);
    });

    it('should fetch interactive CBT examination questions', async () => {
      const exams = await studentService.getTests();
      expect(Array.isArray(exams)).toBe(true);
      expect(exams.length).toBeGreaterThan(0);
      const cbt = exams[0];
      expect(cbt.questions && cbt.questions.length).toBeGreaterThan(0);
      expect(cbt.questions![0].options.length).toBe(4);
    });

    it('should fetch published exam results and report cards', async () => {
      const results = await studentService.getResults();
      expect(Array.isArray(results)).toBe(true);
      expect(results.length).toBeGreaterThan(0);
      expect(results[0].marksObtained).toBeDefined();
      expect(results[0].maxMarks).toBeDefined();
    });

    it('should fetch tuition fee installments and bank transfer details', async () => {
      const fees = await studentService.getFees();
      expect(fees.totalFee).toBeGreaterThan(0);
      expect(Array.isArray(fees.installments)).toBe(true);
      expect(fees.bankDetails.accountNumber).toBeDefined();
    });
  });

  describe('3. Teacher Mobile API Services', () => {
    it('should fetch teacher dashboard metrics and schedule', async () => {
      const dash = await teacherService.getDashboard();
      expect(dash.assignedBatchesCount).toBeGreaterThan(0);
      expect(Array.isArray(dash.todaySchedule)).toBe(true);
    });

    it('should retrieve assigned batches and student roster', async () => {
      const batches = await teacherService.getBatches();
      expect(Array.isArray(batches)).toBe(true);
      expect(batches.length).toBeGreaterThan(0);

      const roster = await teacherService.getBatchStudents(batches[0].id);
      expect(Array.isArray(roster.students)).toBe(true);
      expect(roster.students.length).toBeGreaterThan(0);
    });

    it('should fetch teacher assignments and student submissions', async () => {
      const assignments = await teacherService.getAssignments();
      expect(Array.isArray(assignments)).toBe(true);
      expect(assignments.length).toBeGreaterThan(0);

      const subs = await teacherService.getAssignmentSubmissions(assignments[0].id);
      expect(Array.isArray(subs)).toBe(true);
    });

    it('should fetch personal faculty leave applications', async () => {
      const leaves = await teacherService.getLeaves();
      expect(Array.isArray(leaves)).toBe(true);
      expect(leaves.length).toBeGreaterThan(0);
      expect(leaves[0].leaveType).toBeDefined();
    });

    it('should fetch personal monthly salary slips', async () => {
      const salaries = await teacherService.getSalaries();
      expect(Array.isArray(salaries)).toBe(true);
      expect(salaries.length).toBeGreaterThan(0);
      expect(salaries[0].netPayable).toBeGreaterThan(0);
    });

    it('should fetch and manage student invitation codes', async () => {
      const invites = await teacherService.getInvitations();
      expect(Array.isArray(invites)).toBe(true);
      expect(invites.length).toBeGreaterThan(0);
      expect(invites[0].code).toBeDefined();
    });
  });
});
