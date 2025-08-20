export default function Page() {
  return (
    <main className="prose mx-auto max-w-3xl px-6 py-16">
      <h1>Privacy Policy</h1>
      <p><strong>Last updated:</strong> {new Date().toISOString().slice(0,10)}</p>
      <h2>Overview</h2>
      <p>This Policy explains how we collect, use, and share information. We design our marketing site to avoid collecting Protected Health Information (PHI).</p>
      <h2>What We Collect</h2>
      <ul>
        <li>Contact details you submit (e.g., name, work email, message)</li>
        <li>Usage data (pages visited, device info) — only with your cookie consent</li>
      </ul>
      <h2>How We Use Information</h2>
      <ul>
        <li>Provide and improve the site</li>
        <li>Respond to inquiries and provide demos</li>
        <li>Analyze usage (with consent) to improve content and performance</li>
      </ul>
      <h2>Cookies and Consent</h2>
      <p>We use a consent banner to control analytics and marketing cookies. You can update choices at any time.</p>
      <h2>Sharing</h2>
      <p>We may share with service providers (e.g., hosting, analytics, CRM, billing) under appropriate agreements. We do not sell personal information.</p>
      <h2>Data Retention</h2>
      <p>We retain information as needed for the purposes above or as required by law.</p>
      <h2>Your Rights</h2>
      <p>Depending on your location, you may have rights to access, correct, or delete your information. Contact privacy@medimetrics.com.</p>
      <h2>Security</h2>
      <p>We apply technical and organizational measures appropriate to the risk. No method of transmission or storage is 100% secure.</p>
      <h2>International Transfers</h2>
      <p>We may process data in the U.S. and other countries. We use appropriate safeguards where required.</p>
      <h2>Contact</h2>
      <p>privacy@medimetrics.com</p>
      <p><em>This sample is provided for informational purposes only and is not legal advice.</em></p>
    </main>
  );
}