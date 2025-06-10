FROM python:3.11-slim

WORKDIR /app

COPY . /app

RUN pip install mutagen psycopg2-binary

CMD ["python", "parse_tracks.py"]