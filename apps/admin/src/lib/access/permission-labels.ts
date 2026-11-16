/**
 * Display text for permissions, groups and bundles.
 *
 * `@mia/permissions` owns the identities (keys, groups) and ships an English
 * label for each, because the server uses the package too. The admin shows the
 * operator's language instead: `i18n/<lang>/permissions.json`, keyed by the
 * package's own keys, with the package's English as the fallback. A test pins
 * the English catalogue to the package, so a new permission cannot ship
 * without an entry.
 *
 *   permissionLabel('order:read')   it → "Visualizza ordini"
 *   permissionGroupLabel('Orders')  it → "Ordini"
 *   bundleLabel(bundle)             it → "Gestione ordini"
 *
 * Call at render time — these read the interface language.
 */
import {
  permissionByCode,
  PERMISSION_LIST,
  type PermissionBundle,
  type PermissionDefinition,
  type PermissionGroup,
} from '@mia/permissions';

import { tOptional } from '~/lib/ui-text';

/** A definition, or just its key (`order:read`) when the caller only has that. */
export function permissionLabel(permission: PermissionDefinition | string): string {
  const key = typeof permission === 'string' ? permission : permission.key;
  const english =
    typeof permission === 'string'
      ? (PERMISSION_LIST.find((definition) => definition.key === key)?.label ?? key)
      : permission.label;
  return tOptional(`permissions.perm.${key}`) ?? english;
}

export function permissionLabelByCode(code: number): string | undefined {
  const definition = permissionByCode(code);
  return definition ? permissionLabel(definition) : undefined;
}

export function permissionGroupLabel(group: PermissionGroup): string {
  return tOptional(`permissions.group.${group}`) ?? group;
}

export function bundleLabel(bundle: PermissionBundle): string {
  return tOptional(`permissions.bundle.${bundle.key}`) ?? bundle.label;
}

export function bundleDescription(bundle: PermissionBundle): string {
  return tOptional(`permissions.bundle.${bundle.key}.description`) ?? bundle.description;
}
