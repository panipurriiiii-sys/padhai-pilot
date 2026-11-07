'use client';

import React, { useEffect, useMemo, useState } from 'react';
import { RefreshCw } from 'lucide-react';
import { adminApi } from '../lib/api';
import { DataList, ErrorState, LoadingBlock, PageHeader, Pager, StatusBadge, fmtDate, useLoad } from '../components/ui';

const PAGE_SIZE = 15;

export default function Audit() {
  const { data, error, loading, reload } = useLoad(() => adminApi.getAuditLogs(200));
  const [q, setQ] = useState('');
  const [action, setAction] = useState('ALL');
  const [status, setStatus] = useState('ALL');
  const [from, setFrom] = useState('');
  const [to, setTo] = useState('');
  const [page, setPage] = useState(1);

  const actions = useMemo(() => Array.from(new Set((data ?? []).map((a) => a.action))).sort(), [data]);
  const rows = useMemo(() => {
    const needle = q.trim().toLowerCase();
    const f = from ? new Date(`${from}T00:00:00`).getTime() : -Infinity;
    const t = to ? new Date(`${to}T23:59:59.999`).getTime() : Infinity;
    return (data ?? []).filter((a) => {
      const ts = new Date(a.timestamp).getTime();
      return (
        (action === 'ALL' || a.action === action) &&
        (status === 'ALL' || a.status === status) &&
        ts >= f &&
        ts <= t &&
        (!needle || [a.actorEmail, a.details, a.targetId, a.targetType].some((v) => v?.toLowerCase().includes(needle)))
      );
    });
  }, [data, q, action, status, from, to]);

  useEffect(() => setPage(1), [q, action, status, from, to]);
  const pages = Math.max(1, Math.ceil(rows.length / PAGE_SIZE));
  const slice = rows.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  return (
    <>
      <PageHeader
        title="Audit log"
        subtitle="Platform administration events (latest 200 loaded from the API; filters apply to those)."
        actions={<button type="button" className="btn-secondary" onClick={reload}><RefreshCw className="w-3.5 h-3.5" /> Refresh</button>}
      />
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-5 gap-2 mb-4">
        <input className="input-paper" placeholder="Search actor, details, target" aria-label="Search audit log" value={q} onChange={(e) => setQ(e.target.value)} />
        <select className="select-paper" aria-label="Filter by action" value={action} onChange={(e) => setAction(e.target.value)}>
          <option value="ALL">All actions</option>
          {actions.map((a) => <option key={a}>{a}</option>)}
        </select>
        <select className="select-paper" aria-label="Filter by result" value={status} onChange={(e) => setStatus(e.target.value)}>
          <option value="ALL">All results</option>
          {['SUCCESS', 'WARNING', 'FAILURE'].map((s) => <option key={s}>{s}</option>)}
        </select>
        <input type="date" className="input-paper" aria-label="From date" value={from} onChange={(e) => setFrom(e.target.value)} />
        <input type="date" className="input-paper" aria-label="To date" value={to} onChange={(e) => setTo(e.target.value)} />
      </div>
      {error ? (
        <ErrorState error={error} onRetry={reload} />
      ) : loading && !data ? (
        <LoadingBlock />
      ) : (
        <>
          <DataList
            rows={slice}
            rowKey={(a) => a.id}
            empty="No audit events match these filters."
            cols={[
              { header: 'When', primary: true, cell: (a) => fmtDate(a.timestamp) },
              { header: 'Action', cell: (a) => <span className="font-bold">{a.action}</span> },
              { header: 'Actor', cell: (a) => a.actorEmail || a.actorId },
              { header: 'Target', cell: (a) => (a.targetType ? `${a.targetType}${a.targetId ? ` ${a.targetId.slice(0, 10)}` : ''}` : '-') },
              { header: 'Details', cell: (a) => a.details || '-', className: 'max-w-md' },
              { header: 'Result', cell: (a) => <StatusBadge value={a.status} /> },
            ]}
          />
          <Pager page={page} pages={pages} total={rows.length} onPage={setPage} />
        </>
      )}
    </>
  );
}

