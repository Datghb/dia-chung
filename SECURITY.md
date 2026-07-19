# Security policy

## Reporting

Do not open a public issue for suspected credential exposure, access-control bypass, or personal-data leakage. Report it privately to the repository owner with reproduction steps and the affected commit.

## Deployment requirements

- Set `APP_ENV=production` and a strong, unique `ADMIN_API_KEY`.
- Keep provider keys server-side; never expose them through debug endpoints or frontend variables.
- Restrict `FRONTEND_ORIGIN` to approved HTTPS origins.
- Put the API behind TLS, request-size limits, rate limiting, and centralized access logs.
- Rotate provider and admin keys after suspected disclosure.

Administrative crawl, queue deletion, status changes, debug data, and human review fail closed in production when `ADMIN_API_KEY` is absent. Clients send the configured value in the `X-Admin-Key` header.

## Data handling

The pipeline anonymizes common PII before classification. Human-review audit events contain case identifiers, decision metadata, timestamps, and analysis version—not the original social content. Raw crawl and queue JSONL files remain operational data and require restricted filesystem access plus an explicit retention policy.
