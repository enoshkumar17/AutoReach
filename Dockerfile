# Production Dockerfile for AutoReach Unified Fullstack Service
FROM node:20-alpine AS builder

WORKDIR /app

# Copy package definitions
COPY package.json ./
COPY backend/package*.json ./backend/
COPY backend/prisma ./backend/prisma/
COPY frontend/package*.json ./frontend/

# Install dependencies
RUN npm --prefix backend install
RUN npm --prefix frontend install

# Generate Prisma Client
RUN npx --prefix backend prisma generate

# Copy application source code
COPY backend ./backend
COPY frontend ./frontend

# Build backend and frontend
RUN npm --prefix backend run build
RUN npm --prefix frontend run build

# Runner stage
FROM node:20-alpine AS runner

WORKDIR /app
ENV NODE_ENV=production
ENV PORT=5000

# Copy built artifacts and dependencies
COPY package.json ./
COPY backend/package*.json ./backend/
COPY --from=builder /app/backend/node_modules ./backend/node_modules
COPY --from=builder /app/backend/dist ./backend/dist
COPY --from=builder /app/backend/prisma ./backend/prisma
COPY --from=builder /app/frontend/dist ./frontend/dist

# Expose server port
EXPOSE 5000

# Push database schema & start unified server
CMD ["sh", "-c", "npx --prefix backend prisma db push && npm --prefix backend start"]
