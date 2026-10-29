# One complete build entry point

The user requested complete, understandable workflows after partial runs and cross-platform failures. `build.yml` is the sole dispatchable and automatic release workflow. Reusable helpers are internal-only. Android TV and phone share a target/format matrix; iOS uses one two-format helper. Signing identities, package identifiers, supported ABIs and testing/beta/main promotion remain unchanged.

Export and validation are separate stages. Required compilation inputs still gate dependent builds, while tests gate release publication. A failed browser assertion does not prevent producing otherwise buildable native artifacts. All required stages feed an always-run summary, so a partial or skipped build is visibly incomplete. No release may bypass validation.

Dependency caches are automatically verified and repaired; manual old-run dependency selection and partial-preview workflow modes are retired. Complete same-commit native, web and source collections are validated before existing GitHub release publication. Native artifact success remains distinct from physical-device validation.
