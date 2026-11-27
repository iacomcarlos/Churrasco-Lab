import type { Metadata } from "next";
import { Admin } from "@/components/Admin";

export const metadata: Metadata = {
  title: "Área restrita | Churrasco LAB Brasília",
  description: "Área restrita da organização.",
  robots: { index: false, follow: false },
};

export default function Page() {
  return <Admin />;
}
