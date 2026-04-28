-- Restrict execute on helper functions; keep them callable from triggers/policies (which run as definer)
REVOKE EXECUTE ON FUNCTION public.has_role(UUID, public.app_role) FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.handle_new_user() FROM PUBLIC, anon, authenticated;
-- increment_click is intentionally callable by anon + authenticated (that IS the redirect API)
REVOKE EXECUTE ON FUNCTION public.increment_click(TEXT) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.increment_click(TEXT) TO anon, authenticated;