const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const root = path.resolve(__dirname, '..');

function read(relativePath) {
  return fs.readFileSync(path.join(root, relativePath), 'utf8');
}

test('pull request CI verifies the mock-backed application without contacting Supabase', () => {
  const workflow = read('.github/workflows/ci.yml');

  assert.match(workflow, /pull_request:/);
  assert.match(workflow, /contents:\s*read/);
  assert.match(workflow, /actions\/checkout@v6/);
  assert.match(workflow, /actions\/setup-node@v6/);
  assert.match(workflow, /npm ci/);
  assert.match(workflow, /npm run build:supabase-client/);
  assert.match(workflow, /git diff --exit-code -- v2-supabase-bundle\.js/);
  assert.match(workflow, /npm test/);
  assert.match(workflow, /npm audit --audit-level=high/);
  assert.doesNotMatch(workflow, /supabase (?:link|db push)/);
  assert.doesNotMatch(workflow, /SUPABASE_(?:ACCESS_TOKEN|DB_PASSWORD|PROJECT_ID)/);
});

test('production migrations require a confirmed manual run on main', () => {
  const workflow = read('.github/workflows/deploy-supabase.yml');

  assert.match(workflow, /workflow_dispatch:/);
  assert.doesNotMatch(workflow, /(?:pull_request|\n\s+push):/);
  assert.match(workflow, /confirmation:/);
  assert.match(workflow, /github\.ref == 'refs\/heads\/main'/);
  assert.match(workflow, /inputs\.confirmation == 'DEPLOY'/);
  assert.match(workflow, /environment:\s*supabase-production/);
  assert.match(workflow, /contents:\s*read/);
  assert.match(workflow, /concurrency:/);
  assert.match(workflow, /supabase\/setup-cli@v2/);
  assert.match(workflow, /actions\/checkout@v6/);
  assert.match(workflow, /version:\s*2\.114\.0/);
  assert.match(workflow, /SUPABASE_ACCESS_TOKEN:\s*\$\{\{ secrets\.SUPABASE_ACCESS_TOKEN \}\}/);
  assert.match(workflow, /SUPABASE_DB_PASSWORD:\s*\$\{\{ secrets\.SUPABASE_DB_PASSWORD \}\}/);
  assert.match(workflow, /SUPABASE_PROJECT_ID:\s*\$\{\{ secrets\.SUPABASE_PROJECT_ID \}\}/);
  assert.match(workflow, /supabase link --project-ref "\$SUPABASE_PROJECT_ID"/);
  assert.match(workflow, /supabase db push --dry-run/);
  assert.match(workflow, /supabase db push --yes/);
  assert.doesNotMatch(workflow, /xnromcineefyabmrnaro/);
});

test('repository guidance keeps hosted database access out of local development', () => {
  const readme = read('supabase/README.md');
  const gitignore = read('.gitignore');

  assert.match(readme, /ローカルPCからホスト済みSupabaseへ接続しません/);
  assert.match(readme, /GitHub Actions/);
  assert.match(readme, /SUPABASE_ACCESS_TOKEN/);
  assert.match(readme, /SUPABASE_DB_PASSWORD/);
  assert.match(readme, /SUPABASE_PROJECT_ID/);
  assert.match(gitignore, /supabase\/\.temp\//);
});

test('production auth guidance pins confirmation links to the published game', () => {
  const readme = read('supabase/README.md');

  assert.match(readme, /Authentication > URL Configuration/);
  assert.match(readme, /Site URL.*https:\/\/shinichiromotomatsu\.github\.io\/game\/v2\.html/s);
  assert.match(readme, /Redirect URLs.*https:\/\/shinichiromotomatsu\.github\.io\/game\/v2\.html/s);
  assert.match(readme, /\{\{ \.ConfirmationURL \}\}/);
  assert.match(readme, /送信済みの確認メール.*更新されません/);
});

test('GitHub Pages publishing is manual and uploads only the browser game', () => {
  const workflow = read('.github/workflows/deploy-pages.yml');
  const triggerBlock = workflow.match(/^on:\r?\n([\s\S]*?)^permissions:/m)?.[1] ?? '';
  const triggers = Array.from(triggerBlock.matchAll(/^  ([\w-]+):/gm), match => match[1]);

  assert.deepEqual(triggers, ['workflow_dispatch']);
  assert.match(workflow, /confirmation:[\s\S]*Type DEPLOY/);
  assert.match(workflow, /if:\s*github\.ref == 'refs\/heads\/main' && inputs\.confirmation == 'DEPLOY'/);
  assert.match(workflow, /permissions:[\s\S]*pages:\s*write[\s\S]*id-token:\s*write/);
  assert.match(workflow, /environment:[\s\S]*name:\s*github-pages/);
  assert.match(workflow, /actions\/upload-pages-artifact@v4/);
  assert.match(workflow, /actions\/deploy-pages@v4/);
  assert.match(workflow, /path:\s*\.\/\.pages-site/);
  assert.match(workflow, /node scripts\/build-pages-site\.js \.pages-site/);
  assert.doesNotMatch(workflow, /\.env|service_role|sb_secret_|SUPABASE_DB_PASSWORD/i);
});
