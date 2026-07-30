# Toyer Hair Salon - VPS Deployment Guide (IONOS)

This guide walks you through deploying the application to your IONOS VPS using Docker Compose.

## Prerequisites
1. Ensure your IONOS server is running Linux (Ubuntu/Debian recommended).
2. Install [Docker](https://docs.docker.com/engine/install/) and [Docker Compose](https://docs.docker.com/compose/install/).
3. Clone or copy this entire `toyerhairsaloncode` folder to your VPS (e.g., via `scp` or Git).

## Checklist of Required Placeholders
Before you build and start the application, you MUST edit the following `.env` files and replace the placeholders with your actual production values.

### 1. `backend/.env`
- `MONGO_URL`: Your MongoDB connection string (e.g., `mongodb://admin:secretpassword@mongodb:27017` if using the Docker Compose MongoDB container, or an Atlas URL).
- `JWT_SECRET`: A secure random string for signing JWT tokens.
- `STRIPE_API_KEY`: Your live Stripe Secret Key.
- `STRIPE_WEBHOOK_SECRET`: Your Stripe webhook signing secret.
- `RESEND_API_KEY`: Your Resend API key for emails.
- `GOOGLE_PLACES_API_KEY`: Google Places API Key.
- `EMERGENT_LLM_KEY`: LLM Key for the chat widget.
- `PUBLIC_ORIGIN`: Your production domain (e.g., `https://www.toyerhairsalon.com`).

### 2. `frontend/.env`
- `REACT_APP_BACKEND_URL`: The publicly accessible URL of your backend (e.g., `https://api.toyerhairsalon.com` or `https://www.toyerhairsalon.com` if using a reverse proxy/load balancer).

> [!WARNING]
> None of the sensitive keys are hardcoded in the codebase. The application exclusively reads these values from the `.env` files. Ensure you replace them before running the build command.

## Deployment Steps

1. **Navigate to the project root:**
   ```bash
   cd /path/to/toyerhairsaloncode
   ```

2. **Update the Environment Variables:**
   Edit the `.env` files and fill in the checklist above.
   ```bash
   nano backend/.env
   nano frontend/.env
   ```

3. **Build and Start the Containers:**
   Run the following command to build the frontend and backend images and start the services in the background.
   ```bash
   docker compose up -d --build
   ```

4. **Verify the Services:**
   Check the logs to ensure the backend started correctly and connected to MongoDB.
   ```bash
   docker compose logs -f
   ```

5. **Set up a Reverse Proxy (Optional but Recommended):**
   The frontend runs on port 80 and the backend on port 8000. It is highly recommended to set up Nginx (or Caddy/Traefik) on the VPS host to handle SSL (HTTPS) via Let's Encrypt and route traffic to the respective ports.

## Troubleshooting
- If the frontend cannot communicate with the backend, verify that `REACT_APP_BACKEND_URL` in `frontend/.env` is accessible from the client's browser (it should NOT be `localhost` in production, unless accessing locally).
- If the backend crashes, check `docker compose logs backend` to see if a database connection error or missing API key caused an issue.
