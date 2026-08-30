import { redirect } from "next/navigation";

export default function LegacyFulfillmentRedirect() {
  redirect("/admin/orders");
}
