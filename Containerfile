FROM node:22-alpine AS builder

WORKDIR /app

RUN apk add --no-cache python3 make g++

COPY package.json package-lock.json ./
RUN npm ci

COPY . .
RUN npm run build

FROM node:22-alpine AS runner

WORKDIR /app

ENV NODE_ENV=production
ENV ORIGIN=http://localhost:3000
ENV BODY_SIZE_LIMIT=10485760

RUN addgroup -S app && adduser -S app -G app

COPY --from=builder /app/build ./build
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/package.json ./package.json
COPY --from=builder /app/drizzle ./drizzle
COPY --from=builder /app/drizzle.config.ts ./drizzle.config.ts
COPY --from=builder /app/src/lib/db ./src/lib/db
COPY --from=builder /app/questions ./questions
COPY --from=builder /app/tsconfig.json ./tsconfig.json

COPY <<'EOF' /app/entrypoint.sh
#!/bin/sh
set -e
npx drizzle-kit migrate
node --import tsx src/lib/db/seed.ts
exec node build
EOF
RUN chmod +x /app/entrypoint.sh

RUN mkdir -p /app/data && chown -R app:app /app

USER app

EXPOSE 3000

CMD ["/app/entrypoint.sh"]
