# Используем полный образ (не slim), он весит больше, но там есть всё
FROM python:3.11

WORKDIR /app

# На всякий случай оставляем установку GL, в полном образе это не повредит
RUN apt-get update && apt-get install -y \
    libgl1 \
    libglx-mesa0 \
    libglib2.0-0 \
    && rm -rf /var/lib/apt/lists/*

COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY . .

# Добавляем debug логи
CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000", "--log-level", "debug"]
