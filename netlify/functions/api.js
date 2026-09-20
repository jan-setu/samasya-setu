const serverless = require('serverless-http');
const app = require('../../server/app');
const migrate = require('../../server/db/migrate');

let isMigrated = false;

const serverlessHandler = serverless(app);

exports.handler = async (event, context) => {
  console.log('--- NEW REQUEST ---');
  console.log('HTTP Method:', event.httpMethod);
  console.log('Original Path:', event.path);

  // Strictly normalize the path for Express
  // No matter what Netlify provides (e.g. /.netlify/functions/api/auth/login or /api/auth/login),
  // we force it to be /api/... so that app.use('/api/...', routes) always matches.
  if (event.path) {
    if (event.path.startsWith('/.netlify/functions/api')) {
      event.path = event.path.replace('/.netlify/functions/api', '/api');
    }
    if (!event.path.startsWith('/api')) {
      event.path = '/api' + event.path;
    }
  }
  
  console.log('Rewritten Path for Express:', event.path);

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
