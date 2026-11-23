# Tracker integration compatibility

SatyTracker78 treats tracker products as independent, explicitly authorized data providers. It does not impersonate their desktop clients, change their timers, manipulate idle/activity signals, interfere with screenshots, or bypass employer policies. API credentials belong in the local Windows credential store/DPAPI-backed vault, never in the browser extension or a committed file.

## Provider capability and prerequisites

| Provider | Official integration surface | Account / approval notes | SatyTracker78 status |
|---|---|---|---|
| Upwork | GraphQL APIs and OAuth 2.0 | Apply for API credentials; Upwork reviews the use case. Only approved API use is supported. | Research complete; adapter not implemented |
| TeamLogger | No public developer API documentation was located in the reviewed official materials. | Request API/integration documentation and written authorization from TeamLogger. | Awaiting vendor API access |
| Time Doctor | Official REST APIs | API access is described as Premium-plan; API visibility follows account role permissions. | Research complete; adapter not implemented |
| Hubstaff | REST API v2, OAuth 2.0/OIDC, scoped PAT and organization tokens | API availability depends on plan; least-privilege scopes required. | Research complete; adapter not implemented |
| DeskTime | Official API access using an account-specific API key | Obtain the current API specification and key from DeskTime account/vendor documentation. | Research complete; adapter not implemented |
| Toggl Track | Public Track API v9 and webhooks | Public API available to users; observe current rate limits. | Research complete; adapter not implemented |
| Clockify | Public REST API | API permissions follow workspace roles; free-plan rate limits apply. | Research complete; adapter not implemented |

## Planned connector contract

Each provider adapter will implement:
- `connect()`: provider-supported OAuth or API-key flow; no password scraping.
- `healthCheck()`: validate the credential and granted scopes.
- `getCurrentUser()` and `listWorkspaces()`: read-only account discovery.
- `getTimeEntries(from, to)`: read-only time-entry retrieval where the provider exposes it.
- `disconnect()`: revoke locally stored credentials and clear cached data.

Write operations, timer control, and employee-monitoring configuration are out of scope for the initial release. Provider endpoints, payloads, pagination, rate limits, and scopes must be implemented against the provider's current official API specification, not guessed.

## Delivery phases

1. Standalone Windows Native Messaging agent and secure local installation.
2. DPAPI-backed credential vault and provider adapter interface.
3. Read-only connectors with real OAuth/API smoke tests, beginning with providers that have public stable API docs.
4. Vendor-approved TeamLogger integration only after official API documentation or an authorized integration contract is supplied.
5. Dashboard connection health, data provenance, sync logs, and user-controlled disconnect.

## Official references reviewed

- Upwork developer portal: https://www.upwork.com/developer and API authentication: https://support.upwork.com/hc/en-us/articles/17995930500883--API-authentication-and-security
- TeamLogger product and support: https://www.teamlogger.com/ and https://www.teamlogger.com/site-pages/faq.html
- Time Doctor API: https://api2.timedoctor.com/ and https://support.timedoctor.com/migration/knowledge/how-to-use-the-time-doctor-api
- Hubstaff developer portal: https://developer.hubstaff.com/
- DeskTime API/integrations: https://help.desktime.com/hc/en-us and https://desktime.com/features/integrations
- Toggl Track API v9: https://engineering.toggl.space/docs/track/
- Clockify API: https://docs.clockify.me/

Last reviewed: 2026-11-23.
