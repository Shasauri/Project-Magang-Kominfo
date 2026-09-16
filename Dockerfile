FROM node:20-alpine

WORKDIR /app

# Copy package manifests
COPY package*.json ./

# Install dependencies
RUN npm install

# Copy application code
COPY . .

# Expose Next.js server port
EXPOSE 3000

# Environment variables for dev server binding & HMR inside container
ENV PORT=3000
ENV WATCHPACK_POLLING=true

# Command to run Next.js development server bound to all interfaces
CMD ["npx", "next", "dev", "-H", "0.0.0.0", "-p", "3000"]
