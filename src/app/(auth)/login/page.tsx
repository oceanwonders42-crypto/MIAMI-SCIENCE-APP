import Link from "next/link";
import { LoginForm } from "./login-form";
import { LoginPasswordResetBanner } from "./login-password-reset-banner";
import { ROUTES } from "@/lib/constants";

export default function LoginPage() {
  return (
    <div className="space-y-6">
      <div className="text-center space-y-1">
        <h1 className="text-2xl font-semibold tracking-tight text-zinc-100">Welcome back</h1>
        <p className="text-sm text-zinc-500">Sign in to your Miami Science Tracker account</p>
      </div>
      <LoginPasswordResetBanner />
      <LoginForm />
      <p className="text-center text-sm text-zinc-500">
        Don&apos;t have an account?{" "}
        <Link href={ROUTES.signup} className="text-primary-400 hover:text-primary-300 transition-colors">
          Sign up
        </Link>
      </p>
      <p className="text-center text-sm">
        <Link href={ROUTES.forgotPassword} className="text-zinc-500 hover:text-zinc-400 transition-colors">
          Forgot password?
        </Link>
      </p>
    </div>
  );
}
