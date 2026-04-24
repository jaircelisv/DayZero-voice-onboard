# DayZero backend · Chainguard hardened image (J9 · premio Chainguard $1k)

# --- build stage ---
FROM cgr.dev/chainguard/node:latest-dev AS build
WORKDIR /app
COPY package.json tsconfig.json ./
RUN npm install --omit=optional
COPY src ./src
RUN npx tsc -p tsconfig.json

# --- runtime stage ---
FROM cgr.dev/chainguard/node:latest
WORKDIR /app
COPY --from=build /app/node_modules ./node_modules
COPY --from=build /app/dist ./dist
COPY package.json ./
ENV NODE_ENV=production
EXPOSE 3000
CMD ["dist/server.js"]
