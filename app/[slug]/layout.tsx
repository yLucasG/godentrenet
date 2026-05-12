import { Space_Grotesk, JetBrains_Mono } from "next/font/google";
import "./store.css";

const spaceGrotesk = Space_Grotesk({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-space",
  display: "swap",
});

const jetbrainsMono = JetBrains_Mono({
  subsets: ["latin"],
  weight: ["400", "500", "600"],
  variable: "--font-mono",
  display: "swap",
});

export default function StoreLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className={`${spaceGrotesk.variable} ${jetbrainsMono.variable}`}>
      {children}
    </div>
  );
}
