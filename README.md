# ic_label_api

Backend API for image captioning and labeling.

## Docker Installation

These steps run the API with Docker. The Docker image builds the app from `src` into `dist` and starts `node dist/app.js`.

## Requirements

- Docker installed on the server
- MongoDB connection string
- Project source code on the server

The API listens on port `3006` by default.

## 1. Get the Source Code

```bash
git clone <repository-url>
cd ic_label_api
```

If the project is already copied to the server, open the project directory instead.

## 2. Create the Environment File

Create a `.env` file in the project root:

```env
NODE_ENV=production
PORT=3006
MONGO_URI=mongodb://username:password@host:27017/database
JWT_SECRET=change-this-to-a-long-random-secret
CORS_ORIGIN=https://your-frontend-domain.com
```

Required for production:

- `MONGO_URI`: MongoDB connection string
- `JWT_SECRET`: secret used to sign JWT tokens
- `CORS_ORIGIN`: allowed frontend origin, for example `https://example.com`

Common optional settings:

- `GOOGLE_API_KEY`: required for Google GenAI features
- `REQUEST_BODY_LIMIT`: default `10mb`
- `PARAMETER_LIMIT`: default `10000`
- `STATIC_MAX_AGE_MS`: default `3600000`
- `RATE_LIMIT_WINDOW_MS`: default `900000`
- `RATE_LIMIT_MAX`: default `300`
- `MAX_IMAGE_UPLOAD_MB`: default `10`
- `MAX_DOCUMENT_UPLOAD_MB`: default `10`
- `MAX_DATASET_UPLOAD_GB`: default `10`
- `ALLOW_JWT_QUERY_TOKEN`: set to `true` only if query-string JWT tokens are required

Mail, PowerBI, and external service variables are only needed if those features are used.

## 3. Build the Docker Image

```bash
docker build -t ic-label-api .
```

The image uses `node:18-bookworm-slim`, installs production dependencies, builds the Babel output, and excludes local files listed in `.dockerignore`.

## 4. Run the Container

Use a Docker volume for `/app/uploads` so uploaded files are kept when the container is replaced:

```bash
docker volume create ic-label-uploads
docker run -d \
  --name ic-label-api \
  --env-file .env \
  -p 3006:3006 \
  -v ic-label-uploads:/app/uploads \
  ic-label-api
```

Open the API documentation:

```text
http://localhost:3006/api-docs
```

On a remote server, replace `localhost` with the server IP address or domain.

## 5. Check Logs

```bash
docker logs -f ic-label-api
```

Expected startup output:

```text
Server is running at PORT http://localhost:3006
```

## 6. Stop or Restart

Stop the container:

```bash
docker stop ic-label-api
```

Start it again:

```bash
docker start ic-label-api
```

Restart it:

```bash
docker restart ic-label-api
```

## 7. Deploy an Update

Pull or copy the latest source code, rebuild the image, then replace the running container:

```bash
git pull
docker build -t ic-label-api .
docker stop ic-label-api
docker rm ic-label-api
docker run -d \
  --name ic-label-api \
  --env-file .env \
  -p 3006:3006 \
  -v ic-label-uploads:/app/uploads \
  ic-label-api
```

The upload volume is reused, so files in `/app/uploads` are kept.

## Troubleshooting

If the container exits immediately, check the logs:

```bash
docker logs ic-label-api
```

If production config validation fails, confirm that `JWT_SECRET`, `CORS_ORIGIN`, and `MONGO_URI` are set in `.env`.

If MongoDB connection fails, confirm that the container can reach the MongoDB host. If MongoDB runs on the same server outside Docker, `localhost` inside the container will not point to the host machine. Use the server IP address, Docker network hostname, or `host.docker.internal` if your Docker environment supports it.

If uploads fail, confirm that the volume is mounted to `/app/uploads`.
