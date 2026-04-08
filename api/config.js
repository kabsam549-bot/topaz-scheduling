// GET /api/config — reads the live config from GitHub so it's always current,
// regardless of what's in the static public/ dir.

const REPO_OWNER = 'kabsam549-bot';
const REPO_NAME = 'topaz-scheduling';
const FILE_PATH = 'public/config.json';
const BRANCH = 'main';

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');

  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const token = process.env.GITHUB_TOKEN;
  if (!token) {
    // Fallback: serve the static file if no token configured
    return res.redirect('/config.json');
  }

  try {
    const ghRes = await fetch(
      `https://api.github.com/repos/${REPO_OWNER}/${REPO_NAME}/contents/${FILE_PATH}?ref=${BRANCH}`,
      {
        headers: {
          Authorization: `Bearer ${token}`,
          Accept: 'application/vnd.github.v3.raw',
        },
      }
    );

    if (!ghRes.ok) {
      return res.redirect('/config.json');
    }

    const config = await ghRes.json();
    return res.status(200).json(config);
  } catch (err) {
    console.error('config fetch error:', err);
    return res.redirect('/config.json');
  }
}
