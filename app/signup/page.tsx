import { SignupForm } from "@/components/signup-form"
import { AuthGuard } from "@/components/auth-guard";

export default function SignupPage() {
  return (
    <AuthGuard>
      <div className="flex min-h-svh w-full items-center justify-center p-6 md:p-10">
        <div className="w-full max-w-sm">
          <SignupForm />
        </div>
      </div>
    </AuthGuard>
  );
} 