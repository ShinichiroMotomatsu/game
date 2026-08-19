(() => {
  const status = document.querySelector('#v2-cloud-status');
  const signedOut = document.querySelector('#v2-cloud-signed-out');
  const signedIn = document.querySelector('#v2-cloud-signed-in');
  const emailInput = document.querySelector('#v2-cloud-email');
  const passwordInput = document.querySelector('#v2-cloud-password');
  const signInButton = document.querySelector('#v2-cloud-sign-in');
  const signUpButton = document.querySelector('#v2-cloud-sign-up');
  const resendButton = document.querySelector('#v2-cloud-resend');
  const signOutButton = document.querySelector('#v2-cloud-sign-out');
  const uploadButton = document.querySelector('#v2-cloud-upload');
  const downloadButton = document.querySelector('#v2-cloud-download');
  const account = document.querySelector('#v2-cloud-account');
  const config = globalThis.ROPPONGI_SUPABASE_CONFIG;
  const authApi = globalThis.V2_AUTH;
  const cloudApi = globalThis.V2_CLOUD_SAVE;
  const saveApi = globalThis.V2_SAVE;

  function setStatus(message, kind = 'info') {
    status.textContent = message;
    status.dataset.kind = kind;
  }

  function setBusy(busy) {
    [signInButton, signUpButton, resendButton, signOutButton, uploadButton, downloadButton]
      .forEach(button => { button.disabled = busy; });
  }

  function showSession(session) {
    const user = session?.user ?? null;
    signedOut.hidden = Boolean(user);
    signedIn.hidden = !user;
    account.textContent = user?.email ?? '';
    if (user) setStatus('ログイン済み。端末とクラウドを手動で同期できます。', 'success');
    else setStatus('クラウド保存を使うにはログインしてください。');
  }

  const configured = Boolean(
    config?.url?.startsWith('https://')
    && config?.publishableKey?.startsWith('sb_publishable_')
    && globalThis.supabase?.createClient
    && authApi?.createAuthService
    && cloudApi?.createCloudSaveService
    && saveApi?.buildCloudSaveEnvelope
  );
  if (!configured) {
    signedOut.hidden = true;
    signedIn.hidden = true;
    setStatus('クラウド保存は現在準備中です。');
    return;
  }

  const client = globalThis.supabase.createClient(config.url, config.publishableKey, {
    auth: { persistSession: true, autoRefreshToken: true, detectSessionInUrl: true }
  });
  const auth = authApi.createAuthService(client);
  const cloud = cloudApi.createCloudSaveService(client);

  async function submitAuth(mode) {
    setBusy(true);
    const result = await auth[mode](emailInput.value, passwordInput.value);
    passwordInput.value = '';
    setBusy(false);
    if (result.ok && result.confirmationRequired) {
      setStatus('確認メールを送信しました。メール内のリンクを開いてください。', 'success');
    } else if (result.ok) {
      setStatus('ログインしました。', 'success');
    } else {
      const messages = {
        'invalid-email': 'メールアドレスを確認してください。',
        'invalid-password': 'パスワードは8〜128文字で入力してください。',
        'invalid-credentials': 'メールアドレスまたはパスワードが違います。',
        'signup-failed': 'アカウントを作成できませんでした。入力内容を確認してください。'
      };
      setStatus(messages[result.reason] ?? '通信に失敗しました。しばらくしてから再試行してください。', 'error');
    }
  }

  signInButton.addEventListener('click', () => submitAuth('signIn'));
  signUpButton.addEventListener('click', () => submitAuth('signUp'));
  resendButton.addEventListener('click', async () => {
    setBusy(true);
    const result = await auth.resendConfirmation(emailInput.value);
    setBusy(false);
    if (result.ok) {
      setStatus('確認メールを再送しました。新しいメール内のリンクを開いてください。', 'success');
    } else if (result.reason === 'invalid-email') {
      setStatus('メールアドレスを確認してください。', 'error');
    } else {
      setStatus('確認メールを再送できませんでした。しばらくしてから再試行してください。', 'error');
    }
  });
  signOutButton.addEventListener('click', async () => {
    setBusy(true);
    const result = await auth.signOut();
    setBusy(false);
    if (!result.ok) setStatus('ログアウトに失敗しました。', 'error');
  });
  uploadButton.addEventListener('click', async () => {
    setBusy(true);
    const envelope = saveApi.buildCloudSaveEnvelope(localStorage);
    const result = await cloud.save(1, envelope);
    setBusy(false);
    setStatus(result.ok ? '現在の端末データをクラウドへ保存しました。' : 'クラウドへ保存できませんでした。', result.ok ? 'success' : 'error');
  });
  downloadButton.addEventListener('click', async () => {
    setBusy(true);
    const result = await cloud.load(1);
    setBusy(false);
    if (!result.ok) return setStatus('クラウドデータを読み込めませんでした。', 'error');
    if (!result.save) return setStatus('クラウドにセーブデータがありません。');
    if (!confirm('この端末の進行状況をクラウドのデータで上書きしますか？')) return;
    if (!saveApi.restoreCloudSaveEnvelope(result.save, localStorage)) return setStatus('クラウドデータの形式が不正です。', 'error');
    location.reload();
  });

  auth.subscribe(showSession);
  auth.session().then(showSession);
})();
