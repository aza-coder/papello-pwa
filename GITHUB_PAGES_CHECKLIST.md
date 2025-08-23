# GitHub Pages Deployment Checklist - Papéllo PWA

## ✅ Исправления внесены

### 1. Пути в JSON файлах
- **`data/products.json`** - все `imageUrl` изменены с `/assets/` на `./assets/`
- **`data/favorites.json`** - все `image` пути изменены с `assets/` на `./assets/`

### 2. JavaScript логика
- **`index.html`** - функция `normalizeItem()` исправлена, убрана логика добавления `/` к путям
- Все пути в HTML уже корректные (с `./assets/`)

### 3. Service Worker
- **`sw.js`** - версия увеличена с `v3` на `v4`
- Пути в роутинге изменены с `/papello-pwa/` на относительные (используется `includes()` вместо `startsWith()`)

### 4. Manifest
- **`manifest.json`** - пути в `screenshots` изменены с `/assets/` на `./assets/`
- Остальные пути уже корректные

## 🚀 Новая система автогенерации каталога

### Автоматическое обновление при изменении изображений
- **Скрипт**: `scripts/generate-catalog.mjs` - сканирует `assets/cards/**` и генерирует JSON
- **GitHub Actions**: `.github/workflows/auto-generate-catalog.yml` - автоматически запускается при изменениях
- **Структура данных**: обновлена для совместимости с автогенерацией

### Что генерируется автоматически
- **`data/products.json`**: каталог всех карточек с метаданными
- **`data/favorites.json`**: список ID избранных карточек (≤10 элементов)
- **Версия SW**: автоматически увеличивается для инвалидации кэша

## 🔄 Новый Service Worker v4

### Архитектура версионирования
- **Версия**: `SW_VERSION = 'v4'`
- **Кэши**: `static-v4`, `data-v4`, `img-v4`
- **Автоматическая очистка**: старые кэши удаляются при активации

### Стратегии кэширования
- **HTML/навигация**: `network-first` (всегда свежий контент)
- **JSON данные**: `network-first` (актуальные данные)
- **Изображения**: `stale-while-revalidate` (быстро + фоновое обновление)
- **Статика**: `network-first` (баланс свежести и скорости)

### Автоматические обновления
- **Периодические**: каждую минуту проверяется обновление
- **При фокусе**: обновление при возврате на вкладку
- **Уведомления**: тосты о новых версиях
- **Перезагрузка**: автоматическая при смене контроллера

## 🔍 Проверки после деплоя

### 1. Открыть сайт
- URL: `https://<username>.github.io/papello-pwa/`
- DevTools → Console: нет ошибок 404 на картинки
- DevTools → Application → Service Workers: активен SW v4

### 2. Проверить пути
- **Картинки**: загружаются по `./assets/cards/...` (без 404)
- **JSON**: `./data/products.json` и `./data/favorites.json` доступны
- **Иконки**: `./assets/icons/...` загружаются корректно

### 3. Проверить Service Worker
- **Версия**: в консоли видно "Service Worker installing, version: v4"
- **Кэши**: DevTools → Cache Storage → только `static-v4`, `data-v4`, `img-v4`
- **Стратегии**: HTML загружается network-first, картинки stale-while-revalidate

### 4. Тест автогенерации
- Добавить новое изображение в `assets/cards/**`
- Push в main ветку
- GitHub Actions автоматически генерирует JSON
- Проверить: новые карточки появляются в приложении

## 🚨 Если что-то не работает

### Service Worker "залип"
```bash
DevTools → Application → Service Workers → Unregister
DevTools → Application → Clear storage → Clear site data
Перезагрузить страницу
```

### Картинки 404
- Проверить: пути в JSON начинаются с `./assets/` (не `/assets/`)
- Убедиться: файлы существуют в репозитории
- Проверить: регистр файлов совпадает (GitHub Pages чувствителен)

### Автогенерация не работает
- Проверить: GitHub Actions → последний запуск
- Убедиться: изменения в `assets/cards/**` или `scripts/**`
- Проверить: workflow имеет права на запись в репозиторий

## 📝 Для новых релизов

### Обновление Service Worker
1. В `sw.js` изменить `SW_VERSION = 'v5'`
2. Commit + Push
3. Проверить: в DevTools активна новая версия

### Добавление новых изображений
1. Добавить файлы в `assets/cards/**`
2. Push в main
3. GitHub Actions автоматически обновит каталог
4. Проверить: новые карточки в приложении

### Изменение логики генерации
1. Отредактировать `scripts/generate-catalog.mjs`
2. Push изменения
3. GitHub Actions перегенерирует каталог
4. Проверить: новые поля/логика работают
