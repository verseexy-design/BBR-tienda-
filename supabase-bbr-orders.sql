-- BBR: renombrar la tabla de pedidos para identificarla fácilmente en Table Editor.
-- Ejecutar una sola vez en Supabase > SQL Editor > New query.

ALTER TABLE public.orders RENAME TO "BBR";

ALTER TABLE public."BBR" ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Allow customers to create orders" ON public."BBR";

CREATE POLICY "Allow customers to create orders"
ON public."BBR"
FOR INSERT
TO anon, authenticated
WITH CHECK (
  status = 'REALIZADO'
  AND payment_method = 'EFECTIVO_CONTRA_ENTREGA'
);

GRANT INSERT ON TABLE public."BBR" TO anon, authenticated;

NOTIFY pgrst, 'reload schema';
