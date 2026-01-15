import Link from "next/link";
import { Building2 } from "lucide-react";

export function Footer() {
  return (
    <footer className="border-t bg-muted/50">
      <div className="container py-12">
        <div className="grid gap-8 md:grid-cols-4">
          <div className="space-y-4">
            <Link href="/" className="flex items-center gap-2">
              <Building2 className="h-6 w-6 text-primary" />
              <span className="font-bold">RecruiterRank</span>
            </Link>
            <p className="text-sm text-muted-foreground">
              Helping candidates and hiring managers find the best recruitment
              partners through transparent reviews.
            </p>
          </div>

          <div>
            <h3 className="font-semibold mb-4">For Candidates</h3>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li>
                <Link href="/companies" className="hover:text-foreground">
                  Browse Recruiters
                </Link>
              </li>
              <li>
                <Link href="/signup" className="hover:text-foreground">
                  Write a Review
                </Link>
              </li>
            </ul>
          </div>

          <div>
            <h3 className="font-semibold mb-4">For Companies</h3>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li>
                <Link href="/companies" className="hover:text-foreground">
                  Find Your Company
                </Link>
              </li>
              <li>
                <Link href="/signup" className="hover:text-foreground">
                  Claim Your Profile
                </Link>
              </li>
            </ul>
          </div>

          <div>
            <h3 className="font-semibold mb-4">Company</h3>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li>
                <Link href="#" className="hover:text-foreground">
                  About Us
                </Link>
              </li>
              <li>
                <Link href="#" className="hover:text-foreground">
                  Privacy Policy
                </Link>
              </li>
              <li>
                <Link href="#" className="hover:text-foreground">
                  Terms of Service
                </Link>
              </li>
            </ul>
          </div>
        </div>

        <div className="mt-8 pt-8 border-t text-center text-sm text-muted-foreground">
          <p>&copy; {new Date().getFullYear()} RecruiterRank. All rights reserved.</p>
        </div>
      </div>
    </footer>
  );
}
