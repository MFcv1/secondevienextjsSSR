import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import KIT_CONFIG from '../kit/config/constants';

export const generateInvoice = async (order) => {
    return new Promise((resolve, reject) => {
        try {
            const doc = new jsPDF();

            // Set Font
            doc.setFont("helvetica");

            // --- HEADER ---
            // Left — Business info from env vars or KIT_CONFIG
            const bizName    = process.env.NEXT_PUBLIC_INVOICE_COMPANY_NAME || KIT_CONFIG.brandName;
            const bizAddress = process.env.NEXT_PUBLIC_INVOICE_ADDRESS       || process.env.NEXT_PUBLIC_BUSINESS_ADDRESS || '';
            const bizPhone   = process.env.NEXT_PUBLIC_INVOICE_PHONE         || process.env.NEXT_PUBLIC_BUSINESS_PHONE   || '';
            const bizSiren   = process.env.NEXT_PUBLIC_INVOICE_SIREN         || '';
            const bizLegal   = process.env.NEXT_PUBLIC_INVOICE_LEGAL         || '';
            const BANK_HOLDER = process.env.NEXT_PUBLIC_BANK_HOLDER          || KIT_CONFIG.brandName;

            doc.setFontSize(16);
            doc.setFont("helvetica", "bold");
            doc.text(bizName, 15, 20);

            doc.setFontSize(9);
            doc.setFont("helvetica", "normal");
            let y = 35;
            if (bizAddress) { doc.text(bizAddress, 15, y); y += 5; }
            if (bizPhone)   { doc.text(`Tel : ${bizPhone}`, 15, y); y += 5; }
            if (bizSiren)   { doc.text(`SIREN : ${bizSiren}`, 15, y); y += 5; }
            if (bizLegal)   { doc.text(`Forme juridique : ${bizLegal}`, 15, y); y += 5; }

            // Right
            doc.setFontSize(16);
            doc.setFont("helvetica", "bold");
            doc.text("FACTURE", 195, 20, { align: "right" });

            // --- CLIENT INFO ---
            const customerName = order.shipping?.fullName || order.userEmail || "Client";
            const customerAddress = order.shipping?.address || "";
            const customerCityZip = `${order.shipping?.zip || ""} ${order.shipping?.city || ""}`.trim();

            doc.setFontSize(9);
            doc.setFont("helvetica", "bold");
            doc.text("Facturé à", 15, 90);

            doc.setFont("helvetica", "normal");
            doc.text(customerName, 15, 96);
            if (customerAddress) doc.text(customerAddress, 15, 101);
            if (customerCityZip) doc.text(customerCityZip, 15, 106);

            // --- INVOICE INFO ---
            const invoiceDate = order.createdAt?.seconds ? new Date(order.createdAt.seconds * 1000).toLocaleDateString('fr-FR') : new Date().toLocaleDateString('fr-FR');
            const formatId = order.id ? order.id.slice(0, 8).toUpperCase() : 'N/A';

            doc.setFont("helvetica", "bold");
            doc.text("Facture n°", 150, 90);
            doc.text("Date", 150, 96);

            doc.setFont("helvetica", "normal");
            doc.text(formatId, 195, 90, { align: "right" });
            doc.text(invoiceDate, 195, 96, { align: "right" });

            // --- TABLE ---
            const tableData = (order.items || []).map(item => [
                item.quantity || 1,
                item.name || 'Article',
                `${(item.price || 0).toFixed(2).replace('.', ',')}`,
                `${((item.price || 0) * (item.quantity || 1)).toFixed(2).replace('.', ',')}`
            ]);

            autoTable(doc, {
                startY: 120,
                head: [['QTÉ', 'DÉSIGNATION', 'PRIX UNIT.', 'MONTANT']],
                body: tableData,
                theme: 'plain',
                headStyles: {
                    fontStyle: 'bold',
                    fillColor: [240, 240, 240],
                    textColor: [0, 0, 0],
                    halign: 'center'
                },
                columnStyles: {
                    0: { halign: 'center', cellWidth: 20 },
                    1: { halign: 'left' },
                    2: { halign: 'right', cellWidth: 35 },
                    3: { halign: 'right', cellWidth: 35 }
                },
                styles: {
                    font: "helvetica",
                    fontSize: 9,
                    cellPadding: 4,
                    lineColor: [220, 220, 220],
                    lineWidth: 0.1
                }
            });

            // TOTAL Block
            const finalY = doc.lastAutoTable.finalY;
            const totalWidth = 35;
            const totalFormatted = `${(order.total || 0).toFixed(2).replace('.', ',')} €`;

            doc.setFont("helvetica", "bold");
            doc.setFontSize(11);
            doc.text("TOTAL", 150, finalY + 8, { align: "right" });

            // Total box
            doc.setFillColor(240, 240, 240);
            doc.rect(160, finalY, totalWidth, 12, 'F');
            doc.text(totalFormatted, 190, finalY + 8, { align: 'right' });


            // --- FOOTER ---
            const pageHeight = doc.internal.pageSize.height || doc.internal.pageSize.getHeight();
            let currentTempY = pageHeight - 65;

            doc.setFontSize(9);
            doc.setFont("helvetica", "bold");
            doc.text("Conditions et modalités de paiement", 15, currentTempY);

            const bizLegalStatus = process.env.NEXT_PUBLIC_INVOICE_LEGAL   || '';
            const bizIban        = process.env.NEXT_PUBLIC_BUSINESS_IBAN   || '';
            const bizBic         = process.env.NEXT_PUBLIC_BUSINESS_BIC    || '';

            doc.setFont("helvetica", "normal");
            if (bizLegalStatus) { doc.text(bizLegalStatus, 15, currentTempY + 5); }
            doc.text("TVA non applicable article 293B du CGI", 15, currentTempY + 10);

            if (bizIban || bizBic) {
                doc.text("Références bancaires", 15, currentTempY + 20);
                if (BANK_HOLDER) doc.text(BANK_HOLDER, 15, currentTempY + 25);
                if (bizIban) { doc.text("IBAN", 15, currentTempY + 30); doc.text(bizIban, 15, currentTempY + 35); }
                if (bizBic)  { doc.text("BIC",  15, currentTempY + 40); doc.text(bizBic,  15, currentTempY + 45); }
            }

            // Simulate artificial loading UX just for the wow factor
            setTimeout(() => {
                doc.save(`Facture_${formatId}.pdf`);
                resolve(true);
            }, 1000);
        } catch (error) {
            reject(error);
        }
    });
};
