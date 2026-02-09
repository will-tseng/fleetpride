# Build stage
FROM node:20-alpine AS build

# Set working directory
WORKDIR /app

# Set environment variables with correct syntax
ENV NODE_ENV=production
ENV PATH=/app/node_modules/.bin:$PATH

# Accept build arguments for environment variables
ARG REACT_APP_API_BASE_URL

# Set environment variables from build arguments
ENV REACT_APP_API_BASE_URL=$REACT_APP_API_BASE_URL

# Copy package files
COPY package.json package-lock.json ./

# Install dependencies
RUN npm ci

# Copy application code
COPY . ./

# Build the application
RUN npm run build

# Production stage
FROM node:20-alpine AS production

# Set working directory
WORKDIR /app

# Install serve
RUN npm install -g serve

# Copy built assets from build stage
COPY --from=build /app/build ./build

# Set user to non-root for security
USER node

# Expose the port that Cloud Run expects
EXPOSE 8080

# Use environment variable PORT for serve, defaulting to 8080 for Cloud Run
ENV PORT=8080

# Define command to run the application using PORT environment variable
CMD ["sh", "-c", "serve -s build -l $PORT"]
