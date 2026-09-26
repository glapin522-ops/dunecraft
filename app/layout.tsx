import type { ReactNode } from "react";
import "./globals.css";
import "./creator-role.css";

export default function RootLayout({ children }: { children: ReactNode }) {
  return children;
}
