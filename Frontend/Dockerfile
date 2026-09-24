# Dev image: installs dependencies once at build time; source code is bind-mounted
# by docker-compose.yml so edits are picked up without rebuilding.
FROM node:22-alpine

WORKDIR /app

RUN corepack enable

COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
RUN pnpm install --frozen-lockfile

COPY . .

EXPOSE 5173

CMD ["pnpm", "dev"]
