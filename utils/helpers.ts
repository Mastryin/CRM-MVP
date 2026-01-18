import { Lead } from '../types';

export const detectCountryCode = (phoneInput: string): string => {
  const digitsOnly = phoneInput.replace(/\D/g, '');
  
  if (phoneInput.startsWith('+91')) return '+91';
  if (phoneInput.startsWith('+1')) return '+1';
  if (phoneInput.startsWith('+44')) return '+44';
  if (phoneInput.startsWith('+61')) return '+61';
  
  if (digitsOnly.length === 10) return '+91'; // Default India
  if (digitsOnly.length === 11 && digitsOnly.startsWith('1')) return '+1';
  if (digitsOnly.length === 12 && digitsOnly.startsWith('91')) return '+91';
  
  return '+91';
};

export const normalizePhone = (phoneInput: string, countryCodeFromUI?: string): string => {
  const detectedCode = countryCodeFromUI && countryCodeFromUI !== '+91' 
      ? countryCodeFromUI 
      : detectCountryCode(phoneInput);
      
  const digitsOnly = phoneInput.replace(/\D/g, '');
  
  // Remove known country codes from the start of digits to avoid duplication
  // Regex to match start of string with common codes (91, 1, 44, 61)
  const withoutCode = digitsOnly.replace(/^(91|1|44|61)/, '');
  
  return `${detectedCode}${withoutCode}`;
};

export const validateEmail = (email: string): { valid: boolean; error?: string; warning?: string } => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    return { valid: false, error: 'Invalid email format' };
  }
  
  const disposableDomains = ['tempmail.com', '10minutemail.com', 'guerrillamail.com'];
  const domain = email.split('@')[1];
  if (disposableDomains.includes(domain)) {
    return { valid: false, error: 'Disposable email addresses not allowed' };
  }
  
  const commonTypos: Record<string, string> = {
    'gmial.com': 'gmail.com',
    'gmai.com': 'gmail.com',
    'yahooo.com': 'yahoo.com',
    'hotmial.com': 'hotmail.com'
  };
  
  if (commonTypos[domain]) {
    return { 
      valid: true, 
      warning: `Did you mean ${email.replace(domain, commonTypos[domain])}?` 
    };
  }
  
  return { valid: true };
};

export const sanitizeName = (nameInput: string): string => {
  // Allow letters (unicode), spaces, hyphens, apostrophes
  const allowed = /^[\p{L}\s\-']+$/u;
  if (!allowed.test(nameInput)) {
    return nameInput.replace(/[^\p{L}\s\-']/gu, '');
  }
  return nameInput.trim();
};

export const formatDate = (dateString: string) => {
  return new Date(dateString).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
};

export const generatePaymentLink = (serviceId: string, couponCode: string, lead: Lead) => {
  const baseUrl = `https://learn.mastry.in/web/checkout/${serviceId}`;
  const name = `${lead.first_name}+${lead.last_name}`.replace(/ /g, '+');
  const email = encodeURIComponent(lead.email);
  // Remove country code from the normalized phone
  const cleanPhone = lead.phone_normalized.replace(lead.country_code, '');
  
  const params = [
      couponCode ? `couponcode=${couponCode}` : '',
      `name=${name}`,
      `email=${email}`,
      `phone=${cleanPhone}`
  ].filter(Boolean).join('&');
  
  return `${baseUrl}?${params}`;
};

export const parseCSV = async (file: File): Promise<string[][]> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const text = e.target?.result as string;
      const lines = text.split('\n').map(line => line.trim()).filter(line => line);
      const rows = lines.map(line => line.split(',').map(cell => cell.trim()));
      resolve(rows);
    };
    reader.onerror = (e) => reject(e);
    reader.readAsText(file);
  });
};

export const replaceVariables = (text: string, lead: Lead, userFullName: string) => {
    return text
        .replace(/{{first_name}}/g, lead.first_name)
        .replace(/{{last_name}}/g, lead.last_name)
        .replace(/{{full_name}}/g, lead.full_name)
        .replace(/{{email}}/g, lead.email)
        .replace(/{{phone}}/g, lead.phone_normalized)
        .replace(/{{assigned_to_name}}/g, userFullName)
        .replace(/{{payment_link}}/g, 'https://learn.mastry.in/checkout/...');
};