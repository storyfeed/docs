# Updating Dependencies

Update the packages you intend to change, inspect what Composer resolved, and
run your application's checks before committing the lock file. Start with a
clean working tree so the dependency diff is easy to review.

## Start with a Targeted Update

For an application using core and the Filament adapter:

```bash
composer update storyfeed/storyfeed storyfeed/filament
```

Name only packages your application uses. Include `storyfeed/ui` if you intend
to update the UI package too. Leave dependency-widening flags off this first
attempt: Composer keeps other locked packages fixed and reports when that
prevents resolution.

The command respects your `composer.json` constraints. It does not move an
application onto a different release line or guarantee the newest available
release. Review the packages' requirements before choosing a target, especially
when an adapter depends on core and UI. A compatible adapter release may be
needed before core can move.

### When You Intend to Track Main

The [installation instructions](/getting-started/installation) target core's
`dev-main` branch. For an application deliberately following that branch, make
the intended version explicit:

```bash
composer update storyfeed/storyfeed --with storyfeed/storyfeed:dev-main
```

Add any other packages you intend to update to the explicit package list. Keep
that list: `composer update --with storyfeed/storyfeed:dev-main` without a package
list updates all packages.

A temporary `--with` constraint must fit the root constraint and all dependent
package requirements. If your root already requires `dev-main`, it makes the
intent visible without changing the constraint. If an adapter does not accept
that version, the override cannot make it compatible. Do not copy a branch
constraint into an application that intentionally follows tagged releases.

## Read a Refusal Before Widening the Update

A refusal is useful evidence. Read which requirement conflicts: it may be a
locked transitive dependency, an incompatible root constraint, an adapter's
supported core range, or a platform requirement. Widening dependency updates
only addresses the first of those.

If the named packages need transitive updates you deliberately accept, retry:

```bash
composer update storyfeed/storyfeed storyfeed/filament --with-dependencies
```

Keep any intentional, compatible `--with` constraint from your first command.
The lowercase `-w` alias allows dependencies of the named packages to update,
except packages that are also root requirements. Read the lock diff before
committing: these additional changes are now part of your upgrade.

Do not reach for `--with-all-dependencies` (`-W`) just to make a refusal disappear.
It also allows root-required dependencies to move within their constraints.
That broader application upgrade needs its own review; neither flag bypasses
incompatible requirements.

In one consumer trial, `-W` moved about 20 packages, including root requirements
such as `laravel/framework`, `livewire`, `sanctum`, `flysystem` and `guzzle`, and a
browser test failed. The apparent Storyfeed failure came from that broader
update. Retrying with `-w` moved 11 transitive packages. The bare targeted update
resolved cleanly and moved only the two intended packages. These are measured
results from one lock file, not promises about how many packages yours will move.

## Verify What Landed

After either successful form, inspect the installed version and the lock diff:

```bash
composer show storyfeed/storyfeed
composer show storyfeed/filament
git diff -- composer.json composer.lock
```

Omit the adapter command if it is not installed. Check the displayed versions
and source references against your intended target; inspect UI too if you
updated it. A successful resolution, or a green test suite against an unexpected
version, does not establish that the intended upgrade happened.

Run your application's tests, including its feed and browser checks, before
committing. If the diff includes unexpected packages, investigate them before
accepting the update.

See Composer's [update command reference](https://getcomposer.org/doc/03-cli.md#update-u-upgrade)
for partial updates, temporary constraints and dependency flags.
