const PLATFORM_URL = "https://www.yoyakuyo.jp";
const QR_IMAGE_URL = `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(PLATFORM_URL)}`;

const cards = [
  {
    title: "お客様 / For customers",
    titleEn: "Book anytime",
    points: [
      { ja: "24時間いつでも予約", en: "Book 24/7" },
      { ja: "サロン・店舗を検索", en: "Find salons & shops" },
      { ja: "キャンセル・変更が簡単", en: "Easy cancel or change" },
    ],
    icon: "📅",
  },
  {
    title: "お客様 / For customers",
    titleEn: "LINE & mobile",
    points: [
      { ja: "LINEで予約・リマインド", en: "Book & reminders via LINE" },
      { ja: "スマホでサクサク", en: "Smooth on your phone" },
      { ja: "アプリで管理", en: "Manage in the app" },
    ],
    icon: "📱",
  },
  {
    title: "店舗・オーナー様 / For shop owners",
    titleEn: "One place for all",
    points: [
      { ja: "予約を一括管理", en: "All bookings in one place" },
      { ja: "カレンダーで確認", en: "See at a glance" },
      { ja: "紙・電話から卒業", en: "No more paper or phone" },
    ],
    icon: "🏪",
  },
  {
    title: "店舗・オーナー様 / For shop owners",
    titleEn: "LINE連携",
    points: [
      { ja: "LINEでお客様とつながる", en: "Connect with customers via LINE" },
      { ja: "予約確認・リマインド自動", en: "Auto confirm & remind" },
      { ja: "空席を有効活用", en: "Fill empty slots" },
    ],
    icon: "💬",
  },
];

export default function FlyerPage() {
  return (
    <div className="min-h-screen bg-[#f5f0eb] flex items-center justify-center p-4 md:p-6">
      <article
        className="w-full max-w-2xl bg-white rounded-3xl shadow-[0_25px_80px_-12px_rgba(0,0,0,0.12)] overflow-hidden"
        style={{ fontFamily: "'Noto Sans JP', 'Poppins', sans-serif" }}
      >
        {/* Header */}
        <div className="bg-blue-600 text-white px-6 py-4 text-center">
          <h1 className="text-xl md:text-2xl font-bold tracking-tight">Yoyaku Yo</h1>
          <p className="text-blue-100 text-xs mt-0.5">予約管理プラットフォーム / Reservation Platform</p>
        </div>

        {/* 4 boards: 2x2 grid */}
        <div className="p-4 grid grid-cols-2 gap-3">
          {cards.map((card, i) => (
            <section
              key={i}
              className="rounded-xl border border-stone-200 bg-stone-50/50 p-4 flex flex-col"
            >
              <div className="flex items-center gap-2 mb-2">
                <span className="text-2xl" aria-hidden>{card.icon}</span>
                <h2 className="text-xs font-semibold text-stone-500 uppercase tracking-wider">
                  {card.title}
                </h2>
              </div>
              <h3 className="text-sm font-bold text-stone-800 mb-2">{card.titleEn}</h3>
              <ul className="space-y-1 text-xs text-stone-600 flex-1">
                {card.points.map((p, j) => (
                  <li key={j} className="flex flex-col sm:flex-row sm:gap-1">
                    <span>{p.ja}</span>
                    <span className="text-stone-400 hidden sm:inline">/</span>
                    <span className="text-stone-500">{p.en}</span>
                  </li>
                ))}
              </ul>
            </section>
          ))}
        </div>

        {/* QR section - bottom */}
        <section className="px-6 pb-6 pt-2">
          <div className="rounded-2xl bg-stone-100 border border-stone-200 p-5 text-center">
            <h3 className="text-sm font-bold text-stone-800 mb-0.5">
              アクセスはこちら / Access the platform
            </h3>
            <p className="text-stone-500 text-xs mb-3">
              スマホでQRコードをスキャン → Download をタップ / Scan QR → tap Download
            </p>
            <div className="inline-flex flex-col items-center">
              <div className="bg-white p-2.5 rounded-xl shadow-inner">
                <img
                  src={QR_IMAGE_URL}
                  alt="QR code"
                  width={180}
                  height={180}
                  className="rounded-lg"
                />
              </div>
              <a
                href={PLATFORM_URL}
                target="_blank"
                rel="noopener noreferrer"
                className="mt-2 text-xs font-medium text-blue-600 hover:underline"
              >
                Open → {PLATFORM_URL.replace("https://", "")}
              </a>
            </div>
          </div>
        </section>
      </article>
    </div>
  );
}
