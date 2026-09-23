<?php

namespace App\Http\Controllers;

use App\Http\Requests\PlaceOrderRequest;
use App\Models\Kitchen;
use Illuminate\Http\RedirectResponse;
use Storyfeed\Facades\Storyfeed;

class OrderController extends Controller
{
    public function store(
        PlaceOrderRequest $request,
        Kitchen $kitchen,
    ): RedirectResponse {
        $order = $kitchen->orders()->create($request->validated());

        Storyfeed::record(
            verb: 'place',
            object: $order,
            actor: $request->user(),
            target: $kitchen,
        );

        return to_route('orders.show', $order);
    }
}
