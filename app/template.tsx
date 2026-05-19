import { AuthGate } from "@/components/AuthGate";

export default function Template({ children }: { children: React.ReactNode }) {
  return <AuthGate>{children}</AuthGate>;
}
