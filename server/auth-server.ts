import { Router, Request, Response } from "express";
import * as jwt from "jsonwebtoken";
import 'dotenv/config';

const router = Router();

type SessionPayload = {
  user: { id: string; email?: string; name?: string };
  exp: number; // unix seconds
};

function createSessionObject(provider: string, profile: any): SessionPayload {
  const id = `${provider}:${profile.id || profile.email || Date.now()}`;
  const exp = Math.floor(Date.now() / 1000) + 60 * 60 * 24 * 7; // 7 days
  return {
    user: {
      id,
      email: profile.email,
      name: profile.name || profile.email,
    },
    exp,
  };
}

function sessionCookieOptions() {
  return {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax" as const,
    maxAge: 1000 * 60 * 60 * 24 * 7,
  };
}

// Providers list
router.get("/providers", (_req: Request, res: Response) => {
  const providers: string[] = [];
  if (process.env.GOOGLE_CLIENT_ID) providers.push("google");
  // add others as needed
  res.json({ providers });
});

// Start OAuth flow (dev-friendly: redirects straight to callback for quick testing)
router.get("/oauth/:provider", (req: Request, res: Response) => {
  const { provider } = req.params;
  // If provider credentials are configured, redirect to the provider's
  // consent/authorization endpoint so the real OAuth flow runs.
  if (provider === "google" && process.env.GOOGLE_CLIENT_ID) {
    const callbackUrl = `${"http://localhost:3000"}/api/auth/callback/${provider}`;
    const params = new URLSearchParams({
      client_id: process.env.GOOGLE_CLIENT_ID!,
      redirect_uri: callbackUrl,
      response_type: "code",
      scope: "openid email profile",
      access_type: "offline",
      prompt: "consent",
    });
    const authUrl = `https://accounts.google.com/o/oauth2/v2/auth?${params.toString()}`;
    console.log(`[auth] Google OAuth redirect URL: ${authUrl}`);
    return res.redirect(authUrl);
  }

  // Fallback/dev: simulate by redirecting immediately to callback with a dev code.
  const callbackUrl = `${"http://localhost:3000"}/api/auth/callback/${provider}`;
  return res.redirect(`${callbackUrl}?code=dev-code`);
});

// OAuth callback - exchange code, create session, set cookie, redirect
// OAuth callback - exchange code, create session token, set cookie, redirect
router.get("/callback/:provider", (req: Request, res: Response) => {
  const { provider } = req.params;
  const { code } = req.query;

  // In a real implementation, exchange `code` with provider for profile info.
  // Here we simulate a profile for dev flows.
  const profile = { id: `dev-${provider}`, email: `user@${provider}.local`, name: `Dev ${provider}` };

  const session = createSessionObject(provider, profile);

  const secret = process.env.BETTER_AUTH_SECRET || process.env.BETTER_AUTH_COOKIE_SECRET;
  if (!secret) {
    console.error("Missing BETTER_AUTH_SECRET / BETTER_AUTH_COOKIE_SECRET env var");
    return res.status(500).send("Server misconfigured");
  }

  const token = jwt.sign(session, secret);

  // set signed JWT as session cookie
  res.cookie("session", token, sessionCookieOptions());

  // Redirect back to the app dashboard or configured redirect
  const redirectTo = process.env.APP_ORIGIN ? `${process.env.APP_ORIGIN}/dashboard` : "/dashboard";
  return res.redirect(redirectTo);
});

// Return current session
router.get("/session", (req: Request, res: Response) => {
  try {
    const cookie = (req as any).cookies?.session;
    if (!cookie) return res.status(401).json({ message: "Not authenticated" });

    const secret = process.env.BETTER_AUTH_SECRET || process.env.BETTER_AUTH_COOKIE_SECRET;
    if (!secret) return res.status(500).json({ message: "Server misconfigured" });

    const session = jwt.verify(cookie, secret) as SessionPayload;

    // check expiry
    if (session.exp < Math.floor(Date.now() / 1000)) {
      res.clearCookie("session", sessionCookieOptions());
      return res.status(401).json({ message: "Session expired" });
    }

    return res.json(session);
  } catch (err) {
    return res.status(400).json({ message: "Invalid session" });
  }
});

// Sign out
router.post("/signout", (_req: Request, res: Response) => {
  res.clearCookie("session", sessionCookieOptions());
  res.json({ ok: true });
});

// Simple helper middleware to require a session
export function requireSession(req: Request, res: Response, next: Function) {
  try {
    const cookie = (req as any).cookies?.session;
    if (!cookie) return res.status(401).json({ message: "Not authenticated" });

    const secret = process.env.BETTER_AUTH_SECRET || process.env.BETTER_AUTH_COOKIE_SECRET;
    if (!secret) return res.status(500).json({ message: "Server misconfigured" });

    const session = jwt.verify(cookie, secret) as SessionPayload;
    if (session.exp < Math.floor(Date.now() / 1000)) {
      res.clearCookie("session", sessionCookieOptions());
      return res.status(401).json({ message: "Session expired" });
    }

    (req as any).session = session;
    return next();
  } catch (err) {
    return res.status(401).json({ message: "Invalid session" });
  }
}

export default router;
