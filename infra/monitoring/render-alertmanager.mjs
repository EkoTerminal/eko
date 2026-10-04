import { readFile, writeFile } from 'node:fs/promises';
import { pathToFileURL } from 'node:url';

const receiverVars = ['OPS_ALERT_WEBHOOK_URL', 'ONCALL_ALERT_WEBHOOK_URL'];

// Alertmanager does not expand environment variables in its configuration.
export function renderAlertmanager(template, env) {
  const config = structuredClone(template);
  for (const name of receiverVars) {
    const value = env[name];
    let url;
    try { url = new URL(value); } catch { throw new Error(`Configure ${name} with an HTTPS webhook URL`); }
    if (url.protocol !== 'https:' || url.username || url.password || url.hash)
      throw new Error(`Configure ${name} with an HTTPS webhook URL without userinfo or fragment`);
    let found = false;
    for (const receiver of config.receivers) for (const webhook of receiver.webhook_configs ?? []) {
      if (webhook.url === '${' + name + '}') { webhook.url = value; found = true; }
    }
    if (!found) throw new Error(`Missing receiver placeholder ${name}`);
  }
  if (JSON.stringify(config).includes('${')) throw new Error('Unresolved receiver placeholder');
  return config;
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  try {
    const output = process.argv[2];
    if (!output || process.argv.length !== 3) throw new Error('Usage: node render-alertmanager.mjs <new-output-file>');
    const template = JSON.parse(await readFile(new URL('./alertmanager.json', import.meta.url), 'utf8'));
    const config = renderAlertmanager(template, process.env);
    // Exclusive creation prevents overwriting an existing host configuration or following a symlink.
    await writeFile(output, JSON.stringify(config, null, 2) + '\n', { mode: 0o600, flag: 'wx' });
    console.log('Receiver configuration rendered; validate it before provisioning.');
  } catch (error) {
    // Messages are constructed above; never echo an environment value or filesystem error.
    console.error(error instanceof Error && /^(Configure |Missing receiver|Unresolved receiver|Usage:)/.test(error.message)
      ? error.message : 'Receiver configuration could not be written');
    process.exitCode = 1;
  }
}
