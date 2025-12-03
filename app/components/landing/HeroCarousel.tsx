"use client";

import React, { useState, useEffect } from 'react';
import Image from 'next/image';
import { useTranslations } from 'next-intl';

// Hero background images for the carousel
const heroImages = [
  'https://tse3.mm.bing.net/th/id/OIP.zoOE3F889IVVuzwS_A2EiwHaEl?rs=1&pid=ImgDetMain&o=7&rm=3',
  'https://www.liveenhanced.com/wp-content/uploads/2019/09/dental-clinic-25.jpg',
  'https://mos-kapital.ru/wp-content/uploads/2020/11/0_90097300_1590788955_img.jpg',
  'https://static.vecteezy.com/system/resources/previews/024/284/257/original/beauty-salon-logo-design-free-vector.jpg',
  'https://images.arigatotravel.com/wp-content/uploads/2023/08/28145827/IshibekojiMuanRoom.png',
  'https://th.bing.com/th/id/OIP.CTbrn8GyukLkRohqlba5JQHaEg?o=7rm=3&rs=1&pid=ImgDetMain&o=7&rm=3',
  'https://cdn-cf.ipsy.com/contentAsset/image/d0b0b823-4c8f-4a92-965f-d9e0d1fa0148/fileAsset?byInode=1',
  'https://i.pinimg.com/originals/92/7e/14/927e1476792755ed422bc0ee3192f8d5.jpg',
  'https://static.vecteezy.com/system/resources/previews/023/136/451/large_2x/beauty-spa-treatment-and-relax-concept-hot-stone-massage-setting-lit-by-candles-neural-network-ai-generated-photo.jpg',
  'https://cdn-ak.f.st-hatena.com/images/fotolife/m/massageyherapy/20200423/20200423205855.jpg',
  'https://i.pinimg.com/originals/95/13/f2/9513f242d2e3bcd78175da692cf06b26.jpg',
  'https://www.leisureopportunities.co.uk/images/imagesX/HIGH339960_164070_175138.jpg',
  'https://i.etsystatic.com/37266898/r/il/49da1a/4182986944/il_1080xN.4182986944_1c19.jpg',
  'https://tse4.mm.bing.net/th/id/OIP.dQIF1nsR84smATszJLMvTQHaEK?rs=1&pid=ImgDetMain&o=7&rm=3',
  'https://tse3.mm.bing.net/th/id/OIP.dks9st7wuhq6v9EBOtMAlQAAAA?rs=1&pid=ImgDetMain&o=7&rm=3',
  'https://old-tokyo.info/wp-content/uploads/2018/08/Izakaya-Goupachi-Rappongi-1-1140x641.jpg',
  'https://images.says.com/uploads/story_source/source_image/838759/f93a.jpg',
  'https://tblg.k-img.com/restaurant/images/Rvw/85519/640x640_rect_85519070.jpg',
  'https://tse2.mm.bing.net/th/id/OIP.xc8VBBggd7A2F-uyS2ZU5QHaE7?rs=1&pid=ImgDetMain&o=7&rm=3',
  'https://media.cntraveler.com/photos/5a931002d363c34048b35bf5/16:9/w_2560,c_limit/Motoyoshi_2018__DSC5176.jpg',
  'https://jw-webmagazine.com/wp-content/uploads/2023/05/FineDiningJapan-LucaFantin-min.jpg',
];

export default function HeroCarousel() {
  const t = useTranslations('landing');
  const [currentIndex, setCurrentIndex] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % heroImages.length);
    }, 3000); // Change image every 3 seconds

    return () => clearInterval(interval);
  }, []);

  return (
    <div className="relative w-full h-[70vh] min-h-[600px] overflow-hidden">
      {/* Background Images with Fade Transition */}
      {heroImages.map((imageUrl, index) => (
        <div
          key={index}
          className={`absolute inset-0 transition-opacity duration-1000 ${
            index === currentIndex ? 'opacity-100' : 'opacity-0'
          }`}
        >
          <Image
            src={imageUrl}
            alt={`Hero background ${index + 1}`}
            fill
            className="object-cover object-center"
            priority={index === 0}
            unoptimized
          />
        </div>
      ))}

      {/* Soft Overlay - Full */}
      <div className="absolute inset-0 bg-japanese-charcoal/40" />

      {/* Left Side Gradient Overlay - Japanese aesthetic */}
      <div className="absolute inset-0 bg-gradient-to-r from-japanese-charcoal/70 via-japanese-charcoal/30 to-transparent z-10" />

      {/* Hero Content - Left Aligned */}
      <div className="absolute inset-0 flex items-center z-20">
        <div className="text-left pl-10 md:pl-12 lg:pl-16 max-w-4xl">
          <h1 className="text-5xl md:text-6xl lg:text-7xl font-bold text-white mb-6 tracking-tight drop-shadow-lg">
            {t('heroMainTitle')}
          </h1>
          <p className="text-xl md:text-2xl lg:text-3xl text-white mb-4 font-light drop-shadow-md">
            {t('heroMainSubtitle')}
          </p>
          <p className="text-base md:text-lg lg:text-xl text-white/90 font-light drop-shadow-md">
            {t('heroTagline')}
          </p>
        </div>
      </div>
    </div>
  );
}
