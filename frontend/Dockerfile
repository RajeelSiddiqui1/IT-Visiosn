FROM node:20-bullseye

WORKDIR /app

# Install build tools + canvas dependencies
RUN apt-get update && apt-get install -y \
    python3 \
    make \
    g++ \
    pkg-config \
    libcairo2-dev \
    libpango1.0-dev \
    libjpeg-dev \
    libgif-dev \
    librsvg2-dev \
    && rm -rf /var/lib/apt/lists/*

# Copy package.json first to leverage Docker cache
COPY package*.json ./

# Install production dependencies
RUN npm install --omit=dev

# Copy rest of the app
COPY . .

EXPOSE 5000
EXPOSE 8288

CMD ["node", "src/server.js"]
