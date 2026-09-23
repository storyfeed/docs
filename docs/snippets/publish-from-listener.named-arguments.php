<?php

namespace App\Listeners;

use App\Events\OrderPlaced;
use Storyfeed\Facades\Storyfeed;

class RecordOrderPlaced
{
    public function handle(OrderPlaced $event): void
    {
        Storyfeed::record(
            'place',
            $event->order,
            actor: $event->customer,
            target: $event->order->kitchen,
        );
    }
}
