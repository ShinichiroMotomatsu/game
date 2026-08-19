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
  assert.match(workflow, /npm ci/);
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
  assert.match(workflow, /supabase\/setup-cli@v1/);
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
