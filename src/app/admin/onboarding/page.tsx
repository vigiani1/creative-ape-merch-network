import { redirect } from "next/navigation";

export default function LegacyOnboardingRedirect() {
  redirect("/admin/products/new");
}
