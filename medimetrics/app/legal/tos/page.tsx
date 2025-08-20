export default function Page() {
  return (
    <main className="prose mx-auto max-w-3xl px-6 py-16">
      <h1>Terms of Service</h1>
      <p><strong>Last updated:</strong> {new Date().toISOString().slice(0,10)}</p>
      <p>These Terms govern your use of the MediMetrics website and related services. By accessing or using our site, you agree to these Terms.</p>
      <h2>Accounts</h2>
      <p>You are responsible for maintaining the confidentiality of your account credentials and for all activities under your account.</p>
      <h2>Acceptable Use</h2>
      <p>Do not misuse the Services, interfere with others' use, or attempt to access areas you are not authorized to access.</p>
      <h2>Medical Disclaimer</h2>
      <p>The Services are provided for investigational and clinical decision support. They are not a substitute for professional medical judgment. Regulated use may require appropriate clearances.</p>
      <h2>Intellectual Property</h2>
      <p>All content is owned by MediMetrics or its licensors. You may not copy, modify, or distribute without permission.</p>
      <h2>Privacy</h2>
      <p>Your use is subject to our <a href="/legal/privacy">Privacy Policy</a>.</p>
      <h2>Termination</h2>
      <p>We may suspend or terminate access for violations of these Terms.</p>
      <h2>Disclaimers & Limitation of Liability</h2>
      <p>Services are provided "as is" without warranties. To the maximum extent permitted by law, we are not liable for indirect or consequential damages.</p>
      <h2>Governing Law</h2>
      <p>These Terms are governed by the laws of the governing jurisdiction we specify in our ordering documents.</p>
      <h2>Contact</h2>
      <p>Questions? Contact us at legal@medimetrics.com.</p>
      <p><em>This sample is provided for informational purposes only and is not legal advice.</em></p>
    </main>
  );
}