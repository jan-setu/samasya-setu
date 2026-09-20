const serverless = require('serverless-http');
const app = require('../../server/app');
const migrate = require('../../server/db/migrate');

let isMigrated = false;

const serverlessHandler = serverless(app, {
  basePath: '/.netlify/functions/api'
});

exports.handler = async (event, context) => {
  console.log('--- NEW REQUEST ---');
  console.log('HTTP Method:', event.httpMethod);
  console.log('Original Path:', event.path);
  console.log('Headers:', JSON.stringify(event.headers));

  // Ensure DB tables exist on cold start
  if (!isMigrated) {
    try {
      await migrate();
      isMigrated = true;
    } catch (e) {
      console.warn('Cold start migration notice:', e.message);
    }
  }

  // Rewrite path just in case Express needs /api prefix instead of root
  // We mounted both /auth and /api/auth in app.js, so serverless basePath should map /.netlify/functions/api/auth/login to /auth/login
  
  const response = await serverlessHandler(event, context);
  console.log('Response status:', response.statusCode);
  return response;
};
