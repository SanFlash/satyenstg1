# Security model

1. Explicit user initiation for each run.
2. Domain allowlist for browser execution.
3. Validate schemas, action types, counts, delays and locators on execution host.
4. Reject arbitrary JavaScript, shell commands and unbounded loops.
5. Validate exact extension origin in Native Messaging host.
6. Use request IDs, message-size limits, timeouts and replay protection.
7. Independent desktop emergency stop; cancel pending actions and release held inputs.
8. Visible execution state and audit logs.
9. Confirmation for destructive or sensitive operations.
10. Never store credentials, cookies or tokens in workflow exports.
11. Do not conceal automation or bypass monitoring/security controls.

Connection UI is demonstrative until a real pairing protocol is implemented.
