import { toast } from 'svelte-sonner';

import { API_BASE } from '~/lib/api';
import { t } from '~/lib/ui-text';
import type { BackupRun } from './backup-types';

/** Fetches the dump through the authenticated endpoint and hands it to the browser as a file. */
export async function downloadBackup(run: BackupRun): Promise<void> {
  try {
    const response = await fetch(`${API_BASE}/api/admin/backups/${run.id}/download`, {
      credentials: 'include',
    });
    if (!response.ok) throw new Error('Download failed');
    const url = URL.createObjectURL(await response.blob());
    const a = document.createElement('a');
    a.href = url;
    a.download = run.fileName;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
  } catch {
    toast.error(t('settings.downloadFailed'));
  }
}
