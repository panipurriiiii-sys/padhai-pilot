'use client';

import * as React from 'react';
import { useMemo } from 'react';

export interface PaginationProps {
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
  totalItems?: number;
  pageSize?: number;
  onPageSizeChange?: (size: number) => void;
  pageSizeOptions?: number[];
  className?: string;
  showItemCount?: boolean;
}

/**
 * Enterprise-grade Pagination component matching the PadhaiPilot Paper-Desk design system.
 * Accessible, keyboard-navigable, and responsive.
 */
export function Pagination({
  currentPage,
  totalPages,
  onPageChange,
  totalItems,
  pageSize,
  onPageSizeChange,
  pageSizeOptions = [10, 25, 50],
  className = '',
  showItemCount = true,
}: PaginationProps) {
  if (totalPages <= 1 && (!totalItems || totalItems <= (pageSize || 10))) {
    return null;
  }

  // Generate page numbers with ellipsis window
  const pageNumbers = useMemo(() => {
    const pages: (number | 'ellipsis')[] = [];
    if (totalPages <= 7) {
      for (let i = 1; i <= totalPages; i++) pages.push(i);
    } else {
      pages.push(1);
      if (currentPage > 3) {
        pages.push('ellipsis');
      }
      const start = Math.max(2, currentPage - 1);
      const end = Math.min(totalPages - 1, currentPage + 1);
      for (let i = start; i <= end; i++) {
        pages.push(i);
      }
      if (currentPage < totalPages - 2) {
        pages.push('ellipsis');
      }
      pages.push(totalPages);
    }
    return pages;
  }, [currentPage, totalPages]);

  const startItem = totalItems && pageSize ? (currentPage - 1) * pageSize + 1 : 0;
  const endItem = totalItems && pageSize ? Math.min(currentPage * pageSize, totalItems) : 0;

  return (
    <nav
      role="navigation"
      aria-label="Pagination"
      className={`flex flex-col sm:flex-row items-center justify-between gap-3 pt-4 border-t border-[var(--pp-border)] text-xs text-[var(--pp-text-muted)] ${className}`}
    >
      {/* Item Range Count */}
      {showItemCount && totalItems !== undefined && pageSize !== undefined && (
        <div className="flex items-center gap-2">
          <span>
            Showing <strong className="text-[var(--pp-text)] font-semibold">{startItem}</strong>–
            <strong className="text-[var(--pp-text)] font-semibold">{endItem}</strong> of{' '}
            <strong className="text-[var(--pp-text)] font-semibold">{totalItems}</strong> items
          </span>

          {onPageSizeChange && (
            <div className="flex items-center gap-1.5 ml-2 pl-2 border-l border-[var(--pp-border)]">
              <span>Per page:</span>
              <select
                value={pageSize}
                onChange={(e) => onPageSizeChange(Number(e.target.value))}
                className="bg-[var(--pp-surface)] border border-[var(--pp-border)] rounded-md px-2 py-0.5 text-xs text-[var(--pp-text)] focus:border-[var(--pp-brand)] focus:outline-none"
              >
                {pageSizeOptions.map((opt) => (
                  <option key={opt} value={opt}>
                    {opt}
                  </option>
                ))}
              </select>
            </div>
          )}
        </div>
      )}

      {/* Page Buttons */}
      <div className="flex items-center gap-1">
        {/* Previous Button */}
        <button
          type="button"
          onClick={() => onPageChange(Math.max(1, currentPage - 1))}
          disabled={currentPage <= 1}
          aria-label="Previous Page"
          className="px-2.5 py-1 rounded-lg border border-[var(--pp-border)] bg-[var(--pp-surface)] text-[var(--pp-text)] hover:bg-[var(--pp-surface-warm)] disabled:opacity-40 disabled:cursor-not-allowed transition font-medium"
        >
          Previous
        </button>

        {/* Page Numbers */}
        <div className="flex items-center gap-1">
          {pageNumbers.map((item, idx) => {
            if (item === 'ellipsis') {
              return (
                <span key={`ellipsis-${idx}`} className="px-2 py-1 text-[var(--pp-text-muted)] select-none">
                  …
                </span>
              );
            }
            const isActive = item === currentPage;
            return (
              <button
                key={item}
                type="button"
                onClick={() => onPageChange(item)}
                aria-current={isActive ? 'page' : undefined}
                className={`min-w-[30px] h-[28px] px-2 rounded-lg text-xs font-semibold transition ${
                  isActive
                    ? 'bg-[var(--pp-brand)] text-white shadow-xs'
                    : 'border border-[var(--pp-border)] bg-[var(--pp-surface)] text-[var(--pp-text)] hover:bg-[var(--pp-surface-warm)]'
                }`}
              >
                {item}
              </button>
            );
          })}
        </div>

        {/* Next Button */}
        <button
          type="button"
          onClick={() => onPageChange(Math.min(totalPages, currentPage + 1))}
          disabled={currentPage >= totalPages}
          aria-label="Next Page"
          className="px-2.5 py-1 rounded-lg border border-[var(--pp-border)] bg-[var(--pp-surface)] text-[var(--pp-text)] hover:bg-[var(--pp-surface-warm)] disabled:opacity-40 disabled:cursor-not-allowed transition font-medium"
        >
          Next
        </button>
      </div>
    </nav>
  );
}

/**
 * Universal hook for client-side pagination of any dataset.
 * Automatically slices the array based on page and pageSize.
 */
export function usePagination<T>(items: T[], initialPageSize = 10) {
  const [currentPage, setCurrentPage] = React.useState(1);
  const [pageSize, setPageSize] = React.useState(initialPageSize);

  // Reset to page 1 if items length shrinks below current page range
  React.useEffect(() => {
    const maxPage = Math.max(1, Math.ceil(items.length / pageSize));
    if (currentPage > maxPage) {
      setCurrentPage(maxPage);
    }
  }, [items.length, pageSize, currentPage]);

  const totalPages = Math.max(1, Math.ceil(items.length / pageSize));

  const pagedItems = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return items.slice(start, start + pageSize);
  }, [items, currentPage, pageSize]);

  return {
    pagedItems,
    currentPage,
    totalPages,
    totalItems: items.length,
    pageSize,
    setPage: setCurrentPage,
    setPageSize,
    nextPage: () => setCurrentPage((p) => Math.min(totalPages, p + 1)),
    prevPage: () => setCurrentPage((p) => Math.max(1, p - 1)),
    canNext: currentPage < totalPages,
    canPrev: currentPage > 1,
  };
}

