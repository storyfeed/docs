<?php

namespace App\Http\Controllers;

use App\Models\Order;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Storyfeed\Facades\Storyfeed;

class PlaceOrderController extends Controller
{
    public function __invoke(Request $request, Order $order): RedirectResponse
    {
        $order->update(['status' => 'placed']);

        Storyfeed::record(
            verb: 'place',
            object: $order,
            actor: $request->user(),
            target: $order->kitchen,
        );

        return to_route('orders.show', $order);
    }
}
