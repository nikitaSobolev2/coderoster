# Use an official Node.js runtime as a parent image
FROM node:18-alpine AS base

WORKDIR /app

# Update npm to its latest version compatible with Node 18
RUN npm install -g npm

# Install dependencies
COPY package*.json ./
RUN npm install

# Attempt to fix known vulnerabilities
# The '--force' is used to ensure fixes apply even if they are breaking changes for sub-dependencies
# The '|| true' ensures the build doesn't fail if audit fix has non-critical issues or cannot fix all
RUN npm audit fix --force || true

# Copy application code
COPY . ./

# Build the Next.js application
RUN npm run build

# Production image
FROM node:18-alpine AS production

WORKDIR /app

COPY --from=base /app/.next ./.next
COPY --from=base /app/public ./public
COPY --from=base /app/package.json ./package.json
COPY --from=base /app/node_modules ./node_modules

EXPOSE 3000

ENV NODE_ENV=production

CMD ["npm", "start"] 