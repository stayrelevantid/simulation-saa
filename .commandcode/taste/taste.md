# Taste

## Communication

- Writes requests in Indonesian (Bahasa Indonesia), mixing in English technical terms (e.g. "generate", "refresh kontent", "asyncronus"); expects replies in the same language. Confidence: 0.7

## Workflow

- Runs the project locally with Podman (not Docker) via `podman compose` using `compose.yaml` + `Containerfile`, and cares whether changes actually make it into the running container — asks "sudah jalan di podman belum?", not just whether local check/test/build passed. Confidence: 0.75
- After code changes, expects the running container to be rebuilt/redeployed (e.g. approving `podman compose up -d --build`) and the change verified live against the running service before it's considered done. Confidence: 0.6
