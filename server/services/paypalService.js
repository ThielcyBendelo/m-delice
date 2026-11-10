/**
 * Client PayPal REST API v2 (Orders) — auth OAuth2 client_credentials.
 * Docs: https://developer.paypal.com/docs/api/orders/v2/
 */
function apiBase() {
  return String(process.env.PAYPAL_MODE || 'sandbox').toLowerCase() === 'live'
    ? 'https://api-m.paypal.com'
    : 'https://api-m.sandbox.paypal.com';
}

function assertConfigured() {
  if (!process.env.PAYPAL_CLIENT_ID || !process.env.PAYPAL_CLIENT_SECRET) {
    throw new Error('PayPal non configuré (PAYPAL_CLIENT_ID / PAYPAL_CLIENT_SECRET manquants).');
  }
}

async function getAccessToken() {
  assertConfigured();
  const auth = Buffer.from(`${process.env.PAYPAL_CLIENT_ID}:${process.env.PAYPAL_CLIENT_SECRET}`).toString('base64');
  const res = await fetch(`${apiBase()}/v1/oauth2/token`, {
    method: 'POST',
    headers: {
      Authorization: `Basic ${auth}`,
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: 'grant_type=client_credentials',
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data?.error_description || 'PayPal auth failed.');
  return data.access_token;
}

async function createOrder({ amount, currency = 'USD', txRef, returnUrl, cancelUrl }) {
  const token = await getAccessToken();
  const res = await fetch(`${apiBase()}/v2/checkout/orders`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      intent: 'CAPTURE',
      purchase_units: [{
        custom_id: txRef,
        amount: { currency_code: currency, value: Number(amount).toFixed(2) },
      }],
      application_context: {
        return_url: returnUrl,
        cancel_url: cancelUrl,
        user_action: 'PAY_NOW',
      },
    }),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data?.message || 'Création commande PayPal échouée.');
  return data;
}

async function captureOrder(orderId) {
  const token = await getAccessToken();
  const res = await fetch(`${apiBase()}/v2/checkout/orders/${orderId}/capture`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data?.message || 'Capture PayPal échouée.');
  return data;
}

/**
 * Vérifie la signature d'un webhook via l'API PayPal (nécessite PAYPAL_WEBHOOK_ID).
 */
async function verifyWebhookSignature(headers, body) {
  if (!process.env.PAYPAL_WEBHOOK_ID) return false;
  const token = await getAccessToken();
  const res = await fetch(`${apiBase()}/v1/notifications/verify-webhook-signature`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      transmission_id: headers['paypal-transmission-id'],
      transmission_time: headers['paypal-transmission-time'],
      cert_url: headers['paypal-cert-url'],
      auth_algo: headers['paypal-auth-algo'],
      transmission_sig: headers['paypal-transmission-sig'],
      webhook_id: process.env.PAYPAL_WEBHOOK_ID,
      webhook_event: body,
    }),
  });
  const data = await res.json();
  return res.ok && data?.verification_status === 'SUCCESS';
}

export default { createOrder, captureOrder, verifyWebhookSignature };
