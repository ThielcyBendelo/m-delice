/**
 * Client PawaPay Merchant API v2 (agrégateur Mobile Money — Orange/Airtel/Vodacom M-Pesa/Afrimoney).
 * Docs: https://docs.pawapay.io/v2/api-reference/deposits/initiate-deposit
 */
function apiBase() {
  return String(process.env.PAWAPAY_ENV || 'sandbox').toLowerCase() === 'production'
    ? 'https://api.pawapay.io'
    : 'https://api.sandbox.pawapay.io';
}

function assertConfigured() {
  if (!process.env.PAWAPAY_API_TOKEN) {
    throw new Error('PawaPay non configuré (PAWAPAY_API_TOKEN manquant).');
  }
}

/**
 * @param {object} params
 * @param {string} params.depositId UUIDv4 unique généré côté serveur (idempotence)
 * @param {string} params.amount montant en string, ex: '15'
 * @param {string} params.currency ex: 'USD' ou 'CDF'
 * @param {string} params.phoneNumber MSISDN sans '+', ex: '243812345678'
 * @param {string} params.provider code opérateur PawaPay, ex: 'ORANGE_COD', 'AIRTEL_COD', 'VODACOM_MPESA_COD'
 * @param {string} [params.clientReferenceId] référence interne (ex: TransactionReference)
 */
async function initiateDeposit({ depositId, amount, currency = 'USD', phoneNumber, provider, clientReferenceId, customerMessage }) {
  assertConfigured();
  const res = await fetch(`${apiBase()}/v2/deposits`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${process.env.PAWAPAY_API_TOKEN}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      depositId,
      payer: { type: 'MMO', accountDetails: { phoneNumber, provider } },
      clientReferenceId,
      customerMessage: customerMessage || 'ESNAS ARCA',
      amount: String(amount),
      currency,
    }),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data?.failureReason?.failureMessage || 'Initiation dépôt PawaPay échouée.');
  return data;
}

async function checkDepositStatus(depositId) {
  assertConfigured();
  const res = await fetch(`${apiBase()}/v2/deposits/${depositId}`, {
    headers: { Authorization: `Bearer ${process.env.PAWAPAY_API_TOKEN}` },
  });
  const data = await res.json();
  if (!res.ok) throw new Error('Lecture statut dépôt PawaPay échouée.');
  return data;
}

/**
 * Prédit l'opérateur (provider) à partir d'un numéro de téléphone.
 */
async function predictProvider(phoneNumber) {
  assertConfigured();
  const res = await fetch(`${apiBase()}/v2/predict-provider`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${process.env.PAWAPAY_API_TOKEN}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ phoneNumber }),
  });
  const data = await res.json();
  if (!res.ok) throw new Error('Prédiction opérateur PawaPay échouée.');
  return data;
}

export default { initiateDeposit, checkDepositStatus, predictProvider };
