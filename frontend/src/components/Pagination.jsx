import React from 'react';

const Pagination = ({ currentPage, totalPages, onPageChange }) => {
  if (totalPages <= 1) return null;

  const getPaginationGroup = () => {
    if (totalPages <= 5) {
      return Array.from({ length: totalPages }, (_, i) => i + 1);
    }
    
    if (currentPage <= 3) {
      return [1, 2, 3, 4, '...', totalPages];
    }
    
    if (currentPage >= totalPages - 2) {
      return [1, '...', totalPages - 3, totalPages - 2, totalPages - 1, totalPages];
    }
    
    return [1, '...', currentPage - 1, currentPage, currentPage + 1, '...', totalPages];
  };

  const pages = getPaginationGroup();

  return (
    <div className="flex items-center gap-2">
      <button
        type="button"
        disabled={currentPage === 1}
        onClick={() => onPageChange(Math.max(1, currentPage - 1))}
        className="flex h-8 w-8 items-center justify-center rounded-full border border-gray-100 disabled:cursor-not-allowed disabled:opacity-40"
      >
        ‹
      </button>
      {pages.map((item, index) => {
        if (item === '...') {
          return (
            <span key={`ellipsis-${index}`} className="flex h-8 w-8 items-center justify-center text-gray-400">
              ...
            </span>
          );
        }
        return (
          <button
            key={`page-${item}`}
            type="button"
            onClick={() => onPageChange(item)}
            className={`flex h-8 w-8 items-center justify-center rounded-full ${
              currentPage === item ? 'bg-[#c70d1a] font-black text-white' : 'border border-gray-100 text-gray-600 hover:bg-gray-50'
            }`}
          >
            {item}
          </button>
        );
      })}
      <button
        type="button"
        disabled={currentPage === totalPages}
        onClick={() => onPageChange(Math.min(totalPages, currentPage + 1))}
        className="flex h-8 w-8 items-center justify-center rounded-full border border-gray-100 disabled:cursor-not-allowed disabled:opacity-40"
      >
        ›
      </button>
    </div>
  );
};

export default Pagination;
