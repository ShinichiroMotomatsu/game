const test = require('node:test');
const assert = require('node:assert/strict');

const {
  EMAIL_CONFIRMATION_REDIRECT,
  createAuthService,
  validEmail,
  validPassword
} = require('../v2-auth.js');

test('login accepts a normalized email and never returns provider error details', async () => {
  let credentials;
  const client = {
    auth: {
      signInWithPassword: async value => {
        credentials = value;
        return { data: { user: { id: 'user-1', email: value.email } }, error: null };
      }
    }
  };
  const result = await createAuthService(client).signIn('  FAMILY@example.com ', 'long-password');
  assert.deepEqual(credentials, { email: 'family@example.com', password: 'long-password' });
  assert.deepEqual(result, { ok: true, user: { id: 'user-1', email: 'family@example.com' } });
});

test('invalid credentials fail before contacting Supabase', async () => {
  let contacted = false;
  const client = { auth: { signInWithPassword: async () => { contacted = true; } } };
  const service = createAuthService(client);
  assert.equal((await service.signIn('not-an-email', 'long-password')).reason, 'invalid-email');
  assert.equal((await service.signIn('family@example.com', 'short')).reason, 'invalid-password');
  assert.equal(contacted, false);
});

test('signup uses the exact production confirmation redirect and exposes only safe results', async () => {
  let signupRequest;
  const client = {
    auth: {
      signUp: async request => {
        signupRequest = request;
        return { data: { user: { id: 'pending' }, session: null }, error: null };
      },
      signOut: async () => ({ error: new Error('provider internals') })
    }
  };
  const service = createAuthService(client);
  assert.deepEqual(await service.signUp('family@example.com', 'long-password'), { ok: true, confirmationRequired: true });
  assert.deepEqual(signupRequest, {
    email: 'family@example.com',
    password: 'long-password',
    options: { emailRedirectTo: 'https://shinichiromotomatsu.github.io/game/v2.html' }
  });
  assert.equal(EMAIL_CONFIRMATION_REDIRECT, 'https://shinichiromotomatsu.github.io/game/v2.html');
  assert.deepEqual(await service.signOut(), { ok: false, reason: 'remote-error' });
});

test('pending signup can resend a confirmation email to the production game', async () => {
  let resendRequest;
  const client = {
    auth: {
      resend: async request => {
        resendRequest = request;
        return { data: {}, error: null };
      }
    }
  };
  const service = createAuthService(client);

  assert.deepEqual(await service.resendConfirmation('  FAMILY@example.com '), { ok: true });
  assert.deepEqual(resendRequest, {
    type: 'signup',
    email: 'family@example.com',
    options: { emailRedirectTo: 'https://shinichiromotomatsu.github.io/game/v2.html' }
  });
});

test('confirmation resend validates email locally and hides provider errors', async () => {
  let contacted = false;
  const client = {
    auth: {
      resend: async () => {
        contacted = true;
        return { data: null, error: new Error('provider internals') };
      }
    }
  };
  const service = createAuthService(client);

  assert.deepEqual(await service.resendConfirmation('not-an-email'), { ok: false, reason: 'invalid-email' });
  assert.equal(contacted, false);
  assert.deepEqual(await service.resendConfirmation('family@example.com'), { ok: false, reason: 'resend-failed' });
});

test('session lookup and auth subscription use the injected client', async () => {
  let listener;
  let unsubscribed = false;
  const client = {
    auth: {
      getSession: async () => ({ data: { session: { user: { id: 'user-1' } } }, error: null }),
      onAuthStateChange(callback) {
        listener = callback;
        return { data: { subscription: { unsubscribe: () => { unsubscribed = true; } } } };
      }
    }
  };
  const service = createAuthService(client);
  assert.equal((await service.session()).user.id, 'user-1');
  const unsubscribe = service.subscribe(() => {});
  assert.equal(typeof listener, 'function');
  unsubscribe();
  assert.equal(unsubscribed, true);
});

test('email and password validation enforce bounded input', () => {
  assert.equal(validEmail('family@example.com'), true);
  assert.equal(validEmail(`${'a'.repeat(250)}@x.test`), false);
  assert.equal(validPassword('12345678'), true);
  assert.equal(validPassword('x'.repeat(129)), false);
});
