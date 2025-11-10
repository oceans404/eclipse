# Verifiable Compute

**Verifiable compute** means anyone can prove that the nilCC enclave is running the exact Docker Compose workload published in this repo. This page summarizes the hashes involved, where they’re published, how we calculate them, and how you can verify them yourself.

---

## 1. Key Hashes

| Term | What it represents | How to obtain independently |
|------|--------------------|-----------------------------|
| `measurement_hash` | AMD SEV-SNP launch digest of OVMF + kernel + initrd + kernel params (which embed the Docker Compose hash) + CPU count. | Fetch from the workload’s attestation report or recompute with `nilcc-verifier measurement-hash …`. |
| `docker_compose_hash` | SHA-256 of `docker-compose.nilcc.yml`. Any edit to the compose file changes this hash and therefore the measurement. | Download/checkout the compose file at a specific commit and run `shasum -a 256 docker-compose.nilcc.yml`. |

The attestation report alone is insufficient—you must also know (and re-hash) the compose file referenced by the deployment.

---

## 2. Where the Values Live

1. **Public attestation report**  
   `https://be37ae74-be62-4800-8d11-a9abc50b1fc2.workloads.nilcc.sandbox.nillion.network/nilcc/api/v2/report`  
   Served by the `nilcc-attester` sidecar; contains the enclave’s measurement hash, `nilcc_version`, VM type, CPU count, and TLS fingerprint.

2. **Verification manifest (`verification-manifest.json`)**  
   Keeps a per-release record of `{ measurement_hash, docker_compose_hash, cpus, nilcc_version }`. Auditors can diff new releases against this file to see exactly what changed.

---

## 3. How We Generate the Manifest (Mirror This Yourself)

- **Script** – `scripts/update-verification-manifest.sh`  
  - Hashes `docker-compose.nilcc.yml` (supports `sha256sum` and `shasum`)  
  - Uses the official `ghcr.io/nillionnetwork/nilcc-verifier` image to recompute the SEV-SNP measurement for the specified version + CPU tier  
  - Writes/updates the entry in `verification-manifest.json`

- **GitHub Action** – `.github/workflows/verification-manifest.yml` (stored at repo root)  
  - Runs on pushes touching the compose/script/manifest (or manually)  
  - Executes the script above and commits the refreshed manifest if anything changed

Because both artifacts are in the repo, anyone can repeat the process and cross-check the published hashes.

---

## 4. How to Verify

### Web UI (recommended)
Use https://nilcc.nillion.com/verify and fill in:
1. Measurement hash – copy from `verification-manifest.json` (and optionally confirm against the attestation report)
2. Docker Compose hash – copy from `verification-manifest.json` (or recompute locally)
3. CPU count – from the manifest (`cpus: 1`)

The UI runs the same checks as the CLI (recomputes measurement + validates attestation) but is faster for most users.

### CLI
```bash
git clone https://github.com/NillionNetwork/nilcc && cd nilcc/nilcc-verifier
cargo build --release

./target/release/nilcc-verifier validate \
  https://be37ae74-be62-4800-8d11-a9abc50b1fc2.workloads.nilcc.sandbox.nillion.network \
  --docker-compose-hash <SHA256_OF_compose>
```
The verifier downloads the official nilCC artifacts for the reported version, recomputes the measurement using the compose hash + kernel args, checks the AMD SEV-SNP certificate chain, and confirms the attestation signature. Matching hashes prove the enclave is running this repo’s code.

---

## 5. Maintainer Checklist

1. Modify `docker-compose.nilcc.yml` (if needed).
2. Run `scripts/update-verification-manifest.sh` locally or trigger the “verification-manifest” GitHub Action.
3. Commit the updated compose file + `verification-manifest.json`.

Following that loop keeps the verification data honest and lets anyone in the community independently attest the running workload.***
