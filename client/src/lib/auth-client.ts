import { createAuthClient } from "better-auth/react";

// Avoid importing dotenv on the client — that module references `process` and
// will throw in the browser. Use `import.meta.env` where available and fall
// back safely if `process` exists during SSR or Node runs.
const getBaseURL = () => {
    if (typeof process !== "undefined" && process.env?.BETTER_AUTH_URL) return process.env.BETTER_AUTH_URL;
    // Vite exposes env via `import.meta.env`. Many projects prefix with VITE_,
    // but keep this flexible to read the same variable name if provided.
    const env: any = import.meta.env || {};
    return env.BETTER_AUTH_URL || env.VITE_BETTER_AUTH_URL || "";
};

export const authClient = createAuthClient({
    baseURL: getBaseURL(),
});

export const {
    signIn,
    signOut,
    signUp,
    useSession,
} = authClient;