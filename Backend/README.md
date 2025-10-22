# AnonifyNeuro Backend

Backend-составляющая приложения для анонимизации персональных данных.

## Стек технологий

-   FastAPI
-   PostgreSQL
-   SQLAlchemy
-   Alembic (миграции)
-   JWT аутентификация
-   Docker

## Установка и запуск

### 1. Установка зависимостей

```bash
python3 -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
```

### 2. Запуск базы данных

```bash
docker-compose up -d
```

База будет доступна на `localhost:5433`.

### 3. Применение миграций

```bash
alembic upgrade head
```

### 4. Запуск сервера

```bash
python -m uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

API будет доступно на `http://localhost:8000`.

Документация API: `http://localhost:8000/docs`

## Тестирование

### Unit-тесты

```bash
DATABASE_URL="sqlite:///./test.db" pytest tests/ -v
```

### Регрессионные тесты

Запустите сервер, затем:

```bash
./test_auth.sh
```

## API эндпоинты

### Аутентификация

-   `POST /auth/register` - Регистрация пользователя
-   `POST /auth/login` - Вход и получение JWT токена
-   `POST /auth/logout` - Выход (требует токена)
-   `POST /auth/refresh` - Обновление JWT токена (требует токена)
