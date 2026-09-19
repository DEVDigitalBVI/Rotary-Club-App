import { redirect } from "next/navigation";

/** Public registration is intentionally unavailable; accounts are invited. */
export default function SignupPage() {
  redirect("/login");
}
