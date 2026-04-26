@php
    $appName = config('app.name', 'Site');
@endphp
<!doctype html>
<html lang="en">
<head>
    <meta charset="utf-8">
    <title>{{ $appName }} invitation</title>
</head>
<body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background:#0d0e12; color:#e5e7eb; margin:0; padding:32px 16px;">
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:560px;margin:0 auto;background:#15171c;border:1px solid #23262d;border-radius:12px;padding:32px;">
        <tr>
            <td>
                <h1 style="font-size:20px;margin:0 0 16px;color:#f5f6f7;">You've been invited to {{ $appName }}</h1>
                <p style="line-height:1.55;color:#c2c5cc;margin:0 0 16px;">
                    A super admin has issued you an account with the role <strong style="color:#f5f6f7;">{{ $roleLabel }}</strong>.
                </p>
                <p style="line-height:1.55;color:#c2c5cc;margin:0 0 24px;">
                    Click the button below to set your password and finish registering. The link is single-use and
                    @if($expiresAt)
                        expires {{ $expiresAt->diffForHumans() }} ({{ $expiresAt->toDayDateTimeString() }} UTC).
                    @else
                        expires soon.
                    @endif
                </p>
                <p style="margin:0 0 32px;">
                    <a href="{{ $acceptUrl }}"
                       style="display:inline-block;background:#5fd39b;color:#0d0e12;font-weight:600;padding:12px 22px;border-radius:8px;text-decoration:none;">
                        Accept invitation
                    </a>
                </p>
                <p style="font-size:12px;line-height:1.55;color:#7d818a;margin:0;">
                    If the button doesn't work, paste this URL into your browser:<br>
                    <span style="word-break:break-all;color:#a4a8b0;">{{ $acceptUrl }}</span>
                </p>
                <p style="font-size:12px;line-height:1.55;color:#7d818a;margin:16px 0 0;">
                    Didn't expect this email? You can safely ignore it — the invitation will expire on its own.
                </p>
            </td>
        </tr>
    </table>
</body>
</html>
