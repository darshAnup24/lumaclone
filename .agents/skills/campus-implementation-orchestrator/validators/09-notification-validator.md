# Validator — Phase 9

## Purpose
Verify required notification types, recipient ownership, read state, and event lifecycle notification behavior.


## Common gate

Run only commands that exist in the repository. Discover equivalents when necessary.

Required evidence:
- commands executed
- exit status
- tests executed and result
- files changed
- security-sensitive changes, if any

Never edit validator tests merely to make them pass.


## Result contract

Return one of:

PASS
or

FAIL

If FAIL, list:
1. exact failing check
2. evidence
3. expected behavior
4. actual behavior
5. minimal fix required

Do not advance the phase on FAIL.
