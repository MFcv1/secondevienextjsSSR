'use strict';

const crypto = require('node:crypto');
const { jsPDF } = require('jspdf');
const { hashInvoice } = require('./manualInvoiceDomain');

const PDF_CONTENT_TYPE = 'application/pdf';
const MAX_PDF_BYTES = 2 * 1024 * 1024;

function formatMoney(cents) {
    return new Intl.NumberFormat('fr-FR', {
        style: 'currency',
        currency: 'EUR'
    }).format(Number(cents || 0) / 100);
}

function formatDate(value) {
    return new Intl.DateTimeFormat('fr-FR', {
        day: '2-digit', month: 'long', year: 'numeric', timeZone: 'UTC'
    }).format(new Date(`${value}T12:00:00.000Z`));
}

function customerName(customer) {
    if (customer.customerType === 'business') return customer.businessName;
    return [customer.firstName, customer.lastName].filter(Boolean).join(' ');
}

function addressLines(party) {
    return [
        party.address1,
        party.address2,
        [party.postalCode, party.city].filter(Boolean).join(' '),
        party.country
    ].filter(Boolean);
}

function safeFilename(number) {
    return `Facture_${String(number || 'BROUILLON').replace(/[^A-Za-z0-9_-]/g, '_')}.pdf`;
}

function drawWrapped(pdf, lines, x, y, maxWidth, lineHeight = 4.7) {
    let cursor = y;
    for (const value of lines.filter(Boolean)) {
        const wrapped = pdf.splitTextToSize(String(value), maxWidth).slice(0, 4);
        pdf.text(wrapped, x, cursor);
        cursor += wrapped.length * lineHeight;
    }
    return cursor;
}

function renderManualInvoicePdf(invoice, { draft = invoice.status !== 'issued' } = {}) {
    const pdf = new jsPDF({
        compress: true,
        putOnlyUsedFonts: true,
        unit: 'mm',
        format: 'a4'
    });
    const number = invoice.number || 'BROUILLON';
    const contentHash = hashInvoice(invoice);
    pdf.setLanguage('fr-FR');
    pdf.setProperties({
        title: draft ? 'Brouillon de facture' : `Facture ${number}`,
        subject: customerName(invoice.customer),
        author: invoice.seller.businessName,
        creator: 'Seconde Vie'
    });
    pdf.setCreationDate(new Date(`${invoice.issueDate}T12:00:00.000Z`));
    pdf.setFileId(crypto.createHash('sha256').update(contentHash).digest('hex').slice(0, 32).toUpperCase());

    const drawHeader = () => {
        pdf.setFillColor(28, 25, 23);
        pdf.rect(0, 0, 210, 33, 'F');
        pdf.setTextColor(255, 255, 255);
        pdf.setFont('helvetica', 'bold');
        pdf.setFontSize(18);
        pdf.text(invoice.seller.businessName, 15, 19);
        pdf.setTextColor(226, 138, 58);
        pdf.text('.', 15 + pdf.getTextWidth(invoice.seller.businessName), 19);
        pdf.setTextColor(255, 255, 255);
        pdf.setFontSize(9);
        pdf.text(draft ? 'BROUILLON DE FACTURE' : 'FACTURE', 195, 13, { align: 'right' });
        pdf.setFontSize(13);
        pdf.text(number, 195, 21, { align: 'right' });
    };

    drawHeader();
    pdf.setTextColor(28, 25, 23);
    pdf.setFont('helvetica', 'normal');
    pdf.setFontSize(8.5);
    let sellerY = 48;
    pdf.setFont('helvetica', 'bold');
    pdf.setFontSize(8);
    pdf.setTextColor(120, 113, 108);
    pdf.text('ÉMETTEUR', 15, sellerY);
    pdf.setTextColor(28, 25, 23);
    pdf.setFontSize(10);
    pdf.text(invoice.seller.legalName, 15, sellerY + 7);
    pdf.setFont('helvetica', 'normal');
    pdf.setFontSize(8.5);
    sellerY = drawWrapped(pdf, addressLines(invoice.seller), 15, sellerY + 13, 78);
    sellerY = drawWrapped(pdf, [invoice.seller.email, invoice.seller.phone], 15, sellerY + 1, 78);
    sellerY = drawWrapped(pdf, [
        `SIREN ${invoice.seller.siren}`,
        invoice.seller.siret ? `SIRET ${invoice.seller.siret}` : '',
        invoice.seller.legalForm
    ], 15, sellerY + 1, 78);

    let customerY = 48;
    pdf.setFont('helvetica', 'bold');
    pdf.setFontSize(8);
    pdf.setTextColor(120, 113, 108);
    pdf.text('FACTURÉ À', 112, customerY);
    pdf.setTextColor(28, 25, 23);
    pdf.setFontSize(10);
    pdf.text(customerName(invoice.customer), 112, customerY + 7);
    pdf.setFont('helvetica', 'normal');
    pdf.setFontSize(8.5);
    customerY = drawWrapped(pdf, addressLines(invoice.customer), 112, customerY + 13, 83);
    drawWrapped(pdf, [invoice.customer.email, invoice.customer.phone], 112, customerY + 1, 83);

    const metaY = Math.max(95, sellerY + 8, customerY + 14);
    pdf.setFillColor(247, 244, 238);
    pdf.roundedRect(15, metaY, 180, 19, 2, 2, 'F');
    const meta = [
        ['Date de facture', formatDate(invoice.issueDate)],
        ['Date de vente', formatDate(invoice.saleDate)],
        ['Échéance', formatDate(invoice.dueDate)]
    ];
    meta.forEach(([label, value], index) => {
        const x = 21 + index * 60;
        pdf.setFont('helvetica', 'normal');
        pdf.setFontSize(7.5);
        pdf.setTextColor(120, 113, 108);
        pdf.text(label, x, metaY + 6.5);
        pdf.setFont('helvetica', 'bold');
        pdf.setFontSize(8.5);
        pdf.setTextColor(28, 25, 23);
        pdf.text(value, x, metaY + 13);
    });

    let y = metaY + 31;
    const drawTableHeader = () => {
        pdf.setFillColor(28, 25, 23);
        pdf.rect(15, y, 180, 10, 'F');
        pdf.setTextColor(255, 255, 255);
        pdf.setFont('helvetica', 'bold');
        pdf.setFontSize(7.5);
        pdf.text('DÉSIGNATION', 20, y + 6.5);
        pdf.text('QTÉ', 140, y + 6.5, { align: 'right' });
        pdf.text('PRIX UNIT.', 166, y + 6.5, { align: 'right' });
        pdf.text('TOTAL', 191, y + 6.5, { align: 'right' });
        y += 10;
    };
    drawTableHeader();

    for (const line of invoice.lines) {
        const nameLines = pdf.splitTextToSize(line.name, 101).slice(0, 2);
        const descriptionLines = line.description
            ? pdf.splitTextToSize(line.description, 101).slice(0, 3)
            : [];
        const rowHeight = Math.max(15, 7 + nameLines.length * 4.5 + descriptionLines.length * 3.8);
        if (y + rowHeight > 252) {
            pdf.addPage();
            drawHeader();
            y = 45;
            drawTableHeader();
        }
        pdf.setDrawColor(222, 215, 204);
        pdf.line(15, y + rowHeight, 195, y + rowHeight);
        pdf.setTextColor(28, 25, 23);
        pdf.setFont('helvetica', 'bold');
        pdf.setFontSize(8.5);
        pdf.text(nameLines, 20, y + 6.5);
        if (descriptionLines.length) {
            pdf.setFont('helvetica', 'normal');
            pdf.setFontSize(7.5);
            pdf.setTextColor(120, 113, 108);
            pdf.text(descriptionLines, 20, y + 7 + nameLines.length * 4.5);
        }
        pdf.setTextColor(28, 25, 23);
        pdf.setFont('helvetica', 'normal');
        pdf.setFontSize(8.5);
        pdf.text(String(line.quantity), 140, y + 7, { align: 'right' });
        pdf.text(formatMoney(line.unitPriceCents), 166, y + 7, { align: 'right' });
        pdf.setFont('helvetica', 'bold');
        pdf.text(formatMoney(line.totalCents), 191, y + 7, { align: 'right' });
        y += rowHeight;
    }

    if (y > 229) {
        pdf.addPage();
        drawHeader();
        y = 49;
    }
    y += 10;
    const totalsX = 125;
    pdf.setFontSize(8.5);
    pdf.setFont('helvetica', 'normal');
    pdf.setTextColor(87, 83, 78);
    pdf.text('Sous-total HT', totalsX, y);
    pdf.text(formatMoney(invoice.subtotalCents), 195, y, { align: 'right' });
    if (invoice.vatCents > 0) {
        y += 8;
        pdf.text('TVA', totalsX, y);
        pdf.text(formatMoney(invoice.vatCents), 195, y, { align: 'right' });
    }
    y += 11;
    pdf.setDrawColor(28, 25, 23);
    pdf.line(totalsX, y - 6, 195, y - 6);
    pdf.setFont('helvetica', 'bold');
    pdf.setFontSize(12);
    pdf.setTextColor(28, 25, 23);
    pdf.text('Total', totalsX, y);
    pdf.text(formatMoney(invoice.totalCents), 195, y, { align: 'right' });

    y += 17;
    pdf.setFont('helvetica', 'bold');
    pdf.setFontSize(8.5);
    pdf.text('Règlement', 15, y);
    pdf.setFont('helvetica', 'normal');
    pdf.setFontSize(8);
    const payment = [invoice.paymentTerms, invoice.paymentMethod].filter(Boolean).join(' · ');
    pdf.text(pdf.splitTextToSize(payment, 105).slice(0, 3), 15, y + 6);
    if (invoice.notes) {
        pdf.setFont('helvetica', 'bold');
        pdf.text('Notes', 15, y + 20);
        pdf.setFont('helvetica', 'normal');
        pdf.text(pdf.splitTextToSize(invoice.notes, 105).slice(0, 5), 15, y + 26);
    }
    pdf.setFont('helvetica', 'normal');
    pdf.setFontSize(7.5);
    pdf.setTextColor(87, 83, 78);
    const legalMention = invoice.seller.vatMode === 'franchise'
        ? 'TVA non applicable, art. 293 B du CGI.'
        : invoice.seller.vatMode === 'margin'
            ? 'Régime particulier — Biens d’occasion.'
            : invoice.seller.vatNumber ? `TVA intracommunautaire : ${invoice.seller.vatNumber}` : '';
    pdf.text(legalMention, 195, y + 18, { align: 'right', maxWidth: 67 });

    const pageCount = pdf.getNumberOfPages();
    for (let page = 1; page <= pageCount; page += 1) {
        pdf.setPage(page);
        pdf.setDrawColor(222, 215, 204);
        pdf.line(15, 277, 195, 277);
        pdf.setTextColor(120, 113, 108);
        pdf.setFontSize(7);
        pdf.setFont('helvetica', 'normal');
        pdf.text(`${invoice.seller.businessName} · ${invoice.seller.email}`, 15, 283);
        pdf.text(`${number} · ${page}/${pageCount}`, 195, 283, { align: 'right' });
        if (draft) {
            pdf.setTextColor(180, 83, 9);
            pdf.setFontSize(7.5);
            pdf.text('BROUILLON — sans valeur comptable', 105, 291, { align: 'center' });
        }
    }

    const buffer = Buffer.from(pdf.output('arraybuffer'));
    if (buffer.length < 100 || buffer.length > MAX_PDF_BYTES) {
        const error = new Error('MANUAL_INVOICE_PDF_SIZE_INVALID');
        error.code = 'MANUAL_INVOICE_PDF_SIZE_INVALID';
        throw error;
    }
    return {
        buffer,
        filename: safeFilename(number),
        contentType: PDF_CONTENT_TYPE,
        sha256: crypto.createHash('sha256').update(buffer).digest('hex'),
        contentHash,
        size: buffer.length
    };
}

module.exports = {
    MAX_PDF_BYTES,
    PDF_CONTENT_TYPE,
    renderManualInvoicePdf
};
