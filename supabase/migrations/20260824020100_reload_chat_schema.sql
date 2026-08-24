-- PostgREST can retain its pre-migration schema briefly on linked projects.
-- Reload explicitly so the new chat API is available immediately after push.
notify pgrst, 'reload schema';
