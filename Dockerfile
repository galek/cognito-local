FROM node:19-alpine as builder
WORKDIR /app

# dependencies and code
ADD package.json src ./
# building
RUN npm i
RUN npm run build
RUN npm prune --production

FROM node:19-alpine
WORKDIR /app
COPY --from=builder /app/dist .
COPY --from=builder node_modules node_modules

# bindings
EXPOSE 9229
ENV HOST 0.0.0.0
ENV PORT 9229
VOLUME /app/.cognito
ENTRYPOINT ["node", "index.js"]
