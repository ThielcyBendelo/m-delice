import { randomUUID } from 'crypto';

function simulatedResult(channel) {
  return {
    provider: 'simulation',
    channel,
    providerMessageId: `sim_${randomUUID()}`,
    status: 'accepted',
    simulated: true,
    acceptedAt: new Date().toISOString(),
  };
}

const simulationProvider = {
  name: 'simulation',

  async sendWhatsApp() {
    return simulatedResult('whatsapp');
  },

  async sendSms() {
    return simulatedResult('sms');
  },
};

export default simulationProvider;