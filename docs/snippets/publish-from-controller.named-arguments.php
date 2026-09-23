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

        Storyfeed::record( // [!code focus]
            verb: 'place', // [!code focus]
            object: $order, // [!code focus]
            actor: $request->user(), // [!code focus]
            target: $kitchen, // [!code focus]
        ); // [!code focus]

        return to_route('orders.show', $order);
    }
}
