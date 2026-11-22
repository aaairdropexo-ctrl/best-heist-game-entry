// Serve game/ on http://localhost:8080 for play-testing in desktop Chrome.
// Static files only, no build step — the same files the grader receives.
import { createServer } from 'node:http';
import { readFile } from 'node:fs/promises';
import { extname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const here = fileURLToPath(new URL('.', import.meta.url));
const root = join(here, 'game');
const types = {
  '.html': 'text/html',
  '.js': 'text/javascript',
  '.mjs': 'text/javascript',
  '.css': 'text/css',
  '.json': 'application/json',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
};

const server = createServer(async (request, response) => {
  try {
    const url = new URL(request.url ?? '/', 'http://localhost');
    const path = join(root, url.pathname === '/' ? 'index.html' : url.pathname);
    const data = await readFile(path);
    response.writeHead(200, { 'content-type': types[extname(path)] ?? 'application/octet-stream' });
    response.end(data);
  } catch {
    response.writeHead(404);
    response.end('not found');
  }
});

server.listen(8080, () => {
  console.log('The Midnight Express at http://localhost:8080');
});
