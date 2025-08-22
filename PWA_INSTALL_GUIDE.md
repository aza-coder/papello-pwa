# PWA Install Guide - Papéllo

## Обзор функциональности

Приложение Papéllo теперь поддерживает установку как Progressive Web App (PWA) на всех платформах:

- **Android/Desktop**: Системная установка через браузер
- **iOS**: Подсказка "Add to Home Screen" через Share меню

## Компоненты установки

### 1. Кнопка "Install app"
- Расположена в правом верхнем углу
- Показывается только когда приложение не установлено
- Автоматически скрывается после установки

### 2. iOS подсказка
- Модальное окно с пошаговыми инструкциями
- Показывается только на iOS устройствах
- Закрывается по ESC, клику вне окна или кнопке "Got it!"

## Тестирование

### Chrome/Android/Desktop

1. **Проверка установимости**:
   - Откройте DevTools → Application → Manifest
   - Должно быть: "Installable: Yes"

2. **Тест установки**:
   - Кнопка "Install app" должна появиться автоматически
   - При клике появляется системный диалог установки
   - После установки приложение открывается в standalone режиме

3. **Проверка событий**:
   - `beforeinstallprompt` - должно срабатывать
   - `appinstalled` - должно срабатывать после установки

### Safari/iOS

1. **Проверка мета-тегов**:
   - `apple-mobile-web-app-capable = yes`
   - `apple-mobile-web-app-status-bar-style = default`
   - `apple-touch-icon` подключен

2. **Тест подсказки**:
   - Кнопка "Install app" показывает iOS инструкции
   - Инструкции: Share → Add to Home Screen → Add

3. **Проверка иконки**:
   - После добавления на Домой иконка отображается корректно
   - Приложение открывается без адресной строки

## Технические детали

### Service Worker
- Версия: v3
- Shell кэш: HTML, manifest, все иконки
- Стратегии: cache-first для shell, network-first для JSON, stale-while-revalidate для изображений

### Manifest.json
- `display: standalone`
- `start_url: "."`
- `scope: "/"`
- Иконки: 16x16 до 512x512 (включая maskable)

### Кэширование
- Shell assets кэшируются при установке
- JSON данные обновляются при каждом запросе
- Изображения: кэш + обновление в фоне

## Отладка

### Логи в консоли
```javascript
// Проверка состояния установки
console.log('App installed:', isAppInstalled);
console.log('Deferred prompt:', deferredPrompt);

// Проверка платформы
console.log('Platform:', platform);
```

### Проверка кэша
```javascript
// В DevTools → Application → Storage
// Service Workers → Cache Storage
// Должны быть: shell-v3, runtime-v3
```

### Проверка событий
```javascript
// Слушаем события установки
window.addEventListener('beforeinstallprompt', console.log);
window.addEventListener('appinstalled', console.log);
```

## Возможные проблемы

### 1. Кнопка не появляется
- Проверьте, что `beforeinstallprompt` срабатывает
- Убедитесь, что приложение не установлено
- Проверьте критерии установимости в DevTools

### 2. iOS подсказка не работает
- Проверьте мета-теги в `<head>`
- Убедитесь, что устройство определяется как iOS
- Проверьте, что приложение не в standalone режиме

### 3. Service Worker не обновляется
- Увеличьте версию в `sw.js`
- Проверьте, что SW зарегистрирован
- Очистите старые кэши в DevTools

## Критерии готовности

✅ **Android/Desktop**: Системная установка работает  
✅ **iOS**: Подсказка "Add to Home Screen" отображается  
✅ **Кнопка**: Показывается/скрывается корректно  
✅ **События**: `beforeinstallprompt` и `appinstalled` обрабатываются  
✅ **Кэш**: Service Worker кэширует все необходимые файлы  
✅ **Manifest**: Все параметры настроены правильно  
✅ **Доступность**: ARIA атрибуты и клавиатурная навигация работают  

## Дополнительные улучшения

- [ ] Toast уведомления об успешной установке
- [ ] Анимации для кнопки установки
- [ ] Статистика установок
- [ ] A/B тестирование различных текстов кнопки
- [ ] Интеграция с аналитикой
