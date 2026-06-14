/**
 * EMAIL: Transporteur + Triggers de commande
 * 
 * - onOrderCreated: Email admin + client à la création
 * - onOrderUpdated: Email client pour expédition et livraison
 */
const admin = require('firebase-admin');
const functions = require('firebase-functions/v1');
const nodemailer = require('nodemailer');
const { onDocumentCreated, onDocumentUpdated } = require('firebase-functions/v2/firestore');
const { GMAIL_EMAIL, GMAIL_PASSWORD } = require('../../helpers/secrets');
const { getSiteUrl } = require('../../helpers/config');
const { checkIsAdmin } = require('../../helpers/security');

const db = admin.firestore();

function escapeHtml(unsafe) {
    if (!unsafe || typeof unsafe !== 'string') return unsafe;
    return unsafe
         .replace(/&/g, "&amp;")
         .replace(/</g, "&lt;")
         .replace(/>/g, "&gt;")
         .replace(/"/g, "&quot;")
         .replace(/'/g, "&#039;");
}

function createTransporter() {
    return nodemailer.createTransport({
        service: 'gmail',
        auth: {
            user: GMAIL_EMAIL.value(),
            pass: GMAIL_PASSWORD.value()
        }
    });
}

/**
 * Envoi des emails de confirmation (Admin + Client)
 * Extrait en helper pour être réutilisé par onOrderCreated et onOrderUpdated
 */
async function sendNewOrderEmails(orderId, order) {
    const adminEmail = GMAIL_EMAIL.value();
    if (!adminEmail) {
        console.error("❌ Email non configuré (GMAIL_EMAIL manquant).");
        return;
    }

    const transporter = createTransporter();
    const clientEmail = order.userEmail || order.shipping?.email;
    const SITE_URL = getSiteUrl();

    const safeEmail = escapeHtml(clientEmail || "inconnu");
    const safeName = escapeHtml(order.shipping?.fullName || "inconnu");

    const itemsHtml = (order.items || []).map(item =>
        `<li>${item.quantity || 1}x <b>${escapeHtml(item.name || "Article")}</b> - ${item.price}€</li>`
    ).join('');

    const shippingInfo = order.shipping ?
        `${escapeHtml(order.shipping.address)}, ${escapeHtml(order.shipping.city)} (${escapeHtml(order.shipping.postalCode)})` : "Non spécifié";

    // Email Admin
    const adminMailOptions = {
        from: `Commerce Bot <${adminEmail}>`,
        to: adminEmail,
        subject: `🆕 Nouvelle Commande : ${order.total}€ (${safeName})`,
        html: `
            <h2>Nouvelle commande reçue !</h2>
            <p><b>Client :</b> ${safeName} (${safeEmail})</p>
            <p><b>Total :</b> ${order.total}€</p>
            <p><b>Paiement :</b> ${order.paymentMethod === 'stripe' || order.status === 'paid' ? 'Carte Bancaire (Validé)' : 'Différé (À encaisser)'}</p>
            <hr/>
            <h3>Articles :</h3>
            <ul>${itemsHtml}</ul>
            <hr/>
            <h3>Livraison :</h3>
            <p>${shippingInfo}</p>
            <p><a href="${SITE_URL}/admin">Aller au Dashboard</a></p>
        `
    };

    // Instructions paiement différé (si applicable)
    const paymentInstructions = (order.paymentMethod === 'deferred' || order.paymentMethod === 'manual' || order.status === 'pending_payment') ? `
        <div style="background: #fffbeb; border: 1px solid #fcd34d; padding: 20px; border-radius: 10px; margin: 20px 0;">
            <h3 style="color: #b45309; margin-top:0;">Instructions de règlement</h3>
            <p>Pour finaliser votre commande, merci d'effectuer le règlement par <b>Virement</b> ou autre moyen convenu.</p>
            <p style="font-size: 12px; color: #92400e;"><i>Votre commande sera expédiée dès réception du règlement.</i></p>
        </div>
    ` : '';

    // Email Client
    const clientMailOptions = clientEmail ? {
        from: `Votre Boutique <${adminEmail}>`,
        to: clientEmail,
        subject: `Confirmation de votre commande`,
        html: `
            <div style="font-family: sans-serif; color: #333; max-width: 600px;">
                <h1 style="color: #d97706;">Merci pour votre commande !</h1>
                <p>Bonjour ${escapeHtml(order.shipping?.fullName || '')},</p>
                <p>Nous avons bien reçu votre commande <b>#${orderId.slice(0, 8)}</b>.</p>
                
                ${paymentInstructions}

                <div style="background: #f5f5f4; padding: 20px; border-radius: 10px; margin: 20px 0;">
                    <h3 style="margin-top:0;">Récapitulatif</h3>
                    <ul>${itemsHtml}</ul>
                    <p><strong>Total : ${order.total}€</strong></p>
                </div>

                <p>Adresse de livraison :<br/>${shippingInfo}</p>
                
                <hr style="border:none; border-top:1px solid #eee; margin: 20px 0;" />
                <p>À très vite,<br/><i>L'équipe</i></p>
            </div>
        `
    } : null;

    try {
        await transporter.sendMail(adminMailOptions);
        console.log("✅ Email Admin envoyé.");
        if (clientMailOptions) {
            await transporter.sendMail(clientMailOptions);
            console.log("✅ Email Client envoyé à", clientEmail);
        }
    } catch (e) {
        console.error("❌ Erreur Envoi Email:", e);
    }
}

exports.sendTestEmail = functions.runWith({ secrets: [GMAIL_EMAIL, GMAIL_PASSWORD] }).https.onCall(async (data, context) => {
    checkIsAdmin(context);

    const adminEmail = GMAIL_EMAIL.value();
    const gmailPassword = GMAIL_PASSWORD.value();
    if (!adminEmail || !gmailPassword) {
        throw new functions.https.HttpsError('failed-precondition', 'Configuration email incomplète.');
    }

    const recipient = context.auth?.token?.email || adminEmail;
    const SITE_URL = getSiteUrl();
    const transporter = createTransporter();

    await transporter.sendMail({
        from: `Diagnostic Seconde Vie <${adminEmail}>`,
        to: recipient,
        subject: 'Diagnostic email Seconde Vie',
        html: `
            <div style="font-family: sans-serif; color: #1c1917; max-width: 600px;">
                <h1>Diagnostic email OK</h1>
                <p>Le transport Gmail des Cloud Functions est opérationnel.</p>
                <p>Projet : <a href="${SITE_URL}">${SITE_URL}</a></p>
                <p style="color:#78716c;font-size:12px;">Message généré par sendTestEmail.</p>
            </div>
        `
    });

    return { success: true, to: recipient };
});

// --- TRIGGER: Nouvelle Commande ---
exports.onOrderCreated = onDocumentCreated(
    { document: 'orders/{orderId}', region: 'europe-west1', secrets: [GMAIL_EMAIL, GMAIL_PASSWORD] },
    async (event) => {
        console.log("⚡ onOrderCreated TRIGGERED! ID:", event.params.orderId);
        const order = event.data?.data();
        if (!order) return null;

        // Si c'est une commande Stripe Elements "pending", on NE FAIT RIEN pour l'instant.
        // L'email sera envoyé via onOrderUpdated une fois le paiement confirmé (status => 'paid')
        if (order.paymentMethod === 'stripe_elements' && order.status === 'pending_payment') {
            console.log("⏸️ Commande pre-créée (Stripe Elements). On attend le paiement pour envoyer l'email.");
            return null;
        }

        // Pour les autres cas (paiement différé, ou ancienne commande stripe_checkout direct en paid)
        await sendNewOrderEmails(event.params.orderId, order);
        return null;
    }
);

// --- TRIGGER: Mise à jour commande (confirmation paiement, expédition, livraison) ---
exports.onOrderUpdated = onDocumentUpdated(
    { document: 'orders/{orderId}', region: 'europe-west1', secrets: [GMAIL_EMAIL, GMAIL_PASSWORD] },
    async (event) => {
        const orderBefore = event.data?.before?.data();
        const orderAfter = event.data?.after?.data();
        if (!orderBefore || !orderAfter) return null;
        const orderId = event.params.orderId;
        const clientEmail = orderAfter.userEmail || orderAfter.shipping?.email;

        // --- 1. EMAIL DE CONFIRMATION (Stripe Elements: pending_payment → paid) ---
        if (orderBefore.status === 'pending_payment' && orderAfter.status === 'paid') {
            console.log(`✅ Paiement confirmé pour la commande ${orderId}. Envoi de l'email de confirmation.`);
            await sendNewOrderEmails(orderId, orderAfter);
        }

        if (!clientEmail) return null;

        const adminEmail = GMAIL_EMAIL.value();
        const transporter = createTransporter();

        // --- 2. SHIPPED ---
        if (orderAfter.status === 'shipped' && orderBefore.status !== 'shipped') {
            try {
                await transporter.sendMail({
                    from: `Votre Boutique <${adminEmail}>`,
                    to: clientEmail,
                    subject: `📦 Votre commande a été expédiée !`,
                    html: `
                        <div style="font-family: sans-serif; color: #333; max-width: 600px;">
                            <h1 style="color: #4f46e5;">Bonne nouvelle !</h1>
                            <p>Bonjour ${escapeHtml(orderAfter.shipping?.fullName || '')},</p>
                            <p>Votre commande <b>#${orderId.slice(0, 8)}</b> vient d'être expédiée !</p>
                            ${orderAfter.trackingNumber ? `<p>📍 Numéro de suivi : <b>${escapeHtml(orderAfter.trackingNumber)}</b></p>` : ''}
                            <hr style="border:none; border-top:1px solid #eee; margin: 20px 0;" />
                            <p>À très vite,<br/><i>L'équipe</i></p>
                        </div>
                    `
                });
                console.log("✅ Email d'expédition envoyé à", clientEmail);
            } catch (e) {
                console.error("❌ Erreur Envoi Email d'expédition:", e);
            }
        }

        // --- COMPLETED (Delivered) ---
        if (orderAfter.status === 'completed' && orderBefore.status !== 'completed') {
            try {
                await transporter.sendMail({
                    from: `Votre Boutique <${adminEmail}>`,
                    to: clientEmail,
                    subject: `✨ Votre commande est arrivée !`,
                    html: `
                        <div style="font-family: 'Georgia', serif; color: #1c1917; max-width: 600px;">
                            <h1>Merci pour votre confiance !</h1>
                            <p>Bonjour ${escapeHtml(orderAfter.shipping?.fullName || '')},</p>
                            <p>Votre commande <b>#${orderId.slice(0, 8)}</b> a été livrée avec succès.</p>
                            <p>N'hésitez pas à nous laisser un avis !</p>
                            <hr style="border:none; border-top:1px solid #eee; margin: 20px 0;" />
                            <p>À très vite,<br/><i>L'équipe</i></p>
                        </div>
                    `
                });
                console.log("✅ Email de Livraison envoyé à", clientEmail);
            } catch (e) {
                console.error("❌ Erreur Envoi Email:", e);
            }
        }

        return null;
    }
);
