import React from 'react';
import ReactPaginate from 'react-paginate';

interface PaginationProps {
  currentPage: number;
  totalPages: number;
  onPageChange: (selectedItem: { selected: number }) => void;
}

const Pagination: React.FC<PaginationProps> = ({
  currentPage,
  totalPages,
  onPageChange
}) => {
  if (totalPages <= 1) {
    return null;
  }

  return (
    <ReactPaginate
      previousLabel={'«'}
      nextLabel={'»'}
      breakLabel={'...'}
      breakClassName={'break-me'}
      pageCount={totalPages}
      marginPagesDisplayed={2}
      pageRangeDisplayed={5}
      onPageChange={onPageChange}
      containerClassName={'pagination'}
      activeClassName={'active'}
      forcePage={currentPage - 1}
    />
  );
};

export default Pagination;