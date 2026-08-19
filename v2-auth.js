(function exposeAuth(root, factory) {
  const api = factory();
  if (typeof module === 'object' && module.exports) module.exports = api;
  if (root) root.V2_AUTH = api;
})(typeof globalThis !== 'undefined' ? globalThis : this, () => {
  const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

  function normalizeEmail(email) {
    return typeof email === 'string' ? email.trim().toLowerCase() : '';
  }

  function validEmail(email) {
    const normalized = normalizeEmail(email);
    return normalized.length <= 254 && EMAIL_PATTERN.test(normalized);
  }

  function validPassword(password) {
    return typeof password === 'string' && password.length >= 8 && password.length <= 128;
  }

  function failure(reason) {
    return { ok: false, reason };
  }

  function createAuthService(client) {
    if (!client?.auth) throw new TypeError('A Supabase-compatible auth client is required');

    async function signIn(email, password) {
      const normalized = normalizeEmail(email);
      if (!validEmail(normalized)) return failure('invalid-email');
      if (!validPassword(password)) return failure('invalid-password');
      try {
        const { data, error } = await client.auth.signInWithPassword({ email: normalized, password });
        if (error || !data?.user) return failure('invalid-credentials');
        return { ok: true, user: data.user };
      } catch {
        return failure('remote-error');
      }
    }

    async function signUp(email, password) {
      const normalized = normalizeEmail(email);
      if (!validEmail(normalized)) return failure('invalid-email');
      if (!validPassword(password)) return failure('invalid-password');
      try {
        const { data, error } = await client.auth.signUp({ email: normalized, password });
        if (error || !data?.user) return failure('signup-failed');
        return { ok: true, confirmationRequired: !data.session };
      } catch {
        return failure('remote-error');
      }
    }

    async function signOut() {
      try {
        const { error } = await client.auth.signOut();
        return error ? failure('remote-error') : { ok: true };
      } catch {
        return failure('remote-error');
      }
    }

    async function session() {
      try {
        const { data, error } = await client.auth.getSession();
        return error ? null : data?.session ?? null;
      } catch {
        return null;
      }
    }

    function subscribe(callback) {
      const { data } = client.auth.onAuthStateChange((_event, nextSession) => callback(nextSession));
      return () => data?.subscription?.unsubscribe?.();
    }

    return Object.freeze({ session, signIn, signOut, signUp, subscribe });
  }

  return { createAuthService, normalizeEmail, validEmail, validPassword };
});
