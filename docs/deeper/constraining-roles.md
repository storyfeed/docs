# Constraining Roles

## Introduction

Role constraints limit which model types may fill an activity's roles.
A publish with a different type throws before the activity is stored.

<script setup>
import { scenes } from '../.vitepress/theme/samples'
const placed = { ...scenes.order, data: null, glyph_intent: null }
</script>

<a id="publishing-an-activity"></a>

<a id="allowing-role-types"></a>

## Defining Role Constraints

```php memo="routes/feed.php"
use App\Models\Kitchen;
use App\Models\Order;
use App\Models\User;
use Storyfeed\Facades\Story;

Story::for(Order::class)->verb('place')
    ->headline(':actor placed :object with :target')
    ->icon('shopping-bag')
    ->whereActor(User::class)
    ->whereTarget(Kitchen::class);
```

<FeedExample :items="[placed]" />

Publishing an order placed by a user with a kitchen target satisfies both constraints. Like Laravel's
`Route::where()` and `whereIn()`, these methods restrict allowed values;
Storyfeed checks role types at publish time instead of matching a URL.

| Method | Role Checked |
|---|---|
| `whereActor(User::class)` | actor |
| `whereObject(Order::class)` | object |
| `whereTarget(Kitchen::class)` | target |
| `whereContext(Kitchen::class)` | context |
| `whereRole('origin', Kitchen::class)` | origin; also accepts `result`, `instrument` or any role above |

### Model Types and Morph Aliases

Each accepts model classes, morph aliases, or `'party'`. Classes resolve through
`getMorphClass()`. Pass several types as separate arguments or as an array.
An empty type list, `'*'`, or a class that is not an Eloquent model throws at
declaration. Repeating a constraint replaces the allowed types for that role.

<a id="allowing-parties"></a>

### Parties and Empty Roles

```php memo="routes/feed.php"
use App\Models\Kitchen;
use App\Models\Order;
use App\Models\User;
use Storyfeed\Facades\Story;

Story::for(Order::class)->verb('place')
    ->headline(':actor placed :object with :target')
    ->icon('shopping-bag')
    ->whereActor(User::class, 'party')
    ->whereTarget(Kitchen::class);
```

<FeedExample :items="[placed]" />

This replaces the preceding declaration and also allows a declared party to
act. `'party'` resolves to the configured party morph alias; the default is
`storyfeed.party`. `Storyfeed\Models\Party::class` is another way to name it.

Actor defaults are resolved before the constraint is checked. If the verb or
fallback supplies a party, `whereActor(User::class)` rejects it unless `'party'`
is also allowed. Empty roles never violate a constraint: a null target is
allowed, and an anonymous actor remains allowed even with `whereActor()`.
Constraints limit types; they do not make roles required.

### Constraints on Groups

Constraints can be declared on a verb, a class binding, a resource or a
[group](/deeper/named-stories#nesting-groups). A Story constructed with data takes
its constraints on the binding in `routes/feed.php`.

An inner group replaces the outer constraint for that role. A verb's own
constraint takes precedence over its groups.

<a id="handling-a-mismatch"></a>

## Handling Role Mismatches

With only `User::class` allowed, publishing `place` about an order with a party
actor throws `Storyfeed\Exceptions\StoryRoleMismatch`:

```txt
Wrong actor for [Verb: place] [Key: order.place] [Expected: user] [Given: storyfeed.party].
The verb's ->whereActor() says which types may be its actor; add 'party' to allow
a Party, or publish ->anonymously() when nobody is known.
```

The exception names the verb's declaration key, role, allowed types and actual
type. A queued publish checks on the worker; `Storyfeed::fake()` checks queued
activities too. An object constraint checks every member of a composite.

## Inspecting Constraints

### Listing Constraints

```bash
php artisan storyfeed:list --type=order -v
```

The verbose listing adds a **Where** column beside **Middleware**. JSON output
always includes the constraints in `where`.

### Checking Stored Activities

```bash
php artisan storyfeed:doctor --only=role_constraints
```

The doctor reports `role_constraints.violated` as a warning for live stored
rows whose role types violate a constraint. Null roles and tombstones are
skipped. The rows remain in the feed; the check does not rewrite them.
