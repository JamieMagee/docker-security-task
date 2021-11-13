FROM scratch
COPY --from=gcr.io/k8s-skaffold/skaffold:v0.11.0 /usr/bin/skaffold /usr/bin/skaffold
