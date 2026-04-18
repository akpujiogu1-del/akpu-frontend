import Link from "next/link";

export default function PendingPage() {
  return (
    <div className="min-h-screen bg-primary-50 flex items-center justify-center px-4">
      <div className="bg-white rounded-2xl shadow-lg p-10 w-full max-w-md text-center">
        <p className="text-5xl mb-4">⏳</p>
        <h1 className="text-2xl font-extrabold text-primary mb-3">Under Review</h1>
        <p className="text-gray-600 mb-2">
          Your KYC has been submitted and is currently being reviewed by the community admin.
        </p>
        <p className="text-gray-500 text-sm mb-6">
          You will receive access once your identity is verified. This usually takes 24-48 hours.
        </p>
        <div className="bg-primary-50 rounded-xl p-4 mb-6 border border-primary-100">
          <p className="text-primary text-sm font-semibold">What happens next?</p>
          <ul className="text-gray-600 text-sm mt-2 space-y-1 text-left">
            <li>✅ Your KYC details are reviewed by the admin</li>
            <li>✅ Once approved, you get full platform access</li>
            <li>✅ You can then join groups, post feeds and chat</li>
          </ul>
        </div>
        <Link href="/" className="inline-block bg-primary text-white px-6 py-2.5 rounded-lg font-semibold hover:bg-primary-dark transition text-sm">
          Back to Home
        </Link>
      </div>
    </div>
  );
}
