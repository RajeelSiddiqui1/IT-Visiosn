FROM node:20-alpine

WORKDIR /app

# Install build tools for node-gyp (canvas, sharp)
RUN apk add --no-cache python3 make g++ libc6-compat

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm install --production

# Copy source code
COPY . .

# Expose backend + Inngest ports
EXPOSE 5000 8288

# Default command (server.js in src folder)
CMD ["node", "src/server.js"]
