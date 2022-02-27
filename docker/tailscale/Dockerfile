FROM alpine as install-dependencies
RUN apk add --no-cache npm
WORKDIR /build
COPY . .
RUN npm ci

FROM alpine as tailscale-monitor
RUN apk add --no-cache nodejs curl
LABEL maintainer="xinmans <xinmans@gmail.com>"

WORKDIR /usr/src/app

CMD /bin/sh
CMD [ "node", "index.js" ]

COPY --from=install-dependencies /build .
