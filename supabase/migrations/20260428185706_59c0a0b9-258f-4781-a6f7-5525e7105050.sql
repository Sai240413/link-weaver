-- Roles
CREATE TYPE public.app_role AS ENUM ('user', 'admin');

CREATE TABLE public.profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    display_name TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Profiles are readable by owner"
ON public.profiles FOR SELECT TO authenticated
USING (auth.uid() = id);

CREATE POLICY "Users can update own profile"
ON public.profiles FOR UPDATE TO authenticated
USING (auth.uid() = id);

CREATE TABLE public.user_roles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    role public.app_role NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    UNIQUE (user_id, role)
);
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role public.app_role)
RETURNS BOOLEAN
LANGUAGE SQL
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = _user_id AND role = _role
  );
$$;

CREATE POLICY "Users can read own roles"
ON public.user_roles FOR SELECT TO authenticated
USING (auth.uid() = user_id);

CREATE POLICY "Admins can read all roles"
ON public.user_roles FOR SELECT TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

-- New user trigger: create profile + default 'user' role
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, display_name)
  VALUES (NEW.id, COALESCE(NEW.raw_user_meta_data->>'display_name', NEW.email));
  INSERT INTO public.user_roles (user_id, role)
  VALUES (NEW.id, 'user');
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_auth_user_created
AFTER INSERT ON auth.users
FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- URLs table
CREATE TABLE public.urls (
    id BIGSERIAL PRIMARY KEY,
    long_url TEXT NOT NULL,
    short_code TEXT UNIQUE,
    user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    is_private BOOLEAN NOT NULL DEFAULT FALSE,
    click_count BIGINT NOT NULL DEFAULT 0,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    expires_at TIMESTAMPTZ NOT NULL DEFAULT (now() + interval '30 days')
);
CREATE INDEX idx_urls_short_code ON public.urls(short_code);
CREATE INDEX idx_urls_user_id ON public.urls(user_id);

ALTER TABLE public.urls ENABLE ROW LEVEL SECURITY;

-- Anyone (including guests via anon key) can insert
CREATE POLICY "Anyone can create urls"
ON public.urls FOR INSERT TO anon, authenticated
WITH CHECK (true);

-- Public urls readable by everyone
CREATE POLICY "Public urls readable by anyone"
ON public.urls FOR SELECT TO anon, authenticated
USING (is_private = false);

-- Private urls: owner or admin
CREATE POLICY "Owner can read own urls"
ON public.urls FOR SELECT TO authenticated
USING (auth.uid() = user_id);

CREATE POLICY "Admins can read all urls"
ON public.urls FOR SELECT TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

-- Delete: owner or admin
CREATE POLICY "Owner can delete own urls"
ON public.urls FOR DELETE TO authenticated
USING (auth.uid() = user_id);

CREATE POLICY "Admins can delete any url"
ON public.urls FOR DELETE TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

-- Atomic click increment used by the redirect function
CREATE OR REPLACE FUNCTION public.increment_click(_short_code TEXT)
RETURNS TABLE(long_url TEXT, expires_at TIMESTAMPTZ)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_row public.urls%ROWTYPE;
BEGIN
  SELECT * INTO v_row FROM public.urls WHERE short_code = _short_code;
  IF NOT FOUND THEN RETURN; END IF;
  IF v_row.expires_at < now() THEN
    long_url := NULL; expires_at := v_row.expires_at; RETURN NEXT; RETURN;
  END IF;
  UPDATE public.urls SET click_count = click_count + 1 WHERE id = v_row.id;
  long_url := v_row.long_url; expires_at := v_row.expires_at; RETURN NEXT;
END;
$$;