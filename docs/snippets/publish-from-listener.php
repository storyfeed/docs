<?php

namespace App\Listeners;

class RecordUpload
{
    public function handle(DocumentUploaded $event): void
    {
        Storyfeed::activity()
            ->by($event->user)
            ->action('upload', $event->document)
            ->to($event->document->project)
            ->publish();
    }
}
