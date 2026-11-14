import React from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";

export const DataTable = ({
  columns,
  data,
  isLoading = false,
  emptyMessage = "No records found.",
  page = 1,
  totalPages = 1,
  onPageChange,
  totalRecords,
}) => {
  return (
    <div className="w-full rounded-2xl bg-charcoal-card border border-charcoal-border overflow-hidden shadow-lg">
      <div className="overflow-x-auto">
        <table className="w-full text-left text-sm text-alice">
          <thead className="bg-charcoal-elevated/70 text-xs uppercase tracking-wider text-alice-muted border-b border-charcoal-border">
            <tr>
              {columns.map((col, idx) => (
                <th
                  key={idx}
                  className={`py-3.5 px-4 font-semibold ${col.align === "right" ? "text-right" : col.align === "center" ? "text-center" : "text-left"} ${col.className || ""}`}
                >
                  {col.header}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-charcoal-border/50">
            {isLoading ? (
              <tr>
                <td colSpan={columns.length} className="py-12 text-center text-alice-muted">
                  <div className="flex items-center justify-center gap-2">
                    <div className="w-4 h-4 border-2 border-downy border-t-transparent rounded-full animate-spin" />
                    <span>Loading records...</span>
                  </div>
                </td>
              </tr>
            ) : data && data.length > 0 ? (
              data.map((row, rowIdx) => (
                <tr
                  key={row._id || rowIdx}
                  className="hover:bg-charcoal-elevated/40 transition-colors"
                >
                  {columns.map((col, colIdx) => (
                    <td
                      key={colIdx}
                      className={`py-3 px-4 ${col.align === "right" ? "text-right" : col.align === "center" ? "text-center" : "text-left"} ${col.className || ""}`}
                    >
                      {col.render ? col.render(row, rowIdx) : row[col.accessor]}
                    </td>
                  ))}
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={columns.length} className="py-10 text-center text-alice-muted text-sm">
                  {emptyMessage}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination Footer */}
      {(totalPages > 1 || totalRecords !== undefined) && (
        <div className="flex items-center justify-between px-4 py-3 border-t border-charcoal-border bg-charcoal-card/80 text-xs text-alice-muted">
          <div>
            {totalRecords !== undefined ? (
              <span>Showing {data?.length || 0} of {totalRecords} records</span>
            ) : (
              <span>Page {page} of {totalPages}</span>
            )}
          </div>
          {totalPages > 1 && (
            <div className="flex items-center gap-1.5">
              <button
                disabled={page <= 1}
                onClick={() => onPageChange && onPageChange(page - 1)}
                className="p-1.5 rounded-lg border border-charcoal-border text-alice hover:bg-charcoal-elevated disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <span className="px-2 font-medium text-alice">
                {page} / {totalPages}
              </span>
              <button
                disabled={page >= totalPages}
                onClick={() => onPageChange && onPageChange(page + 1)}
                className="p-1.5 rounded-lg border border-charcoal-border text-alice hover:bg-charcoal-elevated disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
