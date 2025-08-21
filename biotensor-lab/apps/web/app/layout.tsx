import "./globals.css";
import type { ReactNode } from "react";
import { PHProvider } from "../lib/posthog/PHProvider";

export const metadata = {
  title: "BioTensor Lab",
  description: "Multimodal biometrics platform — clinic-ready."
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <body>
        <PHProvider>
          {children}
        </PHProvider>
      </body>
    </html>
  );
}