import fs from 'node:fs';
import path from 'node:path';
import { execSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import dotenv from 'dotenv';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const envPath = ['.env.local', '.env'].map((file) => path.join(root, file)).find((file) => fs.existsSync(file));
if (!envPath) throw new Error('Run `neon deploy` or `neon env pull` first. No root .env.local or .env was found.');
const env = dotenv.parse(fs.readFileSync(envPath));
let functionUrl = env.ELSEWHERE_API_URL;
if (!functionUrl) {
  const output = execSync('npx.cmd neon@latest functions get api -o json', { cwd: root, encoding: 'utf8', stdio: ['ignore', 'pipe', 'inherit'] });
  const jsonText = output.slice(output.indexOf('{'), output.lastIndexOf('}') + 1);
  if (jsonText.startsWith('{')) {
    const response = JSON.parse(jsonText);
    functionUrl = response.invocation_url ?? response.function?.invocation_url ?? response.url;
  }
}
if (!functionUrl) throw new Error('Could not determine the deployed Function URL. Run `neon functions get api` and set ELSEWHERE_API_URL in the root .env.local.');
const lines = [
  `EXPO_PUBLIC_NEON_AUTH_URL=${env.NEON_AUTH_BASE_URL ?? ''}`,
  `EXPO_PUBLIC_NEON_REALTIME_URL=${env.NEON_REALTIME_URL ?? ''}`,
  `EXPO_PUBLIC_ELSEWHERE_API_URL=${functionUrl}`,
];
if (lines.some((line) => line.endsWith('='))) throw new Error('Neon Auth and Realtime must be enabled before syncing mobile env.');
fs.writeFileSync(path.join(root, 'mobile', '.env.local'), `${lines.join('\n')}\n`);
console.log('Wrote mobile/.env.local with public service URLs only.');
