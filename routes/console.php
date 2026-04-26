<?php

use Illuminate\Foundation\Inspiring;
use Illuminate\Support\Facades\Artisan;
use Illuminate\Support\Facades\Schedule;

Artisan::command('inspire', function () {
    $this->comment(Inspiring::quote());
})->purpose('Display an inspiring quote');

// Shared-hosting cron should start short-lived workers, not a daemon.
// Hostinger can call `php artisan schedule:run` once per minute; this drains
// queued jobs and exits before the next cron tick.
Schedule::command('queue:work database --queue=default --stop-when-empty --max-time=50 --timeout=45 --tries=3 --sleep=1')
    ->everyMinute()
    ->withoutOverlapping()
    ->appendOutputTo(storage_path('logs/queue-cron.log'));
