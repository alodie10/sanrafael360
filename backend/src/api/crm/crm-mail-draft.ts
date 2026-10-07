import { execFile } from 'node:child_process';
import { mkdtemp, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { promisify } from 'node:util';

const execFileAsync = promisify(execFile);

const ABRIR_BORRADOR = `on run argv
  set theSubject to item 1 of argv
  set theTo to item 2 of argv
  set htmlText to read POSIX file (item 3 of argv) as «class utf8»
  tell application "Mail"
    set msg to make new outgoing message with properties {subject:theSubject, visible:true, html content:htmlText}
    tell msg
      make new to recipient at end of to recipients with properties {address:theTo}
    end tell
    activate
  end tell
end run
`;

export function renderCrmMailEml(input: { to: string; subject: string; html: string }): string {
  return [
    `To: ${input.to}`,
    `Subject: ${encodeMailSubject(input.subject)}`,
    'X-Unsent: 1',
    'MIME-Version: 1.0',
    'Content-Type: text/html; charset=UTF-8',
    'Content-Transfer-Encoding: 8bit',
    '',
    input.html,
    '',
  ].join('\r\n');
}

function encodeMailSubject(value: string): string {
  if (/^[\t\x20-\x7E]*$/.test(value)) return value;
  const words: string[] = [];
  for (let i = 0; i < value.length; i += 18) {
    const slice = Buffer.from(value.slice(i, i + 18), 'utf8').toString('base64');
    words.push(`=?UTF-8?B?${slice}?=`);
  }
  return words.join('\r\n ');
}

export async function abrirBorradorMail(input: {
  to: string;
  subject: string;
  html: string;
}): Promise<void> {
  if (process.platform !== 'darwin') {
    throw new Error('El borrador de Mail solo se abre en esta Mac');
  }
  const dir = await mkdtemp(join(tmpdir(), 'crm-mail-'));
  const script = join(dir, 'abrir.applescript');
  const cuerpo = join(dir, 'cuerpo.html');
  await writeFile(script, ABRIR_BORRADOR, 'utf8');
  await writeFile(cuerpo, input.html, 'utf8');
  await execFileAsync('osascript', [script, input.subject, input.to, cuerpo]);
}
