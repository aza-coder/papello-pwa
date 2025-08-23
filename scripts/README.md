# Скрипт генерации каталога

## Описание

Скрипт `generate-catalog.mjs` автоматически генерирует каталог продуктов и избранного на основе файлов в директории `assets/cards/`.

## Запуск

### Локально
```bash
# Установить Node.js 18+
node scripts/generate-catalog.mjs

# Или через npm
npm run generate
```

### В GitHub Actions
Автоматически запускается при:
- Push в ветку `main` с изменениями в `assets/cards/**`
- Изменениях в `scripts/**` или `.github/workflows/**`
- Ручном запуске через GitHub Actions

## Правила генерации

### Поддерживаемые форматы
- `.jpg`, `.jpeg`, `.png`, `.webp`, `.gif`
- Регистр расширения не важен

### Игнорируемые файлы
- Скрытые файлы/папки (начинаются с `.`)
- Файлы больше 20MB
- Неподдерживаемые форматы

### Генерация полей

#### ID
- Kebab-case от имени файла без расширения
- Уникальный идентификатор
- Пример: `happy-birthday-cat_5usd.jpg` → `happy-birthday-cat-5usd`

#### Title
- Из имени файла, пробелы вместо `- _`
- Максимум 70 символов
- Пример: `happy-birthday-cat_5usd` → `happy birthday cat 5usd`

#### Price
- Из шаблона в имени файла: `_4usd`, `_5.99`, `_10руб`
- Если шаблон не найден → `null`
- Пример: `_5usd` → `5`

#### Tags
- Из имен родительских папок
- Исключаются папки, начинающиеся с `!` или `.`
- Пример: `assets/cards/birthday/funny/cat.jpg` → `["birthday", "funny"]`

#### ImageUrl
- Относительный путь с `./assets/cards/`
- Всегда использует `/` (Unix-style)
- Пример: `./assets/cards/birthday/cat.jpg`

#### CreatedAt
- ISO-строка времени последнего изменения файла
- Используется для сортировки (новые первыми)

## Структура выходных данных

### `data/products.json`
```json
{
  "items": [
    {
      "id": "happy-birthday-cat",
      "title": "Happy Birthday Cat",
      "price": 5,
      "imageUrl": "./assets/cards/birthday/cat.jpg",
      "tags": ["birthday"],
      "createdAt": "2024-01-01T12:00:00.000Z"
    }
  ]
}
```

### `data/favorites.json`
```json
{
  "items": ["happy-birthday-cat", "romantic-sunset"]
}
```

## Логика фаворитов

1. **Сканирование**: все файлы в `assets/cards/!favorite/**`
2. **Сортировка**: по `createdAt` (новые первыми)
3. **Ограничение**: максимум 10 элементов
4. **Выход**: массив ID для слайдера

## Автоматические действия

1. **Генерация** каталога из файлов
2. **Обновление** версии в `sw.js` (v4 → v5 → v6...)
3. **Валидация** JSON файлов
4. **Логирование** процесса генерации

## Обработка ошибок

- **Критические ошибки**: выход с кодом ≠0
- **Предупреждения**: логируются, но не прерывают выполнение
- **Валидация**: проверка корректности JSON перед записью

## Интеграция с приложением

### Главный слайдер
- Загружает `favorites.json` → получает массив ID
- Фильтрует `products.json` по ID
- Показывает максимум 10 карточек

### Экран "Все карточки"
- Загружает `products.json`
- Пагинация по `createdAt` (новые первыми)

### Экран "Избранное"
- Использует `localStorage` для пользовательских лайков
- Не зависит от автогенерации

## Примеры имен файлов

### С ценой
- `birthday-card_5usd.jpg` → price: 5
- `romantic_10.99.jpg` → price: 10.99
- `funny-meme_3руб.png` → price: 3

### Без цены
- `simple-card.jpg` → price: null
- `free-greeting.png` → price: null

### Структура папок
```
assets/cards/
├── birthday/
│   ├── balloons.jpg          → tags: ["birthday"]
│   └── cake.png             → tags: ["birthday"]
├── !favorite/
│   ├── best-card.jpg        → в favorites + tags: ["!favorite"]
│   └── top-greeting.png     → в favorites + tags: ["!favorite"]
└── romantic/
    └── sunset.jpg           → tags: ["romantic"]
```
