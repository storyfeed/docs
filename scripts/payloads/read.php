<?php

/*
 * Reads the docs world's rows through core's array source and prints the
 * payload nodes, keyed by row id. Input on stdin, from scripts/payloads.mjs:
 *
 *   {"verbs": {verb: {glyph, headline}}, "intents": {"type.verb": intent}, "items": [item, …]}
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

$items = Storyfeed::feed()->source(new ArraySource($input['items']))->log()->limit(PHP_INT_MAX)->get()->toArray();

echo json_encode(array_column($items, null, 'id'), JSON_THROW_ON_ERROR | JSON_UNESCAPED_SLASHES | JSON_UNESCAPED_UNICODE | JSON_PRETTY_PRINT);
