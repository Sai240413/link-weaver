import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { Trash2, Copy, ExternalLink, Shield } from "lucide-react";
import type { Tables } from "@/integrations/supabase/types";

const FUNCTIONS_BASE = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1`;
type UrlRow = Tables<"urls">;

const Dashboard = () => {
  const nav = useNavigate();
  const [urls, setUrls] = useState<UrlRow[]>([]);
  const [isAdmin, setIsAdmin] = useState(false);
  const [showAll, setShowAll] = useState(false);
  const [userId, setUserId] = useState<string | null>(null);

  useEffect(() => { document.title = "Dashboard — URL Shortener"; }, []);

  useEffect(() => {
    (async () => {
      const { data: s } = await supabase.auth.getSession();
      if (!s.session) { nav("/auth", { replace: true }); return; }
      setUserId(s.session.user.id);
      const { data: roles } = await supabase
        .from("user_roles").select("role").eq("user_id", s.session.user.id);
      setIsAdmin(!!roles?.some((r) => r.role === "admin"));
    })();
  }, [nav]);

  useEffect(() => {
    if (!userId) return;
    (async () => {
      let q = supabase.from("urls").select("*").order("created_at", { ascending: false });
      if (!(isAdmin && showAll)) q = q.eq("user_id", userId);
      const { data, error } = await q;
      if (error) toast.error(error.message); else setUrls(data ?? []);
    })();
  }, [userId, isAdmin, showAll]);

  const remove = async (id: number) => {
    const { error } = await supabase.from("urls").delete().eq("id", id);
    if (error) toast.error(error.message);
    else { setUrls((u) => u.filter((x) => x.id !== id)); toast.success("Deleted"); }
  };

  const copy = async (code: string) => {
    await navigator.clipboard.writeText(`${FUNCTIONS_BASE}/redirect/${code}`);
    toast.success("Short URL copied");
  };

  return (
    <main className="container py-10">
      <header className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-semibold">Your URLs</h1>
          <p className="text-sm text-muted-foreground">Manage, track clicks, and remove links.</p>
        </div>
        <div className="flex items-center gap-2">
          {isAdmin && (
            <Button variant={showAll ? "default" : "outline"} size="sm" onClick={() => setShowAll((v) => !v)}>
              <Shield className="mr-2 h-4 w-4" />{showAll ? "Showing all" : "Admin: show all"}
            </Button>
          )}
          <Button asChild variant="outline" size="sm"><Link to="/">Shorten new</Link></Button>
        </div>
      </header>

      <div className="grid gap-3">
        {urls.length === 0 && (
          <Card className="p-8 text-center text-muted-foreground">No URLs yet.</Card>
        )}
        {urls.map((u) => {
          const expired = new Date(u.expires_at) < new Date();
          const short = u.short_code ? `${FUNCTIONS_BASE}/redirect/${u.short_code}` : "";
          return (
            <Card key={u.id} className="flex flex-col gap-2 p-4 md:flex-row md:items-center">
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <a href={short} target="_blank" rel="noreferrer" className="font-medium text-primary hover:underline">
                    /{u.short_code}
                  </a>
                  {u.is_private && <Badge variant="secondary">Private</Badge>}
                  {expired && <Badge variant="destructive">Expired</Badge>}
                </div>
                <div className="mt-1 truncate text-sm text-muted-foreground">{u.long_url}</div>
                <div className="mt-1 text-xs text-muted-foreground">
                  {u.click_count} clicks · expires {new Date(u.expires_at).toLocaleDateString()}
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Button variant="ghost" size="icon" onClick={() => copy(u.short_code!)}><Copy className="h-4 w-4" /></Button>
                <Button asChild variant="ghost" size="icon"><a href={short} target="_blank" rel="noreferrer"><ExternalLink className="h-4 w-4" /></a></Button>
                <Button variant="ghost" size="icon" onClick={() => remove(u.id)}><Trash2 className="h-4 w-4" /></Button>
              </div>
            </Card>
          );
        })}
      </div>
    </main>
  );
};

export default Dashboard;
