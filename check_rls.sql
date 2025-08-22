SELECT schemaname, tablename, rowsecurity FROM pg_tables WHERE tablename = 'super_admins';
SELECT * FROM pg_policies WHERE tablename = 'super_admins';
