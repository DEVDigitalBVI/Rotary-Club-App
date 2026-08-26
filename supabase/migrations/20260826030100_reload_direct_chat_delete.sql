-- Make the newly added RPC visible to PostgREST immediately after migration.
notify pgrst, 'reload schema';
