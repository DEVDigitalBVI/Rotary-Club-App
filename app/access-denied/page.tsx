import { signOut } from "@/app/login/actions";
import { AuthHeader } from "@/components/auth/auth-header";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

export default function AccessDeniedPage() {
  return (
    <main className="flex min-h-dvh items-center justify-center bg-muted p-4">
      <Card className="w-full max-w-md">
        <CardContent className="flex flex-col gap-5 p-6 text-center sm:p-8">
          <AuthHeader label="Member portal" />
          <div>
            <h1 className="font-heading text-xl font-semibold text-foreground">
              Membership access required
            </h1>
            <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
              Your login is not linked to an active club roster record. Ask the
              club secretary to confirm your roster email or membership status.
            </p>
          </div>
          <form action={signOut}>
            <Button type="submit" variant="outline" className="w-full">
              Sign out
            </Button>
          </form>
        </CardContent>
      </Card>
    </main>
  );
}
