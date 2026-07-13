FROM node:26-alpine

ENV NODE_ENV=production

WORKDIR /app

RUN npm install --global pnpm@11.10.0

COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
RUN pnpm install --frozen-lockfile --prod

COPY src ./src

USER node

CMD ["node", "--import", "tsx", "src/main.ts"]
