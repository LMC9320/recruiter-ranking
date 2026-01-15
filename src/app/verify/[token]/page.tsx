import { redirect } from "next/navigation";
import Link from "next/link";
import { CheckCircle, XCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { verifyToken } from "@/lib/actions/claims";

interface PageProps {
  params: Promise<{ token: string }>;
}

export default async function VerifyPage({ params }: PageProps) {
  const { token } = await params;
  const result = await verifyToken(token);

  if (result.success && result.companySlug) {
    redirect(`/companies/${result.companySlug}?verified=true`);
  }

  return (
    <div className="container py-16 max-w-lg">
      <Card>
        <CardContent className="py-12 text-center">
          {result.error ? (
            <>
              <XCircle className="mx-auto h-16 w-16 text-red-500 mb-4" />
              <h2 className="text-xl font-bold mb-2">Verification Failed</h2>
              <p className="text-muted-foreground mb-6">{result.error}</p>
              <Link href="/companies">
                <Button>Browse Companies</Button>
              </Link>
            </>
          ) : (
            <>
              <CheckCircle className="mx-auto h-16 w-16 text-green-500 mb-4" />
              <h2 className="text-xl font-bold mb-2">Verification Successful</h2>
              <p className="text-muted-foreground mb-6">
                Your company has been verified successfully.
              </p>
              <Link href="/companies">
                <Button>Browse Companies</Button>
              </Link>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
