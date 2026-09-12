// Wraps an async route handler so any thrown/rejected error is passed to
// Express's error-handling middleware instead of hanging the request.
// Without this, a failed query inside an `async (req,res)` function has
// nowhere to go in Express 4 - the request just hangs until the platform's
// proxy times it out (this is what was causing the 504 pages).
module.exports = function asyncHandler(fn) {
  return function (req, res, next) {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
};
