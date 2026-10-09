export const SITE = {
  name: 'ailegalguard.com',
  title: 'ailegalguard.com | Premium Domain for Sale | AI Legal Guard',
  description:
    'ailegalguard.com is for sale at $9,997 — a premium .com domain for AI law, compliance and legal protection. Escrow-protected transfer. Buy now or make an offer.',
  url: 'https://ailegalguard.com/',
  locale: 'en_US',
  acquisitionEmail: 'sales@desertrich.com',
  updated: '2026-10-09',
  price: '9997.00',
  priceDisplay: '$9,997',
  currency: 'USD',
} as const;

export const ACQUISITION_MAILTO = `mailto:${SITE.acquisitionEmail}?subject=${encodeURIComponent(
  `${SITE.name} — Domain Acquisition Inquiry`,
)}&body=${encodeURIComponent(
  'Hello,\n\nI am interested in acquiring ailegalguard.com. Please share availability, terms, and next steps.\n\n— ',
)}`;

export const BUY_MAILTO = `mailto:${SITE.acquisitionEmail}?subject=${encodeURIComponent(
  `${SITE.name} — Buy Now @ ${SITE.priceDisplay}`,
)}&body=${encodeURIComponent(
  `Hello,\n\nI would like to purchase ailegalguard.com at the listed price of ${SITE.priceDisplay} USD. Please send payment and transfer instructions.\n\nRegistra (name): \n\n— `,
)}`;

export const OFFER_MAILTO = `mailto:${SITE.acquisitionEmail}?subject=${encodeURIComponent(
  `${SITE.name} — Offer`,
)}&body=${encodeURIComponent(
  'Hello,\n\nI would like to make an offer for ailegalguard.com.\n\nMy offer (USD): \nPreferred timeline: \n\n— ',
)}`;

export interface FaqItem {
  q: string;
  a: string;
}

export const FAQ: FaqItem[] = [
  {
    q: 'Is ailegalguard.com actually available right now?',
    a: `Yes. ${SITE.name} is a single, one-of-one asset that is registered and available for immediate acquisition. There is no competing listing and no second copy — when it sells, it is gone.`,
  },
  {
    q: `What is the asking price?`,
    a: `The listed price is ${SITE.priceDisplay} USD, one-time, with no renewal fees owed to us. The price covers the domain name itself and the transfer of full ownership to you.`,
  },
  {
    q: 'How does the purchase and transfer actually work?',
    a: 'Funds are held by a licensed escrow service (Escrow.com) until the transfer completes. Once payment clears, the domain is unlocked, the auth/EPP code is released, and it is pushed or transferred to the registrar account you nominate. Most closings finish within one to seven days.',
  },
  {
    q: 'Can I make an offer below the asking price?',
    a: 'Yes. Serious, funded offers are reviewed personally. Use the inquiry form below with your offer and timeline, or reply directly to the confirmation email — we respond to qualified buyers within 24 hours.',
  },
  {
    q: 'What exactly do I receive when I buy?',
    a: 'You receive full ownership of the domain name ailegalguard.com, transferred to a registrar of your choice with a clean title. No website, content, trademark, social handles, or revenue is included unless separately agreed in writing.',
  },
  {
    q: 'Do you offer financing or staged payments?',
    a: 'Flexible terms — including staged payment on qualified offers — can be arranged through escrow. Ask when you inquire and we will structure something that works for both sides.',
  },
];
