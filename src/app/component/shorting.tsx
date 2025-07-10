import React from 'react';
import Loader from '@/app/component/loader';
import Empty from '@/app/component/empty';

interface SortableTableProps {
  headers: string[];
  data: any[];
  renderRow: (item: any) => React.ReactNode;
  sortBy: string;
  sortDirection: 'asc' | 'desc';
  handleSort: (column: string) => void;
  loading: boolean;  // New prop to track loading state
  renderHeaderCell?: (header: string, index: number) => React.ReactNode;
}

const SortableTable: React.FC<SortableTableProps> = ({
  headers,
  data,
  renderRow,
  sortBy,
  sortDirection,
  handleSort,
  loading, 
  renderHeaderCell,
}) => {
  // Define sortable columns
  const sortableColumns = ['id', 'name', 'email', 'type'];

  return (
    <div className="overflow-x-auto rounded-md">
      <table className="table w-full table-fixed">
      <thead>
  <tr>
    {headers.map((header, index) => {
      if (typeof renderHeaderCell === 'function') {
        return renderHeaderCell(header, index);
      }

      const columnKey = header.toLowerCase().replace(' ', '');
      return (
        <th
          key={index}
          className= 'cursor-pointer [&:nth-child(2n)]:w-[50px]'
          onClick={() => sortableColumns.includes(columnKey) && handleSort(columnKey)}
        >
          {header}
          {sortableColumns.includes(columnKey) && sortBy === columnKey && (
            <span className={`ml-2 ${sortDirection === 'asc' ? 'text-white' : 'text-white'}`}>
              {sortDirection === 'asc' ? '▲' : '▼'}
            </span>
          )}
        </th>
      );
    })}
  </tr>
</thead>

        <tbody>
          {loading ? (
            <tr>
              <td colSpan={headers.length} className="text-center py-10">
                <Loader /> {/* Loader displayed while fetching data */}
              </td>
            </tr>
          ) : data.length === 0 ? (
            <tr>
              <td colSpan={headers.length} className="text-center py-10 text-gray-500">
                <Empty />
              </td>
            </tr>
          ) : (
            data.map((item, index) => renderRow(item))
          )}
        </tbody>
      </table>
    </div>
  );
};

export default SortableTable;
