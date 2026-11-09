'use client';

import React, { useState, useEffect, useCallback } from 'react';
import {
  BookOpen,
  ExternalLink,
  Search,
  Plus,
  X,
  ChevronLeft,
  ChevronRight,
  Loader2,
  BookMarked,
  FileText,
  FileQuestion,
  GraduationCap,
  ScrollText,
  StickyNote,
  Tag,
} from 'lucide-react';
import { teacherApi, LibraryMaterialItem } from '../lib/api';

const CONTENT_TYPE_LABELS: Record<string, string> = {
  TEXTBOOK: 'Textbook',
  SOLUTION: 'Solution',
  QUESTION_PAPER: 'Question Paper',
  NOTES: 'Notes',
  SYLLABUS: 'Syllabus',
  OTHER: 'Other',
};

const CONTENT_TYPE_ICONS: Record<string, React.ElementType> = {
  TEXTBOOK: BookMarked,
  SOLUTION: FileText,
  QUESTION_PAPER: FileQuestion,
  NOTES: StickyNote,
  SYLLABUS: ScrollText,
  OTHER: BookOpen,
};

const BOARD_LABELS: Record<string, string> = {
  CBSE: 'CBSE',
  ICSE: 'ICSE',
  SSC: 'SSC',
  RBSE: 'RBSE',
  MPBSE: 'MPBSE',
  HPBSE: 'HPBSE (HP)',
  PSEB: 'PSEB (Punjab)',
  UPMSP: 'UP Board',
  WBBSE: 'WBBSE (WB)',
  BSEB: 'BSEB (Bihar)',
  GSEB: 'GSEB (Gujarat)',
  MH_SSC: 'MH SSC',
  MH_HSC: 'MH HSC',
  OTHER: 'Other',
  GENERAL: 'General',
};

interface UploadModalProps {
  onClose: () => void;
  onSubmit: (data: {
    title: string;
    description: string;
    board: string;
    classLevel: string;
    subject: string;
    contentType: string;
    externalUrl: string;
    yearOrEdition: string;
    tags: string[];
  }) => Promise<void>;
}

function UploadModal({ onClose, onSubmit }: UploadModalProps) {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [board, setBoard] = useState('CBSE');
  const [classLevel, setClassLevel] = useState('');
  const [subject, setSubject] = useState('');
  const [contentType, setContentType] = useState('NOTES');
  const [externalUrl, setExternalUrl] = useState('');
  const [yearOrEdition, setYearOrEdition] = useState('');
  const [tagsInput, setTagsInput] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !board || !contentType) {
      setError('Title, board and content type are required.');
      return;
    }
    setBusy(true);
    setError(null);
    try {
      const tags = tagsInput
        .split(',')
        .map((t) => t.trim().toLowerCase())
        .filter(Boolean);
      await onSubmit({
        title: title.trim(),
        description: description.trim(),
        board,
        classLevel: classLevel.trim(),
        subject: subject.trim(),
        contentType,
        externalUrl: externalUrl.trim(),
        yearOrEdition: yearOrEdition.trim(),
        tags,
      });
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Upload failed. Please try again.');
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/50 backdrop-blur-xs" onClick={onClose} />
      <div className="relative bg-[var(--bg-paper)] border border-[var(--border-paper)] rounded-2xl shadow-2xl w-full max-w-lg p-6 overflow-y-auto max-h-[90vh]">
        <div className="flex items-center justify-between mb-5">
          <h2 className="font-['Playfair_Display'] font-bold text-lg text-[var(--ink-primary)]">
            Upload Material
          </h2>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-[var(--ink-muted)] hover:text-[var(--ink-primary)] hover:bg-[var(--bg-secondary)] transition"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {error && (
          <div className="mb-4 p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-['Inter']">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-['Raleway'] font-bold text-[var(--ink-secondary)] mb-1">
              Title <span className="text-rose-500">*</span>
            </label>
            <input
              className="w-full px-3 py-2 rounded-xl border border-[var(--border-paper)] bg-[var(--bg-paper)] text-sm font-['Inter'] text-[var(--ink-primary)] focus:outline-none focus:ring-2 focus:ring-[var(--brand-electric)]/30 focus:border-[var(--brand-electric)]"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. NCERT Class 10 Maths Chapter 3"
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-['Raleway'] font-bold text-[var(--ink-secondary)] mb-1">
                Board <span className="text-rose-500">*</span>
              </label>
              <select
                className="w-full px-3 py-2 rounded-xl border border-[var(--border-paper)] bg-[var(--bg-paper)] text-sm font-['Inter'] text-[var(--ink-primary)] focus:outline-none focus:ring-2 focus:ring-[var(--brand-electric)]/30"
                value={board}
                onChange={(e) => setBoard(e.target.value)}
              >
                {Object.entries(BOARD_LABELS).map(([k, v]) => (
                  <option key={k} value={k}>{v}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-['Raleway'] font-bold text-[var(--ink-secondary)] mb-1">
                Content Type <span className="text-rose-500">*</span>
              </label>
              <select
                className="w-full px-3 py-2 rounded-xl border border-[var(--border-paper)] bg-[var(--bg-paper)] text-sm font-['Inter'] text-[var(--ink-primary)] focus:outline-none focus:ring-2 focus:ring-[var(--brand-electric)]/30"
                value={contentType}
                onChange={(e) => setContentType(e.target.value)}
              >
                {Object.entries(CONTENT_TYPE_LABELS).map(([k, v]) => (
                  <option key={k} value={k}>{v}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-['Raleway'] font-bold text-[var(--ink-secondary)] mb-1">
                Class (1–12, optional)
              </label>
              <input
                className="w-full px-3 py-2 rounded-xl border border-[var(--border-paper)] bg-[var(--bg-paper)] text-sm font-['Inter'] text-[var(--ink-primary)] focus:outline-none focus:ring-2 focus:ring-[var(--brand-electric)]/30"
                value={classLevel}
                onChange={(e) => setClassLevel(e.target.value)}
                placeholder="e.g. 10"
              />
            </div>
            <div>
              <label className="block text-xs font-['Raleway'] font-bold text-[var(--ink-secondary)] mb-1">
                Subject (optional)
              </label>
              <input
                className="w-full px-3 py-2 rounded-xl border border-[var(--border-paper)] bg-[var(--bg-paper)] text-sm font-['Inter'] text-[var(--ink-primary)] focus:outline-none focus:ring-2 focus:ring-[var(--brand-electric)]/30"
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                placeholder="e.g. Mathematics"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-['Raleway'] font-bold text-[var(--ink-secondary)] mb-1">
              URL (paste a link to the resource)
            </label>
            <input
              className="w-full px-3 py-2 rounded-xl border border-[var(--border-paper)] bg-[var(--bg-paper)] text-sm font-['Inter'] text-[var(--ink-primary)] focus:outline-none focus:ring-2 focus:ring-[var(--brand-electric)]/30"
              value={externalUrl}
              onChange={(e) => setExternalUrl(e.target.value)}
              type="url"
              placeholder="https://..."
            />
          </div>

          <div>
            <label className="block text-xs font-['Raleway'] font-bold text-[var(--ink-secondary)] mb-1">
              Year / Edition (optional)
            </label>
            <input
              className="w-full px-3 py-2 rounded-xl border border-[var(--border-paper)] bg-[var(--bg-paper)] text-sm font-['Inter'] text-[var(--ink-primary)] focus:outline-none focus:ring-2 focus:ring-[var(--brand-electric)]/30"
              value={yearOrEdition}
              onChange={(e) => setYearOrEdition(e.target.value)}
              placeholder="e.g. 2024 or 2023-24"
            />
          </div>

          <div>
            <label className="block text-xs font-['Raleway'] font-bold text-[var(--ink-secondary)] mb-1">
              Description (optional)
            </label>
            <textarea
              className="w-full px-3 py-2 rounded-xl border border-[var(--border-paper)] bg-[var(--bg-paper)] text-sm font-['Inter'] text-[var(--ink-primary)] focus:outline-none focus:ring-2 focus:ring-[var(--brand-electric)]/30 resize-none"
              rows={2}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Brief description of the resource"
            />
          </div>

          <div>
            <label className="block text-xs font-['Raleway'] font-bold text-[var(--ink-secondary)] mb-1">
              Tags (comma-separated, optional)
            </label>
            <input
              className="w-full px-3 py-2 rounded-xl border border-[var(--border-paper)] bg-[var(--bg-paper)] text-sm font-['Inter'] text-[var(--ink-primary)] focus:outline-none focus:ring-2 focus:ring-[var(--brand-electric)]/30"
              value={tagsInput}
              onChange={(e) => setTagsInput(e.target.value)}
              placeholder="ncert, class10, maths"
            />
          </div>

          <button
            type="submit"
            disabled={busy}
            className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-[var(--brand-electric)] text-white text-sm font-['Raleway'] font-bold shadow-sm hover:opacity-90 transition disabled:opacity-60"
          >
            {busy ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
            {busy ? 'Saving…' : 'Upload Material'}
          </button>
        </form>
      </div>
    </div>
  );
}

function MaterialCard({ item }: { item: LibraryMaterialItem }) {
  const url = item.externalUrl || item.fileUrl;
  const Icon = CONTENT_TYPE_ICONS[item.contentType] ?? BookOpen;
  const typeLabel = CONTENT_TYPE_LABELS[item.contentType] ?? item.contentType;
  const boardLabel = BOARD_LABELS[item.board] ?? item.board;

  return (
    <div className="bg-[var(--bg-paper)] border border-[var(--border-paper)] rounded-2xl p-4 flex flex-col gap-3 hover:border-[var(--brand-electric)]/40 hover:shadow-md transition group">
      <div className="flex items-start gap-2.5">
        <div className="w-9 h-9 rounded-xl bg-[var(--bg-paper-warm)] border border-[var(--border-paper)] flex items-center justify-center shrink-0">
          <Icon className="w-4 h-4 text-[var(--brand-electric)]" />
        </div>
        <div className="flex-1 min-w-0">
          <h3 className="font-['Playfair_Display'] font-bold text-sm text-[var(--ink-primary)] line-clamp-2 leading-snug">
            {item.title}
          </h3>
          {item.description && (
            <p className="mt-1 text-xs font-['Inter'] text-[var(--ink-secondary)] line-clamp-2">
              {item.description}
            </p>
          )}
        </div>
      </div>

      <div className="flex flex-wrap gap-1.5">
        <span className="inline-flex items-center px-2 py-0.5 rounded-lg bg-blue-50 text-[var(--brand-electric)] text-[10px] font-['Raleway'] font-bold border border-blue-100">
          {boardLabel}
        </span>
        {item.classLevel && (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-lg bg-[var(--bg-paper-warm)] text-[var(--ink-secondary)] text-[10px] font-['Raleway'] font-bold border border-[var(--border-paper)]">
            <GraduationCap className="w-2.5 h-2.5" />
            Class {item.classLevel}
          </span>
        )}
        <span className="inline-flex items-center px-2 py-0.5 rounded-lg bg-[var(--bg-secondary)] text-[var(--ink-muted)] text-[10px] font-['Raleway'] font-bold border border-[var(--border-paper)]">
          {typeLabel}
        </span>
        {item.yearOrEdition && (
          <span className="inline-flex items-center px-2 py-0.5 rounded-lg bg-[var(--bg-secondary)] text-[var(--ink-muted)] text-[10px] font-['Inter']">
            {item.yearOrEdition}
          </span>
        )}
      </div>

      {item.subject && (
        <p className="text-[11px] font-['Inter'] text-[var(--ink-muted)] truncate">{item.subject}</p>
      )}

      {url && (
        <a
          href={url}
          target="_blank"
          rel="noopener noreferrer"
          className="mt-auto inline-flex items-center gap-1.5 text-[var(--brand-electric)] text-xs font-['Raleway'] font-bold hover:underline"
        >
          <ExternalLink className="w-3 h-3" />
          Open resource
        </a>
      )}
    </div>
  );
}

function SkeletonCard() {
  return (
    <div className="bg-[var(--bg-paper)] border border-[var(--border-paper)] rounded-2xl p-4 animate-pulse">
      <div className="flex gap-2.5 mb-3">
        <div className="w-9 h-9 rounded-xl bg-[var(--bg-secondary)]" />
        <div className="flex-1 space-y-2">
          <div className="h-4 bg-[var(--bg-secondary)] rounded w-3/4" />
          <div className="h-3 bg-[var(--bg-secondary)] rounded w-full" />
        </div>
      </div>
      <div className="flex gap-1.5">
        <div className="h-5 w-12 bg-[var(--bg-secondary)] rounded-lg" />
        <div className="h-5 w-16 bg-[var(--bg-secondary)] rounded-lg" />
      </div>
    </div>
  );
}

interface LibraryViewProps {
  userRole?: string;
}

export function LibraryView({ userRole }: LibraryViewProps) {
  const [items, setItems] = useState<LibraryMaterialItem[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  const [board, setBoard] = useState('');
  const [classLevel, setClassLevel] = useState('');
  const [subject, setSubject] = useState('');
  const [contentType, setContentType] = useState('');
  const [q, setQ] = useState('');

  const [availableBoards, setAvailableBoards] = useState<string[]>([]);
  const [availableSubjects, setAvailableSubjects] = useState<string[]>([]);
  const [availableContentTypes, setAvailableContentTypes] = useState<string[]>([]);
  const [availableClassLevels, setAvailableClassLevels] = useState<string[]>([]);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showUploadModal, setShowUploadModal] = useState(false);

  const canUpload = userRole !== 'STUDENT';

  const load = useCallback(async (pg = 1) => {
    setLoading(true);
    setError(null);
    try {
      const res = await teacherApi.getLibraryMaterials({
        board: board || undefined,
        classLevel: classLevel || undefined,
        subject: subject || undefined,
        contentType: contentType || undefined,
        q: q || undefined,
        page: pg,
        limit: 20,
      });
      setItems(res.items);
      setTotal(res.total);
      setPage(res.page);
      setTotalPages(res.totalPages);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load library materials.');
    } finally {
      setLoading(false);
    }
  }, [board, classLevel, subject, contentType, q]);

  useEffect(() => {
    teacherApi.getLibraryMeta().then((meta) => {
      setAvailableBoards(meta.boards);
      setAvailableSubjects(meta.subjects);
      setAvailableContentTypes(meta.contentTypes);
      setAvailableClassLevels(meta.classLevels);
    }).catch(() => { /* non-critical */ });
  }, []);

  useEffect(() => {
    load(1);
  }, [load]);

  const handleUpload = async (data: Parameters<UploadModalProps['onSubmit']>[0]) => {
    await teacherApi.createLibraryMaterial(data);
    load(1);
  };

  const boardOptions = availableBoards.length ? availableBoards : Object.keys(BOARD_LABELS);
  const contentTypeOptions = availableContentTypes.length ? availableContentTypes : Object.keys(CONTENT_TYPE_LABELS);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div>
          <h1 className="font-['Playfair_Display'] font-bold text-2xl text-[var(--ink-primary)]">
            Study Library
          </h1>
          <p className="text-sm font-['Raleway'] text-[var(--ink-muted)] mt-0.5">
            Textbooks, notes, question papers and syllabi — all boards in one place.
          </p>
        </div>
        {canUpload && (
          <button
            onClick={() => setShowUploadModal(true)}
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-[var(--brand-electric)] text-white text-sm font-['Raleway'] font-bold shadow-sm hover:opacity-90 transition"
          >
            <Plus className="w-4 h-4" />
            Upload Material
          </button>
        )}
      </div>

      {/* Filter Bar */}
      <div className="bg-[var(--bg-paper)] border border-[var(--border-paper)] rounded-2xl p-4 space-y-3">
        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--ink-muted)]" />
          <input
            className="w-full pl-9 pr-3 py-2 rounded-xl border border-[var(--border-paper)] bg-[var(--bg-paper-warm)] text-sm font-['Inter'] text-[var(--ink-primary)] placeholder:text-[var(--ink-faint)] focus:outline-none focus:ring-2 focus:ring-[var(--brand-electric)]/30 focus:border-[var(--brand-electric)]"
            placeholder="Search by title, description or tags…"
            value={q}
            onChange={(e) => setQ(e.target.value)}
          />
          {q && (
            <button
              onClick={() => setQ('')}
              className="absolute right-2 top-1/2 -translate-y-1/2 p-1 rounded text-[var(--ink-muted)] hover:text-[var(--ink-primary)]"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        {/* Dropdowns */}
        <div className="flex flex-wrap gap-2">
          <select
            className="flex-1 min-w-[120px] px-3 py-1.5 rounded-xl border border-[var(--border-paper)] bg-[var(--bg-paper-warm)] text-xs font-['Raleway'] font-semibold text-[var(--ink-secondary)] focus:outline-none focus:ring-2 focus:ring-[var(--brand-electric)]/30"
            value={board}
            onChange={(e) => setBoard(e.target.value)}
          >
            <option value="">All Boards</option>
            {boardOptions.map((b) => (
              <option key={b} value={b}>{BOARD_LABELS[b] ?? b}</option>
            ))}
          </select>

          <select
            className="flex-1 min-w-[100px] px-3 py-1.5 rounded-xl border border-[var(--border-paper)] bg-[var(--bg-paper-warm)] text-xs font-['Raleway'] font-semibold text-[var(--ink-secondary)] focus:outline-none focus:ring-2 focus:ring-[var(--brand-electric)]/30"
            value={classLevel}
            onChange={(e) => setClassLevel(e.target.value)}
          >
            <option value="">All Classes</option>
            {(availableClassLevels.length ? availableClassLevels : Array.from({ length: 12 }, (_, i) => String(i + 1))).map((cl) => (
              <option key={cl} value={cl}>Class {cl}</option>
            ))}
          </select>

          {availableSubjects.length > 0 && (
            <select
              className="flex-1 min-w-[120px] px-3 py-1.5 rounded-xl border border-[var(--border-paper)] bg-[var(--bg-paper-warm)] text-xs font-['Raleway'] font-semibold text-[var(--ink-secondary)] focus:outline-none focus:ring-2 focus:ring-[var(--brand-electric)]/30"
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
            >
              <option value="">All Subjects</option>
              {availableSubjects.map((s) => (
                <option key={s} value={s}>{s}</option>
              ))}
            </select>
          )}

          <select
            className="flex-1 min-w-[130px] px-3 py-1.5 rounded-xl border border-[var(--border-paper)] bg-[var(--bg-paper-warm)] text-xs font-['Raleway'] font-semibold text-[var(--ink-secondary)] focus:outline-none focus:ring-2 focus:ring-[var(--brand-electric)]/30"
            value={contentType}
            onChange={(e) => setContentType(e.target.value)}
          >
            <option value="">All Types</option>
            {contentTypeOptions.map((ct) => (
              <option key={ct} value={ct}>{CONTENT_TYPE_LABELS[ct] ?? ct}</option>
            ))}
          </select>

          {(board || classLevel || subject || contentType || q) && (
            <button
              onClick={() => {
                setBoard(''); setClassLevel(''); setSubject(''); setContentType(''); setQ('');
              }}
              className="px-3 py-1.5 rounded-xl border border-[var(--border-paper)] text-xs font-['Raleway'] font-bold text-[var(--ink-muted)] hover:text-[var(--ink-primary)] hover:bg-[var(--bg-secondary)] transition flex items-center gap-1"
            >
              <X className="w-3 h-3" /> Clear
            </button>
          )}
        </div>
      </div>

      {/* Results */}
      {error && (
        <div className="p-4 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-sm font-['Inter']">
          {error}
          <button
            onClick={() => load(page)}
            className="ml-3 underline font-semibold"
          >
            Retry
          </button>
        </div>
      )}

      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {Array.from({ length: 6 }).map((_, i) => <SkeletonCard key={i} />)}
        </div>
      ) : items.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <div className="w-16 h-16 rounded-2xl bg-[var(--bg-paper-warm)] border border-[var(--border-paper)] flex items-center justify-center mb-4">
            <BookOpen className="w-7 h-7 text-[var(--ink-faint)]" />
          </div>
          <p className="font-['Playfair_Display'] font-bold text-lg text-[var(--ink-primary)]">
            No materials found
          </p>
          <p className="text-sm font-['Raleway'] text-[var(--ink-muted)] mt-1 max-w-xs">
            Try adjusting your filters or search term.
          </p>
        </div>
      ) : (
        <>
          <p className="text-xs font-['Raleway'] text-[var(--ink-muted)]">
            Showing {items.length} of {total} resource{total !== 1 ? 's' : ''}
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {items.map((item) => (
              <MaterialCard key={item.id} item={item} />
            ))}
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-center gap-3 pt-2">
              <button
                onClick={() => load(page - 1)}
                disabled={page <= 1}
                className="p-2 rounded-xl border border-[var(--border-paper)] text-[var(--ink-secondary)] hover:bg-[var(--bg-secondary)] disabled:opacity-40 disabled:cursor-not-allowed transition"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <span className="text-xs font-['Raleway'] font-semibold text-[var(--ink-muted)]">
                Page {page} of {totalPages}
              </span>
              <button
                onClick={() => load(page + 1)}
                disabled={page >= totalPages}
                className="p-2 rounded-xl border border-[var(--border-paper)] text-[var(--ink-secondary)] hover:bg-[var(--bg-secondary)] disabled:opacity-40 disabled:cursor-not-allowed transition"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          )}
        </>
      )}

      {showUploadModal && (
        <UploadModal
          onClose={() => setShowUploadModal(false)}
          onSubmit={handleUpload}
        />
      )}
    </div>
  );
}
