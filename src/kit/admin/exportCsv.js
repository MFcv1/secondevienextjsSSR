const CSV_FORMULA_PREFIX = /^[=+\-@\t\r]/;

function escapeCsvValue(value) {
    if (value === null || value === undefined) return '';
    const stringValue = String(value);
    const safeValue = CSV_FORMULA_PREFIX.test(stringValue) ? `'${stringValue}` : stringValue;
    return `"${safeValue.replace(/"/g, '""')}"`;
}

function sanitizeFilenamePart(value) {
    return String(value || '')
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .replace(/[^A-Za-z0-9._-]+/g, '_')
        .replace(/^_+|_+$/g, '')
        .slice(0, 80) || 'export';
}

export function downloadCsv(rows, filenameBase) {
    if (!Array.isArray(rows) || rows.length === 0) return false;

    const headers = Object.keys(rows[0]);
    const csv = [
        headers.map(escapeCsvValue).join(','),
        ...rows.map((row) => headers.map((header) => escapeCsvValue(row[header])).join(','))
    ].join('\r\n');

    const blob = new Blob([`\uFEFF${csv}`], { type: 'text/csv;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${sanitizeFilenamePart(filenameBase)}_${new Date().toISOString().split('T')[0]}.csv`;
    document.body.appendChild(link);
    link.click();
    link.remove();
    URL.revokeObjectURL(url);
    return true;
}
