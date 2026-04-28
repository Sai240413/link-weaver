import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { toast } from "sonner";
import { Copy, Link2, LogIn, LogOut, LayoutDashboard } from "lucide-react";

const FUNCTIONS_BASE = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1`;

const Index = () => {
  const [longUrl, setLongUrl] = useState("");
  const [isPrivate, setIsPrivate] = useState(false);
  const [loading, setLoading] = useState(false);
  const [shortUrl, setShortUrl] = useState<string | null>(null);
  const [session, setSession] = useState<unknown>(null);

  useEffect(() => {
    document.title = "URL Shortener — Short, fast, secure links";
    supabase.auth.getSession().then(({ data }) => setSession(data.session));
    const { data: sub } = supabase.auth.onAuthStateChange((_e, s) => setSession(s));
    return () => sub.subscription.unsubscribe();
  }, []);

  const shorten = async () => {
    if (!longUrl.trim()) return;
    setLoading(true);
    setShortUrl(null);
    try {
      const { data, error } = await supabase.functions.invoke("shorten", {
        body: { longUrl: longUrl.trim(), isPrivate },
      });
      if (error) throw error;
      const code = (data as { shortCode: string }).shortCode;
      const url = `${FUNCTIONS_BASE}/redirect/${code}`;
      setShortUrl(url);
      toast.success("Short URL created");
    } catch (e) {
      toast.error((e as Error).message ?? "Failed to shorten");
    } finally {
      setLoading(false);
    }
  };

  const copy = async () => {
    if (!shortUrl) return;
    await navigator.clipboard.writeText(shortUrl);
    toast.success("Copied to clipboard");
  };

  return (
    <main className="min-h-screen bg-background">
      <header className="container flex items-center justify-between py-6">
        <div className="flex items-center gap-2 font-semibold">
          <Link2 className="h-5 w-5 text-primary" />
          <span>Shorten</span>
        </div>
        <nav className="flex items-center gap-2">
          {session ? (
            <>
              <Button asChild variant="ghost" size="sm">
                <Link to="/dashboard"><LayoutDashboard className="mr-2 h-4 w-4" />Dashboard</Link>
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={async () => { await supabase.auth.signOut(); toast.success("Signed out"); }}
              >
                <LogOut className="mr-2 h-4 w-4" />Sign out
              </Button>
            </>
          ) : (
            <Button asChild size="sm">
              <Link to="/auth"><LogIn className="mr-2 h-4 w-4" />Sign in</Link>
            </Button>
          )}
        </nav>
      </header>

      <section className="container flex flex-col items-center pt-12 pb-20 text-center">
        <h1 className="bg-[image:var(--gradient-primary)] bg-clip-text text-5xl font-bold tracking-tight text-transparent md:text-6xl">
          Short. Fast. Yours.
        </h1>
        <p className="mt-4 max-w-xl text-muted-foreground">
          Turn long URLs into compact links with built-in analytics. Sign in to manage and keep them private.
        </p>

        <Card className="mt-10 w-full max-w-2xl p-6 shadow-[var(--shadow-elegant)]">
          <div className="flex flex-col gap-3 sm:flex-row">
            <Input
              placeholder="https://example.com/your-very-long-url"
              value={longUrl}
              onChange={(e) => setLongUrl(e.target.value)}
              className="h-12"
            />
            <Button onClick={shorten} disabled={loading} className="h-12 px-6">
              {loading ? "Shortening…" : "Shorten"}
            </Button>
          </div>
          {session && (
            <div className="mt-4 flex items-center gap-3 text-sm">
              <Switch id="priv" checked={isPrivate} onCheckedChange={setIsPrivate} />
              <Label htmlFor="priv" className="text-muted-foreground">Private (only you and admins can view)</Label>
            </div>
          )}
          {shortUrl && (
            <div className="mt-6 flex items-center gap-2 rounded-md border bg-secondary p-3 text-left">
              <Link2 className="h-4 w-4 shrink-0 text-primary" />
              <a href={shortUrl} target="_blank" rel="noreferrer" className="flex-1 truncate text-sm font-medium">
                {shortUrl}
              </a>
              <Button size="sm" variant="ghost" onClick={copy}><Copy className="h-4 w-4" /></Button>
            </div>
          )}
        </Card>
      </section>
    </main>
  );
};

export default Index;
