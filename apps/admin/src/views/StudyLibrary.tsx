'use client';

import React, { useState } from 'react';
import { CheckCircle2, Trash2, ExternalLink } from 'lucide-react';
import { adminApi, type LibraryMaterialAdminItem } from '../lib/api';
import {
  DataList,
  ErrorState,
  LoadingBlock,
  PageHeader,
  StatusBadge,
  errMsg,
  fmtDate,
  useLoad,
  useToast,
} from '../components/ui';

export default function StudyLibrary() {
  const toast = useToast();
  const { data, error, loading, reload } = useLoad(() => adminApi.getLibraryMaterials({ limit: 50 }));
  const [busy, setBusy] = useState<string | null>(null);

  const handleApprove = async (id: string) => {
    setBusy(id);
    try {
      await adminApi.approveLibraryMaterial(id);
      toast('Material approved.');
      reload();
    } catch (e) {
      toast(errMsg(e, 'Approve failed.'));
    } finally {
      setBusy(null);
    }
  };

  const handleDelete = async (id: string, title: string) => {
    if (!window.confirm(`Delete "${title}"? This cannot be undone.`)) return;
    setBusy(id);
    try {
      await adminApi.deleteLibraryMaterial(id);
      toast('Material deleted.');
      reload();
    } catch (e) {
      toast(errMsg(e, 'Delete failed.'));
    } finally {
      setBusy(null);
    }
  };

  const items = data?.items ?? [];

  return (
    <>
      <PageHeader
        title="Study Library"
        subtitle="Platform-level library materials (all boards, any approval status). Approve or remove items."
      />

      {error ? (
        <ErrorState error={error} onRetry={reload} />
      ) : loading && items.length === 0 ? (
        <LoadingBlock />
      ) : (
        <DataList<LibraryMaterialAdminItem>
          rows={items}
          rowKey={(m) => m.id}
          empty="No platform-level library materials found. Run the seed script to add starter content."
          cols={[
            {
              header: 'Title',
              primary: true,
              cell: (m) => (
                <div className="min-w-0">
                  <span className="font-bold font-primary block truncate">{m.title}</span>
                  {m.description && (
                    <span className="text-xs text-ink-muted block truncate">{m.description}</span>
                  )}
                </div>
              ),
            },
            { header: 'Board', cell: (m) => <span className="font-data text-xs">{m.board}</span> },
            { header: 'Class', cell: (m) => <span className="font-data text-xs">{m.classLevel ?? '—'}</span> },
            { header: 'Type', cell: (m) => <span className="font-data text-xs">{m.contentType}</span> },
            {
              header: 'Status',
              cell: (m) => (
                <StatusBadge
                  value={m.isApproved ? 'ACTIVE' : 'PENDING'}
                  label={m.isApproved ? 'Approved' : 'Pending'}
                />
              ),
            },
            { header: 'Views', cell: (m) => <span className="font-data text-xs">{m.viewCount}</span> },
            { header: 'Created', cell: (m) => <span className="text-xs">{fmtDate(m.createdAt)}</span> },
            {
              header: 'Actions',
              cell: (m) => (
                <div className="flex items-center gap-1.5">
                  {(m.externalUrl ?? m.fileUrl) && (
                    <a
                      href={m.externalUrl ?? m.fileUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="tap p-1.5 rounded-lg hover:bg-paper-warm text-ink-muted"
                      title="Open URL"
                    >
                      <ExternalLink className="w-3.5 h-3.5" />
                    </a>
                  )}
                  {!m.isApproved && (
                    <button
                      type="button"
                      disabled={busy === m.id}
                      onClick={() => handleApprove(m.id)}
                      className="btn-secondary text-xs py-1 px-2"
                      title="Approve"
                    >
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      Approve
                    </button>
                  )}
                  <button
                    type="button"
                    disabled={busy === m.id}
                    onClick={() => handleDelete(m.id, m.title)}
                    className="tap p-1.5 rounded-lg hover:bg-rose-50 text-rose-500"
                    title="Delete"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              ),
            },
          ]}
        />
      )}
    </>
  );
}
