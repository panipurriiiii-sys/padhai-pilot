'use client';

import React, { useState, useEffect, useRef } from 'react';
import {
  FileText,
  Download,
  ExternalLink,
  Plus,
  BookOpen,
  Filter,
  CheckCircle2,
  Globe,
  Search,
  Paperclip,
  UploadCloud,
  FileCheck,
  AlertCircle,
  Copy,
  Check,
  Trash2,
  HardDrive,
} from 'lucide-react';
import { teacherApi } from '../lib/api';
import { uploadMediaFile } from '../lib/mediaUpload';
import { LoadError } from './LoadError';
import type {
  StudyMaterialItem,
  CreateStudyMaterialDto,
  BatchSummary,
  StudyMaterialCategory,
} from '@padhai-pilot/shared';

interface StudyMaterialViewProps {
  batches: BatchSummary[];
  teacherName?: string;
}

const CATEGORIES: { key: StudyMaterialCategory; label: string }[] = [
  { key: 'CHAPTER_NOTES', label: 'Chapter Notes' },
  { key: 'WORKSHEET', label: 'Daily Worksheets (DPP)' },
  { key: 'FORMULA_SHEET', label: 'Formula Sheets' },
  { key: 'HANDOUT', label: 'Lecture Handouts' },
  { key: 'REVISION_GUIDE', label: 'Revision Guides' },
  { key: 'PRACTICE_PAPER', label: 'Mock Practice Papers' },
];

export function StudyMaterialView({
  batches,
  teacherName = 'Faculty Member',
}: StudyMaterialViewProps) {
  const [materials, setMaterials] = useState<StudyMaterialItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [selectedBatch, setSelectedBatch] = useState<string>('ALL');
  const [selectedCategory, setSelectedCategory] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [showUploadModal, setShowUploadModal] = useState(false);

  // File Upload State
  const [isUploadingFile, setIsUploadingFile] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploadStatusText, setUploadStatusText] = useState('');
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Form State
  const [formData, setFormData] = useState<CreateStudyMaterialDto>({
    batchId: batches[0]?.id || '',
    title: '',
    category: 'CHAPTER_NOTES',
    subject: batches[0]?.subject || '',
    chapter: '',
    content: '',
    fileUrl: '',
    fileName: '',
    fileSize: '',
    isStudentVisible: true,
    status: 'PUBLISHED',
  });

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  useEffect(() => {
    loadMaterials();
  }, [selectedBatch]);

  async function loadMaterials() {
    setIsLoading(true);
    setLoadError(null);
    try {
      const batchParam = selectedBatch === 'ALL' ? undefined : selectedBatch;
      const data = await teacherApi.getStudyMaterials(batchParam);
      setMaterials(data);
    } catch (err) {
      setLoadError(err instanceof Error ? err.message : 'Could not load this section.');
    } finally {
      setIsLoading(false);
    }
  }

  // Handle direct file upload to Cloudflare Media Host CDN with resilient multi-attempt retry
  async function handleFileSelected(file: File) {
    if (!file) return;
    setIsUploadingFile(true);
    setUploadProgress(10);
    setUploadStatusText('Validating file & optimizing filename...');
    setUploadError(null);

    try {
      const result = await uploadMediaFile(file, (percent, statusText) => {
        setUploadProgress(percent);
        setUploadStatusText(statusText);
      });
      setFormData((prev) => ({
        ...prev,
        fileUrl: result.url,
        fileName: result.fileName,
        fileSize: result.fileSize,
        // Auto-fill title if empty
        title: prev.title.trim()
          ? prev.title
          : file.name.replace(/\.[^/.]+$/, '').replace(/[-_]/g, ' '),
      }));
    } catch (err: any) {
      console.error('File upload failed:', err);
      setUploadError(err.message || 'Failed to upload file to media host.');
    } finally {
      setIsUploadingFile(false);
    }
  }

  function handleDrop(e: React.DragEvent<HTMLDivElement>) {
    e.preventDefault();
    e.stopPropagation();
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFileSelected(e.dataTransfer.files[0]);
    }
  }

  function handleDragOver(e: React.DragEvent<HTMLDivElement>) {
    e.preventDefault();
    e.stopPropagation();
  }

  function handleRemoveFile() {
    setFormData((prev) => ({
      ...prev,
      fileUrl: '',
      fileName: '',
      fileSize: '',
    }));
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  }

  async function handleCreateMaterial(e: React.FormEvent) {
    e.preventDefault();
    if (!formData.title.trim()) {
      alert('Please provide a document title.');
      return;
    }

    setIsSubmitting(true);
    try {
      const created = await teacherApi.createStudyMaterial(formData);
      setMaterials((prev) => [created, ...prev]);
      setShowUploadModal(false);
      setToastMessage(`Study material "${created.title}" published!`);
      setTimeout(() => setToastMessage(null), 4000);

      // Reset
      setFormData({
        batchId: batches[0]?.id || '',
        title: '',
        category: 'CHAPTER_NOTES',
        subject: batches[0]?.subject || '',
        chapter: '',
        content: '',
        fileUrl: '',
        fileName: '',
        fileSize: '',
        isStudentVisible: true,
        status: 'PUBLISHED',
      });
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    } finally {
      setIsSubmitting(false);
    }
  }

  function copyCdnUrl(id: string, url: string) {
    navigator.clipboard.writeText(url);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2500);
  }

  const filteredMaterials = materials.filter((m) => {
    if (selectedBatch !== 'ALL' && m.batchId !== selectedBatch) return false;
    if (selectedCategory !== 'ALL' && m.category !== selectedCategory) return false;
    if (
      searchQuery &&
      !m.title.toLowerCase().includes(searchQuery.toLowerCase()) &&
      !(m.chapter && m.chapter.toLowerCase().includes(searchQuery.toLowerCase())) &&
      !m.subject.toLowerCase().includes(searchQuery.toLowerCase())
    ) {
      return false;
    }
    return true;
  });

  return (
    <div className="space-y-6">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 flex items-center gap-2.5 px-4 py-3 rounded-xl bg-emerald-50 border border-emerald-300 text-emerald-900 font-['Raleway'] font-bold text-xs shadow-lg animate-in fade-in slide-in-from-bottom-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-2 border-b border-[var(--border-paper)]">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-['Raleway'] font-bold uppercase tracking-widest text-[var(--brand-electric)]">
              Curriculum Assets • Learning Notes & Worksheets
            </span>
            <span className="badge-code font-['Inter'] text-[10px]">MEDIA CDN HOSTED</span>
          </div>
          <h1 className="font-['Playfair_Display'] text-2xl md:text-3xl font-bold tracking-tight text-[var(--ink-primary)] mt-1">
            Study Materials & Chapter Notes
          </h1>
          <p className="font-['Raleway'] text-xs text-[var(--ink-muted)] mt-1">
            Publish verified chapter notes, DPP worksheets, and formula sheets directly to student batches via high-speed media CDN.
          </p>
        </div>

        <button
          onClick={() => setShowUploadModal(true)}
          className="btn-primary self-start md:self-auto text-xs font-['Raleway'] font-bold px-4 py-2.5 flex items-center gap-2"
        >
          <Plus className="w-4 h-4" />
          Upload Study Material
        </button>
      </div>

      {/* Filter Strip */}
      <div className="paper-card p-3 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2 flex-1 min-w-[200px]">
          <Search className="w-4 h-4 text-[var(--ink-muted)] shrink-0 ml-1" />
          <input
            type="text"
            placeholder="Search notes, chapters, formula sheets..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-transparent border-0 text-xs font-['Raleway'] text-[var(--ink-primary)] focus:outline-none placeholder:text-[var(--ink-faint)]"
          />
        </div>

        <div className="flex items-center gap-2">
          <select
            value={selectedBatch}
            onChange={(e) => setSelectedBatch(e.target.value)}
            className="select-paper text-xs py-1.5 px-2.5 font-['Raleway']"
          >
            <option value="ALL">All Batches</option>
            {batches.map((b) => (
              <option key={b.id} value={b.id}>
                {b.name}
              </option>
            ))}
          </select>

          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="select-paper text-xs py-1.5 px-2.5 font-['Raleway']"
          >
            <option value="ALL">All Categories</option>
            {CATEGORIES.map((cat) => (
              <option key={cat.key} value={cat.key}>
                {cat.label}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Materials Grid */}
      {loadError ? (
        <LoadError message={loadError} onRetry={loadMaterials} />
      ) : isLoading ? (
        <div className="paper-card p-12 text-center text-xs font-['Raleway'] text-[var(--ink-muted)]">
          Loading study materials...
        </div>
      ) : filteredMaterials.length === 0 ? (
        <div className="paper-card p-12 text-center space-y-3">
          <FileText className="w-8 h-8 text-[var(--ink-faint)] mx-auto" />
          <p className="font-['Raleway'] font-bold text-sm text-[var(--ink-primary)]">
            No study materials found
          </p>
          <p className="font-['Raleway'] text-xs text-[var(--ink-muted)]">
            Upload chapter handouts, formula sheets, or DPP practice sets for your batches.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredMaterials.map((mat) => {
            const formattedDate = new Date(mat.createdAt).toLocaleDateString('en-IN', {
              day: 'numeric',
              month: 'short',
            });

            return (
              <div
                key={mat.id}
                className="paper-card p-5 flex flex-col justify-between space-y-4 hover:border-stone-400 transition-all bg-[var(--bg-paper)] shadow-sm"
              >
                <div>
                  <div className="flex items-center justify-between gap-2 mb-2">
                    <span className="badge-code font-['Inter'] text-[9px]">
                      {mat.category.replace(/_/g, ' ')}
                    </span>
                    <div className="flex items-center gap-1.5 text-[10px] font-['Raleway'] text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                      <Globe className="w-3 h-3 text-emerald-600" />
                      <span>Student Portal</span>
                    </div>
                  </div>

                  <h3 className="font-['Playfair_Display'] font-bold text-sm text-[var(--ink-primary)] line-clamp-2 leading-snug">
                    {mat.title}
                  </h3>

                  <p className="font-['Raleway'] text-[11px] text-[var(--ink-muted)] mt-1">
                    {mat.chapter ? `${mat.chapter} • ` : ''}
                    {mat.subject}
                  </p>

                  {mat.content && (
                    <p className="font-['Raleway'] text-xs text-[var(--ink-secondary)] line-clamp-2 mt-2 leading-relaxed bg-[var(--bg-paper-warm)] p-2 rounded-lg border border-[var(--border-paper)]">
                      {mat.content}
                    </p>
                  )}
                </div>

                <div className="pt-3 border-t border-[var(--border-paper)] space-y-2.5">
                  <div className="flex items-center justify-between text-xs font-['Inter'] text-[var(--ink-muted)]">
                    <div>
                      <span className="text-[10px] block font-['Raleway']">Batch: {mat.batchName}</span>
                      <span className="text-[10px] block text-[var(--ink-faint)]">
                        {mat.fileName || 'Document'} • {mat.fileSize || 'PDF'} • {formattedDate}
                      </span>
                    </div>

                    {mat.fileUrl && (
                      <span className="text-[9px] font-mono px-1.5 py-0.5 rounded bg-blue-50 text-blue-700 border border-blue-200">
                        CDN
                      </span>
                    )}
                  </div>

                  <div className="flex items-center gap-2 pt-1">
                    {mat.fileUrl ? (
                      <>
                        <button
                          type="button"
                          onClick={() => {
                            window.open(mat.fileUrl, '_blank', 'noopener,noreferrer');
                          }}
                          className="btn-primary flex-1 text-[11px] font-['Raleway'] font-bold py-1.5 flex items-center justify-center gap-1.5"
                        >
                          <Download className="w-3.5 h-3.5" />
                          <span>Download / Open</span>
                        </button>

                        <button
                          type="button"
                          onClick={() => copyCdnUrl(mat.id, mat.fileUrl!)}
                          title="Copy direct Media CDN URL"
                          className="p-1.5 rounded-lg border border-[var(--border-paper)] hover:bg-[var(--bg-secondary)] text-[var(--ink-secondary)] transition-all"
                        >
                          {copiedId === mat.id ? (
                            <Check className="w-3.5 h-3.5 text-emerald-600" />
                          ) : (
                            <Copy className="w-3.5 h-3.5 text-[var(--ink-muted)]" />
                          )}
                        </button>
                      </>
                    ) : (
                      <div className="text-[10px] text-[var(--ink-faint)] italic">
                        Text notes only
                      </div>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* ------------------------------------------------------------------- */}
      {/* UPLOAD MODAL */}
      {/* ------------------------------------------------------------------- */}
      {showUploadModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm animate-in fade-in">
          <div className="paper-card p-6 md:p-8 max-w-lg w-full bg-[var(--bg-paper)] shadow-2xl space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-[var(--border-paper)]">
              <div>
                <h3 className="font-['Playfair_Display'] text-xl font-bold text-[var(--ink-primary)]">
                  Publish Study Material
                </h3>
                <p className="font-['Raleway'] text-xs text-[var(--ink-muted)]">
                  Files upload directly to high-speed Media CDN; no large files saved in Postgres.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setShowUploadModal(false)}
                className="p-1 rounded-lg text-[var(--ink-muted)] hover:bg-[var(--bg-secondary)]"
              >
                <Plus className="w-4 h-4 rotate-45" />
              </button>
            </div>

            <form onSubmit={handleCreateMaterial} className="space-y-3.5">
              <div>
                <label className="block text-xs font-['Raleway'] font-bold text-[var(--ink-secondary)] mb-1">
                  Target Batch *
                </label>
                <select
                  value={formData.batchId}
                  onChange={(e) => {
                    const sel = batches.find((b) => b.id === e.target.value);
                    setFormData({
                      ...formData,
                      batchId: e.target.value,
                      subject: sel ? sel.subject : formData.subject,
                    });
                  }}
                  className="select-paper w-full text-xs font-['Raleway'] py-2"
                >
                  {batches.map((b) => (
                    <option key={b.id} value={b.id}>
                      {b.name} ({b.code})
                    </option>
                  ))}
                </select>
              </div>

              {/* DIRECT FILE UPLOAD ZONE */}
              <div>
                <label className="block text-xs font-['Raleway'] font-bold text-[var(--ink-secondary)] mb-1">
                  Attach Document / File (PDF, DOCX, Images)
                </label>

                {formData.fileUrl ? (
                  <div className="p-3.5 rounded-xl border border-emerald-300 bg-emerald-50/60 flex items-center justify-between gap-3">
                    <div className="flex items-center gap-2.5 overflow-hidden">
                      <FileCheck className="w-5 h-5 text-emerald-600 shrink-0" />
                      <div className="overflow-hidden">
                        <div className="font-['Raleway'] font-bold text-xs text-emerald-950 truncate">
                          {formData.fileName || 'Uploaded File'}
                        </div>
                        <div className="text-[10px] text-emerald-700 font-mono flex items-center gap-1.5">
                          <span>{formData.fileSize}</span>
                          <span>•</span>
                          <span className="truncate max-w-[200px]">{formData.fileUrl}</span>
                        </div>
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={handleRemoveFile}
                      className="p-1.5 rounded-lg text-emerald-800 hover:bg-emerald-100 transition"
                      title="Remove file"
                    >
                      <Trash2 className="w-4 h-4 text-emerald-700" />
                    </button>
                  </div>
                ) : (
                  <div
                    onDrop={handleDrop}
                    onDragOver={handleDragOver}
                    onClick={() => fileInputRef.current?.click()}
                    className={`border-2 border-dashed rounded-xl p-5 text-center cursor-pointer transition-all ${
                      isUploadingFile
                        ? 'border-[var(--brand-electric)] bg-blue-50/40'
                        : 'border-[var(--border-paper)] hover:border-[var(--brand-electric)] hover:bg-[var(--bg-paper-warm)]'
                    }`}
                  >
                    <input
                      ref={fileInputRef}
                      type="file"
                      className="hidden"
                      accept=".pdf,.doc,.docx,.png,.jpg,.jpeg,.webp,.txt,.xlsx,.zip"
                      onChange={(e) => {
                        if (e.target.files && e.target.files[0]) {
                          handleFileSelected(e.target.files[0]);
                        }
                      }}
                    />

                    {isUploadingFile ? (
                      <div className="space-y-3 py-3 px-3">
                        <div className="w-6 h-6 border-2 border-[var(--brand-electric)] border-t-transparent rounded-full animate-spin mx-auto" />
                        <div className="font-['Raleway'] font-bold text-xs text-[var(--brand-electric)] text-center">
                          {uploadStatusText || 'Uploading to Media CDN (https://media.dhyey.cc)...'}
                        </div>
                        <div className="w-full bg-slate-200 dark:bg-slate-700 h-2 rounded-full overflow-hidden">
                          <div
                            className="bg-[var(--brand-electric)] h-full transition-all duration-300 rounded-full"
                            style={{ width: `${Math.max(8, uploadProgress)}%` }}
                          />
                        </div>
                        <div className="flex items-center justify-between text-[10px] text-[var(--ink-faint)]">
                          <span>Auto-retry & proxy enabled</span>
                          <span className="font-mono font-semibold">{uploadProgress}%</span>
                        </div>
                      </div>
                    ) : (
                      <div className="space-y-1.5 py-1">
                        <UploadCloud className="w-7 h-7 text-[var(--brand-electric)] mx-auto" />
                        <div className="font-['Raleway'] font-bold text-xs text-[var(--ink-primary)]">
                          Click to select or drop study material here
                        </div>
                        <div className="text-[10px] text-[var(--ink-muted)]">
                          PDF, Word Docs, Formula Sheets, or High-Res diagrams (Strict 20MB limit per CDN)
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {uploadError && (
                  <div className="mt-1.5 flex items-center gap-1.5 text-[11px] text-rose-600">
                    <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                    <span>{uploadError}</span>
                  </div>
                )}
              </div>

              <div>
                <label className="block text-xs font-['Raleway'] font-bold text-[var(--ink-secondary)] mb-1">
                  Material Title *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Definite Integrals — 50 Solved JEE Advanced Models"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  className="input-paper w-full text-xs font-['Raleway'] py-2"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-['Raleway'] font-bold text-[var(--ink-secondary)] mb-1">
                    Category *
                  </label>
                  <select
                    value={formData.category}
                    onChange={(e) =>
                      setFormData({ ...formData, category: e.target.value as StudyMaterialCategory })
                    }
                    className="select-paper w-full text-xs font-['Raleway'] py-2"
                  >
                    {CATEGORIES.map((c) => (
                      <option key={c.key} value={c.key}>
                        {c.label}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-['Raleway'] font-bold text-[var(--ink-secondary)] mb-1">
                    Chapter / Topic
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Definite Integration"
                    value={formData.chapter || ''}
                    onChange={(e) => setFormData({ ...formData, chapter: e.target.value })}
                    className="input-paper w-full text-xs font-['Raleway'] py-2"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-['Raleway'] font-bold text-[var(--ink-secondary)] mb-1">
                  Summary / Overview Description
                </label>
                <textarea
                  rows={2}
                  placeholder="Brief summary of concepts covered in this material..."
                  value={formData.content || ''}
                  onChange={(e) => setFormData({ ...formData, content: e.target.value })}
                  className="input-paper w-full text-xs font-['Raleway'] p-2.5"
                />
              </div>

              <div className="p-3 rounded-xl bg-[var(--bg-surface-subtle)] border border-[var(--border-paper)] space-y-1">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formData.isStudentVisible}
                    onChange={(e) => setFormData({ ...formData, isStudentVisible: e.target.checked })}
                    className="rounded text-[var(--brand-electric)]"
                  />
                  <span className="font-['Raleway'] font-bold text-xs text-[var(--ink-primary)]">
                    Make visible in Student Portal immediately
                  </span>
                </label>
                <p className="font-['Raleway'] text-[10px] text-[var(--ink-muted)] ml-5">
                  Students enrolled in this batch can immediately view and download from the Media CDN.
                </p>
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-[var(--border-paper)]">
                <button
                  type="button"
                  onClick={() => setShowUploadModal(false)}
                  className="btn-subtle text-xs font-['Raleway'] font-bold px-4 py-2"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting || isUploadingFile}
                  className="btn-primary text-xs font-['Raleway'] font-bold px-5 py-2"
                >
                  {isSubmitting ? 'Publishing...' : 'Publish Material'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
