<?php

namespace App\Http\Controllers;

use App\Http\Requests\PlaceOrderRequest;
use App\Models\Shop;
use Illuminate\Http\RedirectResponse;
use Storyfeed\Facades\Storyfeed;

class OrderController extends Controller
{
    public function store(
        PlaceOrderRequest $request,
        Shop $shop,
    ): RedirectResponse {
        $order = $shop->orders()->create($request->validated());

        Storyfeed::activity()
            ->by($request->user())
            ->action('place', $order)
            ->to($shop)
            ->publish();

        return to_route('orders.show', $order);
    }
}
