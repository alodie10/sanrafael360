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
    set acc to first account
    set rawAddr to email addresses of acc
    if class of rawAddr is list then
      set addr to item 1 of rawAddr as text
    else
      set addr to rawAddr as text
    end if
    set theSender to (full name of acc) & " <" & addr & ">"
    set msg to make new outgoing message with properties {subject:theSubject, visible:true, html content:htmlText}
    tell msg
      set sender to theSender
      make new to recipient at end of to recipients with properties {address:theTo}
    end tell
    activate
  end tell
end run
`;

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
