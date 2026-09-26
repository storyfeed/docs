<?php

namespace App\Events;

use App\Models\Order;
use Illuminate\Foundation\Events\Dispatchable;
use Storyfeed\Contracts\PublishesToFeed;
use Storyfeed\Facades\Storyfeed;
use Storyfeed\PendingActivity;

class OrderPaid implements PublishesToFeed
{
    use Dispatchable;

    public function __construct(public Order $order) {}

    public function toFeedActivity(): ?PendingActivity
    {
        return Storyfeed::activity()
            ->by('Stripe')
            ->action('pay', $this->order);
    }
}
