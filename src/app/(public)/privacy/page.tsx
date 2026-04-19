import Link from "next/link";

export default function PrivacyPage() {
  return (
    <div className="max-w-3xl mx-auto px-4 py-12">
      <Link href="/" className="inline-flex items-center gap-2 mb-6 text-sm font-semibold hover:underline"
        style={{ color: "#6b3a1f" }}>← Back to Home</Link>
      <h1 className="text-3xl font-extrabold mb-2" style={{ color: "#2d6a2d" }}>Privacy Policy</h1>
      <p className="text-gray-500 text-sm mb-8">Last updated: April 2026</p>
      <div className="space-y-6 text-gray-700 text-sm leading-relaxed">
        <section>
          <h2 className="font-bold text-lg mb-2" style={{ color: "#2d6a2d" }}>1. Information We Collect</h2>
          <p>We collect your full name, date of birth, phone number, email address, village, and profile photo during registration and KYC. We also collect content you post on the platform including messages, comments, and poll votes.</p>
        </section>
        <section>
          <h2 className="font-bold text-lg mb-2" style={{ color: "#2d6a2d" }}>2. How We Use Your Information</h2>
          <p>Your information is used solely to operate the Akpu Community Platform, verify your identity as a community member, facilitate communication between members, and process community payments.</p>
        </section>
        <section>
          <h2 className="font-bold text-lg mb-2" style={{ color: "#2d6a2d" }}>3. Data Sharing</h2>
          <p>We do not sell or share your personal data with third parties. Your information is only visible to verified community members and platform administrators.</p>
        </section>
        <section>
          <h2 className="font-bold text-lg mb-2" style={{ color: "#2d6a2d" }}>4. Data Security</h2>
          <p>All data is stored securely using industry-standard encryption. Passwords are never stored in plain text. File access is password-protected and logged.</p>
        </section>
        <section>
          <h2 className="font-bold text-lg mb-2" style={{ color: "#2d6a2d" }}>5. Your Rights</h2>
          <p>You have the right to request access to your personal data, request correction of inaccurate data, or request deletion of your account by contacting the community admin.</p>
        </section>
        <section>
          <h2 className="font-bold text-lg mb-2" style={{ color: "#2d6a2d" }}>6. Contact</h2>
          <p>For privacy concerns, use the Contact Us page on this platform to reach the community admin.</p>
        </section>
      </div>
      <div className="mt-10 p-4 rounded-xl text-center text-sm text-gray-400"
        style={{ background: "#eaf5ea" }}>
        Akpu Community Platform · Brought to you by One Nation Agency Services
      </div>
    </div>
  );
}
EOFmkdir -p src/app/\(public\)/privacy
cat > src/app/\(public\)/privacy/page.tsx << 'EOF'
import Link from "next/link";

export default function PrivacyPage() {
  return (
    <div className="max-w-3xl mx-auto px-4 py-12">
      <Link href="/" className="inline-flex items-center gap-2 mb-6 text-sm font-semibold hover:underline"
        style={{ color: "#6b3a1f" }}>← Back to Home</Link>
      <h1 className="text-3xl font-extrabold mb-2" style={{ color: "#2d6a2d" }}>Privacy Policy</h1>
      <p className="text-gray-500 text-sm mb-8">Last updated: April 2026</p>
      <div className="space-y-6 text-gray-700 text-sm leading-relaxed">
        <section>
          <h2 className="font-bold text-lg mb-2" style={{ color: "#2d6a2d" }}>1. Information We Collect</h2>
          <p>We collect your full name, date of birth, phone number, email address, village, and profile photo during registration and KYC. We also collect content you post on the platform including messages, comments, and poll votes.</p>
        </section>
        <section>
          <h2 className="font-bold text-lg mb-2" style={{ color: "#2d6a2d" }}>2. How We Use Your Information</h2>
          <p>Your information is used solely to operate the Akpu Community Platform, verify your identity as a community member, facilitate communication between members, and process community payments.</p>
        </section>
        <section>
          <h2 className="font-bold text-lg mb-2" style={{ color: "#2d6a2d" }}>3. Data Sharing</h2>
          <p>We do not sell or share your personal data with third parties. Your information is only visible to verified community members and platform administrators.</p>
        </section>
        <section>
          <h2 className="font-bold text-lg mb-2" style={{ color: "#2d6a2d" }}>4. Data Security</h2>
          <p>All data is stored securely using industry-standard encryption. Passwords are never stored in plain text. File access is password-protected and logged.</p>
        </section>
        <section>
          <h2 className="font-bold text-lg mb-2" style={{ color: "#2d6a2d" }}>5. Your Rights</h2>
          <p>You have the right to request access to your personal data, request correction of inaccurate data, or request deletion of your account by contacting the community admin.</p>
        </section>
        <section>
          <h2 className="font-bold text-lg mb-2" style={{ color: "#2d6a2d" }}>6. Contact</h2>
          <p>For privacy concerns, use the Contact Us page on this platform to reach the community admin.</p>
        </section>
      </div>
      <div className="mt-10 p-4 rounded-xl text-center text-sm text-gray-400"
        style={{ background: "#eaf5ea" }}>
        Akpu Community Platform · Brought to you by One Nation Agency Services
      </div>
    </div>
  );
}
