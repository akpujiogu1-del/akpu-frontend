import Link from "next/link";

export default function RejectedPage() {
  return (
    <div className="min-h-screen bg-primary-50 flex items-center justify-center px-4">
      <div className="bg-white rounded-2xl shadow-lg p-10 w-full max-w-md text-center">
        <p className="text-5xl mb-4">❌</p>
        <h1 className="text-2xl font-extrabold text-red-600 mb-3">Application Rejected</h1>
        <p className="text-gray-600 mb-4">
          Your KYC application was not approved. This may be due to incomplete or unverifiable information.
        </p>
        <p className="text-gray-500 text-sm mb-6">
          Please contact the admin for clarification or to reapply with correct details.
        </p>
        <div className="flex gap-3 justify-center">
          <Link href="/contact" className="inline-block bg-secondary text-white px-6 py-2.5 rounded-lg font-semibold hover:bg-secondary-dark transition text-sm">
            Contact Admin
          </Link>
          <Link href="/" className="inline-block bg-primary text-white px-6 py-2.5 rounded-lg font-semibold hover:bg-primary-dark transition text-sm">
            Go Home
          </Link>
        </div>
      </div>
    </div>
  );
}
