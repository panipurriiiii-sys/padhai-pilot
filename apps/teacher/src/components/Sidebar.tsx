'use client';

import React from 'react';
import {
  LayoutDashboard,
  Users,
  CalendarCheck,
  FileText,
  KeyRound,
  Clock,
  Megaphone,
  Award,
  BookOpen,
  BarChart3,
  Settings,
  Building2,
  LogIn,
  FileSpreadsheet,
  Sliders,
  NotebookPen,
  CreditCard,
  CalendarDays,
  IndianRupee,
  Shield,
  FileCheck2,
  Sparkles,
  X,
  Bell,
  Library,
} from 'lucide-react';

export type NavTab =
  | 'dashboard'
  | 'teachingDiary'
  | 'attendance'
  | 'bulkMarks'
  | 'batches'
  | 'studyMaterials'
  | 'library'
  | 'assignments'
  | 'tests'
  | 'lessonPlans'
  | 'invitations'
  | 'timetable'
  | 'announcements'
  | 'facultyRoster'
  | 'facultySalary'
  | 'facultyLeave'
  | 'studentFees'
  | 'studentLeaves'
  | 'tuitionBranding'
  | 'reports'
  | 'subscription'
  | 'settings';

interface SidebarProps {
  currentTab: NavTab;
  onSelectTab: (tab: NavTab) => void;
  teacherName?: string;
  instituteName?: string;
  userRole?: string;
  onOpenAuthModal: () => void;
  isOpenMobile?: boolean;
  onCloseMobile?: () => void;
  onOpenNotifications?: () => void;
  unreadNotificationCount?: number;
}

export function Sidebar({
  currentTab,
  onSelectTab,
  teacherName = '',
  instituteName = '',
  userRole = 'TEACHER',
  onOpenAuthModal,
  isOpenMobile = false,
  onCloseMobile,
  onOpenNotifications,
  unreadNotificationCount = 0,
}: SidebarProps) {
  // Contextually filter sections by user role (Tuition Owner vs Faculty Member)
  const isOwner = userRole === 'TUITION_OWNER' || userRole === 'INSTITUTE_ADMIN';
  const roleLabel = isOwner ? 'Tuition Owner' : 'Faculty Member';

  const sections = [
    // 1. Classroom & Academic Operations (Available to both Owners and Faculty)
    {
      title: 'Classroom & Academic',
      items: [
        { id: 'dashboard' as NavTab, label: 'Overview', icon: LayoutDashboard },
        { id: 'teachingDiary' as NavTab, label: 'Daily Diary', icon: NotebookPen, badge: 'Daily' },
        { id: 'attendance' as NavTab, label: 'Attendance', icon: CalendarCheck, badge: 'Pinned' },
        { id: 'bulkMarks' as NavTab, label: 'Bulk Marks', icon: FileSpreadsheet, badge: 'New' },
        { id: 'batches' as NavTab, label: 'Batches & Roster', icon: Users },
        { id: 'studyMaterials' as NavTab, label: 'Study Materials', icon: FileText },
        { id: 'library' as NavTab, label: 'Study Library', icon: Library },
        { id: 'assignments' as NavTab, label: 'Assignments', icon: FileCheck2 },
        { id: 'tests' as NavTab, label: 'Tests & Quizzes', icon: Award },
        { id: 'lessonPlans' as NavTab, label: 'Curriculum Plans', icon: BookOpen },
        { id: 'invitations' as NavTab, label: 'Student Invites', icon: KeyRound },
        { id: 'timetable' as NavTab, label: 'Timetable', icon: Clock },
        { id: 'announcements' as NavTab, label: 'Announcements', icon: Megaphone },
        { id: 'studentLeaves' as NavTab, label: 'Student Leaves', icon: CalendarDays },
        { id: 'reports' as NavTab, label: 'Reports & Charts', icon: BarChart3 },
      ],
    },

    // 2. Tuition Management (Visible to Tuition Owner) OR My HR (Visible to Faculty)
    ...(isOwner
      ? [
          {
            title: 'Tuition Management',
            items: [
              { id: 'tuitionBranding' as NavTab, label: 'Academy Branding', icon: Building2, badge: 'Owner' },
              { id: 'facultyRoster' as NavTab, label: 'Faculty & Workload', icon: Users, badge: 'HR' },
              { id: 'facultySalary' as NavTab, label: 'Salary & Payroll', icon: CreditCard, badge: 'Ledger' },
              { id: 'facultyLeave' as NavTab, label: 'Leave Applications', icon: CalendarDays },
              { id: 'studentFees' as NavTab, label: 'Batch Fees', icon: IndianRupee },
              { id: 'subscription' as NavTab, label: 'Plans & Billing', icon: Sparkles, badge: 'Plan' },
            ],
          },
        ]
      : [
          {
            title: 'My Batches & Pay',
            items: [
              { id: 'studentFees' as NavTab, label: 'Batch Fees', icon: IndianRupee },
              { id: 'facultyLeave' as NavTab, label: 'My Leaves', icon: CalendarDays },
              { id: 'facultySalary' as NavTab, label: 'My Pay Slips', icon: CreditCard },
            ],
          },
        ]),

    // 3. Preferences & Settings
    {
      title: 'Preferences',
      items: [
        { id: 'settings' as NavTab, label: 'Settings', icon: Settings },
      ],
    },
  ];

  return (
    <>
    <aside className="hidden lg:flex w-64 h-screen sticky top-0 flex-col bg-[var(--bg-surface-subtle)] border-r border-[var(--border-paper)] shadow-[2px_0_12px_rgba(60,52,40,0.03)] select-none z-30 shrink-0">
      {/* Brand & Studio Header */}
      <div className="p-4 border-b border-[var(--border-paper)] bg-[var(--bg-paper-warm)]">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-3">
            {/* Logo Badge in AK Electric Blue */}
            <img src="/logo.png" alt="PadhaiPilot" className="w-9 h-9 rounded-xl object-contain" />
            <div>
              <div className="flex items-center gap-1.5">
                <span className="font-['Playfair_Display'] font-bold text-base tracking-tight text-[var(--ink-primary)]">
                  PadhaiPilot
                </span>
              </div>
              <p className="text-[10px] font-['Raleway'] font-bold text-[var(--brand-electric)] uppercase tracking-widest">
                Teacher Portal
              </p>
            </div>
          </div>

          {onOpenNotifications && (
            <button
              onClick={onOpenNotifications}
              className="relative p-2 rounded-xl bg-[var(--bg-paper)] border border-[var(--border-paper)] text-[var(--ink-secondary)] hover:text-[var(--brand-electric)] transition shadow-2xs"
              title="Notifications"
            >
              <Bell className="w-4 h-4" />
              {unreadNotificationCount > 0 && (
                <span className="absolute -top-1 -right-1 w-4 h-4 bg-rose-500 text-white rounded-full text-[9px] font-bold flex items-center justify-center animate-pulse">
                  {unreadNotificationCount > 9 ? '9+' : unreadNotificationCount}
                </span>
              )}
            </button>
          )}
        </div>

        {/* Institute Info Tag */}
        <div className="mt-2.5 flex items-center gap-2 px-2.5 py-1.5 rounded-xl bg-[var(--bg-paper)] border border-[var(--border-paper)] text-xs shadow-sm">
          <Building2 className="w-3.5 h-3.5 text-[var(--brand-electric)] shrink-0" />
          <span className="truncate font-['Raleway'] font-semibold text-[var(--ink-secondary)] text-[11px]">
            {instituteName}
          </span>
        </div>
      </div>

      {/* Navigation Links Grouped */}
      <nav className="flex-1 px-3 py-2 space-y-4 overflow-y-auto">
        {sections.map((section, sIdx) => (
          <div key={sIdx} className="space-y-1">
            <div className="px-3 pt-1 pb-1 text-[10px] font-['Raleway'] font-bold uppercase tracking-wider text-[var(--ink-muted)]">
              {section.title}
            </div>
            {section.items.map((item) => {
              const Icon = item.icon;
              const isActive = currentTab === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => onSelectTab(item.id)}
                  className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-['Raleway'] transition-all duration-150 text-left ${
                    isActive
                      ? 'bg-[var(--bg-paper)] text-[var(--ink-primary)] font-bold shadow-sm border border-[var(--border-paper)]'
                      : 'text-[var(--ink-muted)] hover:text-[var(--ink-primary)] hover:bg-[var(--bg-secondary)]'
                  }`}
                >
                  <Icon
                    className={`w-3.5 h-3.5 transition-colors shrink-0 ${
                      isActive ? 'text-[var(--brand-electric)]' : 'text-[var(--ink-faint)]'
                    }`}
                  />
                  <span className="flex-1 truncate">{item.label}</span>
                  {item.badge && (
                    <span
                      className={`text-[9px] font-['Inter'] font-bold px-1.5 py-0.5 rounded-md uppercase tracking-wider ${
                        isActive
                          ? 'bg-blue-50 text-[var(--brand-electric)] border border-blue-200'
                          : 'bg-[var(--bg-muted)] text-[var(--ink-muted)]'
                      }`}
                    >
                      {item.badge}
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        ))}
      </nav>

      {/* Faculty Pass Footer */}
      <div className="p-3 border-t border-[var(--border-paper)] bg-[var(--bg-paper-warm)]">
        <button
          onClick={onOpenAuthModal}
          className="w-full flex items-center gap-2.5 p-2 rounded-xl bg-[var(--bg-paper)] border border-[var(--border-paper)] hover:border-[var(--brand-electric)] transition-all text-left shadow-2xs group"
        >
          <div className="w-8 h-8 rounded-lg bg-[var(--brand-electric)] text-white font-['Playfair_Display'] font-bold flex items-center justify-center text-xs shrink-0 shadow-sm">
            {teacherName.charAt(0)}
          </div>
          <div className="flex-1 min-w-0">
            <p className="font-['Raleway'] font-bold text-xs text-[var(--ink-primary)] truncate group-hover:text-[var(--brand-electric)] transition-colors">
              {teacherName}
            </p>
            <p className="font-['Inter'] text-[10px] text-[var(--ink-muted)] truncate">
              {isOwner ? 'Tuition Owner / Administrator' : 'Faculty Member'}
            </p>
          </div>
          <LogIn className="w-3.5 h-3.5 text-[var(--ink-faint)] group-hover:text-[var(--brand-electric)] transition-colors shrink-0" />
        </button>
      </div>
    </aside>

      {/* Mobile Slide-Over Navigation Drawer */}
      {isOpenMobile && (
        <div className="fixed inset-0 z-50 lg:hidden flex">
          {/* Backdrop */}
          <div
            className="fixed inset-0 bg-black/60 backdrop-blur-xs transition-opacity"
            onClick={onCloseMobile}
          />

          {/* Drawer Panel */}
          <div className="relative w-72 max-w-[85vw] h-full bg-[var(--bg-surface-subtle)] border-r border-[var(--border-paper)] shadow-2xl flex flex-col z-10 animate-in slide-in-from-left duration-200">
            {/* Header */}
            <div className="p-4 border-b border-[var(--border-paper)] bg-[var(--bg-paper-warm)] flex items-center justify-between">
              <div className="flex items-center gap-3">
                <img src="/logo.png" alt="PadhaiPilot" className="w-8 h-8 rounded-xl object-contain" />
                <div>
                  <span className="font-['Playfair_Display'] font-bold text-sm tracking-tight text-[var(--ink-primary)] block">
                    PadhaiPilot
                  </span>
                  <p className="text-[9px] font-['Raleway'] font-bold text-[var(--brand-electric)] uppercase tracking-widest">
                    Teacher Portal
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-1.5">
                {onOpenNotifications && (
                  <button
                    onClick={() => {
                      onOpenNotifications();
                      onCloseMobile?.();
                    }}
                    className="relative p-2 rounded-xl bg-[var(--bg-paper)] border border-[var(--border-paper)] text-[var(--ink-secondary)] hover:text-[var(--brand-electric)] transition"
                    title="Notifications"
                  >
                    <Bell className="w-4 h-4" />
                    {unreadNotificationCount > 0 && (
                      <span className="absolute -top-1 -right-1 w-4 h-4 bg-rose-500 text-white rounded-full text-[9px] font-bold flex items-center justify-center">
                        {unreadNotificationCount > 9 ? '9+' : unreadNotificationCount}
                      </span>
                    )}
                  </button>
                )}
                <button
                  onClick={onCloseMobile}
                  className="p-1.5 rounded-lg text-[var(--ink-muted)] hover:text-[var(--ink-primary)] hover:bg-[var(--bg-paper)] transition"
                  aria-label="Close menu"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Institute Info Tag */}
            <div className="p-3 border-b border-[var(--border-paper)] bg-[var(--bg-paper)]">
              <div className="flex items-center gap-2 px-2.5 py-1.5 rounded-xl bg-[var(--bg-paper-warm)] border border-[var(--border-paper)] text-xs">
                <Building2 className="w-3.5 h-3.5 text-[var(--brand-electric)] shrink-0" />
                <span className="truncate font-['Raleway'] font-semibold text-[var(--ink-secondary)] text-[11px]">
                  {instituteName}
                </span>
              </div>
            </div>

            {/* Navigation Links Grouped */}
            <nav className="flex-1 px-3 py-2 space-y-4 overflow-y-auto">
              {sections.map((section, sIdx) => (
                <div key={sIdx} className="space-y-1">
                  <div className="px-3 pt-1 pb-1 text-[10px] font-['Raleway'] font-bold uppercase tracking-wider text-[var(--ink-muted)]">
                    {section.title}
                  </div>
                  {section.items.map((item) => {
                    const Icon = item.icon;
                    const isActive = currentTab === item.id;
                    return (
                      <button
                        key={item.id}
                        onClick={() => {
                          onSelectTab(item.id);
                          onCloseMobile?.();
                        }}
                        className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-['Raleway'] transition-all text-left ${
                          isActive
                            ? 'bg-[var(--bg-paper)] text-[var(--ink-primary)] font-bold shadow-sm border border-[var(--border-paper)]'
                            : 'text-[var(--ink-muted)] hover:text-[var(--ink-primary)] hover:bg-[var(--bg-secondary)]'
                        }`}
                      >
                        <Icon
                          className={`w-3.5 h-3.5 transition-colors shrink-0 ${
                            isActive ? 'text-[var(--brand-electric)]' : 'text-[var(--ink-faint)]'
                          }`}
                        />
                        <span className="flex-1 truncate">{item.label}</span>
                        {item.badge && (
                          <span
                            className={`text-[9px] font-['Inter'] font-bold px-1.5 py-0.5 rounded-md uppercase tracking-wider ${
                              isActive
                                ? 'bg-blue-50 text-[var(--brand-electric)] border border-blue-200'
                                : 'bg-[var(--bg-muted)] text-[var(--ink-muted)]'
                            }`}
                          >
                            {item.badge}
                          </span>
                        )}
                      </button>
                    );
                  })}
                </div>
              ))}
            </nav>

            {/* Faculty Pass Footer */}
            <div className="p-3 border-t border-[var(--border-paper)] bg-[var(--bg-paper-warm)]">
              <button
                onClick={() => {
                  onOpenAuthModal();
                  onCloseMobile?.();
                }}
                className="w-full flex items-center gap-2.5 p-2 rounded-xl bg-[var(--bg-paper)] border border-[var(--border-paper)] text-left shadow-2xs group"
              >
                <div className="w-8 h-8 rounded-lg bg-[var(--brand-electric)] text-white font-['Playfair_Display'] font-bold flex items-center justify-center text-xs shrink-0 shadow-sm">
                  {teacherName.charAt(0)}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-['Raleway'] font-bold text-xs text-[var(--ink-primary)] truncate group-hover:text-[var(--brand-electric)] transition-colors">
                    {teacherName}
                  </p>
                  <p className="font-['Inter'] text-[10px] text-[var(--ink-muted)] truncate">
                    {isOwner ? 'Tuition Owner / Administrator' : 'Faculty Member'}
                  </p>
                </div>
                <LogIn className="w-3.5 h-3.5 text-[var(--ink-faint)] shrink-0" />
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
