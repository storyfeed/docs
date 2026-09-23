<?php

namespace App\Http\Controllers;

use App\Http\Requests\PlaceOrderRequest;
use App\Models\Kitchen;
use Illuminate\Http\RedirectResponse;
use Storyfeed\Facades\Storyfeed;

class OrderController extends Controller
{
    public function store(PlaceOrderRequest $request, Kitchen $kitchen): RedirectResponse
    {
        $order = $kitchen->orders()->create($request->validated());

        Storyfeed::activity() // [!code focus]
            ->by($request->user()) // [!code focus]
            ->action('place', $order) // [!code focus]
            ->to($kitchen) // [!code focus]
            ->publish(); // [!code focus]

        return to_route('orders.show', $order);
    }
}
