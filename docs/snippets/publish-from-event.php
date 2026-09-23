<?php

namespace App\Events;

use App\Models\Order;
use App\Models\User;
use Storyfeed\Contracts\PublishesToFeed; // [!code focus]
use Storyfeed\Facades\Storyfeed;
use Storyfeed\PendingActivity; // [!code focus]

class OrderPlaced implements PublishesToFeed // [!code focus]
{
    public function __construct(public Order $order, public User $customer) {}

    public function toFeedActivity(): ?PendingActivity // [!code focus]
    { // [!code focus]
        return Storyfeed::activity() // [!code focus]
            ->by($this->customer) // [!code focus]
            ->action('place', $this->order) // [!code focus]
            ->to($this->order->kitchen); // [!code focus]
    } // [!code focus]
}
