import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import KIT_CONFIG from '../kit/config/constants';
import { getMillis } from './time';

const formatMoney = (cents, currency = 'EUR') => (
    new Intl.NumberFormat('fr-FR', {
        style: 'currency',
        currency: String(currency || 'EUR').toUpperCase(),
    }).format((Number(cents) || 0) / 100)
);

const formatDate = (value) => {
    const millis = getMillis(value);
    return millis
        ? new Date(millis).toLocaleString('fr-FR', {
            dateStyle: 'long',
            timeStyle: 'short',
        })
        : 'Date indisponible';
};

const documentCopy = (document) => {
    if (document.kind === 'sandbox_refund_confirmation') {
        return {
            title: 'CONFIRMATION DE REMBOURSEMENT',
            amountLabel: 'Montant rembourse',
            amountCents: document.refundedCents,
            filename: 'Confirmation_remboursement',
        };
    }
    return {
        title: 'RECU DE PAIEMENT',
        amountLabel: 'Montant encaisse',
        amountCents: document.capturedCents,
        filename: 'Recu_paiement',
    };
};

export async function generateCommerceDocument(order, document) {
    const pdf = new jsPDF();
    const copy = documentCopy(document);
    const orderId = String(order.id || document.orderId || 'commande');
    const shortOrderId = orderId.slice(0, 12).toUpperCase();
    const customerName = order.customerSnapshot?.fullName
        || order.shippingSnapshot?.fullName
        || order.shipping?.fullName
        || order.userEmail
        || 'Client';

    pdf.setFont('helvetica', 'bold');
    pdf.setFontSize(17);
    pdf.text(KIT_CONFIG.brandName, 15, 20);
    pdf.setFontSize(16);
    pdf.text(copy.title, 195, 20, { align: 'right' });

    pdf.setFillColor(248, 238, 224);
    pdf.roundedRect(15, 30, 180, 18, 2, 2, 'F');
    pdf.setTextColor(126, 72, 26);
    pdf.setFontSize(10);
    pdf.text('DOCUMENT SANDBOX — NON FISCAL', 105, 41, { align: 'center' });
    pdf.setTextColor(0, 0, 0);

    pdf.setFont('helvetica', 'normal');
    pdf.setFontSize(10);
    pdf.text(`Commande : CMD-${shortOrderId}`, 15, 63);
    pdf.text(`Client : ${customerName}`, 15, 70);
    pdf.text(`Emission : ${formatDate(document.issuedAt)}`, 15, 77);
    pdf.text(`Reference document : ${document.documentId}`, 15, 84, {
        maxWidth: 180,
    });

    const rows = (order.items || []).map((item) => {
        const quantity = Number(item.quantity) || 1;
        const unitCents = Number.isSafeInteger(item.unitAmountCents)
            ? item.unitAmountCents
            : Math.round((Number(item.price) || 0) * 100);
        return [
            quantity,
            item.titleSnapshot || item.name || 'Article',
            formatMoney(unitCents, document.currency),
            formatMoney(unitCents * quantity, document.currency),
        ];
    });

    autoTable(pdf, {
        startY: 98,
        head: [['Qte', 'Designation', 'Prix unitaire', 'Montant']],
        body: rows.length ? rows : [['-', 'Commande enregistree', '-', '-']],
        theme: 'grid',
        headStyles: {
            fillColor: [35, 35, 35],
            textColor: [255, 255, 255],
        },
        styles: {
            font: 'helvetica',
            fontSize: 9,
            cellPadding: 4,
        },
        columnStyles: {
            0: { halign: 'center', cellWidth: 18 },
            2: { halign: 'right', cellWidth: 35 },
            3: { halign: 'right', cellWidth: 35 },
        },
    });

    const finalY = pdf.lastAutoTable.finalY + 12;
    pdf.setFont('helvetica', 'bold');
    pdf.setFontSize(12);
    pdf.text(copy.amountLabel, 145, finalY, { align: 'right' });
    pdf.text(
        formatMoney(copy.amountCents, document.currency),
        195,
        finalY,
        { align: 'right' }
    );

    pdf.setFont('helvetica', 'normal');
    pdf.setFontSize(9);
    pdf.setTextColor(90, 90, 90);
    pdf.text(
        'Ce document atteste une operation realisee en environnement de test. '
        + 'Il ne constitue ni une facture ni un avoir fiscal.',
        15,
        275,
        { maxWidth: 180 }
    );

    pdf.save(`${copy.filename}_${shortOrderId}.pdf`);
}
