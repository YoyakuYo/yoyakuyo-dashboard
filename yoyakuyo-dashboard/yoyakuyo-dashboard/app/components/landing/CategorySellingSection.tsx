// app/components/landing/CategorySellingSection.tsx
// Marketing/selling section for category pages

"use client";

import Image from 'next/image';
import { MAIN_CATEGORIES, getSubcategories } from '@/lib/categories';
import { getCategoryImages, getCategoryMarketing } from '@/lib/categoryImages';
import { useLocale } from 'next-intl';

interface CategorySellingSectionProps {
  categoryId: string;
}

export default function CategorySellingSection({ categoryId }: CategorySellingSectionProps) {
  const locale = useLocale();
  const isJapanese = locale === 'ja';

  const category = MAIN_CATEGORIES.find(c => c.id === categoryId);
  if (!category) return null;

  const images = getCategoryImages(category.imageKey);
  const marketing = getCategoryMarketing(category.imageKey);
  const subcategories = getSubcategories(categoryId);

  const categoryName = isJapanese ? category.nameJa : category.name;
  const description = marketing ? (isJapanese ? marketing.descriptionJa : marketing.description) : '';
  
  // Value points (same for all categories)
  const valuePoints = isJapanese ? [
    '日本全国の店舗から選択可能',
    'AIアシスタントが24時間サポート',
    '多言語対応（日本語、英語、その他）',
    '完全無料で予約可能',
    '信頼できる店舗のみ掲載'
  ] : [
    'Thousands of shops across Japan',
    'AI assistant available 24/7',
    'Multilingual support (Japanese, English & more)',
    '100% free to book',
    'Only trusted, verified shops'
  ];

  return (
    <div className="mb-12">
      {/* Category Title */}
      <h1 className="text-4xl md:text-5xl font-bold text-white mb-4 drop-shadow-lg">
        {categoryName}
      </h1>

      {/* Description */}
      {description && (
        <p className="text-lg text-white/90 mb-8 max-w-3xl drop-shadow-md">
          {description}
        </p>
      )}

      {/* Value Points */}
      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4 mb-12">
        {valuePoints.map((point, index) => (
          <div
            key={index}
            className="bg-white/10 backdrop-blur-sm rounded-lg p-4 border border-white/20"
          >
            <div className="flex items-start gap-3">
              <span className="text-japanese-red text-xl font-bold mt-1">✓</span>
              <p className="text-white text-sm leading-relaxed">{point}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Category Images Grid */}
      {images.length > 0 && (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {images.slice(0, 8).map((imageUrl, index) => (
            <div
              key={index}
              className="relative aspect-square rounded-lg overflow-hidden shadow-lg hover:shadow-2xl transition-shadow"
            >
              <Image
                src={imageUrl}
                alt={`${categoryName} ${index + 1}`}
                fill
                className="object-cover hover:scale-110 transition-transform duration-300"
                sizes="(max-width: 768px) 50vw, (max-width: 1024px) 33vw, 25vw"
                unoptimized
              />
            </div>
          ))}
        </div>
      )}

      {/* Subcategories Info */}
      {subcategories.length > 0 && (
        <div className="mt-8 p-6 bg-white/5 backdrop-blur-sm rounded-lg border border-white/10">
          <h3 className="text-xl font-semibold text-white mb-3">
            {isJapanese ? '利用可能なサービス' : 'Available Services'}
          </h3>
          <div className="flex flex-wrap gap-2">
            {subcategories.map(subcat => (
              <span
                key={subcat.id}
                className="px-3 py-1 bg-white/10 text-white text-sm rounded-full border border-white/20"
              >
                {isJapanese ? subcat.nameJa : subcat.name}
              </span>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

