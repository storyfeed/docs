# Constraining Roles

## Introduction

Role constraints limit which model types may fill an activity's roles.
A headline written for a shop target may not describe another type correctly.
Use a constraint to reject that type before storing the activity.

<script setup>
import { scene } from '../.vitepress/theme/world'
const placed = { ...scene.order, data: null, glyph_intent: null }
</script>

<a id="publishing-an-activity"></a>

<a id="allowing-role-types"></a>

## Defining Role Constraints

```php memo="routes/feed.php"
use App\Models\Shop;
use App\Models\Order;
use App\Models\User;
use Storyfeed\Facades\Story;

Story::for(Order::class)->verb('place')
    ->headline(':actor placed :object with :target')
    ->icon('shopping-bag')
    ->whereActor(User::class)
    ->whereTarget(Shop::class);
```

<FeedExample :items="[placed]" />

An order placed by a user with a shop target satisfies both constraints.
Like Laravel's `Route::where()` and `whereIn()`, these methods restrict allowed
values. Storyfeed checks model types when publishing the activity.

| Method | Role Checked |
|---|---|
| `whereActor(User::class)` | actor |
| `whereObject(Order::class)` | object |
| `whereTarget(Shop::class)` | target |
| `whereContext(Shop::class)` | context |
| `whereRole('origin', Shop::class)` | origin; also accepts `result`, `instrument` or any role above |

### Model Types and Morph Aliases

Each method accepts model classes, morph aliases, or `'party'`. Model classes
resolve through `getMorphClass()`. Pass multiple types as separate arguments
or an array. An empty list, `'*'`, or a class that is not an Eloquent model
throws an exception when declared. Repeating a constraint replaces its allowed
types for that role.

<a id="allowing-parties"></a>

### Parties and Empty Roles

```php memo="routes/feed.php"
use App\Models\Shop;
use App\Models\Order;
use App\Models\User;
use Storyfeed\Facades\Story;

Story::for(Order::class)->verb('place')
    ->headline(':actor placed :object with :target')
    ->icon('shopping-bag')
    ->whereActor(User::class, 'party')
    ->whereTarget(Shop::class);
```

<FeedExample :items="[placed]" />

Replace the preceding declaration with this example to also allow a party actor.
The `'party'` value resolves to the configured morph alias, `storyfeed.party`
by default. You may also use `Storyfeed\Models\Party::class`.

Actor defaults are resolved before the constraint is checked. If the verb or
fallback supplies a party, `whereActor(User::class)` rejects it unless `'party'`
is also allowed. Empty roles never violate a constraint: a null target is
allowed, and an anonymous actor remains allowed even with `whereActor()`.
Constraints limit types; they do not make roles required.

### Constraints on Groups

Declare constraints on a verb, class registration, resource, or
[group](/deeper/named-stories#nesting-groups). For a Story that accepts constructor
data, add constraints to its registration in `routes/feed.php`.

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

The exception names the verb, its role, the allowed types and the actual type.

> [!NOTE]
> [Queued activities](/deeper/queues) are checked on the worker. The Storyfeed
> fake also checks queued activities. An object constraint applies to every
> member of a [composite](/deeper/composites).

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

The [doctor](/reference/doctor#role-constraints) reports
`role_constraints.violated` for stored activities whose role types violate a
constraint. Empty roles and tombstones are skipped. This warning does not
modify or remove the activities.
