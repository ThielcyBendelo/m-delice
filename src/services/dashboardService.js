import secureAPIClient from '../utils/secureAPIClient';

function unwrap(response) {
  return (response && response.data && response.data.data) ? response.data.data : (response && response.data) ? response.data : {};
}

const dashboardService = {
  async getStats() {
    const response = await secureAPIClient.get('/admin/stats');
    return unwrap(response);
  },

  async getRecentPolicies() {
    const response = await secureAPIClient.get('/admin/recent-policies');
    return unwrap(response);
  },

  async getBeneficiaries(params) {
    const q = new URLSearchParams();
    if (params && params.q) q.set('q', params.q);
    if (params && params.city && params.city !== 'Tous') q.set('city', params.city);
    const suffix = q.toString() ? ('?' + q.toString()) : '';
    const response = await secureAPIClient.get('/admin/beneficiaries' + suffix);
    return unwrap(response);
  },

  async getSubscribers(params) {
    const q = new URLSearchParams();
    if (params && params.q) q.set('q', params.q);
    if (params && params.country && params.country !== 'Tous') q.set('country', params.country);
    const suffix = q.toString() ? ('?' + q.toString()) : '';
    const response = await secureAPIClient.get('/admin/subscribers' + suffix);
    return unwrap(response);
  },

  async getPayments() {
    const response = await secureAPIClient.get('/payments');
    return unwrap(response);
  },

  async getPolicies() {
    const response = await secureAPIClient.get('/policies');
    return unwrap(response);
  },

  async getClaims(params) {
    const q = new URLSearchParams();
    if (params && params.status) q.set('status', params.status);
    if (params && params.policyNumber) q.set('policyNumber', params.policyNumber);
    const suffix = q.toString() ? ('?' + q.toString()) : '';
    const response = await secureAPIClient.get('/claims' + suffix);
    return unwrap(response);
  },

  async updateClaimStatus(claimNumber, body) {
    const response = await secureAPIClient.patch(
      '/claims/' + encodeURIComponent(claimNumber) + '/status',
      body || {}
    );
    return unwrap(response);
  },

  async updateUserRole(userId, role) {
    const response = await secureAPIClient.patch('/admin/users/' + encodeURIComponent(userId) + '/role', { role });
    return unwrap(response);
  },

  async setUserActive(userId, active) {
    const response = await secureAPIClient.patch('/admin/users/' + encodeURIComponent(userId) + '/active', { active });
    return unwrap(response);
  },

  async verifyPolicy(policyNumber) {
    const response = await secureAPIClient.get('/admin/verify/policy/' + encodeURIComponent(policyNumber));
    return unwrap(response);
  },

  async verifyBeneficiary(q) {
    const response = await secureAPIClient.get('/admin/verify/beneficiary?q=' + encodeURIComponent(q));
    return unwrap(response);
  },

  async getAdminOverview() {
    const response = await secureAPIClient.get('/admin/overview');
    return unwrap(response);
  },

  async getHealthDb() {
    const response = await secureAPIClient.get('/admin/health-db');
    return unwrap(response);
  },

  async getAuditLogs(limit) {
    const suffix = limit ? ('?limit=' + encodeURIComponent(limit)) : '';
    const response = await secureAPIClient.get('/admin/audit' + suffix);
    return unwrap(response);
  },

  async getInvoices(params) {
    const q = new URLSearchParams();
    if (params && params.q) q.set('q', params.q);
    if (params && params.status) q.set('status', params.status);
    const suffix = q.toString() ? ('?' + q.toString()) : '';
    const response = await secureAPIClient.get('/invoices' + suffix);
    return unwrap(response);
  },

  async getInvoice(txRef) {
    const response = await secureAPIClient.get('/invoices/' + encodeURIComponent(txRef));
    return unwrap(response);
  },

  /**
   * Ouvre la quittance HTML (auth Bearer) dans un nouvel onglet pour impression / PDF.
   */
  async openInvoicePrint(txRef) {
    const response = await secureAPIClient.get(
      '/invoices/' + encodeURIComponent(txRef) + '/print',
      { responseType: 'text', headers: { Accept: 'text/html' } }
    );
    const html = typeof response.data === 'string' ? response.data : String(response.data || '');
    if (!html || html.length < 20) {
      throw new Error('Quittance HTML vide.');
    }
    const blob = new Blob([html], { type: 'text/html;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const w = window.open(url, '_blank', 'noopener,noreferrer');
    if (!w) {
      // popup bloquée : téléchargement
      const a = document.createElement('a');
      a.href = url;
      a.download = `quittance-${txRef}.html`;
      document.body.appendChild(a);
      a.click();
      a.remove();
    }
    setTimeout(() => URL.revokeObjectURL(url), 60_000);
    return { success: true };
  },
};

export default dashboardService;
