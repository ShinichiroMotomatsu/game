# Supabase開発・反映手順

対象プロジェクト: `xnromcineefyabmrnaro`

このリポジトリでは、ローカルPCからホスト済みSupabaseへ接続しません。ローカルではモックを使ってゲームとセーブ処理を検証し、本番DBへのマイグレーション反映はGitHub Actionsからのみ行います。

Secret Key、`service_role` key、DBパスワード、接続文字列、CLIアクセストークンは、コード、設定ファイル、Issue、PR、チャットへ記載しないでください。

## ローカル開発

通常の開発とテストにSupabaseやDockerは不要です。

```sh
npm ci
npm test
```

`v2-cloud-save.js` は注入されたモッククライアントで検証できます。PRのCIもモックだけを使用し、Supabaseの認証情報を渡さず、外部DBへ接続しません。

必要になった場合に限り、Docker上のローカルSupabaseを別途利用できます。ただし、ホスト済みプロジェクトに対する `supabase login`、`supabase link`、`supabase db push` はローカルPCでは実行しません。特に `db reset --linked` は使用禁止です。

## GitHubで最初に一度だけ行う設定

リポジトリの **Settings > Environments** で `supabase-production` を作成します。利用できる場合はRequired reviewersを設定し、反映前に承認が必要な状態にします。

次に **Settings > Secrets and variables > Actions** に、以下のRepository secretsを登録します。

- `SUPABASE_ACCESS_TOKEN`: SupabaseアカウントのAccess Token
- `SUPABASE_DB_PASSWORD`: 対象プロジェクトのDBパスワード
- `SUPABASE_PROJECT_ID`: 対象プロジェクトのProject Ref

Scoped Access Tokenを使う場合は、対象プロジェクトだけを選び、`Project Settings: Read`、`Database: Read`、`Database Config: Read`、`Connection Pooling: Read`、`API Keys: Read`、`Data API Config: Read`、`Migrations: Write`を設定します。それ以外は`None`にします。

値はGitHubの暗号化Secretにだけ登録します。ログへ値を表示するコマンドは追加しないでください。

## 本番DBへの反映

1. マイグレーションを含むPRをレビューし、テスト成功後に`main`へマージします。
2. GitHubの **Actions > Deploy Supabase migrations > Run workflow** を開きます。
3. Branchに`main`を選択し、確認欄へ`DEPLOY`と入力して実行します。
4. `supabase-production`の承認待ちになった場合は、差分を再確認して承認します。
5. Previewが成功した場合だけ、同じジョブ内でマイグレーションが反映されます。

ワークフローは手動実行専用で、`main`以外や確認文字が一致しない実行は拒否します。複数のDB反映が同時に走らないようにも制限しています。

## ブラウザ設定

公開URLと認証画面を決めた後、`v2-supabase-config.public.js` の空欄へプロジェクトの`sb_publishable_...`キーを設定します。Publishable KeyとProject URLは公開情報であり、ブラウザからRLSを通して利用します。Secret Keyや`service_role` keyは絶対に含めません。

設定画面のクラウド保存は、メール＋パスワード認証と明示的なアップロード・ダウンロードだけを提供します。自動同期は行わず、ダウンロード時は端末データを上書きする前に確認します。

## 本番の認証URL

Supabase Dashboardの **Authentication > URL Configuration** で、次の値を設定します。

- Site URL: `https://shinichiromotomatsu.github.io/game/v2.html`
- Redirect URLs: `https://shinichiromotomatsu.github.io/game/v2.html`

本番ではワイルドカードではなく、上記の完全一致URLを使います。`supabase/config.toml` のlocalhost設定はローカルSupabase専用で、ホスト済みプロジェクトの設定には反映されません。

**Authentication > Email Templates > Confirm signup** をカスタマイズした場合は、確認リンクに `{{ .ConfirmationURL }}` を使用します。送信済みの確認メールに含まれるURLは設定変更後も更新されません。公開版の設定画面から「確認メールを再送」を実行し、新しく届いたメールを使用します。
