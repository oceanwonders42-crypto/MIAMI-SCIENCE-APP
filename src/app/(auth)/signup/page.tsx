import Link from "next/link";
import { SignupForm } from "./signup-form";
import { ROUTES } from "@/lib/constants";

export default function SignupPage() {
  return (
    <div className="space-y-6">
      <div className="text-center space-y-1">
        <h1 className="text-2xl font-semibold tracking-tight text-zinc-100">Create an account</h1>
        <p className="text-sm text-zinc-500">Join Miami Science Tracker</p>
      </div>
      <SignupForm />
      <p className="text-center text-sm text-zinc-500">
        Already have an account?{" "}
        <Link href={ROUTES.login} className="text-primary-400 hover:text-primary-300 transition-colors">
          Sign in
        </Link>
      </p>
    </div>
  );
}
