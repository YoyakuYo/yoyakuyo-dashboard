"use client";

import { useTranslations } from 'next-intl';
import CategoryCard from './CategoryCard';

export default function CategorySection() {
  const t = useTranslations('landing');
  
  const categories = [
    {
      id: 'beauty_services',
      title: t('categoryBeautyTitle'),
      titleJa: t('categoryBeautyTitleJa'),
      description: t('categoryBeautyDesc'),
      sellingPoints: [
        t('categoryBeautyPoint1'),
        t('categoryBeautyPoint2'),
        t('categoryBeautyPoint3'),
        t('categoryBeautyPoint4'),
      ],
      imageSearchTerms: [
        'https://i.pinimg.com/originals/08/97/cb/0897cbdc3142bd46bc7742d870a8ada5.jpg',
        'https://barb.pro/uploads/images/blog/1703/1-spring-nail-idea.jpg',
        'https://styleyouroccasion.com/wp-content/uploads/2022/11/Neutral-Nails-Pins-3.jpg',
        'https://comfortel.co.uk/wp-content/uploads/our-favourite-salon-design-trends-202.jpg',
        'https://i.pinimg.com/originals/48/9e/3a/489e3a9554d378d489e6e47b7363207c.jpg',
        'https://images.squarespace-cdn.com/content/v1/615b663e7af04a6b75ad47fa/1634105808237-GZ9K3UX6SFZCKJZB66MC/gotstyleshairsalon.jpg',
        'https://thumbs.dreamstime.com/z/woman-long-eyelashes-beauty-salon-eyelash-extension-woman-long-eyelashes-beauty-salon-eyelash-171786288.jpg',
        'https://thumbs.dreamstime.com/z/beautiful-woman-long-eyelashes-beauty-salon-eyelash-extension-procedure-lashes-close-up-beautiful-woman-long-109072421.jpg',
        'https://forreslocal.com/wp-content/uploads/2022/11/MFH-NEWS-stylestreetbarbers-2216.36-1-scaled.jpg',
        'https://blogz.my/wp-content/uploads/2024/09/Top-5-barber-shop-in-shah-alam-scaled.jpeg',
        'https://dailybarber.com/wp-content/uploads/York-Barber-Shop-New-York-1.jpg',
        'https://www.ultimatewaxing.com/s/cc_images/teaserbox_57247501.jpg?t=1548428869',
        'https://media.timeout.com/images/103362561/image.jpg',
        'https://www.perfectwaxing.uk/wp-content/uploads/2020/05/eyebrow_treatment-800x533.jpeg',
        'https://cdn.indonesiaexpat.id/wp-content/uploads/2023/11/WL-Waxing.jpeg',
        'https://www.designerwaxing.com/wp-content/themes/timber-bootstrap/assets/img/img_2_shop_interior.jpg',
      ],
    },
    {
      id: 'spa_onsen',
      title: t('categorySpaTitle'),
      titleJa: t('categorySpaTitleJa'),
      description: t('categorySpaDesc'),
      sellingPoints: [
        t('categorySpaPoint1'),
        t('categorySpaPoint2'),
        t('categorySpaPoint3'),
        t('categorySpaPoint4'),
      ],
      imageSearchTerms: [
        'https://anaicbeppu.com/wp-content/uploads/slider16/Main-Onsen-Inside-11.jpeg',
        'https://www.onsen.co.nz/wp-content/uploads/2020/04/Original-Onsen.jpg',
        'https://nzhotpools.co.nz/wp-content/uploads/2017/01/Onsen-3.jpg',
        'https://i.ytimg.com/vi/hgpTL3IMWXc/maxresdefault.jpg',
        'https://i.ytimg.com/vi/Mli3BEsyghs/maxresdefault.jpg',
        'https://tse2.mm.bing.net/th/id/OIP.qLuuEe4oiNOxp3lkG4TYGQHaLH?rs=1&pid=ImgDetMain&o=7&rm=3',
        'https://goodspaguide--live.s3.amazonaws.com/_1200x630_crop_center-center_82_none/Ikbal_spab.jpg?mtime=1702312696',
        'https://img.freepik.com/premium-photo/photo-spa-relaxation-room-with-cozy-seating_1055425-40368.jpg?w=1060',
        'https://images.squarespace-cdn.com/content/v1/61afd43e933ad92c6928b093/1686162068976-Q4SDZSW5AH2PZDKDOPOC/mobile+massage+vancouver.jpg',
        'https://static.wixstatic.com/media/3d581d_ac0d3bd0ef8d4ebd8ebba4f40c1f242f~mv2.png/v1/fill/w_640,h_426,al_c,q_85,enc_auto/3d581d_ac0d3bd0ef8d4ebd8ebba4f40c1f242f~mv2.png',
        'https://static.vecteezy.com/system/resources/previews/027/177/280/non_2x/types-of-massage-infographics-vector.jpg',
      ],
    },
    {
      id: 'hotels',
      title: t('categoryHotelsTitle'),
      titleJa: t('categoryHotelsTitleJa'),
      description: t('categoryHotelsDesc'),
      sellingPoints: [
        t('categoryHotelsPoint1'),
        t('categoryHotelsPoint2'),
        t('categoryHotelsPoint3'),
        t('categoryHotelsPoint4'),
      ],
      imageSearchTerms: [
        'https://i.pinimg.com/originals/41/c1/1e/41c11eeca92e8e5e791ca1802d0a8fd0.jpg',
        'https://www.princehotels.com/parktower/wp-content/uploads/sites/14/2019/07/res-stellar-platinum.jpg.jpg',
        'https://familytravelgenie.com/media/wp-uploads/2024/04/Palace-Hotel-Tokyo-Executive-Club-Lounge-Night-Time.jpg',
        'https://images.adsttc.com/media/images/5839/349a/e58e/cebc/9300/004e/large_jpg/03.jpg?1480144020',
        'https://cf.bstatic.com/xdata/images/hotel/max1024x768/219186638.jpg?k=2345e338a266b160d19f5adda9137b1761aab25ef558b1d8184da836358cadc1&o=&hp=1',
        'https://www.royalparkhotels.co.jp/canvas/ginzacorridor/assets/images/home/kv.png',
      ],
    },
    {
      id: 'dining',
      title: t('categoryDiningTitle'),
      titleJa: t('categoryDiningTitleJa'),
      description: t('categoryDiningDesc'),
      sellingPoints: [
        t('categoryDiningPoint1'),
        t('categoryDiningPoint2'),
        t('categoryDiningPoint3'),
        t('categoryDiningPoint4'),
      ],
      imageSearchTerms: [
        'https://www.willflyforfood.net/wp-content/uploads/2020/01/miyako3.jpg',
        'https://media-cdn.tripadvisor.com/media/photo-s/1a/7d/96/e3/photo1jpg.jpg',
        'https://media.timeout.com/images/105746598/1920/1080/image.jpg',
        'https://www.hankyu-hotel.com/en/hotel/dh/dhtokyo/-/media/hotel/dh/dhtokyo/restaurants/images/raunnji/lounge21_new_room/9546_1.jpg?h=300&w=500&la=ja-JP&hash=05109D606B951B47977E1D07FFA1D3FE52CED483',
        'https://tse2.mm.bing.net/th/id/OIP.xP9qQffIuyKuTrZm8ipP5QHaEK?rs=1&pid=ImgDetMain&o=7&rm=3',
        'https://media.timeout.com/images/103536311/image.jpg',
        'https://www.willflyforfood.net/wp-content/uploads/2019/02/rai-rai-tei1.jpg.webp',
        'https://th.bing.com/th/id/R.be77f140de9c7ddd3274fe24c665041a?rik=iIGCXYNr0ZE1xw&riu=http%3a%2f%2fdiscoverjapan.blog%2fwp-content%2fuploads%2f2024%2f05%2fdff9e495482cc7de561eed8aa754d085.webp&ehk=UAm%2bDCDta%2fODAfcLEWlVW%2bxYxJRRI%2btYWd8c1VuXKR4%3d&risl=&pid=ImgRaw&r=0',
        'https://a.cdn-hotels.com/gdcs/production198/d1097/cd589259-ee09-472d-98f7-d50fb8d9bff8.jpg?impolicy=fcrop&w=1600&h=1066&q=medium',
      ],
    },
    {
      id: 'clinics',
      title: t('categoryClinicsTitle'),
      titleJa: t('categoryClinicsTitleJa'),
      description: t('categoryClinicsDesc'),
      sellingPoints: [
        t('categoryClinicsPoint1'),
        t('categoryClinicsPoint2'),
        t('categoryClinicsPoint3'),
        t('categoryClinicsPoint4'),
      ],
      imageSearchTerms: [
        'japanese modern clinic interior clean',
        'tokyo medical clinic professional',
        'japanese aesthetic clinic treatment',
        'japanese dental clinic modern',
        'modern japanese healthcare facility',
        'japanese medical facility sterile',
      ],
    },
    {
      id: 'activities',
      title: t('categoryActivitiesTitle'),
      titleJa: t('categoryActivitiesTitleJa'),
      description: t('categoryActivitiesDesc'),
      sellingPoints: [
        t('categoryActivitiesPoint1'),
        t('categoryActivitiesPoint2'),
        t('categoryActivitiesPoint3'),
        t('categoryActivitiesPoint4'),
      ],
      imageSearchTerms: [
        'https://thegolfdome.com/wp-content/uploads/2022/03/IntUpper-downrange_1920x1080-1536x864.jpg',
        'https://www.indoorgolfarena.eu/image/2016/3/16/716_iga_so_20140122_def_page_24_2_jpg_2c8b1ad14b3e708bb19aff54e73d53d3.jpg(mediaclass-default.39a7cb77450cae1df8cc1a404ecae71401e24d88).jpg',
        'https://thegolfdome.com/wp-content/uploads/2022/03/PracticeStudios_1920x1080.jpg',
        'https://www.theteenmagazine.com/rails/active_storage/representations/redirect/eyJfcmFpbHMiOnsibWVzc2FnZSI6IkJBaHBBLzQvQVE9PSIsImV4cCI6bnVsbCwicHVyIjoiYmxvYl9pZCJ9fQ%3d%3d--21f59fb1691960e074a44fbb757996001b37f933/eyJfcmFpbHMiOnsibWVzc2FnZSI6IkJBaDdCem9MWm05eWJXRjBTU0lJYW5CbkJqb0dSVlE2RW5KbGMybDZaVjkwYjE5bWFYUmJCMmtDNkFNdyIsImV4cCI6bnVsbCwicHVyIjoidmFyaWF0aW9uIn19--630ea93a8437270e449de3dbebc208269f777335/pexels-nicholas-fu-9288101.jpg',
        'https://uploads-ssl.webflow.com/620d593c0cff284f05f9cb95/625091a96cb932f79c70dd17_PS+Pilates+Studio+Highlands+Colorado+Denver.jpg',
        'https://www.bodysmart.com.au/wp-content/uploads/2017/05/20171229_Pilates-Exercise-Room.jpg',
        'https://thumbs.dreamstime.com/b/image-shows-interior-modern-pilates-studio-room-features-wooden-reformers-wall-water-feature-plants-322655362.jpg',
        'https://nfg-sofun.s3.amazonaws.com/uploads/event/photo/46270/poster_board_240728808_4156236694474593_7477211711026404452_n.jpg',
      ],
    },
  ];

  return (
    <section className="py-16 md:py-24 bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Row 1: 2 boxes */}
        <div className="grid md:grid-cols-2 gap-6 mb-6">
          <CategoryCard
            title={categories[0].title}
            titleJa={categories[0].titleJa}
            description={categories[0].description}
            sellingPoints={categories[0].sellingPoints}
            imageSearchTerms={categories[0].imageSearchTerms}
            categoryId={categories[0].id}
          />
          <CategoryCard
            title={categories[1].title}
            titleJa={categories[1].titleJa}
            description={categories[1].description}
            sellingPoints={categories[1].sellingPoints}
            imageSearchTerms={categories[1].imageSearchTerms}
            categoryId={categories[1].id}
          />
        </div>

        {/* Row 2: 2 boxes */}
        <div className="grid md:grid-cols-2 gap-6 mb-6">
          <CategoryCard
            title={categories[2].title}
            titleJa={categories[2].titleJa}
            description={categories[2].description}
            sellingPoints={categories[2].sellingPoints}
            imageSearchTerms={categories[2].imageSearchTerms}
            categoryId={categories[2].id}
          />
          <CategoryCard
            title={categories[3].title}
            titleJa={categories[3].titleJa}
            description={categories[3].description}
            sellingPoints={categories[3].sellingPoints}
            imageSearchTerms={categories[3].imageSearchTerms}
            categoryId={categories[3].id}
          />
        </div>

        {/* Row 3: 2 boxes */}
        <div className="grid md:grid-cols-2 gap-6">
          <CategoryCard
            title={categories[4].title}
            titleJa={categories[4].titleJa}
            description={categories[4].description}
            sellingPoints={categories[4].sellingPoints}
            imageSearchTerms={categories[4].imageSearchTerms}
            categoryId={categories[4].id}
          />
          <CategoryCard
            title={categories[5].title}
            titleJa={categories[5].titleJa}
            description={categories[5].description}
            sellingPoints={categories[5].sellingPoints}
            imageSearchTerms={categories[5].imageSearchTerms}
            categoryId={categories[5].id}
          />
        </div>
      </div>
    </section>
  );
}

