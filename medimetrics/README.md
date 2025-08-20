# MediMetrics Marketing Site (Next.js App Router)

**Features**: Advanced SEO, MDX blog, HubSpot contact with email fallback, Stripe Checkout, OG image, sitemap/robots, analytics provider, accessible UI.

## Quickstart

```bash
npm i
cp .env.example .env
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) to view the site.

## Build

```bash
npm run build && npm start
```

## Configure

- Set `BASE_URL` to your domain
- Create Stripe prices with nicknames `starter-monthly` and `pro-monthly`
- Set webhook secret at `/api/stripe/webhook`
- HubSpot: set `HUBSPOT_PORTAL_ID` & `HUBSPOT_FORM_ID` or remove from contact page
- Email fallback: configure SMTP_* vars
- Analytics: Configure PostHog and GA4 keys for tracking

## Project Structure

```
medimetrics/
├── app/                    # Next.js App Router pages
│   ├── api/               # API routes (Stripe, contact)
│   ├── blog/              # Blog pages
│   ├── legal/             # Legal pages (TOS, Privacy, BAA)
│   └── ...                # Other pages
├── components/            # React components
├── content/              # MDX blog content
├── lib/                  # Utility functions
└── public/               # Static assets
```

## Features

- **Modern UI**: Tailwind CSS with responsive design
- **SEO Optimized**: Metadata, OG images, sitemap, robots.txt
- **Analytics**: PostHog with A/B testing and GA4 with consent mode
- **Lead Capture**: HubSpot integration with email fallback
- **Monetization**: Stripe Checkout and webhook handling
- **Compliance**: GDPR cookie consent, HIPAA-ready content
- **Blog**: MDX support for rich content

## Deployment

Deploy to Vercel, Netlify, or any Node.js hosting platform:

```bash
npm run build
npm start
```

## License

© 2024 MediMetrics. All rights reserved.