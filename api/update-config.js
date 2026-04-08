// Vercel Serverless Function: receives new config JSON from admin panel,
// commits it to GitHub (public/config.json), which triggers a Vercel redeploy.

const REPO_OWNER = 'kabsam549-bot';
const REPO_NAME = 'topaz-scheduling';
const FILE_PATH = 'public/config.json';
const BRANCH = 'main';
const ADMIN_HASH = '706e41'; // lightweight admin password check

function simpleHash(str) {
  let h = 0;
  for (let i = 0; i < str.length; i++) {
    h = ((h << 5) - h + str.charCodeAt(i)) | 0;
  }
  return (h >>> 0).toString(16).slice(-6);
}

export default async function handler(req, res) {
  // CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(200).end();

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { config, password } = req.body || {};

  // Verify admin password
  if (!password || simpleHash(password) !== ADMIN_HASH) {
    return res.status(401).json({ error: 'Invalid admin password' });
  }

  if (!config) {
    return res.status(400).json({ error: 'Missing config payload' });
  }

  const token = process.env.GITHUB_TOKEN;
  if (!token) {
    return res.status(500).json({ error: 'Server misconfigured: missing GITHUB_TOKEN' });
  }

  try {
    // Get current file SHA (required for updates)
    const getRes = await fetch(
      `https://api.github.com/repos/${REPO_OWNER}/${REPO_NAME}/contents/${FILE_PATH}?ref=${BRANCH}`,
      { headers: { Authorization: `Bearer ${token}`, Accept: 'application/vnd.github.v3+json' } }
    );

    let sha = undefined;
    if (getRes.ok) {
      const data = await getRes.json();
      sha = data.sha;
    }

    // Commit the updated config
    const content = Buffer.from(JSON.stringify(config, null, 2) + '\n').toString('base64');
    const putRes = await fetch(
      `https://api.github.com/repos/${REPO_OWNER}/${REPO_NAME}/contents/${FILE_PATH}`,
      {
        method: 'PUT',
        headers: {
          Authorization: `Bearer ${token}`,
          Accept: 'application/vnd.github.v3+json',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          message: `Update TOPAz config via admin panel`,
          content,
          sha,
          branch: BRANCH,
        }),
      }
    );

    if (!putRes.ok) {
      const err = await putRes.text();
      console.error('GitHub API error:', err);
      return res.status(502).json({ error: 'Failed to update config on GitHub' });
    }

    return res.status(200).json({ ok: true, message: 'Config updated. Redeployment triggered.' });
  } catch (err) {
    console.error('update-config error:', err);
    return res.status(500).json({ error: 'Internal server error' });
  }
}
