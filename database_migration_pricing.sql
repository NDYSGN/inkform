-- Idempotent script to add pricing and other columns to the appointments table

DO $$ BEGIN IF NOT EXISTS(SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name='appointments' AND column_name='price') THEN ALTER TABLE public.appointments ADD COLUMN price DECIMAL(10,2); END IF; END $$;
DO $$ BEGIN IF NOT EXISTS(SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name='appointments' AND column_name='deposit') THEN ALTER TABLE public.appointments ADD COLUMN deposit DECIMAL(10,2); END IF; END $$;
DO $$ BEGIN IF NOT EXISTS(SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name='appointments' AND column_name='deposit_paid') THEN ALTER TABLE public.appointments ADD COLUMN deposit_paid BOOLEAN DEFAULT FALSE; END IF; END $$;
DO $$ BEGIN IF NOT EXISTS(SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name='appointments' AND column_name='payment_status') THEN ALTER TABLE public.appointments ADD COLUMN payment_status VARCHAR(20) DEFAULT 'pending' CHECK (payment_status IN ('pending', 'deposit_paid', 'fully_paid', 'cancelled')); END IF; END $$;
DO $$ BEGIN IF NOT EXISTS(SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name='appointments' AND column_name='client_email') THEN ALTER TABLE public.appointments ADD COLUMN client_email VARCHAR(255); END IF; END $$;
DO $$ BEGIN IF NOT EXISTS(SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name='appointments' AND column_name='calendar_event_id') THEN ALTER TABLE public.appointments ADD COLUMN calendar_event_id VARCHAR(255); END IF; END $$;

-- Policies and Indexes are generally safe to re-run.
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Users can update their own studio appointments pricing') THEN
        CREATE POLICY "Users can update their own studio appointments pricing" ON appointments
            FOR UPDATE USING (
                studio_id IN (
                    SELECT id FROM studios WHERE user_id = auth.uid()
                )
            );
    END IF;
END;
$$;


-- Indexes are safe to re-run with IF NOT EXISTS
CREATE INDEX IF NOT EXISTS idx_appointments_payment_status ON appointments(payment_status);
CREATE INDEX IF NOT EXISTS idx_appointments_price ON appointments(price);
CREATE INDEX IF NOT EXISTS idx_appointments_client_email ON appointments(client_email);
CREATE INDEX IF NOT EXISTS idx_appointments_calendar_event_id ON appointments(calendar_event_id); 