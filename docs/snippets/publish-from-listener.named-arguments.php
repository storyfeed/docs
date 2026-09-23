<?php

namespace App\Listeners;

use App\Events\OrderPlaced;
use Storyfeed\Facades\Storyfeed;

class RecordOrderPlaced
{
    public function handle(OrderPlaced $event): void
    {
        Storyfeed::record(
            verb: 'place',
            object: $event->order,
            actor: $event->customer,
            target: $event->order->kitchen,
        );
    }
}
