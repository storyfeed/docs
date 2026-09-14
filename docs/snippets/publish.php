// where the upload happens: a controller, an action, a listener
Storyfeed::activity()
    ->by($user)
    ->action('upload', $document)
    ->to($project)
    ->publish();
