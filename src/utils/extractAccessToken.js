export function extractAccessToken(req) {
  return req.headers.authorization?.split(" ")[1] || req.cookies?.access_token || null;
}
