export const metadata = {
  title: "Sign In | EastGate Hotel Rwanda",
  description: "Access your EastGate Hotel management dashboard",
};

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen grid grid-cols-1 lg:grid-cols-2">
      {/* Left: Image */}
      <div
        className="hidden lg:block relative bg-cover bg-center"
        style={{
          backgroundImage:
            "url(https://images.pexels.com/photos/28586227/pexels-photo-28586227.jpeg)",
        }}
      >
        <div className="absolute inset-0 bg-gradient-to-br from-charcoal/80 via-emerald-dark/60 to-charcoal/90" />
        <div className="relative z-10 flex h-full flex-col justify-between p-10">
          <div>
            <h2 className="heading-sm text-white tracking-wider">
              East<span className="text-gold">Gate</span>
            </h2>
          </div>
          <div className="max-w-md">
            <blockquote className="mb-4">
              <p className="body-lg text-white/90 italic leading-relaxed">
                &ldquo;Where luxury meets the heart of Africa — managing
                exceptional hospitality experiences across Rwanda.&rdquo;
              </p>
            </blockquote>
            <div className="h-[2px] w-12 bg-gold/60 mb-3" />
            <p className="body-sm text-white/60">
              Enterprise Hospitality Management Platform
            </p>
          </div>
        </div>
      </div>

      {/* Right: Form */}
      <div className="flex items-center justify-center bg-ivory p-6 sm:p-12">
        {children}
      </div>
    </div>
  );
}
