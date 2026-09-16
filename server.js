const http = require('http');
const fs = require('fs');
const path = require('path');

const PORT = process.env.PORT || 3000;

// Resolve the directory where static files live.
// Works whether server.js is at the project root or nested.
const STATIC_ROOT = __dirname;

const MIME_TYPES = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'application/javascript; charset=utf-8',
  '.mjs': 'application/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.png': 'image/png',
  '.gif': 'image/gif',
  '.webp': 'image/webp',
  '.svg': 'image/svg+xml',
  '.ico': 'image/x-icon',
  '.woff': 'font/woff',
  '.woff2': 'font/woff2',
  '.mp3': 'audio/mpeg',
  '.wav': 'audio/wav',
};

// Extensions that are static assets — never serve HTML fallback for these
const STATIC_EXTENSIONS = new Set(Object.keys(MIME_TYPES).filter(e => e !== '.html'));

const server = http.createServer((req, res) => {
  const urlPath = decodeURIComponent(req.url.split('?')[0]);
  const ext = path.extname(urlPath).toLowerCase();

  // Determine file path
  let filePath;
  if (urlPath === '/') {
    filePath = path.join(STATIC_ROOT, 'index.html');
  } else {
    filePath = path.join(STATIC_ROOT, urlPath);
  }

  // Security: prevent directory traversal
  if (!filePath.startsWith(STATIC_ROOT)) {
    console.log(`[403] ${urlPath} — blocked (traversal)`);
    res.writeHead(403);
    res.end('Forbidden');
    return;
  }

  fs.stat(filePath, (err, stats) => {
    // File found
    if (!err && stats.isFile()) {
      const contentType = MIME_TYPES[ext] || 'application/octet-stream';
      const cacheControl = ext === '.html' ? 'no-cache' : 'public, max-age=86400';

      fs.readFile(filePath, (readErr, data) => {
        if (readErr) {
          console.error(`[500] ${urlPath} — read error:`, readErr.message);
          res.writeHead(500);
          res.end('Internal Server Error');
          return;
        }
        console.log(`[200] ${urlPath} (${contentType})`);
        res.writeHead(200, {
          'Content-Type': contentType,
          'Cache-Control': cacheControl,
        });
        res.end(data);
      });
      return;
    }

    // File NOT found
    // If it's a known static asset extension → return 404 (DON'T serve index.html)
    if (STATIC_EXTENSIONS.has(ext)) {
      console.log(`[404] ${urlPath} — static asset not found (looked at: ${filePath})`);
      res.writeHead(404);
      res.end('Not Found');
      return;
    }

    // For routes without extension (SPA navigation) → serve index.html
    const indexPath = path.join(STATIC_ROOT, 'index.html');
    fs.readFile(indexPath, (readErr, data) => {
      if (readErr) {
        console.error(`[500] ${urlPath} — index.html read error:`, readErr.message);
        res.writeHead(500);
        res.end('Internal Server Error');
        return;
      }
      console.log(`[200] ${urlPath} → index.html (SPA fallback)`);
      res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
      res.end(data);
    });
  });
});

server.listen(PORT, '0.0.0.0', () => {
  console.log(`🎮 Tetris server running on port ${PORT}`);
  console.log(`   Static root: ${STATIC_ROOT}`);

  // Startup check: verify key files exist
  const keyFiles = ['index.html', 'css/style.css', 'js/app.js', 'assets/hero_golo.jpg'];
  keyFiles.forEach(f => {
    const fp = path.join(STATIC_ROOT, f);
    const exists = fs.existsSync(fp);
    console.log(`   ${exists ? '✅' : '❌'} ${f}`);
  });
});
