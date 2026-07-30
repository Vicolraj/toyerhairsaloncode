FROM node:18-alpine AS builder

WORKDIR /app

COPY package.json yarn.lock* package-lock.json* ./
RUN npm install

COPY . .
# We must build the React app. The .env file in this directory
# will be picked up by craco/react-scripts automatically.
RUN npm run build

FROM nginx:alpine
COPY --from=builder /app/build /usr/share/nginx/html

# Add a custom nginx configuration to handle React Router history API fallback
COPY nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
