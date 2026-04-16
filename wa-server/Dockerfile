FROM node:18-bullseye-slim

# Install dependencies for Puppeteer (Chromium)
RUN apt-get update \
    && apt-get install -y wget gnupg \
    && wget -q -O - https://dl-ssl.google.com/linux/linux_signing_key.pub | apt-key add - \
    && sh -c 'echo "deb [arch=amd64] http://dl.google.com/linux/chrome/deb/ stable main" >> /etc/apt/sources.list.d/google.list' \
    && apt-get update \
    && apt-get install -y google-chrome-stable fonts-ipafont-gothic fonts-wqy-zenhei fonts-thai-tlwg fonts-kacst fonts-freefont-ttf libxss1 \
      --no-install-recommends \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app

# Copy the environment file so whatsapp bot can read it (if it's passed via build)
COPY package*.json ./

# Install dependencies
RUN npm install

# Copy all server files
COPY . .

# Expose port (if your wa-server uses port 5000)
EXPOSE 5000

# Start the bot
CMD ["node", "server.js"]
