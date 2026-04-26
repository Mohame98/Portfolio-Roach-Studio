<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <title>New portfolio inquiry</title>
</head>
<body style="margin:0;padding:24px;background:#f7f7f8;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;color:#1a1a1a;">
  <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="max-width:640px;margin:0 auto;background:#ffffff;border:1px solid #e5e7eb;border-radius:12px;overflow:hidden;">
    <tr>
      <td style="padding:24px 28px;background:#0b0d12;color:#f7f7f8;">
        <div style="font-size:12px;letter-spacing:.12em;text-transform:uppercase;opacity:.7;">Portfolio contact</div>
        <div style="font-size:20px;font-weight:600;margin-top:4px;">New inquiry from {{ $submission->name }}</div>
      </td>
    </tr>

    <tr>
      <td style="padding:24px 28px;">
        <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="font-size:14px;line-height:1.5;">
          <tr>
            <td style="padding:8px 0;color:#6b7280;width:120px;">Name</td>
            <td style="padding:8px 0;font-weight:500;">{{ $submission->name }}</td>
          </tr>
          <tr>
            <td style="padding:8px 0;color:#6b7280;">Email</td>
            <td style="padding:8px 0;font-weight:500;">
              <a href="mailto:{{ $submission->email }}" style="color:#2563eb;text-decoration:none;">{{ $submission->email }}</a>
            </td>
          </tr>
          @if ($submission->company)
            <tr>
              <td style="padding:8px 0;color:#6b7280;">Company</td>
              <td style="padding:8px 0;font-weight:500;">{{ $submission->company }}</td>
            </tr>
          @endif
          <tr>
            <td style="padding:8px 0;color:#6b7280;">Budget</td>
            <td style="padding:8px 0;font-weight:500;">{{ $budgetLabel }}</td>
          </tr>
          <tr>
            <td style="padding:8px 0;color:#6b7280;">Timeline</td>
            <td style="padding:8px 0;font-weight:500;">{{ $timelineLabel }}</td>
          </tr>
          <tr>
            <td style="padding:8px 0;color:#6b7280;">Submitted</td>
            <td style="padding:8px 0;font-weight:500;">{{ optional($submission->submitted_at)->format('Y-m-d H:i T') }}</td>
          </tr>
          @if ($submission->cf_country)
            <tr>
              <td style="padding:8px 0;color:#6b7280;">Country (CF)</td>
              <td style="padding:8px 0;font-weight:500;">{{ $submission->cf_country }}</td>
            </tr>
          @endif
        </table>

        <hr style="border:none;border-top:1px solid #e5e7eb;margin:24px 0;">

        <div style="font-size:12px;letter-spacing:.08em;text-transform:uppercase;color:#6b7280;margin-bottom:8px;">Message</div>
        <div style="font-size:15px;line-height:1.6;white-space:pre-wrap;word-break:break-word;">{{ $submission->message }}</div>

        <hr style="border:none;border-top:1px solid #e5e7eb;margin:24px 0;">

        <p style="font-size:12px;color:#9ca3af;margin:0;">
          Reply to this email to respond directly to {{ $submission->name }}. Submission ID #{{ $submission->id }}.
        </p>
      </td>
    </tr>
  </table>
</body>
</html>
