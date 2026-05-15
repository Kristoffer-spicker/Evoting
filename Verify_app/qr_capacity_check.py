"""
Check the theoretical maximum number of candidates that fit in a QR code.

Each candidate requires:
  - 1 ciphertext : 2 EC points (25 bytes each) + 1 scalar (24 bytes) = 74 bytes
  - 1 proof      : 2 scalars (24 bytes each) + 1 EC point (25 bytes) = 73 bytes
  - Total        : 147 bytes per candidate

The raw bytes are base64-encoded before being put in the QR code.
147 bytes / 3 * 4 = 196 base64 characters per candidate (exact, no padding waste).

Run from inside the verify_app container:
    python3 qr_capacity_check.py
"""

import base64
import os
import segno  # type: ignore

BYTES_PER_CANDIDATE = 147  # 74 (ciphertext) + 73 (proof)

print(f"{'Candidates':>10} {'Base64 chars':>13} {'QR version':>10} {'Modules':>8}")
print("-" * 46)

for n in range(1, 20):
    raw = os.urandom(n * BYTES_PER_CANDIDATE)  # random bytes → lowercase in base64 → byte mode
    content = base64.b64encode(raw).decode('ascii')
    try:
        qr = segno.make_qr(content, error='l')
        modules = 4 * qr.version + 17
        print(f"{n:>10} {len(content):>13} {qr.version:>10} {modules:>7}x{modules}")
    except Exception:
        print(f"{n:>10} {len(content):>13} {'-- EXCEEDS QR LIMIT --':>19}")
        break
