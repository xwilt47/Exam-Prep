Running the Prep App with Docker

Build the image:

```bash
docker build -t prep-app:latest .
```

Run using `docker run` with port forwarding (host 8080 -> container 80):

```bash
docker run --rm -p 8080:80 prep-app:latest
```

Or use docker-compose (recommended):

```bash
docker-compose up --build
```

Then open http://localhost:8080 in your browser.
