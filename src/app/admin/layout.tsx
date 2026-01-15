import { redirect } from "next/navigation";
import Link from "next/link";
import { Shield, Building2, MessageSquare, FileCheck } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { Button } from "@/components/ui/button";

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("is_admin")
    .eq("id", user.id)
    .single();

  if (!profile?.is_admin) {
    redirect("/");
  }

  const navItems = [
    {
      href: "/admin",
      icon: Shield,
      label: "Overview",
    },
    {
      href: "/admin/claims",
      icon: FileCheck,
      label: "Verification Claims",
    },
    {
      href: "/admin/reviews",
      icon: MessageSquare,
      label: "Review Moderation",
    },
    {
      href: "/admin/companies",
      icon: Building2,
      label: "Companies",
    },
  ];

  return (
    <div className="container py-8">
      <div className="flex items-center gap-2 mb-8">
        <Shield className="h-6 w-6 text-primary" />
        <h1 className="text-2xl font-bold">Admin Panel</h1>
      </div>

      <div className="grid gap-8 lg:grid-cols-5">
        <nav className="lg:col-span-1 space-y-1">
          {navItems.map((item) => (
            <Link key={item.href} href={item.href}>
              <Button
                variant="ghost"
                className="w-full justify-start gap-2"
              >
                <item.icon className="h-4 w-4" />
                {item.label}
              </Button>
            </Link>
          ))}
        </nav>
        <div className="lg:col-span-4">{children}</div>
      </div>
    </div>
  );
}
