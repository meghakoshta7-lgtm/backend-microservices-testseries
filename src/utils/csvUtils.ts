import { Response } from 'express';

export const sendCSV = (res: Response, filename: string, headers: string[], rows: string[][]): void => {
  const headerLine = headers.join(',');
  const dataLines = rows.map(row => row.join(','));
  const csv = [headerLine, ...dataLines].join('\n');
  res.setHeader('Content-Type', 'text/csv');
  res.setHeader('Content-Disposition', `attachment; filename=${filename}`);
  res.send(csv);
};

export const escapeCSV = (val: unknown): string => {
  if (val == null) return '';
  const str = String(val);
  if (str.includes(',') || str.includes('"') || str.includes('\n')) {
    return `"${str.replace(/"/g, '""')}"`;
  }
  return str;
};
