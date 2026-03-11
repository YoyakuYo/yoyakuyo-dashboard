const PLATFORM_URL = "https://www.yoyakuyo.jp";
const QR_IMAGE_URL = `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(PLATFORM_URL)}`;

export default function FlyerPage() {

  return (
    <div className="min-h-screen bg-[#f5f0eb] flex items-center justify-center p-4 md:p-8">
      {/* Canvas-style card */}
      <article
        className="w-full max-w-2xl bg-white rounded-3xl shadow-[0_25px_80px_-12px_rgba(0,0,0,0.15),0_0_0_1px_rgba(0,0,0,0.04)] overflow-hidden"
        style={{
          fontFamily: "'Noto Sans JP', 'Poppins', sans-serif",
        }}
      >
        {/* Header strip */}
        <div className="bg-gradient-to-r from-rose-100 via-amber-50 to-stone-100 px-8 py-6 text-center border-b border-rose-100/60">
          <h1 className="text-2xl md:text-3xl font-bold text-stone-800 tracking-tight">
            Yoyaku Yo
          </h1>
          <p className="text-stone-600 text-sm mt-1 font-medium">
            予約管理プラットフォーム / Reservation Platform
          </p>
        </div>

        <div className="px-8 py-6 md:py-8 space-y-6">
          {/* Japanese section */}
          <section>
            <h2 className="text-xs font-semibold uppercase tracking-widest text-rose-400 mb-2">
              日本語
            </h2>
            <h3 className="text-lg font-bold text-stone-800 mb-2">
              プラットフォームのご案内
            </h3>
            <p className="text-stone-600 text-sm leading-relaxed">
              当サービスは、サロン・お店の予約・予約管理を簡単にするプラットフォームです。お客様の予約を一括で管理でき、LINE連携でスムーズにご案内できます。
            </p>
            <ul className="mt-2 text-stone-600 text-sm space-y-1 list-disc list-inside">
              <li>予約を紙や電話で管理しているお店</li>
              <li>LINEで予約を受けたいサロン</li>
              <li>予約状況をひと目で確認したいオーナー様</li>
            </ul>
          </section>

          {/* English section */}
          <section>
            <h2 className="text-xs font-semibold uppercase tracking-widest text-amber-500 mb-2">
              English
            </h2>
            <h3 className="text-lg font-bold text-stone-800 mb-2">
              About the platform
            </h3>
            <p className="text-stone-600 text-sm leading-relaxed">
              Our platform helps salons and shops manage reservations easily. Manage all bookings in one place and connect with customers via LINE.
            </p>
            <ul className="mt-2 text-stone-600 text-sm space-y-1 list-disc list-inside">
              <li>Shops still using paper or phone for reservations</li>
              <li>Salons who want to accept bookings via LINE</li>
              <li>Owners who want to see reservations at a glance</li>
            </ul>
          </section>

          {/* Salon pictures - Unsplash salon/spa imagery */}
          <section>
            <h3 className="text-sm font-semibold text-stone-500 uppercase tracking-wider mb-3">
              画面例・イメージ / Screenshots & style
            </h3>
            <div className="grid grid-cols-3 gap-2">
              <div className="aspect-[3/4] rounded-xl overflow-hidden shadow-md bg-stone-100">
                <img
                  src="https://images.unsplash.com/photo-1560066984-138dadb4c035?w=400&q=80"
                  alt="Salon"
                  className="w-full h-full object-cover"
                />
              </div>
              <div className="aspect-[3/4] rounded-xl overflow-hidden shadow-md bg-stone-100">
                <img
                  src="https://images.unsplash.com/photo-1522337360788-8b13dee7a37e?w=400&q=80"
                  alt="Beauty"
                  className="w-full h-full object-cover"
                />
              </div>
              <div className="aspect-[3/4] rounded-xl overflow-hidden shadow-md bg-stone-100">
                <img
                  src="https://images.unsplash.com/photo-1605497788044-5a32c7078486?w=400&q=80"
                  alt="Spa"
                  className="w-full h-full object-cover"
                />
              </div>
            </div>
          </section>

          {/* QR + CTA */}
          <section className="bg-gradient-to-br from-rose-50 to-amber-50 rounded-2xl p-6 text-center border border-rose-100/80">
            <h3 className="text-base font-bold text-stone-800 mb-1">
              アクセスはこちら / Access the platform
            </h3>
            <p className="text-stone-500 text-xs mb-4">
              スマホでQRコードをスキャン / Scan with your phone
            </p>
            <p className="text-stone-600 text-xs mb-3 max-w-xs mx-auto">
              After opening: tap the <strong>Download</strong> button to install. / 開いたら「Download」をタップ
            </p>
            <div className="inline-flex flex-col items-center">
              <div className="bg-white p-3 rounded-2xl shadow-inner">
                <img
                  src={QR_IMAGE_URL}
                  alt="QR code"
                  width={200}
                  height={200}
                  className="rounded-lg"
                />
              </div>
              <a
                href={PLATFORM_URL}
                target="_blank"
                rel="noopener noreferrer"
                className="mt-3 text-sm font-medium text-rose-600 hover:text-rose-700 underline underline-offset-2"
              >
                Open the platform →
              </a>
            </div>
          </section>
        </div>
      </article>
    </div>
  );
}
