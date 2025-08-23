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
- **Скрипт**: `scripts/generate-catalog.mjs`
- **GitHub Actions**: `.github/workflows/auto-generate-catalog.yml`
- **Триггеры**: изменения в `assets/cards/**`, `scripts/**`, `.github/workflows/**`

### Правила генерации
- **Поддерживаемые форматы**: `.jpg`, `.jpeg`, `.png`, `.webp`, `.gif`
- **Игнорируются**: скрытые файлы (`.`), файлы > 20MB
- **ID**: kebab-case от имени файла (уникально)
- **Title**: из имени файла, пробелы вместо `- _`, максимум 70 символов
- **Price**: из шаблона `_4usd` → 4, иначе null
- **Tags**: из имен родительских папок
- **CreatedAt**: ISO-строка времени изменения файла

### Структура данных
- **`data/products.json`**: `{ "items": [{ "id", "title", "price", "imageUrl", "tags", "createdAt" }] }`
- **`data/favorites.json`**: `{ "items": ["id-1", "id-2", ...] }` (максимум 10)
- **Сортировка**: по `createdAt` (новые первыми)

### Автоматические действия
1. **Сканирование** `assets/cards/**` при каждом push
2. **Генерация** `data/products.json` и `data/favorites.json`
3. **Обновление** версии в `sw.js` для инвалидации кэша
4. **Auto-commit** изменений в репозиторий

## 🔍 Проверки после деплоя

### 1. Открыть сайт
- URL: `https://<username>.github.io/papello-pwa/`
- Убедиться, что сайт загружается без ошибок

### 2. DevTools → Console
- Нет ошибок 404 для картинок
- Все пути должны быть вида `.../papello-pwa/assets/...`

### 3. DevTools → Network
- Картинки загружаются по путям `.../papello-pwa/assets/cards/...`
- Нет 404 ошибок

### 4. DevTools → Application → Service Workers
- Service Worker активен (версия v4+)
- Если SW "залип": **Unregister** → hard reload

### 5. Проверить карточки
- Главный слайдер показывает картинки (максимум 10)
- Экран "Все карточки" работает
- Экран "Избранное" работает

## 🧪 Тестирование автогенерации

### Локальный запуск
```bash
# Установить Node.js 18+
node scripts/generate-catalog.mjs

# Или через npm
npm run generate
```

### Тестирование в GitHub
1. **Добавить новое изображение** в `assets/cards/`
2. **Push в main** → автоматически запустится workflow
3. **Проверить Actions** → должен быть успешный run
4. **Проверить изменения** → `data/*.json` и `sw.js` обновлены

### Проверка результатов
- **`data/products.json`** содержит новое изображение
- **`data/favorites.json`** обновлен (если файл в `!favorite/`)
- **`sw.js`** версия увеличена
- **GitHub Pages** показывает новые карточки

## 🚨 Если всё ещё есть 404

### 1. Проверить регистр файлов
- GitHub Pages чувствителен к регистру
- `JPG` vs `jpg` - должны совпадать

### 2. Проверить имена файлов
- В путях не должно быть пробелов
- При необходимости переименовать файлы и обновить JSON

### 3. Очистить кэш
- DevTools → Application → Storage → Clear storage
- Или hard reload (Ctrl+Shift+R)

### 4. Проверить автогенерацию
- Убедиться, что workflow выполнился успешно
- Проверить, что `data/*.json` обновлены
- Проверить, что `sw.js` версия увеличена

## 📝 Команды для деплоя

```bash
git add .
git commit -m "Add auto-catalog generation system"
git push origin main
```

## 🔧 Дополнительные настройки GitHub Pages

1. **Settings** → **Pages**
2. **Source**: Deploy from a branch
3. **Branch**: main
4. **Folder**: / (root)
5. **Save**

После деплоя подождать 1-2 минуты для обновления.

## 🎯 Критерии готовности автогенерации

✅ **Автоматизация**: Любое изменение в `assets/cards/**` → автоматическое обновление каталога  
✅ **Данные**: `data/products.json` и `data/favorites.json` всегда актуальны  
✅ **Кэш**: Service Worker автоматически обновляется при изменениях  
✅ **Интеграция**: Слайдер и экраны работают с новой структурой данных  
✅ **CI/CD**: GitHub Actions автоматически генерирует и коммитит изменения
