import type { ReactNode } from "react";
import "./globals.css";
import "./creator-role.css";
import "./ether.css";
import "./header-menu.css";
import "./donate-slide.css";

export default function RootLayout({ children }: { children: ReactNode }) {
  return children;
}
