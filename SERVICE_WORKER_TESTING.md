# Тестирование Service Worker v4

## 🚀 Новая архитектура

### Версионирование
- **SW_VERSION**: `v4`
- **Кэши**: `static-v4`, `data-v4`, `img-v4`
- **Автоматическая очистка**: старые кэши удаляются при активации

### Стратегии кэширования
- **HTML/навигация**: `network-first` (всегда свежий контент)
- **JSON данные**: `network-first` (актуальные данные)
- **Изображения**: `stale-while-revalidate` (быстро + обновление)
- **Статика**: `network-first` (баланс свежести и скорости)

## 🧪 Тестирование

### 1. Первичная установка
```bash
# Очистить старые данные
DevTools → Application → Service Workers → Unregister
DevTools → Application → Clear storage → Clear site data

# Перезагрузить страницу
# Проверить в консоли:
"Service Worker installing, version: v4"
"Critical resources cached"
"Service Worker activating, version: v4"
"Deleting old cache: [старые кэши]"
```

### 2. Проверка кэшей
```bash
DevTools → Application → Storage → Cache Storage
# Должны быть только:
- static-v4
- data-v4  
- img-v4
```

### 3. Тест стратегий

#### HTML (network-first)
```bash
# 1. Загрузить страницу
# 2. В DevTools → Network → Disable cache
# 3. Перезагрузить страницу
# 4. Проверить: index.html загружается с сервера (не из кэша)
```

#### JSON (network-first)
```bash
# 1. Загрузить страницу
# 2. В DevTools → Network → Disable cache  
# 3. Перейти на экран "All" или "Likes"
# 4. Проверить: products.json загружается с сервера
```

#### Изображения (stale-while-revalidate)
```bash
# 1. Загрузить страницу (картинки кэшируются)
# 2. В DevTools → Network → Disable cache
# 3. Перезагрузить страницу
# 4. Проверить: картинки загружаются мгновенно из кэша
# 5. В Network видно параллельные запросы на обновление
```

### 4. Тест обновления версии

#### Сценарий 1: Изменение SW_VERSION
```bash
# 1. В sw.js изменить SW_VERSION = 'v5'
# 2. Сохранить файл
# 3. В DevTools → Application → Service Workers → Update
# 4. Проверить в консоли:
"Service Worker installing, version: v5"
"Service Worker activating, version: v5"
"Deleting old cache: static-v4"
"Deleting old cache: data-v4"
"Deleting old cache: img-v4"
```

#### Сценарий 2: Автоматическое обновление
```bash
# 1. Открыть DevTools → Application → Service Workers
# 2. Подождать 1 минуту (setInterval)
# 3. Проверить: автоматически вызывается update()
```

#### Сценарий 3: Обновление при фокусе
```bash
# 1. Переключиться на другую вкладку
# 2. Вернуться на вкладку с приложением
# 3. Проверить в консоли: вызывается update()
```

### 5. Тест уведомлений

#### Активация SW
```bash
# 1. После обновления версии
# 2. Проверить: появляется тост "Обновлено до версии v5"
# 3. Тосты автоматически исчезают через 3 секунды
```

#### Перезагрузка страницы
```bash
# 1. После обновления SW
# 2. Проверить в консоли:
"Service Worker controller changed, reloading page"
# 3. Страница автоматически перезагружается
```

## 🔍 Проверки готовности

### ✅ Критерии успеха
- [ ] При перезагрузке подхватывается свежий `index.html` (network-first)
- [ ] Старые кэши удаляются при активировании новой версии SW
- [ ] Картинки грузятся моментально из кэша и невидимо обновляются
- [ ] При выпуске новой версии достаточно поменять `SW_VERSION`
- [ ] Автоматические обновления работают каждую минуту
- [ ] Обновления при фокусе окна работают
- [ ] Тосты об обновлении показываются корректно
- [ ] Страница автоматически перезагружается при смене контроллера

### 🚨 Возможные проблемы

#### SW не обновляется
```bash
# Решение:
DevTools → Application → Service Workers → Update
# Или
DevTools → Application → Service Workers → Unregister → Reload
```

#### Кэши не очищаются
```bash
# Проверить в sw.js:
- Правильные имена кэшей (static-v4, data-v4, img-v4)
- Функция cleanupOldCaches() вызывается в activate
```

#### Страница не перезагружается
```bash
# Проверить в index.html:
- addEventListener('controllerchange', ...)
- location.reload() вызывается
```

## 📝 Логи для отладки

### Успешная установка
```
Service Worker installing, version: v4
Critical resources cached
Service Worker activating, version: v4
Deleting old cache: [старые кэши]
Service Worker registered successfully
```

### Успешное обновление
```
Service Worker installing, version: v5
Critical resources cached
Service Worker activating, version: v5
Deleting old cache: static-v4
Deleting old cache: data-v4
Deleting old cache: img-v4
Service Worker controller changed, reloading page
```

### Стратегии кэширования
```
HTML request, using network-first: /index.html
JSON request, using network-first: /data/products.json
Image request, using stale-while-revalidate: /assets/cards/...
Static resource, using network-first: /assets/icons/...
```

## 🎯 Команды для тестирования

```bash
# Очистить все данные
DevTools → Application → Clear storage → Clear site data

# Принудительно обновить SW
DevTools → Application → Service Workers → Update

# Проверить кэши
DevTools → Application → Storage → Cache Storage

# Мониторить Network
DevTools → Network → Disable cache

# Проверить Console
DevTools → Console → Filter: "Service Worker"
```
