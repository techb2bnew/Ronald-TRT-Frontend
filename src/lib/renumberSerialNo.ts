/**
 * Reassigns contiguous `serialNo` on table rows after optimistic delete (or any slice),
 * without refetching. `startSerial` is usually `(page - 1) * pageSize + 1` for paginated APIs.
 */
export function renumberSerialNo<T extends object>(
  rows: T[],
  startSerial = 1
): Array<T & { serialNo: number }> {
  return rows.map((row, index) => ({
    ...row,
    serialNo: startSerial + index,
  }));
}
