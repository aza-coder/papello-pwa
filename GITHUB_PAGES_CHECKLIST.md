# GitHub Pages Deployment Checklist - Papéllo PWA

## ✅ Что исправлено для GitHub Pages

### 1. Пути в index.html
- [x] `<link rel="manifest" href="./manifest.json">`
- [x] Все favicon/apple-touch-icon: `href="./assets/icons/....png"`
- [x] Все `<img>`: `src="./assets/..."`
- [x] Все fetch запросы: `fetch('./data/products.json')`
- [x] Service Worker: `navigator.serviceWorker.register('./sw.js', { scope: './' })`

### 2. manifest.json
- [x] `start_url: "./"`
- [x] `scope: "./"`
- [x] Все иконки: `"src": "./assets/icons/....png"`
- [x] Shortcuts: `"url": "./#/likes"`

### 3. Service Worker (sw.js)
- [x] Все пути в precache: `"./index.html", "./manifest.json", "./assets/icons/..."`
- [x] Логика роутинга для `/papello-pwa/` подкаталога

## 🔍 Проверка после деплоя

### 1. Базовая проверка
- [ ] Открыть `https://username.github.io/papello-pwa/`
- [ ] Нажать Ctrl+F5 для полной перезагрузки
- [ ] Проверить, что нет ошибок 404 в Console

### 2. DevTools → Application → Manifest
- [ ] Manifest загружается без ошибок
- [ ] Все иконки показывают "OK"
- [ ] Пути = `/papello-pwa/...`
- [ ] Installable: Yes

### 3. DevTools → Application → Service Workers
- [ ] Service Worker зарегистрирован
- [ ] Статус: activated
- [ ] Нет ошибок 404 в логах
- [ ] Кэши созданы: `shell-v3`, `runtime-v3`

### 4. DevTools → Application → Storage → Cache Storage
- [ ] `shell-v3` содержит все shell assets
- [ ] `runtime-v3` создается при загрузке данных

### 5. Console проверки
- [ ] Нет "Unexpected token '<' ... is not valid JSON"
- [ ] Нет ошибок загрузки изображений
- [ ] Service Worker registration successful
- [ ] PWA install events работают

## 🚨 Возможные проблемы и решения

### 1. Service Worker не обновляется
```bash
# В DevTools → Application → Service Workers
1. Нажать "Unregister"
2. Перезагрузить страницу (Ctrl+F5)
3. Проверить новую версию
```

### 2. Кэш залип
```bash
# В DevTools → Application → Storage
1. Clear storage → Clear site data
2. Перезагрузить страницу
```

### 3. На телефоне
```bash
# Настройки сайта → Очистить данные для домена
# Открыть заново
```

### 4. Manifest не загружается
```bash
# Проверить:
1. manifest.json доступен по ./manifest.json
2. JSON валидный (без комментариев)
3. Content-Type: application/json
```

## 📱 Тестирование PWA функциональности

### Android/Desktop
- [ ] Кнопка "Install app" появляется
- [ ] При клике открывается системный диалог
- [ ] После установки приложение в standalone режиме

### iOS
- [ ] Кнопка "Install app" показывает iOS инструкции
- [ ] Инструкции: Share → Add to Home Screen → Add
- [ ] Иконка на Домой работает

## 🔧 Отладка

### Проверка путей
```javascript
// В Console
console.log('Current location:', location.href);
console.log('Base path:', location.pathname);
```

### Проверка Service Worker
```javascript
// В Console
navigator.serviceWorker.getRegistrations().then(console.log);
```

### Проверка кэша
```javascript
// В Console
caches.keys().then(console.log);
```

## 📋 Финальная проверка

- [ ] Все изображения загружаются
- [ ] Все данные загружаются (products.json, favorites.json)
- [ ] PWA установка работает на всех платформах
- [ ] Service Worker кэширует правильно
- [ ] Нет ошибок в Console
- [ ] Manifest валиден
- [ ] Приложение работает офлайн

## 🎯 Критерии готовности

✅ **GitHub Pages**: Приложение доступно по `/papello-pwa/`  
✅ **Пути**: Все относительные (./) работают корректно  
✅ **PWA**: Установка работает на всех платформах  
✅ **Кэш**: Service Worker кэширует все необходимые файлы  
✅ **Ошибки**: Нет 404 и JSON parse errors  
✅ **Manifest**: Все иконки загружаются корректно
