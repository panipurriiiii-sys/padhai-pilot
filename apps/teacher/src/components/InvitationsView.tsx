'use client';

import React, { useState } from 'react';
import {
  KeyRound,
  Plus,
  Copy,
  Check,
  Ban,
  Calendar,
  ShieldCheck,
  X,
  Users,
} from 'lucide-react';
import type { BatchSummary, InvitationCode } from '@padhai-pilot/shared';

interface InvitationsViewProps {
  batches: BatchSummary[];
  invitations: InvitationCode[];
  onCreateInvitation: (data: { batchId?: string; maxUses?: number; expiryDays?: number }) => Promise<InvitationCode>;
  onRevokeInvitation: (code: string) => Promise<void>;
}

export function InvitationsView({
  batches,
  invitations,
  onCreateInvitation,
  onRevokeInvitation,
}: InvitationsViewProps) {
  const [copiedCode, setCopiedCode] = useState<string | null>(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [revokeConfirmCode, setRevokeConfirmCode] = useState<string | null>(null);

  // Form State
  const [batchId, setBatchId] = useState<string>(batches[0]?.id || '');
  const [maxUses, setMaxUses] = useState<number>(40);
  const [expiryDays, setExpiryDays] = useState<number>(14);

  const handleCopy = (code: string) => {
    navigator.clipboard.writeText(code);
    setCopiedCode(code);
    setTimeout(() => setCopiedCode(null), 2500);
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      await onCreateInvitation({
        batchId: batchId || undefined,
        maxUses: Number(maxUses),
        expiryDays: Number(expiryDays),
      });
      setShowCreateModal(false);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleRevoke = async (code: string) => {
    await onRevokeInvitation(code);
    setRevokeConfirmCode(null);
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-[#E3DFD9]">
        <div>
          <h1 className="font-['Playfair_Display'] text-2xl sm:text-3xl font-bold text-stone-900">
            Student Invitation Codes
          </h1>
          <p className="text-xs sm:text-sm text-stone-500 mt-1 font-['Raleway']">
            Issue cryptographically unpredictable enrollment tokens scoped to your batch. Codes enforce strict quota limits and expiry.
          </p>
        </div>

        <button
          onClick={() => setShowCreateModal(true)}
          className="flex items-center gap-2 px-4 py-2 rounded-lg bg-[#1677FF] hover:bg-[#3395FF] text-white text-xs font-semibold tracking-wide transition shadow-[0_2px_12px_rgba(22,119,255,0.35)] shrink-0"
        >
          <Plus className="w-4 h-4" />
          <span>Generate New Code</span>
        </button>
      </div>

      {/* Security Guidance Note */}
      <div className="p-4 rounded-xl bg-white border border-[#1677FF]/25 flex items-start gap-3">
        <ShieldCheck className="w-5 h-5 text-[#1677FF] shrink-0 mt-0.5" />
        <div className="text-xs text-stone-500 leading-relaxed">
          <span className="font-bold text-stone-900">Zero-Trust Security Enforcement: </span>
          Invitation codes allow students to register directly into the designated batch without administrative manual entry. Revoking a code immediately prevents any further redemptions while preserving already enrolled students.
        </div>
      </div>

      {/* Invitations Table */}
      <div className="rounded-xl bg-white border border-[#E3DFD9] overflow-hidden">
        <div className="p-4 border-b border-[#E3DFD9] bg-[#FAF8F5] flex items-center justify-between">
          <span className="text-xs font-bold text-stone-900 uppercase tracking-wider">
            Active & Historic Tokens ({invitations.length})
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="border-b border-[#E3DFD9] text-stone-500 font-medium uppercase tracking-wider text-[10px] bg-[#FAF8F5]">
                <th className="py-3 px-4">Enrollment Token</th>
                <th className="py-3 px-4">Target Batch</th>
                <th className="py-3 px-4 text-center">Usage Quota</th>
                <th className="py-3 px-4">Expiration</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#ffffff08] font-['Raleway']">
              {invitations.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-stone-500">
                    No invitation codes generated yet. Click &ldquo;Generate New Code&rdquo; above.
                  </td>
                </tr>
              ) : (
                invitations.map((inv) => {
                  const isCopied = copiedCode === inv.code;
                  const isExpired = new Date(inv.expiresAt) < new Date();
                  const isExhausted = inv.usedCount >= inv.maxUses;
                  const isRevoked = inv.isRevoked;

                  const statusLabel = isRevoked
                    ? 'REVOKED'
                    : isExpired
                    ? 'EXPIRED'
                    : isExhausted
                    ? 'EXHAUSTED'
                    : 'ACTIVE';

                  return (
                    <tr key={inv.id} className="hover:bg-[#F3EFE9]/60 transition">
                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-2">
                          <span className="font-['Inter'] font-mono font-bold text-sm tracking-wider text-stone-900 bg-[#FAF8F5] px-2.5 py-1 rounded border border-[#E3DFD9]">
                            {inv.code}
                          </span>
                          <button
                            onClick={() => handleCopy(inv.code)}
                            title="Copy code to clipboard"
                            className="p-1.5 rounded hover:bg-[#ffffff10] text-stone-500 hover:text-white transition"
                          >
                            {isCopied ? (
                              <Check className="w-3.5 h-3.5 text-[#10B981]" />
                            ) : (
                              <Copy className="w-3.5 h-3.5" />
                            )}
                          </button>
                        </div>
                      </td>

                      <td className="py-3.5 px-4 font-medium text-stone-900">
                        {inv.batchName || 'General Admission'}
                      </td>

                      <td className="py-3.5 px-4 text-center font-['Inter']">
                        <span className="font-bold text-stone-900">{inv.usedCount}</span>
                        <span className="text-stone-500"> / {inv.maxUses}</span>
                      </td>

                      <td className="py-3.5 px-4 text-stone-500 font-['Inter']">
                        {new Date(inv.expiresAt).toLocaleDateString()}
                      </td>

                      <td className="py-3.5 px-4">
                        <span
                          className={`text-[10px] font-bold px-2 py-0.5 rounded uppercase tracking-wider ${
                            statusLabel === 'ACTIVE'
                              ? 'bg-[#10B981]/15 text-[#10B981] border border-[#10B981]/30'
                              : statusLabel === 'EXPIRED'
                              ? 'bg-[#929BAA]/15 text-stone-500 border border-[#929BAA]/30'
                              : 'bg-[#F43F5E]/15 text-[#F43F5E] border border-[#F43F5E]/30'
                          }`}
                        >
                          {statusLabel}
                        </span>
                      </td>

                      <td className="py-3.5 px-4 text-right">
                        {statusLabel === 'ACTIVE' && (
                          <button
                            onClick={() => setRevokeConfirmCode(inv.code)}
                            className="px-2.5 py-1 rounded bg-[#F43F5E]/15 hover:bg-[#F43F5E] text-[#F43F5E] hover:text-white border border-[#F43F5E]/30 text-[11px] font-semibold transition"
                          >
                            Revoke
                          </button>
                        )}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Revoke Confirmation Modal */}
      {revokeConfirmCode && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-sm p-4">
          <div className="w-full max-w-sm rounded-2xl bg-white border border-[#F43F5E]/30 p-5 shadow-2xl relative animate-in zoom-in-95 duration-150">
            <h3 className="font-['Playfair_Display'] text-lg font-bold text-stone-900 mb-1">
              Revoke Invitation Code
            </h3>
            <p className="text-xs text-stone-500 mb-4">
              Are you sure you want to revoke code <span className="text-stone-900 font-mono font-bold">{revokeConfirmCode}</span>? Any students who attempt to register with it will be immediately denied access.
            </p>

            <div className="flex items-center justify-end gap-2 text-xs">
              <button
                onClick={() => setRevokeConfirmCode(null)}
                className="px-3 py-1.5 rounded-lg text-stone-500 hover:bg-white"
              >
                Cancel
              </button>
              <button
                onClick={() => handleRevoke(revokeConfirmCode)}
                className="px-4 py-1.5 rounded-lg bg-[#F43F5E] hover:bg-[#ff4d4f] text-white font-semibold shadow-[0_2px_10px_rgba(244,63,94,0.35)]"
              >
                Yes, Revoke Code
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Create Invitation Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-sm p-4">
          <div className="w-full max-w-md rounded-2xl bg-white border border-[#E3DFD9] p-6 shadow-2xl relative animate-in zoom-in-95 duration-150">
            <button
              onClick={() => setShowCreateModal(false)}
              className="absolute right-4 top-4 text-stone-500 hover:text-white"
            >
              <X className="w-4 h-4" />
            </button>

            <h3 className="font-['Playfair_Display'] text-xl font-bold text-stone-900 mb-1">
              Generate Enrollment Code
            </h3>
            <p className="text-xs text-stone-500 mb-5">
              Create a cryptographic code for authorized student onboarding.
            </p>

            <form onSubmit={handleCreate} className="space-y-4 text-xs">
              <div>
                <label className="block text-stone-500 font-medium mb-1">Target Batch *</label>
                <select
                  value={batchId}
                  onChange={(e) => setBatchId(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg bg-[#FAF8F5] border border-[#E3DFD9] text-stone-900 focus:outline-none focus:border-[#1677FF]"
                >
                  {batches.map((b) => (
                    <option key={b.id} value={b.id} className="bg-white">
                      {b.name} ({b.code})
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-stone-500 font-medium mb-1">Max Redemptions</label>
                  <input
                    type="number"
                    min={1}
                    max={200}
                    value={maxUses}
                    onChange={(e) => setMaxUses(Number(e.target.value))}
                    className="w-full px-3 py-2 rounded-lg bg-[#FAF8F5] border border-[#E3DFD9] text-stone-900 focus:outline-none focus:border-[#1677FF]"
                  />
                </div>
                <div>
                  <label className="block text-stone-500 font-medium mb-1">Validity (Days)</label>
                  <input
                    type="number"
                    min={1}
                    max={90}
                    value={expiryDays}
                    onChange={(e) => setExpiryDays(Number(e.target.value))}
                    className="w-full px-3 py-2 rounded-lg bg-[#FAF8F5] border border-[#E3DFD9] text-stone-900 focus:outline-none focus:border-[#1677FF]"
                  />
                </div>
              </div>

              <div className="pt-2 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="px-4 py-2 rounded-lg text-stone-500 hover:bg-white"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-5 py-2 rounded-lg bg-[#1677FF] hover:bg-[#3395FF] text-white font-semibold shadow-[0_2px_12px_rgba(22,119,255,0.35)] disabled:opacity-50"
                >
                  {isSubmitting ? 'Generating...' : 'Generate Code'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
