import Link from "next/link";

export default function SuspendedPage() {
  return (
    <div className="min-h-screen bg-primary-50 flex items-center justify-center px-4">
      <div className="bg-white rounded-2xl shadow-lg p-10 w-full max-w-md text-center">
        <p className="text-5xl mb-4">🚫</p>
        <h1 className="text-2xl font-extrabold text-red-600 mb-3">Account Suspended</h1>
        <p className="text-gray-600 mb-4">
          Your account has been suspended by the community admin. You cannot access the platform at this time.
        </p>
        <p className="text-gray-500 text-sm mb-6">
          If you believe this is a mistake, please contact the admin through the contact form on the homepage.
        </p>
        <Link href="/contact" className="inline-block bg-secondary text-white px-6 py-2.5 rounded-lg font-semibold hover:bg-secondary-dark transition text-sm">
          Contact Admin
        </Link>
      </div>
    </div>
  );
}
