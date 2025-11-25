'use client';

import React, { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';

type Shop = {
  id: string;
  name: string;
  address: string | null;
  city: string | null;
  category_id: string | null;
  claim_status: string | null;
  image_url: string | null;
  cover_photo_url: string | null;
  logo_url: string | null;
  [key: string]: any;
};

type Category = {
  id: string;
  name: string;
  description?: string | null;
  [key: string]: any;
};

const ALL_PREFECTURES = [
  '北海道','青森県','岩手県','宮城県','秋田県','山形県','福島県',
  '茨城県','栃木県','群馬県','埼玉県','千葉県','東京都','神奈川県',
  '新潟県','富山県','石川県','福井県','山梨県','長野県',
  '岐阜県','静岡県','愛知県','三重県',
  '滋賀県','京都府','大阪府','兵庫県','奈良県','和歌山県',
  '鳥取県','島根県','岡山県','広島県','山口県',
  '徳島県','香川県','愛媛県','高知県',
  '福岡県','佐賀県','長崎県','熊本県','大分県','宮崎県','鹿児島県','沖縄県'
];

// Try to detect prefecture from address string
function getPrefectureFromAddress(shop: Shop): string {
  const addr = (shop.address || '') + ' ' + (shop.city || '');
  for (const pref of ALL_PREFECTURES) {
    if (addr.includes(pref)) return pref;
  }
  return '不明';
}

function normalizeApiBase(): string {
  const envBase = process.env.NEXT_PUBLIC_API_URL || '';
  if (!envBase) return ''; // then we will use relative URLs
  return envBase.endsWith('/') ? envBase.slice(0, -1) : envBase;
}

const BrowsePage: React.FC = () => {
  const [shops, setShops] = useState<Shop[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [selectedPrefecture, setSelectedPrefecture] = useState<string | null>(null);
  const [selectedCategoryId, setSelectedCategoryId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        setError(null);

        const base = normalizeApiBase();

        const shopsUrl = base ? `${base}/shops` : '/api/shops';
        const categoriesUrl = base ? `${base}/categories` : '/api/categories';

        const [shopsRes, categoriesRes] = await Promise.all([
          fetch(shopsUrl),
          fetch(categoriesUrl),
        ]);

        if (!shopsRes.ok) {
          throw new Error(`Failed to load shops: ${shopsRes.status}`);
        }
        if (!categoriesRes.ok) {
          throw new Error(`Failed to load categories: ${categoriesRes.status}`);
        }

        const shopsJson = await shopsRes.json();
        const categoriesJson = await categoriesRes.json();

        // Handle different response formats: array, { data: [] }, or { shops: [] }
        const shopsData: Shop[] = Array.isArray(shopsJson) 
          ? shopsJson 
          : shopsJson.data ?? shopsJson.shops ?? [];
        const categoriesData: Category[] = Array.isArray(categoriesJson)
          ? categoriesJson
          : categoriesJson.data ?? [];

        setShops(shopsData);
        setCategories(categoriesData);
      } catch (err: any) {
        console.error(err);
        setError(err.message || 'Failed to load data');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  // Prefectures that actually have shops
  const prefecturesWithShops = useMemo(() => {
    const set = new Set<string>();
    for (const shop of shops) {
      if (shop.claim_status === 'hidden') continue;
      const pref = getPrefectureFromAddress(shop);
      if (pref !== '不明') set.add(pref);
    }
    // Only keep those that are valid prefectures
    return ALL_PREFECTURES.filter((pref) => set.has(pref));
  }, [shops]);

  // Categories that actually have shops
  const categoriesWithShops = useMemo(() => {
    const usedCategoryIds = new Set(
      shops
        .filter((s) => s.claim_status !== 'hidden' && s.category_id)
        .map((s) => s.category_id as string)
    );
    return categories.filter((c) => usedCategoryIds.has(c.id));
  }, [shops, categories]);

  const filteredShops = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();

    return shops.filter((shop) => {
      if (shop.claim_status === 'hidden') return false;

      const pref = getPrefectureFromAddress(shop);

      if (selectedPrefecture && pref !== selectedPrefecture) return false;
      if (selectedCategoryId && shop.category_id !== selectedCategoryId) return false;

      if (q) {
        const name = (shop.name || '').toLowerCase();
        const addr = (shop.address || '').toLowerCase();
        const city = (shop.city || '').toLowerCase();
        if (
          !name.includes(q) &&
          !addr.includes(q) &&
          !city.includes(q)
        ) {
          return false;
        }
      }

      return true;
    });
  }, [shops, selectedPrefecture, selectedCategoryId, searchQuery]);

  const handleClearFilters = () => {
    setSelectedPrefecture(null);
    setSelectedCategoryId(null);
    setSearchQuery('');
  };

  if (loading) {
    return (
      <div className="min-h-screen px-4 py-8 flex items-center justify-center">
        <div className="text-gray-500">Loading shops…</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen px-4 py-8 flex flex-col items-center justify-center gap-4">
        <div className="text-red-600 font-medium">Failed to load browse data</div>
        <div className="text-sm text-gray-500">{error}</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen px-4 py-8 max-w-6xl mx-auto flex flex-col gap-6">
      {/* Search */}
      <div className="w-full">
        <input
          type="text"
          placeholder="Search by shop name, area or service…"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full rounded-full border border-gray-200 px-4 py-2 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
      </div>

      {/* Filters */}
      <div className="flex flex-col gap-4">
        {/* Prefecture filter */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <h2 className="text-sm font-semibold text-gray-800">Browse by Area</h2>
            {selectedPrefecture && (
              <button
                onClick={() => setSelectedPrefecture(null)}
                className="text-xs text-blue-600 hover:underline"
              >
                Clear area
              </button>
            )}
          </div>
          <div className="flex flex-wrap gap-2">
            {prefecturesWithShops.length === 0 && (
              <span className="text-xs text-gray-400">No prefectures found from shop data.</span>
            )}
            {prefecturesWithShops.map((pref) => (
              <button
                key={pref}
                onClick={() =>
                  setSelectedPrefecture((current) => (current === pref ? null : pref))
                }
                className={
                  'px-3 py-1 rounded-full text-xs border transition ' +
                  (selectedPrefecture === pref
                    ? 'bg-blue-600 text-white border-blue-600'
                    : 'bg-white text-gray-700 border-gray-200 hover:border-blue-400')
                }
              >
                {pref}
              </button>
            ))}
          </div>
        </div>

        {/* Category filter */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <h2 className="text-sm font-semibold text-gray-800">Browse by Category</h2>
            {selectedCategoryId && (
              <button
                onClick={() => setSelectedCategoryId(null)}
                className="text-xs text-blue-600 hover:underline"
              >
                Clear category
              </button>
            )}
          </div>
          <div className="flex flex-wrap gap-2">
            {categoriesWithShops.length === 0 && (
              <span className="text-xs text-gray-400">
                No categories associated with shops yet.
              </span>
            )}
            {categoriesWithShops.map((cat) => (
              <button
                key={cat.id}
                onClick={() =>
                  setSelectedCategoryId((current) => (current === cat.id ? null : cat.id))
                }
                className={
                  'px-3 py-1 rounded-full text-xs border transition ' +
                  (selectedCategoryId === cat.id
                    ? 'bg-pink-600 text-white border-pink-600'
                    : 'bg-white text-gray-700 border-gray-200 hover:border-pink-400')
                }
              >
                {cat.name}
              </button>
            ))}
          </div>
        </div>

        {/* Clear all filters */}
        {(selectedPrefecture || selectedCategoryId || searchQuery) && (
          <button
            onClick={handleClearFilters}
            className="self-start text-xs text-gray-600 hover:underline"
          >
            Clear all filters
          </button>
        )}
      </div>

      {/* Shop results */}
      <div className="mt-2">
        {filteredShops.length === 0 ? (
          <div className="border border-dashed border-gray-300 rounded-xl px-6 py-10 text-center text-gray-500 text-sm">
            <div className="mb-2 font-semibold text-gray-700">No shops found</div>
            <div className="mb-4">
              Try changing the area, category, or search keywords.
            </div>
            <button
              onClick={handleClearFilters}
              className="inline-flex items-center px-4 py-1.5 rounded-full text-xs bg-gray-800 text-white hover:bg-gray-700"
            >
              Reset filters
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredShops.map((shop) => (
              <ShopCard key={shop.id} shop={shop} categories={categories} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

type ShopCardProps = {
  shop: Shop;
  categories: Category[];
};

const ShopCard: React.FC<ShopCardProps> = ({ shop, categories }) => {
  const prefecture = getPrefectureFromAddress(shop);
  const category = categories.find((c) => c.id === shop.category_id);

  const img =
    shop.cover_photo_url ||
    shop.image_url ||
    shop.logo_url ||
    null;

  return (
    <div className="flex flex-col rounded-2xl border border-gray-200 overflow-hidden shadow-sm bg-white">
      <div className="relative w-full h-40 bg-gray-100">
        {img ? (
          <img
            src={img}
            alt={shop.name}
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-xs text-gray-400">
            No image
          </div>
        )}
      </div>
      <div className="flex flex-col gap-1 px-3 py-3">
        <div className="text-sm font-semibold text-gray-900 line-clamp-2">
          {shop.name}
        </div>
        <div className="text-xs text-gray-500">
          {prefecture !== '不明' && <span>{prefecture} · </span>}
          {shop.city && <span>{shop.city}</span>}
        </div>
        {shop.address && (
          <div className="text-xs text-gray-400 line-clamp-2">
            {shop.address}
          </div>
        )}
        {category && (
          <div className="mt-1 inline-flex items-center rounded-full bg-pink-50 text-pink-700 text-[10px] px-2 py-0.5">
            {category.name}
          </div>
        )}
        <div className="mt-3">
          <Link
            href={`/shops/${shop.id}`}
            className="block w-full text-center text-xs px-3 py-1.5 rounded-full border border-gray-200 text-gray-800 hover:border-gray-400 hover:bg-gray-50"
          >
            View details
          </Link>
        </div>
      </div>
    </div>
  );
};

export default BrowsePage;
