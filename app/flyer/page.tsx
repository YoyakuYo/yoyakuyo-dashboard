const PLATFORM_URL = "https://www.yoyakuyo.jp";
const QR_IMAGE_URL = `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(PLATFORM_URL)}`;

const cards = [
  {
    titleEn: "いつでも予約",
    points: ["24時間いつでも予約", "サロン・店舗を検索", "キャンセル・変更が簡単"],
    icon: "📅",
  },
  {
    titleEn: "LINE・スマホ",
    points: ["LINEで予約・リマインド", "スマホでサクサク", "アプリで管理"],
    icon: "📱",
  },
  {
    titleEn: "一括管理",
    points: ["予約を一括管理", "カレンダーで確認", "紙・電話から卒業"],
    icon: "🏪",
  },
  {
    titleEn: "LINE連携",
    points: ["LINEでお客様とつながる", "予約確認・リマインド自動", "空席を有効活用"],
    icon: "💬",
  },
];

export default function FlyerPage() {
  return (
    <>
      <style dangerouslySetInnerHTML={{ __html: `
        @page { size: A4; margin: 8mm; }
        @media print {
          body { background: #fff !important; padding: 0 !important; }
          .flyer-print-root { min-height: 0 !important; padding: 0 !important; background: #fff !important; }
          .flyer-print-card {
            max-width: 100% !important;
            box-shadow: none !important;
            border: 1px solid #e5e7eb;
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
            page-break-inside: avoid !important;
          }
          .flyer-print-card * { -webkit-print-color-adjust: exact !important; print-color-adjust: exact !important; }
          .flyer-print-boards section { -webkit-print-color-adjust: exact !important; print-color-adjust: exact !important; }
          .flyer-print-qr { -webkit-print-color-adjust: exact !important; print-color-adjust: exact !important; }
          .flyer-print-card { transform: scale(0.95); transform-origin: top center; }
        }
      `}} />
      <div className="flyer-print-root min-h-screen bg-[#f5f0eb] flex items-center justify-center p-4 md:p-6">
      <article
        className="flyer-print-card w-full max-w-2xl bg-white rounded-3xl shadow-[0_25px_80px_-12px_rgba(0,0,0,0.12)] overflow-hidden"
        style={{ fontFamily: "'Noto Sans JP', 'Poppins', sans-serif" }}
      >
        {/* 4 boards: 2x2 grid */}
        <div className="flyer-print-boards p-3 grid grid-cols-2 gap-2">
          {cards.map((card, i) => (
            <section
              key={i}
              className="rounded-xl border border-stone-200 bg-stone-50/50 p-3 flex flex-col"
            >
              <div className="flex items-center gap-2 mb-2">
                <span className="text-2xl" aria-hidden>{card.icon}</span>
                <h3 className="text-sm font-bold text-stone-800">{card.titleEn}</h3>
              </div>
              <ul className="space-y-1 text-xs text-stone-600 flex-1">
                {card.points.map((p, j) => (
                  <li key={j}>{p}</li>
                ))}
              </ul>
            </section>
          ))}
        </div>

        {/* QR section - bottom */}
        <section className="px-4 pb-4 pt-1">
          <div className="flyer-print-qr rounded-2xl bg-stone-100 border border-stone-200 p-4 text-center">
            <h3 className="text-sm font-bold text-stone-800 mb-0.5">
              アクセスはこちら
            </h3>
            <p className="text-stone-500 text-xs mb-3">
              スマホでQRコードをスキャン → Download をタップ
            </p>
            <div className="inline-flex flex-col items-center">
              <div className="bg-white p-2.5 rounded-xl shadow-inner">
                <img
                  src={QR_IMAGE_URL}
                  alt="QR code"
                  width={160}
                  height={160}
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
    </>
  );
}
