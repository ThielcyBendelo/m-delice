import simulationProvider from './simulationProvider.js';
import twilioProvider from './twilioProvider.js';
import { normalizePhoneNumber, toWhatsAppAddress } from './phoneNumber.js';

const providers = new Map([
  ['simulation', simulationProvider],
  ['twilio', twilioProvider],
]);

const TEMPLATE_KEY_PATTERN = /^[a-z0-9][a-z0-9_.-]{0,79}$/;

function resolveProvider(providerName = process.env.MESSAGING_PROVIDER || 'simulation') {
  const provider = providers.get(String(providerName).trim().toLowerCase());
  if (!provider) {
    throw new Error(`Messaging provider is not available: ${providerName}`);
  }
  return provider;
}

function requireContent({ body, templateKey }) {
  if (!body && !templateKey) {
    throw new TypeError('body or templateKey is required.');
  }
  if (body && (typeof body !== 'string' || body.length > 4096)) {
    throw new TypeError('body must be a string of at most 4096 characters.');
  }
  if (templateKey && !TEMPLATE_KEY_PATTERN.test(templateKey)) {
    throw new TypeError('templateKey is invalid.');
  }
}

export function createMessagingService({
  providerName,
  defaultCallingCode = null,
} = {}) {
  const provider = () => resolveProvider(providerName);
  const callingCode = () => defaultCallingCode || process.env.MESSAGING_DEFAULT_CALLING_CODE || '243';

  return {
    get providerName() {
      return provider().name;
    },

    async sendWhatsApp({ to, body = null, templateKey = null, templateData = null }) {
      requireContent({ body, templateKey });
      return provider().sendWhatsApp({
        to: toWhatsAppAddress(to, callingCode()),
        body,
        templateKey,
        templateData,
      });
    },

    async sendSms({ to, body }) {
      if (!body || typeof body !== 'string' || body.length > 1600) {
        throw new TypeError('body must be a string of at most 1600 characters.');
      }
      return provider().sendSms({
        to: normalizePhoneNumber(to, callingCode()),
        body,
      });
    },
  };
}

const messagingService = createMessagingService();

export default messagingService;