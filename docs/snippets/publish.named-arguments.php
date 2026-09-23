// where the order is placed: a controller, an action, a listener
use Storyfeed\Facades\Storyfeed;

Storyfeed::record(
    verb: 'place',
    object: $order,
    actor: $customer,
    target: $kitchen,
);
