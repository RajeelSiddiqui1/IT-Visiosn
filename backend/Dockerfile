FROM node:20

WORKDIR /app

RUN apt-get update && apt-get install -y \
    python3 \
    build-essential \
    libcairo2-dev \
    libjpeg-dev \
    libpango1.0-dev \
    libgif-dev \
    librsvg2-dev

COPY package*.json ./

RUN npm install

COPY . .

EXPOSE 5000
EXPOSE 8288

CMD ["npm","run","dev"]