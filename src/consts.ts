export const SITE = {
  name: 'ailegalguard.com',
  title: 'ailegalguard.com | The AI Legal Guardian — Premium Domain',
  description:
    'ailegalguard.com — The first name typed when inquiring about AI legal issues. A premium domain for AI law, compliance, regulation, intellectual property, and legal protection in the age of artificial intelligence.',
  url: 'https://ailegalguard.com',
  locale: 'en_US',
  acquisitionEmail: 'sales@desertrich.com',
  updated: '2026-06-26',
} as const;

export const ACQUISITION_MAILTO = `mailto:${SITE.acquisitionEmail}?subject=${encodeURIComponent(
  `${SITE.name} — Domain Acquisition Inquiry`,
)}&body=${encodeURIComponent(
  'Hello,\n\nI am interested in acquiring ailegalguard.com. Please share availability, terms, and next steps.\n\n— ',
)}`;
