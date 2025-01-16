// components/Pagination.tsx
import React from 'react';

interface PaginationProps {
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
}

const Pagination: React.FC<PaginationProps> = ({ currentPage, totalPages, onPageChange }) => {
  return (
    <div className="btn-group text-right mt-5">
      <button onClick={() => onPageChange(1)} className="btn mr-3">«</button>
      {Array.from({ length: totalPages }, (_, i) => (
        <button
          key={i}
          className={`btn-pagination ${i + 1 === currentPage ? 'btn-active' : ''}`}
          onClick={() => onPageChange(i + 1)}
        >
          {i + 1}
        </button>
      ))}
      <button onClick={() => onPageChange(totalPages)} className="btn ml-3">»</button>
    </div>
  );
};

export default Pagination;
