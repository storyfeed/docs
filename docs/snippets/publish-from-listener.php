<?php

namespace App\Listeners;

use App\Events\OrderPlaced;
use Storyfeed\Facades\Storyfeed;

class RecordOrderPlaced
{
    public function handle(OrderPlaced $event): void
    {
        Storyfeed::activity() // [!code focus]
            ->by($event->customer) // [!code focus]
            ->action('place', $event->order) // [!code focus]
            ->to($event->order->kitchen) // [!code focus]
            ->publish(); // [!code focus]
    }
}
