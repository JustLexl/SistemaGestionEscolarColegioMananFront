process.env['NODE_ENV'] = 'test';
process.env['PORT'] = '3000';
process.env['DATABASE_URL'] =
  'postgresql://test_user:test_password@localhost:5432/colegio_manantial_test?schema=public';
