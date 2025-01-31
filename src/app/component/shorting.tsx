// components/shorting.tsx
import React from 'react';

interface SortableTableProps {
  headers: string[];
  data: any[];
  renderRow: (item: any) => React.ReactNode;
  sortBy: string;
  sortDirection: 'asc' | 'desc';
  handleSort: (column: string) => void;
}

const SortableTable: React.FC<SortableTableProps> = ({
  headers,
  data,
  renderRow,
  sortBy,
  sortDirection,
  handleSort,
}) => {
  // Define sortable columns
  const sortableColumns = ['id', 'name', 'email', 'phone number', 'pay rate', 'account status'];

  return (
    <div className="overflow-x-auto rounded-md">
      <table className="table w-full table-fixed">
        <thead>
          <tr>
            {headers.map((header, index) => {
              const columnKey = header.toLowerCase().replace(' ', '');
              return (
                <th
                  key={index}
                  onClick={() => sortableColumns.includes(columnKey) && handleSort(columnKey)}
                  className="cursor-pointer"
                >
                  {header}
                  {sortableColumns.includes(columnKey) && sortBy.toLowerCase() === columnKey && (
                    <span className={`ml-2 ${sortDirection === 'asc' ? 'text-green-500' : 'text-red-500'}`}>
                      {sortDirection === 'asc' ? '↑' : '↓'}
                    </span>
                  )}
                </th>
              );
            })}
          </tr>
        </thead>
        <tbody>
          {data.map((item, index) => renderRow(item))}
        </tbody>
      </table>
    </div>
  );
};

export default SortableTable;
