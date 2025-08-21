export default function SecurityPage() {
  return (
    <main className="mx-auto max-w-4xl px-6 py-16">
      <h1 className="text-4xl font-semibold">Security & Compliance</h1>
      <ul className="mt-6 list-disc pl-6 space-y-2">
        <li>OIDC/SAML SSO, RBAC/ABAC</li>
        <li>PHI tokenization & field-level encryption</li>
        <li>Audit logs, immutable trails, backups</li>
        <li>Data residency & retention controls</li>
      </ul>
    </main>
  );
}