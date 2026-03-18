/**
 * MetaTags — Dynamic document.title + <meta> + Open Graph + Twitter Card
 * v6.0.0
 *
 * Updates on every hash change. Supports entity deep links.
 */
import { useEffect } from 'react';

const SITE_NAME = 'İslam Medeniyeti Atlası / Islamic Civilization Atlas';
const SITE_URL  = 'https://islamicatlas.org';
const OG_IMAGE  = 'https://islamicatlas.org/og-banner.png';

const TAB_TITLES = {
  tr: {
    map: 'Harita', dashboard: 'Pano', timeline: 'Zaman Çizelgesi',
    links: 'Nedensellik', scholars: 'Âlimler', battles: 'Savaşlar',
    alam: "el-A'lâm Veritabanı", yaqut: "Mu'cem el-Büldân", admin: 'Yönetim Paneli',
  },
  en: {
    map: 'Map', dashboard: 'Dashboard', timeline: 'Timeline',
    links: 'Causality', scholars: 'Scholars', battles: 'Battles',
    alam: 'al-Aʿlām Database', yaqut: "Mu'jam al-Buldan", admin: 'Admin Panel',
  },
  ar: {
    map: 'خريطة', dashboard: 'لوحة', timeline: 'الجدول الزمني',
    links: 'السببية', scholars: 'العلماء', battles: 'المعارك',
    alam: 'الأعلام', yaqut: 'معجم البلدان', admin: 'لوحة الإدارة',
  },
};

const TAB_DESCRIPTIONS = {
  tr: {
    map: '186 hanedan, 830 hükümdar, 450 âlim, 100 savaş — interaktif İslam medeniyeti haritası',
    dashboard: 'İslam medeniyetinin istatistiksel analizi ve veri görselleştirmesi',
    timeline: '632–1924 arası İslam tarihinin kronolojik çizelgesi',
    scholars: 'İslam dünyasının büyük âlimlerinin interaktif haritası ve biyografileri',
    battles: 'İslam tarihindeki kritik savaşların haritası ve analizi',
    alam: "ez-Ziriklî'nin el-A'lâm ansiklopedisinden 13.940 biyografi",
    yaqut: "Yâkût el-Hamevî'nin Mu'cem el-Büldân eserinden 12.954 coğrafi kayıt",
  },
  en: {
    map: '186 dynasties, 830 rulers, 450 scholars, 100 battles — interactive Islamic civilization map',
    dashboard: 'Statistical analysis and data visualization of Islamic civilization',
    timeline: 'Chronological timeline of Islamic history from 632 to 1924 CE',
    scholars: 'Interactive map and biographies of great scholars of the Islamic world',
    battles: 'Map and analysis of critical battles in Islamic history',
    alam: '13,940 biographies from al-Zirikli\'s al-Aʿlām encyclopedia',
    yaqut: '12,954 geographic entries from Yāqūt al-Ḥamawī\'s Muʿjam al-Buldān',
  },
};

function setMeta(name, content) {
  let el = document.querySelector(`meta[name="${name}"]`) || document.querySelector(`meta[property="${name}"]`);
  if (!el) {
    el = document.createElement('meta');
    if (name.startsWith('og:') || name.startsWith('twitter:')) {
      el.setAttribute('property', name);
    } else {
      el.setAttribute('name', name);
    }
    document.head.appendChild(el);
  }
  el.setAttribute('content', content);
}

export default function MetaTags({ tab, entityRoute, lang }) {
  useEffect(() => {
    const l = lang || 'tr';
    const titles = TAB_TITLES[l] || TAB_TITLES.tr;
    const descs = TAB_DESCRIPTIONS[l] || TAB_DESCRIPTIONS.tr;

    let title = titles[tab] || titles.map;
    let description = descs[tab] || descs.map;
    let url = `${SITE_URL}/#${tab}`;

    // Entity deep link title
    if (entityRoute && entityRoute.type && entityRoute.id != null) {
      const typeLabels = {
        tr: { dynasty: 'Hanedan', battle: 'Savaş', scholar: 'Âlim', monument: 'Eser', city: 'Şehir', waqf: 'Vakıf' },
        en: { dynasty: 'Dynasty', battle: 'Battle', scholar: 'Scholar', monument: 'Monument', city: 'City', waqf: 'Waqf' },
      };
      const labels = typeLabels[l] || typeLabels.tr;
      const typeLabel = labels[entityRoute.type] || entityRoute.type;
      if (entityRoute.name) {
        title = `${entityRoute.name} — ${SITE_NAME}`;
        description = `${typeLabel}: ${entityRoute.name}`;
      } else {
        title = `${typeLabel} #${entityRoute.id} — ${SITE_NAME}`;
      }
      url = `${SITE_URL}/#${entityRoute.type}/${entityRoute.id}`;
    }

    const fullTitle = title.includes('Atlası') || title.includes('Atlas') ? title : `${title} — ${SITE_NAME}`;

    // Document title
    document.title = fullTitle;

    // Standard meta
    setMeta('description', description);

    // Open Graph
    setMeta('og:title', fullTitle);
    setMeta('og:description', description);
    setMeta('og:url', url);
    setMeta('og:image', OG_IMAGE);
    setMeta('og:type', 'website');
    setMeta('og:site_name', SITE_NAME);

    // Twitter Card
    setMeta('twitter:card', 'summary_large_image');
    setMeta('twitter:title', fullTitle);
    setMeta('twitter:description', description);
    setMeta('twitter:image', OG_IMAGE);
  }, [tab, entityRoute, lang]);

  return null; // Renders nothing — side-effect only
}
