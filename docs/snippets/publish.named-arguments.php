use Storyfeed\Facades\Storyfeed;

Storyfeed::record(
    verb: 'place',
    object: $order,
    actor: $customer,
    target: $kitchen,
);
