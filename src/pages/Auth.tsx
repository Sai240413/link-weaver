import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { isSupabaseConfigured, supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";

const Auth = () => {
  const nav = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    document.title = "Sign in — URL Shortener";
    if (!isSupabaseConfigured) return;
    supabase.auth.getSession().then(({ data }) => { if (data.session) nav("/dashboard", { replace: true }); });
  }, [nav]);

  const signUp = async () => {
    if (!isSupabaseConfigured) {
      toast.error("Supabase environment variables are required for authentication.");
      return;
    }
    setLoading(true);
    const { error } = await supabase.auth.signUp({
      email, password,
      options: { emailRedirectTo: `${window.location.origin}/dashboard` },
    });
    setLoading(false);
    if (error) toast.error(error.message); else toast.success("Check your email to confirm your account");
  };

  const signIn = async () => {
    if (!isSupabaseConfigured) {
      toast.error("Supabase environment variables are required for authentication.");
      return;
    }
    setLoading(true);
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    setLoading(false);
    if (error) toast.error(error.message); else nav("/dashboard");
  };

  return (
    <main className="container flex min-h-screen items-center justify-center py-12">
      <Card className="w-full max-w-md p-6 shadow-[var(--shadow-elegant)]">
        <h1 className="mb-1 text-2xl font-semibold">Welcome</h1>
        <p className="mb-6 text-sm text-muted-foreground">Sign in or create an account to manage your URLs.</p>
        <Tabs defaultValue="signin">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="signin">Sign in</TabsTrigger>
            <TabsTrigger value="signup">Sign up</TabsTrigger>
          </TabsList>
          {["signin", "signup"].map((t) => (
            <TabsContent key={t} value={t} className="space-y-4 pt-4">
              <div className="space-y-2">
                <Label htmlFor={`email-${t}`}>Email</Label>
                <Input id={`email-${t}`} type="email" value={email} onChange={(e) => setEmail(e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label htmlFor={`pwd-${t}`}>Password</Label>
                <Input id={`pwd-${t}`} type="password" value={password} onChange={(e) => setPassword(e.target.value)} />
              </div>
              <Button className="w-full" disabled={loading} onClick={t === "signin" ? signIn : signUp}>
                {t === "signin" ? "Sign in" : "Create account"}
              </Button>
            </TabsContent>
          ))}
        </Tabs>
        <div className="mt-6 text-center text-sm text-muted-foreground">
          <Link to="/" className="hover:underline">← Back to home</Link>
        </div>
      </Card>
    </main>
  );
};

export default Auth;
