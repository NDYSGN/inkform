-- Idempotent script to add settings columns to the studios table

DO $$
BEGIN
  IF NOT EXISTS(SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name='studios' AND column_name='phone') THEN
    ALTER TABLE public.studios ADD COLUMN phone VARCHAR(255);
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS(SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name='studios' AND column_name='email_notifications_enabled') THEN
    ALTER TABLE public.studios ADD COLUMN email_notifications_enabled BOOLEAN DEFAULT FALSE;
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS(SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name='studios' AND column_name='calendar_integration_enabled') THEN
    ALTER TABLE public.studios ADD COLUMN calendar_integration_enabled BOOLEAN DEFAULT FALSE;
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS(SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name='studios' AND column_name='google_calendar_credentials') THEN
    ALTER TABLE public.studios ADD COLUMN google_calendar_credentials TEXT;
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS(SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name='studios' AND column_name='email_smtp_host') THEN
    ALTER TABLE public.studios ADD COLUMN email_smtp_host VARCHAR(255);
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS(SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name='studios' AND column_name='email_smtp_port') THEN
    ALTER TABLE public.studios ADD COLUMN email_smtp_port INTEGER;
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS(SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name='studios' AND column_name='email_smtp_user') THEN
    ALTER TABLE public.studios ADD COLUMN email_smtp_user VARCHAR(255);
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS(SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name='studios' AND column_name='email_smtp_pass') THEN
    ALTER TABLE public.studios ADD COLUMN email_smtp_pass TEXT;
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS(SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name='studios' AND column_name='email_from') THEN
    ALTER TABLE public.studios ADD COLUMN email_from VARCHAR(255);
  END IF;
END $$; 