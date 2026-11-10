import { normalizePhoneNumber, toWhatsAppAddress } from './phoneNumber.js';

function required(env, name) {
  const value = String(env[name] || '').trim();
  if (!value) throw new Error(`Missing Twilio configuration: ${name}`);
  return value;
}

function parseContentSids(value) {
  if (!value) return {};
  try {
    const parsed = JSON.parse(value);
    if (!parsed || Array.isArray(parsed) || typeof parsed !== 'object') throw new Error();
    return parsed;
  } catch {
    throw new Error('TWILIO_CONTENT_SIDS must be a JSON object.');
  }
}

function optionalHttpsUrl(value, name) {
  const raw = String(value || '').trim();
  if (!raw) return null;
  try {
    const url = new URL(raw);
    if (url.protocol !== 'https:') throw new Error();
    return url.toString();
  } catch {
    throw new Error(`${name} must be a valid HTTPS URL.`);
  }
}

function readConfig(env) {
  const accountSid = required(env, 'TWILIO_ACCOUNT_SID');
  const authToken = required(env, 'TWILIO_AUTH_TOKEN');
  const whatsappFrom = String(env.TWILIO_WHATSAPP_FROM || '').trim();
  const smsFrom = String(env.TWILIO_SMS_FROM || '').trim();
  const messagingServiceSid = String(env.TWILIO_MESSAGING_SERVICE_SID || '').trim();

  if (!/^AC[a-f0-9]{32}$/i.test(accountSid)) {
    throw new Error('TWILIO_ACCOUNT_SID is invalid.');
  }
  if (messagingServiceSid && !/^MG[a-f0-9]{32}$/i.test(messagingServiceSid)) {
    throw new Error('TWILIO_MESSAGING_SERVICE_SID is invalid.');
  }

  const defaultCallingCode = env.MESSAGING_DEFAULT_CALLING_CODE || '243';
  const whatsappNumber = whatsappFrom.replace(/^whatsapp:/i, '');

  return {
    accountSid,
    authToken,
    whatsappFrom: whatsappNumber ? toWhatsAppAddress(whatsappNumber, defaultCallingCode) : null,
    smsFrom: smsFrom ? normalizePhoneNumber(smsFrom, defaultCallingCode) : null,
    messagingServiceSid: messagingServiceSid || null,
    statusCallback: optionalHttpsUrl(env.TWILIO_STATUS_CALLBACK_URL, 'TWILIO_STATUS_CALLBACK_URL'),
    contentSids: parseContentSids(env.TWILIO_CONTENT_SIDS),
  };
}

function result(message, channel) {
  return {
    provider: 'twilio',
    channel,
    providerMessageId: message.sid,
    status: message.status || 'accepted',
    simulated: false,
    acceptedAt: message.dateCreated?.toISOString?.() || new Date().toISOString(),
  };
}

export function createTwilioProvider({
  env = process.env,
  clientFactory = null,
} = {}) {
  let clientPromise = null;

  async function client(config) {
    if (!clientPromise) {
      clientPromise = clientFactory
        ? Promise.resolve(clientFactory(config.accountSid, config.authToken))
        : import('twilio').then(({ default: twilio }) => twilio(config.accountSid, config.authToken));
    }
    return clientPromise;
  }

  return {
    name: 'twilio',

    async sendWhatsApp({ to, body, templateKey, templateData }) {
      const config = readConfig(env);
      if (!config.whatsappFrom) {
        throw new Error('Missing Twilio configuration: TWILIO_WHATSAPP_FROM');
      }
      const message = { to, from: config.whatsappFrom };

      if (templateKey) {
        const contentSid = config.contentSids[templateKey];
        if (!contentSid || !/^HX[a-f0-9]{32}$/i.test(contentSid)) {
          throw new Error(`No valid Twilio Content SID configured for template: ${templateKey}`);
        }
        message.contentSid = contentSid;
        if (templateData) message.contentVariables = JSON.stringify(templateData);
      } else {
        message.body = body;
      }
      if (config.statusCallback) message.statusCallback = config.statusCallback;

      const twilioClient = await client(config);
      return result(await twilioClient.messages.create(message), 'whatsapp');
    },

    async sendSms({ to, body }) {
      const config = readConfig(env);
      if (!config.smsFrom && !config.messagingServiceSid) {
        throw new Error('TWILIO_SMS_FROM or TWILIO_MESSAGING_SERVICE_SID is required.');
      }
      const message = { to, body };
      if (config.messagingServiceSid) message.messagingServiceSid = config.messagingServiceSid;
      else message.from = config.smsFrom;
      if (config.statusCallback) message.statusCallback = config.statusCallback;

      const twilioClient = await client(config);
      return result(await twilioClient.messages.create(message), 'sms');
    },
  };
}

const twilioProvider = createTwilioProvider();

export default twilioProvider;