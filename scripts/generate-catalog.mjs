#!/usr/bin/env node

import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Конфигурация
const CONFIG = {
  CARDS_DIR: path.join(__dirname, '../assets/cards'),
  PRODUCTS_OUTPUT: path.join(__dirname, '../data/products.json'),
  FAVORITES_OUTPUT: path.join(__dirname, '../data/favorites.json'),
  SUPPORTED_EXTENSIONS: ['.jpg', '.jpeg', '.png', '.webp', '.gif'],
  MAX_FILE_SIZE: 20 * 1024 * 1024, // 20MB
  MAX_FAVORITES: 10,
  MAX_TITLE_LENGTH: 70
};

// Утилиты
function kebabCase(str) {
  return str
    .replace(/[^a-zA-Z0-9\s-]/g, '') // Убираем спецсимволы
    .replace(/[\s_-]+/g, '-') // Заменяем пробелы, подчеркивания на дефисы
    .replace(/^-+|-+$/g, '') // Убираем дефисы в начале и конце
    .toLowerCase();
}

function extractPrice(filename) {
  const priceMatch = filename.match(/_(\d+(?:\.\d+)?)(?:usd|dollars?|руб|₽)?/i);
  return priceMatch ? parseFloat(priceMatch[1]) : null;
}

function formatTitle(filename) {
  return filename
    .replace(/[_-]/g, ' ') // Заменяем дефисы и подчеркивания на пробелы
    .replace(/\s+/g, ' ') // Убираем множественные пробелы
    .trim()
    .substring(0, CONFIG.MAX_TITLE_LENGTH);
}

function getTagsFromPath(filePath) {
  const relativePath = path.relative(CONFIG.CARDS_DIR, filePath);
  const dirs = path.dirname(relativePath).split(path.sep);
  
  return dirs
    .filter(dir => dir && !dir.startsWith('!') && !dir.startsWith('.'))
    .map(dir => dir.toLowerCase());
}

async function getFileStats(filePath) {
  try {
    const stats = await fs.stat(filePath);
    return {
      size: stats.size,
      mtime: stats.mtime,
      isFile: stats.isFile()
    };
  } catch (error) {
    console.warn(`⚠️  Не удалось получить статистику для ${filePath}:`, error.message);
    return null;
  }
}

async function scanCardsDirectory() {
  const products = [];
  const favorites = [];
  
  console.log(`🔍 Сканирую директорию: ${CONFIG.CARDS_DIR}`);
  
  try {
    await scanDirectory(CONFIG.CARDS_DIR, '', products, favorites);
  } catch (error) {
    console.error(`❌ Ошибка сканирования директории:`, error.message);
    process.exit(1);
  }
  
  console.log(`📊 Найдено файлов: ${products.length}`);
  console.log(`⭐ Фаворитов: ${favorites.length}`);
  
  return { products, favorites };
}

async function scanDirectory(dirPath, relativePath, products, favorites) {
  try {
    const entries = await fs.readdir(dirPath, { withFileTypes: true });
    
    for (const entry of entries) {
      const fullPath = path.join(dirPath, entry.name);
      const entryRelativePath = path.join(relativePath, entry.name);
      
      // Пропускаем скрытые файлы и папки
      if (entry.name.startsWith('.')) {
        continue;
      }
      
      if (entry.isDirectory()) {
        // Рекурсивно сканируем поддиректории
        await scanDirectory(fullPath, entryRelativePath, products, favorites);
      } else if (entry.isFile()) {
        await processFile(fullPath, entryRelativePath, products, favorites);
      }
    }
  } catch (error) {
    console.warn(`⚠️  Не удалось прочитать директорию ${dirPath}:`, error.message);
  }
}

async function processFile(filePath, relativePath, products, favorites) {
  const ext = path.extname(filePath).toLowerCase();
  
  // Проверяем расширение
  if (!CONFIG.SUPPORTED_EXTENSIONS.includes(ext)) {
    return;
  }
  
  // Получаем статистику файла
  const stats = await getFileStats(filePath);
  if (!stats || !stats.isFile) {
    return;
  }
  
  // Проверяем размер файла
  if (stats.size > CONFIG.MAX_FILE_SIZE) {
    console.warn(`⚠️  Файл слишком большой (${(stats.size / 1024 / 1024).toFixed(1)}MB): ${relativePath}`);
    return;
  }
  
  // Обрабатываем файл
  const filename = path.basename(filePath, ext);
  const id = kebabCase(filename);
  const title = formatTitle(filename);
  const price = extractPrice(filename);
  const imageUrl = `./assets/cards/${relativePath.replace(/\\/g, '/')}`;
  const tags = getTagsFromPath(filePath);
  const createdAt = stats.mtime.toISOString();
  
  const product = {
    id,
    title,
    price,
    imageUrl,
    tags,
    createdAt
  };
  
  products.push(product);
  
  // Проверяем, является ли файл фаворитом
  if (relativePath.includes('!favorite')) {
    favorites.push({
      id,
      createdAt
    });
  }
}

function sortProducts(products) {
  return products.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
}

function sortFavorites(favorites) {
  return favorites
    .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
    .slice(0, CONFIG.MAX_FAVORITES)
    .map(fav => fav.id);
}

async function updateServiceWorkerVersion() {
  const swPath = path.join(__dirname, '../sw.js');
  
  try {
    let content = await fs.readFile(swPath, 'utf8');
    
    // Ищем текущую версию
    const versionMatch = content.match(/const VERSION = 'v(\d+)'/);
    if (versionMatch) {
      const currentVersion = parseInt(versionMatch[1]);
      const newVersion = currentVersion + 1;
      
      content = content.replace(
        /const VERSION = 'v\d+'/,
        `const VERSION = 'v${newVersion}'`
      );
      
      await fs.writeFile(swPath, content, 'utf8');
      console.log(`🔄 Service Worker версия обновлена: v${currentVersion} → v${newVersion}`);
    } else {
      console.warn('⚠️  Не удалось найти VERSION в sw.js');
    }
  } catch (error) {
    console.error('❌ Ошибка обновления Service Worker:', error.message);
  }
}

async function writeOutputFiles(products, favorites) {
  try {
    // Сортируем продукты по дате создания (новые первыми)
    const sortedProducts = sortProducts(products);
    
    // Сортируем фавориты и ограничиваем количество
    const sortedFavorites = sortFavorites(favorites);
    
    // Формируем выходные данные
    const productsData = {
      items: sortedProducts
    };
    
    const favoritesData = {
      items: sortedFavorites
    };
    
    // Записываем файлы
    await fs.writeFile(
      CONFIG.PRODUCTS_OUTPUT,
      JSON.stringify(productsData, null, 2),
      'utf8'
    );
    
    await fs.writeFile(
      CONFIG.FAVORITES_OUTPUT,
      JSON.stringify(favoritesData, null, 2),
      'utf8'
    );
    
    console.log(`✅ ${CONFIG.PRODUCTS_OUTPUT} обновлен (${sortedProducts.length} продуктов)`);
    console.log(`✅ ${CONFIG.FAVORITES_OUTPUT} обновлен (${sortedFavorites.length} фаворитов)`);
    
    // Обновляем версию Service Worker
    await updateServiceWorkerVersion();
    
  } catch (error) {
    console.error('❌ Ошибка записи файлов:', error.message);
    process.exit(1);
  }
}

async function validateOutputFiles() {
  try {
    // Проверяем, что файлы можно прочитать и они содержат валидный JSON
    const productsContent = await fs.readFile(CONFIG.PRODUCTS_OUTPUT, 'utf8');
    const favoritesContent = await fs.readFile(CONFIG.FAVORITES_OUTPUT, 'utf8');
    
    JSON.parse(productsContent);
    JSON.parse(favoritesContent);
    
    console.log('✅ Валидация JSON прошла успешно');
    
  } catch (error) {
    console.error('❌ Ошибка валидации JSON:', error.message);
    process.exit(1);
  }
}

async function main() {
  console.log('🚀 Запуск генерации каталога...\n');
  
  try {
    // Сканируем директорию с карточками
    const { products, favorites } = await scanCardsDirectory();
    
    if (products.length === 0) {
      console.warn('⚠️  Не найдено ни одного изображения');
    }
    
    // Записываем выходные файлы
    await writeOutputFiles(products, favorites);
    
    // Валидируем результат
    await validateOutputFiles();
    
    console.log('\n🎉 Генерация каталога завершена успешно!');
    
  } catch (error) {
    console.error('\n❌ Критическая ошибка:', error.message);
    process.exit(1);
  }
}

// Запускаем скрипт
if (import.meta.url === `file://${process.argv[1]}`) {
  main();
}
