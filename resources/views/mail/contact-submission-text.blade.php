New portfolio inquiry from {{ $submission->name }}

Name:     {{ $submission->name }}
Email:    {{ $submission->email }}
@if ($submission->company)Company:  {{ $submission->company }}
@endif
Budget:   {{ $budgetLabel }}
Timeline: {{ $timelineLabel }}
Submitted:{{ ' ' }}{{ optional($submission->submitted_at)->format('Y-m-d H:i T') }}
@if ($submission->cf_country)Country:  {{ $submission->cf_country }}
@endif

--- Message ---
{{ $submission->message }}

--
Reply to this email to respond directly to {{ $submission->name }}.
Submission ID #{{ $submission->id }}.
