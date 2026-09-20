const serverless = require('serverless-http');
const app = require('../../server/app');
const migrate = require('../../server/db/migrate');

let isMigrated = false;

const serverlessHandler = serverless(app);

exports.handler = async (event, context) => {
  // Ensure DB tables exist on cold start
  if (!isMigrated) {
    try {
      await migrate();
      isMigrated = true;
    } catch (e) {
      console.warn('Cold start migration notice:', e.message);
    }
  }

  // Rewrite path to match Express routes
  if (event.path && event.path.startsWith('/.netlify/functions/api')) {
    event.path = event.path.replace('/.netlify/functions/api', '/api');
  } else if (event.path && event.path.startsWith('/api')) {
    // If it already starts with /api (depending on how Netlify passes it), keep it
  }

  // Adjust path if needed for Netlify functions rewrite
  return serverlessHandler(event, context);
};
