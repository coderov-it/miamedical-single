# Access control

Who can open the back office, and what each of them may reach.

Three layers, one unit of access:

| Layer                                   | Holds                                       |
| --------------------------------------- | ------------------------------------------- |
| `packages/permissions`                  | The catalog, the checks, the grantable sets |
| `apps/server/src/modules/admin-users`   | The write side — who exists, what they hold |
| `apps/admin/src/lib/access` + `/access` | The screen an operator grants access from   |

---

## The unit is an integer

A permission **is** its number. `admin_users.permissions` is `int[]`, every guard
compares integers, and the `order:update` string exists so a human can read the
catalog and the picker — never so code can decode one.

```ts
P.ORDER_UPDATE; // 1101 — a literal type, not a lookup
can(user, P.ORDER_UPDATE); // user.permissions.includes(1101)
```

Blocks of 100 per area, `+0` read · `+1` update · `+2` create · `+3` delete ·
`+10…` area-specific. A code is permanent and a retired code is never reused;
`catalog.ts` carries the full rules and the tombstone for the retired 2000 block.

`isSuperuser` is the one attribute that is not a code, and it means "every code,
including ones that do not exist yet". It exists so that adding a permission does
not silently strip an all-access operator of the new area.

There are no roles. `bundles.ts` is not a role — see below.

---

## Sets, not roles

A bundle is a **grant-time template**: clicking "Order desk" copies its fourteen
codes into the selection and is then forgotten. Nothing at runtime resolves a
bundle, so:

- editing a bundle never changes what an existing account can reach;
- a bundle may be renamed, re-scoped or deleted freely — no row refers to it;
- there is still exactly one thing a guard can ask about, which is the integer.

This is the whole reason the "set of attributes" requirement did not become a
`roles` table. A role would be a second unit of access, and every guard would
have to know which one it was holding.

`bundleCoverage()` returns `none | partial | full`, which is what lets a chip be
honest: a half-held set is neither on nor off, and rendering it as off would lose
the operator's own edits on the next click.

---

## What the endpoints refuse

`/api/admin/users`, in `modules/admin-users`. Four invariants, and every rule in
`service.ts` is one of them:

1. **Nobody edits their own access.** Own permissions, own activation, own
   deletion: all refused. A guard that stopped at "do you hold
   `admin:permission_assign`" would let the holder grant themselves everything
   else — and also let them lock themselves out. Changing your own password goes
   through `POST /api/auth/password`, which asks for the current one.
2. **You cannot grant what you do not hold**, and granting anything at all needs
   `admin:permission_assign`. `admin:create` alone still creates a working
   account; it just arrives holding nothing.
3. **Only a superuser can create a superuser.**
4. **The last active superuser stays.** Demoting, disabling or deleting the only
   one would leave nobody able to grant access again.

Two smaller decisions worth knowing:

- **Unknown codes are rejected, not dropped.** `normalizePermissions` drops them
  when _reading_ an old row, which is right. A client _sending_ one is out of
  date or wrong, and a silent drop turns that into a grant the operator thinks
  they made.
- **Codes are stored even while `isSuperuser` is on.** The flag makes them inert,
  not wrong, and keeping them means clearing the flag later reveals a considered
  set rather than an empty one. (`script/create-admin.ts` stores `[]` for a
  superuser because a CLI invocation has no set to preserve.)

Permission changes take effect on the target's **next request** — `withSession`
reads the row every time, so nothing needs invalidating. Disabling an account and
setting its password both additionally delete its session rows: `withSession`
already rejects an inactive account, and a password is reset precisely because
the old sessions are suspect.

### Split by decision, not by shape

| Endpoint               | Permission                | Why separate                            |
| ---------------------- | ------------------------- | --------------------------------------- |
| `PATCH /:id`           | `admin:update`            | Fixing a name is not handing out access |
| `PUT /:id/permissions` | `admin:permission_assign` | The grant surface                       |
| `POST /:id/password`   | `admin:update`            | Ends every session the account has      |

`PUT` rather than `PATCH` on permissions: the body is the account's whole access,
so a field the client forgot cannot read as "leave that part alone".

---

## The screen

`/access` (`routes.adminUsers`), reached from Settings → Admin Users. Standard
list chrome — `PageHeader` → `ListCard` → `Sheet` editor → `AlertDialog` — so it
reads like every other admin list.

The one component with an argument to make is
`lib/access/permission-picker.svelte`. Everything visible in it is a string (the
label, and the `order:update` key beneath it); everything bound is a number
(`codes` is the `int[]` that lands in the column). The catalog is **not fetched**:
it is static, and the picker imports the same module the server's guards compare
against.

Its shape, top to bottom: the superuser switch in its own well (a different kind
of grant, not a 49th checkbox), the bundle chips, the running `n of 48` count,
then the groups. A permission the operator does not hold themselves is dimmed
rather than absent — the server would refuse it, and one line above the grid says
why rather than repeating it 48 times.

The editor sheet saves through **two** calls, access first. Access first because
its refusals — the last superuser, granting past your own reach — are the ones
worth hitting before anything has changed. Two calls because an operator holding
only `admin:update` can fix a name here and never touch a grant; the profile
`PATCH` is skipped when nothing in it changed, and so is the permissions `PUT`.

An `admin:read` holder can open a row and read what it holds: the inputs are
disabled, the picker is read-only, and the footer offers Close rather than a Save
that could only fail.

Actions the server refuses on your own row are hidden on your own row, not shown
failing — and the sheet says _why_ in the one place the rule is not obvious ("You
cannot change your own access").

### The form gate

Save is never disabled for an incomplete form (AGENTS.md). The click validates,
writes into the same `Record<string, string>` the server's `error.fields` uses —
so a client check and a server rejection are indistinguishable on screen — and
`lib/form-gate.ts` moves focus to the first offending control. Revealed messages
clear as their field becomes right; nothing is revealed before the operator asks
to save. `disabled` while a request is in flight is a different thing and stays.

---

## Bootstrapping

The first superuser comes from the CLI and there is deliberately no self-service
registration:

```
pnpm --filter @mia/server admin:create -- --email you@example.com --superuser
```

After that, everything is done from `/access`. The CLI still takes raw codes
(`--permissions 1100,1101,1200`), which is the one place a human types the
numbers rather than reading the strings.
