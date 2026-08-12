import secureAPIClient from '../utils/secureAPIClient';

function unwrap(response) {
  return response.data?.data || response.data || {};
}

const organizationService = {
  async list(filters = {}) {
    const params = new URLSearchParams();
    if (filters.q) params.set('q', filters.q);
    if (filters.type) params.set('type', filters.type);
    if (filters.includeArchived) params.set('includeArchived', 'true');
    const suffix = params.toString() ? `?${params.toString()}` : '';
    return unwrap(await secureAPIClient.get(`/admin/organizations${suffix}`));
  },

  async create(payload) {
    return unwrap(await secureAPIClient.post('/admin/organizations', payload));
  },

  async update(organizationId, payload) {
    return unwrap(await secureAPIClient.put(`/admin/organizations/${organizationId}`, payload));
  },

  async setActive(organizationId, active) {
    return unwrap(await secureAPIClient.patch(`/admin/organizations/${organizationId}/active`, { active }));
  },
};

export default organizationService;