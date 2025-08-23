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
- Service Worker активен (версия v4)
- Если SW "залип": **Unregister** → hard reload

### 5. Проверить карточки
- Главный слайдер показывает картинки
- Экран "Все карточки" работает
- Экран "Избранное" работает

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

## 📝 Команды для деплоя

```bash
git add .
git commit -m "Fix paths for GitHub Pages deployment"
git push origin main
```

## 🔧 Дополнительные настройки GitHub Pages

1. **Settings** → **Pages**
2. **Source**: Deploy from a branch
3. **Branch**: main
4. **Folder**: / (root)
5. **Save**

После деплоя подождать 1-2 минуты для обновления.
