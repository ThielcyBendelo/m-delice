const E164_PATTERN = /^\+[1-9]\d{7,14}$/;

export function normalizePhoneNumber(value, defaultCallingCode = '243') {
  if (typeof value !== 'string' || !value.trim()) {
    throw new TypeError('A recipient phone number is required.');
  }

  const callingCode = String(defaultCallingCode).replace(/\D/g, '');
  if (!callingCode) {
    throw new TypeError('A valid default calling code is required.');
  }

  let normalized = value.trim().replace(/[\s().-]/g, '');
  if (normalized.startsWith('00')) {
    normalized = `+${normalized.slice(2)}`;
  } else if (normalized.startsWith('+')) {
    normalized = `+${normalized.slice(1).replace(/\D/g, '')}`;
  } else {
    const nationalNumber = normalized.replace(/\D/g, '').replace(/^0+/, '');
    normalized = `+${callingCode}${nationalNumber}`;
  }

  if (!E164_PATTERN.test(normalized)) {
    throw new TypeError('The recipient phone number is not a valid E.164 number.');
  }

  return normalized;
}

export function toWhatsAppAddress(value, defaultCallingCode = '243') {
  return `whatsapp:${normalizePhoneNumber(value, defaultCallingCode)}`;
}