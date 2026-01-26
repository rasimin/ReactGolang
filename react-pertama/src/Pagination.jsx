const React = window.React;

/**
 * Modern Pagination Component
 * 
 * @param {Object} props
 * @param {number} props.currentPage - Current active page (1-based)
 * @param {number} props.totalPages - Total number of pages
 * @param {Function} props.onPageChange - Callback when page changes (pageNumber) => void
 * @param {number} props.totalItems - Total number of items (optional, for display)
 * @param {number} props.itemsPerPage - Number of items per page (optional, for display)
 * @param {number} props.indexOfFirstItem - Index of first item being shown (optional, for display)
 * @param {number} props.indexOfLastItem - Index of last item being shown (optional, for display)
 */
export default function Pagination({ 
  currentPage, 
  totalPages, 
  onPageChange,
  totalItems,
  indexOfFirstItem,
  indexOfLastItem
}) {
  // Generate page numbers to display
  const getPageNumbers = () => {
    const maxButtons = 7;
    let startPage = Math.max(1, currentPage - Math.floor(maxButtons / 2));
    let endPage = startPage + maxButtons - 1;

    if (endPage > totalPages) {
      endPage = totalPages;
      startPage = Math.max(1, endPage - maxButtons + 1);
    }
    
    const pages = [];
    for (let i = startPage; i <= endPage; i++) {
      pages.push(i);
    }
    return pages;
  };

  const pages = getPageNumbers();

  return React.createElement('div', { className: 'd-flex justify-content-between align-items-center mt-4 border-top pt-3' }, [
    // Showing info
    totalItems !== undefined && React.createElement('div', { key: 'info', className: 'text-muted small' }, 
      `Showing ${indexOfFirstItem + 1} to ${Math.min(indexOfLastItem, totalItems)} of ${totalItems} entries`
    ),
    
    // Pagination Buttons
    React.createElement('nav', { key: 'nav', 'aria-label': 'Page navigation' }, 
      React.createElement('ul', { className: 'pagination pagination-modern mb-0' }, [
        // First Page
        React.createElement('li', { key: 'first', className: `page-item ${currentPage === 1 ? 'disabled' : ''}` },
          React.createElement('button', { 
            className: 'page-link', 
            onClick: () => onPageChange(1), 
            title: 'First Page',
            disabled: currentPage === 1
          }, 
            React.createElement('i', { className: 'fa-solid fa-angles-left' })
          )
        ),
        // Previous
        React.createElement('li', { key: 'prev', className: `page-item ${currentPage === 1 ? 'disabled' : ''}` },
          React.createElement('button', { 
            className: 'page-link', 
            onClick: () => onPageChange(Math.max(1, currentPage - 1)), 
            title: 'Previous',
            disabled: currentPage === 1
          }, 
            React.createElement('i', { className: 'fa-solid fa-chevron-left' })
          )
        ),
        
        // Page Numbers
        pages.map(page => 
          React.createElement('li', { key: page, className: `page-item ${currentPage === page ? 'active' : ''}` },
            React.createElement('button', { 
              className: 'page-link', 
              onClick: () => onPageChange(page) 
            }, page)
          )
        ),
        
        // Next
        React.createElement('li', { key: 'next', className: `page-item ${currentPage === totalPages || totalPages === 0 ? 'disabled' : ''}` },
          React.createElement('button', { 
            className: 'page-link', 
            onClick: () => onPageChange(Math.min(totalPages, currentPage + 1)), 
            title: 'Next',
            disabled: currentPage === totalPages || totalPages === 0
          }, 
            React.createElement('i', { className: 'fa-solid fa-chevron-right' })
          )
        ),
        // Last Page
        React.createElement('li', { key: 'last', className: `page-item ${currentPage === totalPages || totalPages === 0 ? 'disabled' : ''}` },
          React.createElement('button', { 
            className: 'page-link', 
            onClick: () => onPageChange(totalPages), 
            title: 'Last Page',
            disabled: currentPage === totalPages || totalPages === 0
          }, 
            React.createElement('i', { className: 'fa-solid fa-angles-right' })
          )
        )
      ])
    )
  ]);
}
