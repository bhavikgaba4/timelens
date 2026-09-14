import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "TimeLens AI | Adaptive task-duration planner",
  description: "A local proof-of-concept planner with explainable duration predictions.",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="en"><body>{children}</body></html>;
}
