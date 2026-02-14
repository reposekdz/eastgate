import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Home } from "lucide-react";

export default function NotFound() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-pearl px-4">
      <div className="text-center">
        <h1 className="text-9xl font-heading font-bold text-charcoal mb-4">404</h1>
        <h2 className="heading-lg text-charcoal mb-4">Page Not Found</h2>
        <p className="body-lg text-text-muted-custom mb-8 max-w-md mx-auto">
          The page you&apos;re looking for doesn&apos;t exist or has been moved.
        </p>
        <Button asChild className="bg-emerald hover:bg-emerald-dark">
          <Link href="/" className="flex items-center gap-2">
            <Home size={18} />
            Back to Home
          </Link>
        </Button>
      </div>
    </div>
  );
}
