import { ChevronLeft, ChevronRight } from 'lucide-react'

/**
 * Reusable Pagination component.
 *
 * @param {Object} props
 * @param {number} props.currentPage
 * @param {number} props.totalPages
 * @param {Function} props.onPageChange
 * @param {number} [props.totalItems]
 * @param {number} [props.pageSize]
 */
export default function Pagination({
  currentPage,
  totalPages,
  onPageChange,
  totalItems,
  pageSize,
}) {
  if (totalPages <= 1) return null

  // Calculate range e.g., 1–6 of 20
  const startItem = totalItems ? (currentPage - 1) * pageSize + 1 : 0
  const endItem = totalItems ? Math.min(currentPage * pageSize, totalItems) : 0

  // Generate page numbers array (with simple windowing if many pages)
  const getPageNumbers = () => {
    const pages = []
    const maxVisible = 5
    let start = Math.max(1, currentPage - 2)
    let end = Math.min(totalPages, start + maxVisible - 1)

    if (end - start + 1 < maxVisible) {
      start = Math.max(1, end - maxVisible + 1)
    }

    for (let i = start; i <= end; i++) {
      pages.push(i)
    }
    return pages
  }

  const pages = getPageNumbers()

  return (
    <nav className="pagination" aria-label="Pagination Navigation">
      {totalItems !== undefined && (
        <span className="pagination__info">
          Showing <strong>{startItem}</strong>–<strong>{endItem}</strong> of{' '}
          <strong>{totalItems}</strong>
        </span>
      )}

      <div className="pagination__controls">
        <button
          type="button"
          className="pagination__btn pagination__btn--nav"
          disabled={currentPage <= 1}
          onClick={() => onPageChange(currentPage - 1)}
          aria-label="Previous Page"
        >
          <ChevronLeft size={16} /> Prev
        </button>

        {pages[0] > 1 && (
          <>
            <button
              type="button"
              className={`pagination__btn ${currentPage === 1 ? 'pagination__btn--active' : ''}`}
              onClick={() => onPageChange(1)}
            >
              1
            </button>
            {pages[0] > 2 && <span className="pagination__ellipsis">…</span>}
          </>
        )}

        {pages.map((pageNum) => (
          <button
            key={pageNum}
            type="button"
            className={`pagination__btn ${currentPage === pageNum ? 'pagination__btn--active' : ''}`}
            onClick={() => onPageChange(pageNum)}
            aria-current={currentPage === pageNum ? 'page' : undefined}
          >
            {pageNum}
          </button>
        ))}

        {pages[pages.length - 1] < totalPages && (
          <>
            {pages[pages.length - 1] < totalPages - 1 && (
              <span className="pagination__ellipsis">…</span>
            )}
            <button
              type="button"
              className={`pagination__btn ${currentPage === totalPages ? 'pagination__btn--active' : ''}`}
              onClick={() => onPageChange(totalPages)}
            >
              {totalPages}
            </button>
          </>
        )}

        <button
          type="button"
          className="pagination__btn pagination__btn--nav"
          disabled={currentPage >= totalPages}
          onClick={() => onPageChange(currentPage + 1)}
          aria-label="Next Page"
        >
          Next <ChevronRight size={16} />
        </button>
      </div>
    </nav>
  )
}
