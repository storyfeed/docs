<?php

/*
 * Reads the docs world's rows through core's array source and prints the
 * payload nodes, keyed by row id. Input on stdin, from scripts/payloads.mjs:
 *
 *   {"verbs": {verb: {glyph, headline}}, "intents": {"type.verb": intent}, "items": [item, …]}
 *
 * With "live": {name: [item id, …]}, it instead reads each named subset of the
 * items in Live mode, as its own source, and prints {name: [node, …]} in page
 * order (scripts/live-drift.test.mjs).
 *
 *   php scripts/payloads/read.php <core path> < input.json
 */

use Orchestra\Testbench\Foundation\Application;
use Storyfeed\Facades\Story;
use Storyfeed\Facades\Storyfeed;
use Storyfeed\Sources\ArraySource;
use Storyfeed\StoryfeedServiceProvider;

$core = $argv[1] ?? throw new InvalidArgumentException('Pass the path to a storyfeed/storyfeed checkout.');

require "{$core}/vendor/autoload.php";

$app = Application::create(
    basePath: Application::applicationBasePath(),
    options: ['extra' => ['dont-discover' => ['*']]],
);

// No feed file and no database: everything comes from the input.
$app['config']->set('storyfeed.definitions', false);
$app->register(StoryfeedServiceProvider::class);

$input = json_decode(stream_get_contents(STDIN), true, flags: JSON_THROW_ON_ERROR);

foreach ($input['verbs'] as $verb => $wording) {
    Story::verb($verb)->headline($wording['headline'])->icon($wording['glyph']);
}

foreach ($input['intents'] as $key => $intent) {
    [$type, $verb] = explode('.', $key, 2);
    Story::for($type)->verb($verb)->intent($intent);
}

$flags = JSON_THROW_ON_ERROR | JSON_UNESCAPED_SLASHES | JSON_UNESCAPED_UNICODE | JSON_PRETTY_PRINT;

if (isset($input['live'])) {
    $byId = array_column($input['items'], null, 'id');

    echo json_encode(array_map(
        fn (array $ids) => Storyfeed::feed()
            ->source(new ArraySource(array_map(fn (string $id) => $byId[$id], $ids)))
            ->live()->limit(PHP_INT_MAX)->get()->toArray(),
        $input['live'],
    ), $flags);

    return;
}

$items = Storyfeed::feed()->source(new ArraySource($input['items']))->log()->limit(PHP_INT_MAX)->get()->toArray();

echo json_encode(array_column($items, null, 'id'), $flags);
