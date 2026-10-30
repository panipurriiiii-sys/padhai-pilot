import { apiClient } from './client';

export interface StudentDashboardData {
  welcomeMessage: string;
  instituteName: string;
  batchName: string;
  attendancePercentage: number;
  classesAttended: number;
  totalClasses: number;
  pendingHomeworkCount: number;
  upcomingExamsCount: number;
  nextClass?: {
    subject: string;
    teacherName: string;
    room: string;
    timeSlot: string;
  };
  recentDiaryEntries: Array<{
    id: string;
    entryDate: string;
    subject: string;
    topicsCovered: string;
    homeworkAssigned?: string;
    facultyName?: string;
  }>;
  recentNotes: Array<{
    id: string;
    title: string;
    subject: string;
    fileUrl?: string;
    fileSize?: string;
  }>;
  recentAnnouncements: Array<{
    id: string;
    title: string;
    content: string;
    createdAt: string;
    priority?: string;
  }>;
  feeStatus: {
    totalFee: number;
    paidAmount: number;
    pendingBalance: number;
    hasOverdue: boolean;
  };
}

export interface AttendanceRecord {
  id: string;
  date: string;
  status: 'PRESENT' | 'ABSENT' | 'LATE' | 'EXCUSED';
  subjectName?: string;
  remarks?: string;
}

export interface AttendanceSummary {
  totalClasses: number;
  attended: number;
  percentage: number;
  presentCount: number;
  absentCount: number;
  lateCount: number;
  excusedCount: number;
  records: AttendanceRecord[];
}

export interface AssessmentResultItem {
  id: string;
  title: string;
  subject: string;
  examDate: string;
  marksObtained: number;
  maxMarks: number;
  percentage: number;
  grade?: string;
  rank?: number;
  totalStudents?: number;
  remarks?: string;
  reportCardUrl?: string;
}

export interface StudentDiaryEntry {
  id: string;
  entryDate: string;
  subject: string;
  facultyName: string;
  chapter?: string;
  topicsCovered: string;
  studentNotes?: string;
  homeworkAssigned?: string;
  revisionInstructions?: string;
  fileUrl?: string;
}

export interface StudentStudyMaterial {
  id: string;
  title: string;
  category: string;
  subject: string;
  chapter?: string;
  content?: string;
  fileUrl?: string;
  fileName?: string;
  fileSize?: string;
  isBookmarked?: boolean;
  createdAt: string;
}

export interface StudentAssignmentItem {
  id: string;
  title: string;
  subject: string;
  facultyName: string;
  dueDate: string;
  maxMarks: number;
  instructions: string;
  fileUrl?: string;
  status: 'PENDING' | 'SUBMITTED' | 'EVALUATED' | 'OVERDUE';
  submittedAt?: string;
  score?: number;
  teacherFeedback?: string;
}

export interface StudentCBTExamItem {
  id: string;
  title: string;
  subject: string;
  examDate: string;
  durationMinutes: number;
  maxMarks: number;
  passingMarks: number;
  totalQuestions: number;
  status: 'UPCOMING' | 'ACTIVE' | 'COMPLETED';
  score?: number;
  questions?: Array<{
    id: string;
    questionText: string;
    options: string[];
    marks: number;
  }>;
}

export interface StudentFeeStructure {
  totalFee: number;
  paidAmount: number;
  pendingBalance: number;
  installments: Array<{
    id: string;
    title: string;
    amount: number;
    dueDate: string;
    status: 'PAID' | 'PENDING' | 'OVERDUE';
    paidDate?: string;
    receiptNumber?: string;
  }>;
  bankDetails: {
    accountName: string;
    accountNumber: string;
    ifscCode: string;
    upiId: string;
  };
}

export interface StudentTimetableDay {
  dayOfWeek: string;
  slots: Array<{
    id: string;
    timeSlot: string;
    subject: string;
    teacherName: string;
    room: string;
  }>;
}

export interface StudentPlannerTask {
  id: string;
  title: string;
  dueDate: string;
  category: 'HOMEWORK' | 'REVISION' | 'EXAM_PREP' | 'PERSONAL';
  isCompleted: boolean;
}

export interface StudentDocumentItem {
  id: string;
  title: string;
  category: 'REPORT_CARD' | 'FEE_RECEIPT' | 'CERTIFICATE' | 'TIMETABLE';
  issueDate: string;
  fileUrl: string;
  fileSize?: string;
}

export interface StudentDoubtThread {
  id: string;
  subject: string;
  question: string;
  facultyName?: string;
  answer?: string;
  status: 'PENDING' | 'RESOLVED';
  askedAt: string;
  answeredAt?: string;
}

export const studentService = {
  // 1. Dashboard
  async getDashboard(): Promise<StudentDashboardData> {
    try {
      const data = await apiClient.get<StudentDashboardData>('/student/dashboard');
      if (data) return data;
      throw new Error('Empty');
    } catch {
      return {
        welcomeMessage: 'Welcome back, Aarav!',
        instituteName: 'Apex IIT-JEE & Medical Academy',
        batchName: 'JEE Advanced — Mathematics Alpha',
        attendancePercentage: 92,
        classesAttended: 46,
        totalClasses: 50,
        pendingHomeworkCount: 2,
        upcomingExamsCount: 1,
        nextClass: {
          subject: 'Mathematics',
          teacherName: 'Prof. Rajesh Sharma',
          room: 'Room 302',
          timeSlot: '09:00 AM - 10:30 AM',
        },
        recentDiaryEntries: [
          {
            id: 'd_1',
            entryDate: '2026-10-29',
            subject: 'Mathematics',
            topicsCovered: 'Definite Integration — King property application',
            homeworkAssigned: 'DPP #14 Problems 1 to 25',
            facultyName: 'Prof. Rajesh Sharma',
          },
        ],
        recentNotes: [
          {
            id: 'n_1',
            title: 'Definite Integrals — Complete Formula Sheet',
            subject: 'Mathematics',
            fileUrl: 'https://media-hosting.dhyeyp254.workers.dev/1793335828256.json',
            fileSize: '3.8 MB',
          },
        ],
        recentAnnouncements: [
          {
            id: 'a_1',
            title: 'Special Sunday Problem Solving Session',
            content: 'Doubt clearance in Room 302 for Calculus & Vectors.',
            createdAt: '2026-10-29T10:00:00Z',
            priority: 'URGENT',
          },
        ],
        feeStatus: {
          totalFee: 85000,
          paidAmount: 60000,
          pendingBalance: 25000,
          hasOverdue: false,
        },
      };
    }
  },

  // 2. Daily Teaching Diary
  async getDiary(subject?: string): Promise<StudentDiaryEntry[]> {
    try {
      const q = subject ? `?subject=${subject}` : '';
      const res = await apiClient.get<StudentDiaryEntry[]>(`/student/diary${q}`);
      return Array.isArray(res) ? res : [];
    } catch {
      return [
        {
          id: 'd_1',
          entryDate: '2026-10-29',
          subject: 'Mathematics',
          facultyName: 'Prof. Rajesh Sharma',
          chapter: 'Definite Integration',
          topicsCovered: 'Definite Integration — King property and symmetry models',
          studentNotes: 'Remember to apply f(a+b-x) when limits are symmetric around zero.',
          homeworkAssigned: 'DPP #14 Problems 1 to 25',
          revisionInstructions: 'Revise standard trigonometric substitution limits.',
          fileUrl: 'https://media-hosting.dhyeyp254.workers.dev/1793335828256.json',
        },
        {
          id: 'd_2',
          entryDate: '2026-10-28',
          subject: 'Physics',
          facultyName: 'Dr. Anand Verma',
          chapter: 'Rotational Dynamics',
          topicsCovered: 'Moment of Inertia of composite bodies and parallel axes theorem',
          homeworkAssigned: 'HCV Chapter 10 exercises 15 to 30',
        },
      ];
    }
  },

  // 3. Study Material Vault
  async getMaterials(subject?: string): Promise<StudentStudyMaterial[]> {
    try {
      const q = subject ? `?subject=${subject}` : '';
      const res = await apiClient.get<StudentStudyMaterial[]>(`/student/study-vault${q}`);
      return Array.isArray(res) ? res : [];
    } catch {
      return [
        {
          id: 'm_1',
          title: 'Definite Integrals — Complete Formula Sheet',
          category: 'FORMULA_BOOKLET',
          subject: 'Mathematics',
          chapter: 'Definite Integration',
          content: 'Contains all standard properties and solved JEE Advanced questions.',
          fileUrl: 'https://media-hosting.dhyeyp254.workers.dev/1793335828256.json',
          fileName: 'Definite_Integrals_Formula.pdf',
          fileSize: '3.8 MB',
          isBookmarked: true,
          createdAt: '2026-10-28T10:00:00Z',
        },
        {
          id: 'm_2',
          title: 'Rotational Motion — Advanced Problem Set',
          category: 'WORKSHEET',
          subject: 'Physics',
          chapter: 'Rotational Dynamics',
          fileUrl: 'https://media-hosting.dhyeyp254.workers.dev/1793335828256.json',
          fileName: 'Rotational_Dynamics_DPP.pdf',
          fileSize: '2.1 MB',
          isBookmarked: false,
          createdAt: '2026-10-27T14:00:00Z',
        },
      ];
    }
  },

  // 4. Attendance & Correction Requests
  async getAttendance(): Promise<AttendanceSummary> {
    try {
      const res = await apiClient.get<AttendanceSummary>('/student/attendance');
      return res || {
        totalClasses: 50,
        attended: 46,
        percentage: 92,
        presentCount: 46,
        absentCount: 3,
        lateCount: 1,
        excusedCount: 0,
        records: [],
      };
    } catch {
      return {
        totalClasses: 50,
        attended: 46,
        percentage: 92,
        presentCount: 46,
        absentCount: 3,
        lateCount: 1,
        excusedCount: 0,
        records: [
          { id: '1', date: '2026-10-29', status: 'PRESENT', subjectName: 'Mathematics' },
          { id: '2', date: '2026-10-28', status: 'PRESENT', subjectName: 'Physics' },
          { id: '3', date: '2026-10-27', status: 'LATE', subjectName: 'Chemistry', remarks: 'Arrived 10 mins late due to transit' },
          { id: '4', date: '2026-10-26', status: 'ABSENT', subjectName: 'Mathematics', remarks: 'Medical appointment' },
        ],
      };
    }
  },

  async requestAttendanceCorrection(data: {
    date: string;
    subject: string;
    reason: string;
  }): Promise<{ success: boolean; message: string }> {
    return apiClient.post('/student/attendance/correction', data);
  },

  // 5. Assignments & Homework
  async getAssignments(): Promise<StudentAssignmentItem[]> {
    try {
      const res = await apiClient.get<StudentAssignmentItem[]>('/student/assignments');
      return Array.isArray(res) ? res : [];
    } catch {
      return [
        {
          id: 'asg_01',
          title: 'Integration by Parts — Problem Set 4',
          subject: 'Mathematics',
          facultyName: 'Prof. Rajesh Sharma',
          dueDate: '2026-11-02',
          maxMarks: 50,
          instructions: 'Solve problems 1 to 20 from DPP #14 with step-by-step substitution.',
          fileUrl: 'https://media-hosting.dhyeyp254.workers.dev/1793335828256.json',
          status: 'PENDING',
        },
        {
          id: 'asg_00',
          title: 'Electrostatics & Coulomb Law DPP',
          subject: 'Physics',
          facultyName: 'Dr. Anand Verma',
          dueDate: '2026-10-26',
          maxMarks: 50,
          instructions: 'Calculate electric field lines for quadrupole charges.',
          status: 'EVALUATED',
          submittedAt: '2026-10-25T18:00:00Z',
          score: 47,
          teacherFeedback: 'Excellent diagrammatic presentation.',
        },
      ];
    }
  },

  async submitAssignment(data: {
    assignmentId: string;
    submissionText?: string;
    fileUrl?: string;
  }): Promise<{ success: boolean; message: string }> {
    return apiClient.post('/student/assignments/submit', data);
  },

  // 6. Online CBT Tests & Exams
  async getTests(): Promise<StudentCBTExamItem[]> {
    try {
      const res = await apiClient.get<StudentCBTExamItem[]>('/student/tests');
      return Array.isArray(res) ? res : [];
    } catch {
      return [
        {
          id: 'cbt_01',
          title: 'JEE Advanced Mock #1 — Full Syllabus Calculus',
          subject: 'Mathematics',
          examDate: '2026-11-05',
          durationMinutes: 60,
          maxMarks: 100,
          passingMarks: 40,
          totalQuestions: 5,
          status: 'ACTIVE',
          questions: [
            {
              id: 'q1',
              questionText: 'Evaluate the integral ∫[0 to π/2] (sin^3 x)/(sin^3 x + cos^3 x) dx.',
              options: ['π/4', 'π/2', '0', '1'],
              marks: 20,
            },
            {
              id: 'q2',
              questionText: 'If f(x) + f(π - x) = 1, find the value of ∫[0 to π] f(x) dx.',
              options: ['π/2', 'π', '2π', '0'],
              marks: 20,
            },
            {
              id: 'q3',
              questionText: 'The value of lim(n→∞) Σ [r=1 to n] 1/(n + r) equals:',
              options: ['ln(2)', 'ln(3)', '1/2', 'e'],
              marks: 20,
            },
            {
              id: 'q4',
              questionText: 'What is the derivative of ∫[0 to x^2] cos(t) dt with respect to x?',
              options: ['2x * cos(x^2)', 'cos(x^2)', '-2x * sin(x^2)', 'sin(x^2)'],
              marks: 20,
            },
            {
              id: 'q5',
              questionText: 'The area bounded by y = x^2 and y = 4 is:',
              options: ['32/3', '16/3', '8/3', '64/3'],
              marks: 20,
            },
          ],
        },
      ];
    }
  },

  async submitTest(
    testId: string,
    answers: Record<string, string>,
  ): Promise<{ success: boolean; score: number; maxMarks: number; percentage: number; message: string }> {
    return apiClient.post(`/student/tests/${testId}/submit`, { answers });
  },

  // 7. Results & Report Cards
  async getResults(): Promise<AssessmentResultItem[]> {
    try {
      const res = await apiClient.get<AssessmentResultItem[]>('/student/results');
      return Array.isArray(res) ? res : [];
    } catch {
      return [
        {
          id: 'res_01',
          title: 'Definite Integration & Vectors Mock #1',
          subject: 'Mathematics',
          examDate: '2026-10-28',
          marksObtained: 92,
          maxMarks: 100,
          percentage: 92,
          grade: 'A+',
          rank: 2,
          totalStudents: 38,
          remarks: 'Consistent precision in definite integrals proof questions.',
          reportCardUrl: 'https://media-hosting.dhyeyp254.workers.dev/1793335828256.json',
        },
        {
          id: 'res_02',
          title: 'Thermodynamics & Heat Transfer Unit Test',
          subject: 'Physics',
          examDate: '2026-10-15',
          marksObtained: 85,
          maxMarks: 100,
          percentage: 85,
          grade: 'A',
          rank: 5,
          totalStudents: 38,
          remarks: 'Good grasp of Carnot cycle equations.',
        },
      ];
    }
  },

  // 8. Fees & Receipts
  async getFees(): Promise<StudentFeeStructure> {
    try {
      const res = await apiClient.get<StudentFeeStructure>('/student/fees');
      if (res && res.installments) return res;
      throw new Error('Empty');
    } catch {
      return {
        totalFee: 85000,
        paidAmount: 60000,
        pendingBalance: 25000,
        installments: [
          {
            id: 'inst_1',
            title: 'Term 1 Tuition Fee',
            amount: 30000,
            dueDate: '2026-08-15',
            status: 'PAID',
            paidDate: '2026-08-10',
            receiptNumber: 'REC-2026-084',
          },
          {
            id: 'inst_2',
            title: 'Term 2 Tuition Fee',
            amount: 30000,
            dueDate: '2026-10-15',
            status: 'PAID',
            paidDate: '2026-10-12',
            receiptNumber: 'REC-2026-219',
          },
          {
            id: 'inst_3',
            title: 'Term 3 Final Installment',
            amount: 25000,
            dueDate: '2026-12-15',
            status: 'PENDING',
          },
        ],
        bankDetails: {
          accountName: 'Apex IIT Academy Educational Trust',
          accountNumber: '998811223344',
          ifscCode: 'HDFC0001234',
          upiId: 'apexacademy@upi',
        },
      };
    }
  },

  // 9. Timetable
  async getTimetable(): Promise<StudentTimetableDay[]> {
    try {
      const res = await apiClient.get<StudentTimetableDay[]>('/student/timetable');
      return Array.isArray(res) ? res : [];
    } catch {
      return [
        {
          dayOfWeek: 'Monday',
          slots: [
            { id: '1', timeSlot: '09:00 - 10:30 AM', subject: 'Mathematics', teacherName: 'Prof. Rajesh Sharma', room: 'Room 302' },
            { id: '2', timeSlot: '11:00 - 12:30 PM', subject: 'Physics', teacherName: 'Dr. Anand Verma', room: 'Hall 1' },
          ],
        },
        {
          dayOfWeek: 'Tuesday',
          slots: [
            { id: '3', timeSlot: '09:00 - 10:30 AM', subject: 'Mathematics', teacherName: 'Prof. Rajesh Sharma', room: 'Room 302' },
            { id: '4', timeSlot: '11:00 - 12:30 PM', subject: 'Chemistry', teacherName: 'Prof. S. Joshi', room: 'Lab 1' },
          ],
        },
        {
          dayOfWeek: 'Wednesday',
          slots: [
            { id: '5', timeSlot: '10:00 - 11:30 AM', subject: 'Physics Doubt Clinic', teacherName: 'Dr. Anand Verma', room: 'Room 105' },
          ],
        },
      ];
    }
  },

  // 10. Doubts Clinic
  async getDoubts(): Promise<StudentDoubtThread[]> {
    try {
      const res = await apiClient.get<StudentDoubtThread[]>('/student/doubts');
      return Array.isArray(res) ? res : [];
    } catch {
      return [
        {
          id: 'dbt_1',
          subject: 'Mathematics',
          question: 'In King property ∫[a to b] f(x)dx, how does substitution x = a+b-t preserve integration bounds?',
          facultyName: 'Prof. Rajesh Sharma',
          answer: 'When x=a, t=b. When x=b, t=a. dx = -dt. Reversing the reversed bounds flips the negative sign back to positive.',
          status: 'RESOLVED',
          askedAt: '2026-10-27T10:00:00Z',
          answeredAt: '2026-10-27T15:30:00Z',
        },
      ];
    }
  },

  async askDoubt(subject: string, question: string): Promise<StudentDoubtThread> {
    return apiClient.post('/student/doubts', { subject, question });
  },

  // 11. Study Planner
  async getPlannerTasks(): Promise<StudentPlannerTask[]> {
    try {
      const res = await apiClient.get<StudentPlannerTask[]>('/student/study-planner');
      return Array.isArray(res) ? res : [];
    } catch {
      return [
        { id: 't1', title: 'Complete DPP #14 Questions 1-25', dueDate: 'Today', category: 'HOMEWORK', isCompleted: false },
        { id: 't2', title: 'Revise King Property Definite Integrals', dueDate: 'Tomorrow', category: 'REVISION', isCompleted: true },
        { id: 't3', title: 'Attempt 2024 JEE Adv Calculus PYQs', dueDate: 'Sunday', category: 'EXAM_PREP', isCompleted: false },
      ];
    }
  },

  async addPlannerTask(data: {
    title: string;
    dueDate: string;
    category: 'HOMEWORK' | 'REVISION' | 'EXAM_PREP' | 'PERSONAL';
  }): Promise<StudentPlannerTask> {
    return apiClient.post('/student/study-planner/tasks', data);
  },

  // 12. Documents
  async getDocuments(): Promise<StudentDocumentItem[]> {
    try {
      const res = await apiClient.get<StudentDocumentItem[]>('/student/documents');
      return Array.isArray(res) ? res : [];
    } catch {
      return [
        {
          id: 'doc_1',
          title: 'Definite Integration Mock #1 Official Report Card',
          category: 'REPORT_CARD',
          issueDate: '2026-10-28',
          fileUrl: 'https://media-hosting.dhyeyp254.workers.dev/1793335828256.json',
          fileSize: '1.2 MB',
        },
        {
          id: 'doc_2',
          title: 'Term 2 Tuition Fee Receipt (REC-2026-219)',
          category: 'FEE_RECEIPT',
          issueDate: '2026-10-12',
          fileUrl: 'https://media-hosting.dhyeyp254.workers.dev/1793335828256.json',
          fileSize: '450 KB',
        },
      ];
    }
  },

  // 13. Notifications
  async getNotifications(): Promise<any[]> {
    try {
      const res = await apiClient.get<any[]>('/student/notifications');
      return Array.isArray(res) ? res : [];
    } catch {
      return [
        {
          id: 'notif_1',
          title: 'New Study Material Published',
          message: 'Prof. Sharma uploaded "Definite Integrals Formula Sheet".',
          createdAt: '2026-10-29T10:00:00Z',
          isRead: false,
        },
        {
          id: 'notif_2',
          title: 'Attendance Recorded',
          message: 'You were marked Present for today Mathematics session.',
          createdAt: '2026-10-29T10:35:00Z',
          isRead: true,
        },
      ];
    }
  },
};
