# Casting Activity Data

An activity's data is stored as JSON, so a headline closure reads it back as
strings, numbers and arrays. Casts turn those values back into the types your
application uses: enums, dates, collections and your own value objects. They
work exactly like [Eloquent attribute casts](https://laravel.com/docs/eloquent-mutators#attribute-casting),
keyed by data key instead of column.

Casts change what your PHP code reads. They never change what Storyfeed
stores, or the `data` in the feed's JSON payload.

## Declaring Casts

Pass an array of casts to the `casts` method of a verb. Each key is a data key,
and each value is a cast an Eloquent model accepts:

```php memo="routes/feed.php"
use App\Enums\Channel;
use App\Models\Order;
use Storyfeed\Facades\Story;

Story::for(Order::class)
    ->verb('place')
    ->headline(':actor placed :object')
    ->casts([
        'channel' => Channel::class,
        'promised_at' => 'immutable_datetime',
    ]);
```

A headline closure's `get` method now returns the cast value:

```php memo="routes/feed.php"
use App\Enums\Channel;
use App\Models\Order;
use Storyfeed\ActivityContext;
use Storyfeed\Facades\Story;

Story::for(Order::class)
    ->verb('place')
    ->casts(['channel' => Channel::class])
    ->headline(
        fn (ActivityContext $activity) => $activity->get('channel') === Channel::Phone
            ? ':actor took :object by phone'
            : ':actor placed :object',
    );
```

The activity was recorded with plain data:

```php memo="app/Http/Controllers/OrderController.php" at="store()"
use Storyfeed\Facades\Storyfeed;

Storyfeed::activity('place', $order)
    ->data([
        'channel' => $order->channel,
        'promised_at' => $order->promised_at,
    ])
    ->publish();
```

An enum is recorded as its value and a date as an ISO 8601 string. The casts
read them back as a `Channel` and a `CarbonImmutable`.

### Declaring Casts on a Story Class

A Story class declares its casts in a `casts` method, as a model does:

```php memo="app/Stories/OrderPlaced.php"
<?php

namespace App\Stories;

use App\Enums\Channel;
use App\Models\Order;
use Storyfeed\PendingActivity;
use Storyfeed\Stories\Story;

class OrderPlaced extends Story
{
    public string|array|null $objectType = Order::class;

    public function __construct(public Order $order) {}

    public function toFeedActivity(): ?PendingActivity
    {
        return $this->activity()->data([
            'channel' => $this->order->channel,
            'promised_at' => $this->order->promised_at,
        ]);
    }

    public function headline(): string
    {
        return ':actor placed :object';
    }

    public function casts(): array // [!code highlight]
    {
        return [
            'channel' => Channel::class,
            'promised_at' => 'immutable_datetime',
        ];
    }
}
```

Like a verb's headline, casts are read when stories compile, and
`storyfeed:cache` caches them. A cast is a string or a class name, never a
closure.

Encrypted and hashed casts are refused when stories compile, including when
running `storyfeed:cache`. Activity data is stored as plain JSON.

### Wildcard Verbs

Casts on wildcard verbs merge with the more specific verb's casts. Each data
key is kept, and the more specific declaration wins when both cast the same
key. The order, from broadest to most specific, is `*.*`, `*.verb`, `type.*`,
and `type.verb`.

## Reading Cast Values

On an `ActivityContext`, only `get` reads through a cast. `all` and the typed helpers, such as
`string`, `enum` and `date`, read the recorded value, as a model's
`getAttributes` method does:

```php
$activity->get('channel');                   // Channel::Phone
$activity->all()['channel'];                 // 'phone'
$activity->enum('channel', Channel::class);  // Channel::Phone
```

Dot notation reads into a cast value. When `order` is cast to an object,
`get('order.total')` returns that object's `total` property.

Blade renderers reading a feed item's `data()` also get cast values:
`$item->data()->get('channel')` returns the enum. The item's `toArray()` and
JSON still contain the recorded values.

## Casting to Value Objects

### Collections of Objects

Use Laravel's `AsCollection::of` to read an array of arrays as a collection of
objects. Each item is passed to the class's constructor:

```php memo="routes/feed.php"
use App\Models\Order;
use App\ValueObjects\LineItem;
use Illuminate\Database\Eloquent\Casts\AsCollection;
use Storyfeed\ActivityContext;
use Storyfeed\Facades\Story;

Story::for(Order::class)
    ->verb('place')
    ->casts(['items' => AsCollection::of(LineItem::class)])
    ->headline(
        fn (ActivityContext $activity) => ':actor placed :object with '
            .$activity->get('items')->sum(fn (LineItem $item) => $item->quantity).' items',
    );
```

### Custom Casts

A class that implements `CastsAttributes` works as it does on a model. Its
`get` method receives the recorded value: a scalar as it was recorded, and an
array as its JSON text, which is what a JSON column hands a cast:

```php memo="app/Casts/AsMoney.php"
<?php

namespace App\Casts;

use App\ValueObjects\Money;
use Illuminate\Contracts\Database\Eloquent\CastsAttributes;
use Illuminate\Database\Eloquent\Model;

class AsMoney implements CastsAttributes
{
    public function get(Model $model, string $key, mixed $value, array $attributes): Money
    {
        return new Money($value, 'USD');
    }

    public function set(Model $model, string $key, mixed $value, array $attributes): mixed
    {
        return $value->cents;
    }
}
```

The `$model` a cast receives stands in for the activity's data and has no
table. A cast reads the recorded value, never the database.

### Castable Value Objects

A value object that implements `Castable` names its own cast, so the class
name is the whole declaration:

```php memo="routes/feed.php"
use App\Models\Order;
use App\ValueObjects\Address;
use Storyfeed\Facades\Story;

Story::for(Order::class)->verb('ship')->casts(['address' => Address::class]);
```

See [Castables](https://laravel.com/docs/eloquent-mutators#castables) in the
Laravel documentation for writing one.

## Recording Value Objects

`data` accepts a value object directly. One that implements `Arrayable` is
recorded as its `toArray` result, and one that implements `JsonSerializable`
as its JSON:

```php memo="app/Http/Controllers/OrderController.php" at="store()"
use App\ValueObjects\Address;
use Storyfeed\Facades\Storyfeed;

Storyfeed::activity('ship', $order)
    ->data(['address' => Address::fromOrder($order)])
    ->publish();
```

The row stores the array, and a cast reads it back as an `Address`. A queued
activity carries the array too, so the class does not need to be
serializable.

> [!WARNING]
> An object that implements neither interface is recorded with its public
> properties only. Private and protected properties are dropped without an
> error, and the cast later builds an incomplete object.

A whole data array can be one object as well: `->data(new OrderPlacedData(...))`
records its `toArray` result.

## Older Activities

Casts apply to every activity of the verb, including ones recorded before the
cast was declared. When a cast cannot read a recorded value, such as an enum
case that has since been removed, Storyfeed reports the exception and `get`
returns the recorded value, so the activity still appears in the feed.

Check for the type you expect before relying on it:

```php
$channel = $activity->get('channel');

$channel instanceof Channel ? $channel->label() : 'an unknown channel';
```
