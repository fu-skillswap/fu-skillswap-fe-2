import type { Metadata } from "next";
import "@/styles/globals.css";

export const metadata: Metadata = {
  title: "SkillSwap",
  description: "University skill exchange platform",
  icons: {
    icon: "https://fang-squad-69023135.figma.site/assets/SkillSwapLogo-1-geFhVeE4.png",
  },
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  // Browser extensions can add attributes to <html> before React hydrates.
  return <html lang="vi" suppressHydrationWarning><body>{children}</body></html>;
}
