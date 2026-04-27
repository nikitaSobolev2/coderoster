FROM python:3.12-slim
RUN useradd --create-home --uid 1001 sandbox
USER sandbox
WORKDIR /tmp
ENV PYTHONUNBUFFERED=1 PYTHONDONTWRITEBYTECODE=1
CMD ["python3", "-"]
