# Repeating activities

One row for an act that repeats, and every row for an act that happens once.

```php
Storyfeed::activity()->by($user)->action('rename', $document)->replace()->publish();   // replaces the earlier rename row
Storyfeed::activity()->by($user)->action('upload', $document)->publish();              // every upload is its own row
```

```php
// AppServiceProvider::boot()
Storyfeed::verbs([
    'rename' => ActivityType::Update,
    'upload' => ActivityType::Add,
    'submit' => ActivityType::Offer,
    'approve' => ActivityType::Accept,
]);

Storyfeed::grammar([
    'document.rename' => ':actor renamed :object',
    'document.upload' => ':actor uploaded :object',
    'document.submit' => ':actor submitted :object',
    'document.approve' => ':actor approved :object',
]);
```

## Which verbs replace

| the verb | happens | publish with | examples |
|---|---|---|---|
| create-shaped | once per object | `->publish()` | `create`, `upload`, `comment`, `join` |
| save-shaped | many times, and only the latest matters | `->replace()->publish()` | `rename`, `save`, `sync`, `viewed` |
| status-shaped | once per transition, retried | one verb per transition, each with `->replace()` | `submit`, `approve`, `archive` |

The question is whether a second row of this verb on this object is a second
fact. An upload is. A rename is not.

## A transition is a verb, replaced against itself

```php
Storyfeed::activity()->by($user)->action('submit', $document)->replace()->publish();
```

*later, the review completes*

```php
Storyfeed::activity()->by($user)->action('approve', $document)->replace()->publish();
```

`submit` replaces only `submit`, so a retried request or a double-clicked
button collapses to one row and the `approve` row is untouched. Both rows
survive. `->replace()` matches on the object and the verb. The full statement
is in [Recording](/basics/recording#what-replace-matches-on).

## A save-shaped verb that is not published at all

A save that changes nothing a reader would notice has no row, replaced or
otherwise. See [A save is not news](/cookbook/choosing-when-to-publish).
