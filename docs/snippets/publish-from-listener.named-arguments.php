<?php

namespace App\Listeners;

use App\Events\OrderPlaced;
use Storyfeed\Facades\Storyfeed;

class RecordOrderPlaced
{
    public function handle(OrderPlaced $event): void
    {
        Storyfeed::record( // [!code focus]
            verb: 'place', // [!code focus]
            object: $event->order, // [!code focus]
            actor: $event->customer, // [!code focus]
            target: $event->order->kitchen, // [!code focus]
        ); // [!code focus]
    }
}
