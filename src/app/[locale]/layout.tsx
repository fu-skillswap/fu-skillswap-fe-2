import { AuthProvider } from "@/providers/AuthProvider";
import { QueryProvider } from "@/providers/QueryProvider";

export default function LocaleLayout({ children, params }: Readonly<{ children: React.ReactNode; params: Promise<{ locale: string }> }>) {
  void params;
  return <QueryProvider><AuthProvider>{children}</AuthProvider></QueryProvider>;
}
