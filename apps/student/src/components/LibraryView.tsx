'use client';

import React, { useState, useEffect, useCallback } from 'react';
import {
  BookOpen,
  ExternalLink,
  Search,
  X,
  ChevronLeft,
  ChevronRight,
  BookMarked,
  FileText,
  FileQuestion,
  GraduationCap,
  ScrollText,
  StickyNote,
} from 'lucide-react';
import { studentApi, LibraryMaterialItem } from '../lib/api';

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

function MaterialCard({ item }: { item: LibraryMaterialItem }) {
  const url = item.externalUrl || item.fileUrl;
  const Icon = CONTENT_TYPE_ICONS[item.contentType] ?? BookOpen;
  const typeLabel = CONTENT_TYPE_LABELS[item.contentType] ?? item.contentType;
  const boardLabel = BOARD_LABELS[item.board] ?? item.board;

  return (
    <div className="bg-white border border-gray-200 rounded-2xl p-4 flex flex-col gap-3 hover:border-blue-300 hover:shadow-md transition group">
      <div className="flex items-start gap-2.5">
        <div className="w-9 h-9 rounded-xl bg-blue-50 border border-blue-100 flex items-center justify-center shrink-0">
          <Icon className="w-4 h-4 text-blue-600" />
        </div>
        <div className="flex-1 min-w-0">
          <h3 className="font-semibold text-sm text-gray-900 line-clamp-2 leading-snug">
            {item.title}
          </h3>
          {item.description && (
            <p className="mt-1 text-xs text-gray-500 line-clamp-2">
              {item.description}
            </p>
          )}
        </div>
      </div>

      <div className="flex flex-wrap gap-1.5">
        <span className="inline-flex items-center px-2 py-0.5 rounded-lg bg-blue-50 text-blue-700 text-[10px] font-bold border border-blue-100">
          {boardLabel}
        </span>
        {item.classLevel && (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-lg bg-gray-100 text-gray-600 text-[10px] font-bold border border-gray-200">
            <GraduationCap className="w-2.5 h-2.5" />
            Class {item.classLevel}
          </span>
        )}
        <span className="inline-flex items-center px-2 py-0.5 rounded-lg bg-gray-100 text-gray-600 text-[10px] font-bold border border-gray-200">
          {typeLabel}
        </span>
        {item.yearOrEdition && (
          <span className="inline-flex items-center px-2 py-0.5 rounded-lg bg-gray-100 text-gray-500 text-[10px] border border-gray-200">
            {item.yearOrEdition}
          </span>
        )}
      </div>

      {item.subject && (
        <p className="text-[11px] text-gray-500 truncate">{item.subject}</p>
      )}

      {url && (
        <a
          href={url}
          target="_blank"
          rel="noopener noreferrer"
          className="mt-auto inline-flex items-center gap-1.5 text-blue-600 text-xs font-semibold hover:underline"
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
    <div className="bg-white border border-gray-200 rounded-2xl p-4 animate-pulse">
      <div className="flex gap-2.5 mb-3">
        <div className="w-9 h-9 rounded-xl bg-gray-100" />
        <div className="flex-1 space-y-2">
          <div className="h-4 bg-gray-100 rounded w-3/4" />
          <div className="h-3 bg-gray-100 rounded w-full" />
        </div>
      </div>
      <div className="flex gap-1.5">
        <div className="h-5 w-12 bg-gray-100 rounded-lg" />
        <div className="h-5 w-16 bg-gray-100 rounded-lg" />
      </div>
    </div>
  );
}

export function LibraryView() {
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

  const load = useCallback(async (pg = 1) => {
    setLoading(true);
    setError(null);
    try {
      const res = await studentApi.getLibraryMaterials({
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
    studentApi.getLibraryMeta().then((meta) => {
      setAvailableBoards(meta.boards);
      setAvailableSubjects(meta.subjects);
      setAvailableContentTypes(meta.contentTypes);
      setAvailableClassLevels(meta.classLevels);
    }).catch(() => { /* non-critical */ });
  }, []);

  useEffect(() => {
    load(1);
  }, [load]);

  const boardOptions = availableBoards.length ? availableBoards : Object.keys(BOARD_LABELS);
  const contentTypeOptions = availableContentTypes.length ? availableContentTypes : Object.keys(CONTENT_TYPE_LABELS);

  return (
    <div className="space-y-5">
      {/* Header */}
      <div>
        <h2 className="text-xl font-bold text-gray-900">Study Library</h2>
        <p className="text-sm text-gray-500 mt-0.5">
          Textbooks, notes, question papers and syllabi — all boards in one place.
        </p>
      </div>

      {/* Filter Bar */}
      <div className="bg-white border border-gray-200 rounded-2xl p-4 space-y-3">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            className="w-full pl-9 pr-3 py-2 rounded-xl border border-gray-200 bg-gray-50 text-sm text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-200 focus:border-blue-400"
            placeholder="Search by title, description or tags…"
            value={q}
            onChange={(e) => setQ(e.target.value)}
          />
          {q && (
            <button
              onClick={() => setQ('')}
              className="absolute right-2 top-1/2 -translate-y-1/2 p-1 rounded text-gray-400 hover:text-gray-700"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        <div className="flex flex-wrap gap-2">
          <select
            className="flex-1 min-w-[120px] px-3 py-1.5 rounded-xl border border-gray-200 bg-gray-50 text-xs font-semibold text-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-200"
            value={board}
            onChange={(e) => setBoard(e.target.value)}
          >
            <option value="">All Boards</option>
            {boardOptions.map((b) => (
              <option key={b} value={b}>{BOARD_LABELS[b] ?? b}</option>
            ))}
          </select>

          <select
            className="flex-1 min-w-[100px] px-3 py-1.5 rounded-xl border border-gray-200 bg-gray-50 text-xs font-semibold text-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-200"
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
              className="flex-1 min-w-[120px] px-3 py-1.5 rounded-xl border border-gray-200 bg-gray-50 text-xs font-semibold text-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-200"
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
            className="flex-1 min-w-[130px] px-3 py-1.5 rounded-xl border border-gray-200 bg-gray-50 text-xs font-semibold text-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-200"
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
              className="px-3 py-1.5 rounded-xl border border-gray-200 text-xs font-bold text-gray-500 hover:text-gray-900 hover:bg-gray-100 transition flex items-center gap-1"
            >
              <X className="w-3 h-3" /> Clear
            </button>
          )}
        </div>
      </div>

      {/* Results */}
      {error && (
        <div className="p-4 rounded-xl bg-red-50 border border-red-200 text-red-700 text-sm">
          {error}
          <button onClick={() => load(page)} className="ml-3 underline font-semibold">
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
          <div className="w-16 h-16 rounded-2xl bg-gray-100 border border-gray-200 flex items-center justify-center mb-4">
            <BookOpen className="w-7 h-7 text-gray-400" />
          </div>
          <p className="font-semibold text-lg text-gray-900">No materials found</p>
          <p className="text-sm text-gray-500 mt-1 max-w-xs">
            Try adjusting your filters or search term.
          </p>
        </div>
      ) : (
        <>
          <p className="text-xs text-gray-500">
            Showing {items.length} of {total} resource{total !== 1 ? 's' : ''}
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {items.map((item) => (
              <MaterialCard key={item.id} item={item} />
            ))}
          </div>

          {totalPages > 1 && (
            <div className="flex items-center justify-center gap-3 pt-2">
              <button
                onClick={() => load(page - 1)}
                disabled={page <= 1}
                className="p-2 rounded-xl border border-gray-200 text-gray-500 hover:bg-gray-100 disabled:opacity-40 disabled:cursor-not-allowed transition"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <span className="text-xs font-semibold text-gray-500">
                Page {page} of {totalPages}
              </span>
              <button
                onClick={() => load(page + 1)}
                disabled={page >= totalPages}
                className="p-2 rounded-xl border border-gray-200 text-gray-500 hover:bg-gray-100 disabled:opacity-40 disabled:cursor-not-allowed transition"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
}
