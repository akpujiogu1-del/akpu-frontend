import Link from "next/link";

export default function TermsPage() {
  return (
    <div className="max-w-3xl mx-auto px-4 py-12">
      <Link href="/" className="inline-flex items-center gap-2 mb-6 text-sm font-semibold hover:underline"
        style={{ color: "#6b3a1f" }}>← Back to Home</Link>
      <h1 className="text-3xl font-extrabold mb-2" style={{ color: "#2d6a2d" }}>Terms of Use</h1>
      <p className="text-gray-500 text-sm mb-8">Last updated: April 2026</p>
      <div className="space-y-6 text-gray-700 text-sm leading-relaxed">
        <section>
          <h2 className="font-bold text-lg mb-2" style={{ color: "#2d6a2d" }}>1. Acceptance</h2>
          <p>By accessing and using the Akpu Community Platform, you agree to be bound by these Terms of Use. If you do not agree, please do not use this platform.</p>
        </section>
        <section>
          <h2 className="font-bold text-lg mb-2" style={{ color: "#2d6a2d" }}>2. Eligibility</h2>
          <p>This platform is exclusively for indigenes and recognized members of Akpu Town, Orumba South LGA, Anambra State, Nigeria. All users must complete the KYC verification process and receive approval from the community admin.</p>
        </section>
        <section>
          <h2 className="font-bold text-lg mb-2" style={{ color: "#2d6a2d" }}>3. User Conduct</h2>
          <p>Users must not post offensive, defamatory, or misleading content. Users must treat all community members with respect. Misuse of the platform may result in suspension or removal.</p>
        </section>
        <section>
          <h2 className="font-bold text-lg mb-2" style={{ color: "#2d6a2d" }}>4. Content</h2>
          <p>All content posted on this platform remains the responsibility of the individual user. The platform administrators reserve the right to remove any content that violates community standards.</p>
        </section>
        <section>
          <h2 className="font-bold text-lg mb-2" style={{ color: "#2d6a2d" }}>5. Payments</h2>
          <p>All payments made through this platform (dues, levies, fines, donations) are final. Disputes must be raised with the community admin within 7 days of payment.</p>
        </section>
        <section>
          <h2 className="font-bold text-lg mb-2" style={{ color: "#2d6a2d" }}>6. Contact</h2>
          <p>For questions about these terms, contact us through the Contact Us page on this platform.</p>
        </section>
      </div>
      <div className="mt-10 p-4 rounded-xl text-center text-sm text-gray-400"
        style={{ background: "#eaf5ea" }}>
        Akpu Community Platform · Brought to you by One Nation Agency Services
      </div>
    </div>
  );
}
