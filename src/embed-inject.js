// filmmodu.news iframe'i içinde çalışır: NOTFLİX markası, bizim Giriş/İletişim/Canlı TV/Premium panelleri,
// Forum temizliği, kalan filmmodu adlarının traşlanması ve üst çubuk çakışmasının giderilmesi.
(function () {
  if (window.__nfBrand) return;
  window.__nfBrand = true;

  const style = document.createElement('style');
  style.textContent =
    "@font-face{font-family:'Bebas Neue';font-style:normal;font-weight:400;src:url(data:font/woff2;base64,__FONT_B64__) format('woff2')}" +
    ".nf-word{display:inline-block;height:1.6em;width:auto;vertical-align:middle;overflow:visible;filter:drop-shadow(0 0 .05em rgba(229,9,20,.55)) drop-shadow(0 .03em .16em rgba(229,9,20,.4))}" +
    // SERT MARKA GARANTİSİ: orijinal "Film/modu" span'leri CSS ile anında gizlenir (JS yetişmese bile,
    // SPA geçişinde yeni eklenen logo dahil tek frame görünmez). Bizim .nf-word her zaman görünür.
    "a[href='https://filmmodu.news']>span:not(.nf-word),a[href='https://filmmodu.news/']>span:not(.nf-word),a.tracking-tightest>span:not(.nf-word),a[href='/']>span.text-accent,a[href='/']>span.text-white{visibility:hidden!important}" +
    // Üst utility çubuğunu sola kaydır: bizim pencere kontrol butonlarıyla (sağ üst) çakışmasın.
    "header>div:first-child .container-site{padding-right:150px!important;max-width:none!important}" +
    // Ana menü sekmeleri ekranın ortasında kalmasın: header satırını tam genişliğe al, sekmeleri sola çek.
    "header>div.container-site.flex.h-16{max-width:none!important;padding-right:24px!important}" +
    // Video altı tepki çubuğu (beğen/beğenme + hata bildir), "Açılmıyor mu?" popup'ı ve yorumlar asla görünmesin.
    "[x-data*='dislikes']{display:none!important}" +
    "button[\\@click*='prob']{display:none!important}" +
    ".tb-pop{display:none!important}" +
    "#yorumlar,a[href*='#yorumlar']{display:none!important}" +
    // Canlı TV / Canlı Diziler sekmelerindeki yanıp sönen kırmızı çember (ping + iç nokta) asla görünmesin.
    "a[href*='canli-diziler'] span[class*='animate-ping'],a[href*='canli-diziler'] span[class*='animate-pulse'],a[href*='canli-diziler'] span[class*='bg-red-500'],a[href*='canli-diziler'] span[class*='bg-red-600'][class*='rounded-full'],a[href*='canli-diziler'] span[class*='h-2'][class*='w-2']{display:none!important}";
  (document.head || document.documentElement).appendChild(style);

  // Kavisli marka yayı: tüm logoların textPath'i bu ortak yaya bağlanır (Netflix tarzı bükük duruş).
  if (!document.getElementById('nfArcDefs')) {
    const defs = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    defs.id = 'nfArcDefs';
    defs.setAttribute('width', '0');
    defs.setAttribute('height', '0');
    defs.style.position = 'absolute';
    defs.innerHTML = '<defs><path id="nfArc" d="M16 88 Q170 64 324 88"/></defs>';
    (document.body || document.documentElement).appendChild(defs);
  }

  const WORD = '<svg class="nf-word" viewBox="0 0 340 110" role="img" aria-label="NOTFLİX"><text font-family="\'Bebas Neue\',\'Arial Narrow\',Impact,sans-serif" font-size="62" letter-spacing="3" fill="#e50914"><textPath href="#nfArc" startOffset="50%" text-anchor="middle">NOTFLİX</textPath></text></svg>';
  const done = new WeakSet();
  const post = m => { try { window.parent.postMessage(m, '*'); } catch (e) {} };
  const open = panel => post({ nf: 'panel', panel: panel });

  // Canlı Diziler'in yanına bizim Canlı TV butonunu ekle (aynı pill stili).
  function addCanliNav() {
    if (document.getElementById('nfCanliNav')) return;
    const cd = document.querySelector('a[href*="/canli-diziler"]');
    if (!cd || !cd.parentNode) return;
    const a = document.createElement('a');
    a.id = 'nfCanliNav';
    a.href = '#';
    a.dataset.nfPanel = 'canli';
    a.className = cd.className;
    // Kırmızı yanıp sönen çember yok: yalnızca metin ve 7/24 rozeti.
    a.innerHTML = 'Canlı TV <span class="rounded-pill bg-red-600 px-1 text-xs font-bold uppercase tracking-wide text-white">7/24</span>';
    cd.parentNode.insertBefore(a, cd);
  }

  // Görünür metinlerde kalan "filmmodu" adlarını NOTFLİX yap (script/style/URL hariç).
  function scrubText() {
    const root = document.body;
    if (!root) return;
    const w = document.createTreeWalker(root, NodeFilter.SHOW_TEXT, {
      acceptNode(n) {
        const p = n.parentNode;
        if (!p) return NodeFilter.FILTER_REJECT;
        const tag = p.nodeName;
        if (tag === 'SCRIPT' || tag === 'STYLE' || tag === 'NOSCRIPT' || tag === 'TEXTAREA') return NodeFilter.FILTER_REJECT;
        return /filmmodu/i.test(n.nodeValue || '') ? NodeFilter.FILTER_ACCEPT : NodeFilter.FILTER_REJECT;
      }
    });
    const hits = [];
    let n;
    while ((n = w.nextNode())) hits.push(n);
    hits.forEach(t => { t.nodeValue = t.nodeValue.replace(/filmmodu/gi, 'NOTFLİX'); });
  }

  // Sağ üstteki alana + footer'ın en altına geliştirici destek bağlantısını ekle.
  function addBagis() {
    if (!document.getElementById('nfBagisNav')) {
      const slot = document.querySelector('header .ml-auto') || document.querySelector('header');
      if (slot) {
        const a = document.createElement('a');
        a.id = 'nfBagisNav';
        a.href = '#';
        a.dataset.nfPanel = 'bagis';
        a.className = 'btn-sm shrink-0 whitespace-nowrap rounded-pill border border-white/20 px-3 py-2 text-[13px] font-semibold text-content-secondary transition hover:border-accent/60 hover:text-white';
        a.textContent = 'Geliştiriciye Destek';
        slot.appendChild(a);
      }
    }
    if (!document.getElementById('nfBagisFooter')) {
      const cp = Array.from(document.querySelectorAll('footer p')).find(p => /©/.test(p.textContent || ''));
      if (cp && cp.parentNode) {
        const a = document.createElement('a');
        a.id = 'nfBagisFooter';
        a.href = '#';
        a.dataset.nfPanel = 'bagis';
        a.className = 'inline-block py-1 font-semibold text-accent transition hover:text-accent-hover';
        a.textContent = 'Geliştiriciye Destek';
        cp.parentNode.appendChild(a);
      }
    }
  }

  // Video altı tepki/hata çubuğu + yorumlar: beğen/beğenme, hata bildir, "Açılmıyor mu?" ve yorum bölümü kökten kaldır.
  function removeReport() {
    document.querySelectorAll('[x-data*="dislikes"], #yorumlar').forEach(el => el.remove());
    document.querySelectorAll("a[href*='#yorumlar']").forEach(el => el.remove());
    document.querySelectorAll('button').forEach(b => {
      const click = b.getAttribute('@click') || '';
      if (click.includes('prob') || /Açılmıyor/i.test(b.textContent || '')) {
        const w = b.closest('div.relative');
        (w || b).remove();
      }
    });
    document.querySelectorAll('.tb-pop').forEach(el => el.remove());
  }

  // Canlı Diziler sekmesindeki kırmızı yanıp sönen çemberi DOM'dan da kaldır (CSS'e ek sert garanti).
  function removeLiveDots() {
    document.querySelectorAll('a[href*="canli-diziler"]').forEach(a => {
      a.querySelectorAll('span[class*="animate-ping"], span[class*="animate-pulse"], span[class*="bg-red-500"], span[class*="bg-red-600"][class*="rounded-full"]').forEach(el => {
        const box = el.parentElement;
        el.remove();
        if (box && box !== a && box.tagName === 'SPAN' && !box.textContent.trim() && !box.querySelector('span')) box.remove();
      });
    });
  }

  // Puanlama sistemi görünmesin: detay sayfalarındaki "Puanlama" bölümü (oy ver / giriş yap uyarısı) tamamen gizlenir.
  // IMDb puanı ve kartlardaki puan bilgisi kalır; yalnızca kullanıcının giriş yaparak puan verdiği sistem kaldırılır.
  function hideRating() {
    document.querySelectorAll('main section').forEach(s => {
      const h = s.querySelector('h2.section-title, h2');
      if (h && /^\s*Puanlama\s*$/i.test((h.textContent || '').trim())) {
        s.style.display = 'none';
        s.setAttribute('data-nf-hidden', '1');
      }
    });
  }

  // Dil seçiciyi kaldırma: üst çubuktaki "Dil seç" düğmesi görünür kalır ama tıklanamaz.
  function lockLang() {
    document.querySelectorAll('button[aria-label="Dil seç"]').forEach(b => {
      if (b.dataset.nfLocked === '1') return;
      b.dataset.nfLocked = '1';
      b.style.pointerEvents = 'none';
      b.style.cursor = 'default';
      b.setAttribute('aria-disabled', 'true');
      b.tabIndex = -1;
      const wrap = b.parentElement;
      if (wrap) {
        wrap.style.pointerEvents = 'none';
        const panel = wrap.querySelector('[x-show]');
        if (panel) panel.style.display = 'none';
      }
    });
  }

  // Yasal sayfalar: içeriği tamamen NOTFLİX lehine, platformu koruyacak şekilde yeniden yaz.
  // Platform içerik barındırmaz; yalnızca üçüncü taraf kaynaklara bağlantı verir → sorumluluk reddi.
  const LEGAL = {
    '/gizlilik-politikasi': {
      title: 'Gizlilik Politikası',
      body:
        '<p>NOTFLİX olarak gizliliğinize önem veriyoruz. Bu politika, platformu kullanırken verilerinizin nasıl işlendiğini şeffaf biçimde açıklar.</p>' +
        '<h3>1. Toplanan Veriler</h3>' +
        '<p>NOTFLİX, zorunlu kişisel veri toplamaz. Yalnızca isteğe bağlı iletişim ve bağış formlarını doldurduğunuzda; adınız, e-posta adresiniz ve mesajınız, size dönüş yapabilmek amacıyla işlenir. Bunun dışında kimlik, konum veya ödeme bilgisi talep edilmez.</p>' +
        '<h3>2. Verilerin Kullanımı</h3>' +
        '<p>Formlar aracılığıyla paylaştığınız bilgiler yalnızca talebinize yanıt vermek için kullanılır. Verileriniz satılmaz, kiralanmaz ve pazarlama amacıyla üçüncü şahıslarla paylaşılmaz.</p>' +
        '<h3>3. Çerezler ve Üçüncü Taraf Kaynaklar</h3>' +
        '<p>Deneyimi iyileştirmek için sınırlı düzeyde çerez kullanılabilir. NOTFLİX içerik barındırmaz; yalnızca üçüncü taraf kaynaklara bağlantı verir. Bu kaynakların kendi çerez ve gizlilik uygulamalarından NOTFLİX sorumlu değildir.</p>' +
        '<h3>4. Veri Güvenliği</h3>' +
        '<p>Paylaştığınız verileri makul teknik önlemlerle koruruz. İletişim formu mesajları yalnızca yetkili geliştirici ekibi tarafından yanıt amacıyla görüntülenir.</p>' +
        '<h3>5. Haklarınız ve İletişim</h3>' +
        '<p>Verilerinizle ilgili her türlü talep için platform üzerindeki iletişim formunu kullanabilirsiniz. Bu politika zaman zaman güncellenebilir; güncel sürüm her zaman bu sayfada yayımlanır.</p>'
    },
    '/kullanim-kosullari': {
      title: 'Kullanım Koşulları',
      body:
        '<p>NOTFLİX platformunu kullanarak aşağıdaki koşulları kabul etmiş sayılırsınız. Lütfen kullanmadan önce okuyunuz.</p>' +
        '<h3>1. Hizmetin Niteliği</h3>' +
        '<p>NOTFLİX; film, dizi ve yayın kaynaklarına bağlantı veren bağımsız bir dizin ve aracılık platformudur. Platform hiçbir ses veya video içeriğini kendi sunucularında barındırmaz, yayınlamaz veya dağıtmaz. Sunulan tüm içerikler üçüncü taraf internet kaynaklarına aittir.</p>' +
        '<h3>2. Sorumluluk Reddi</h3>' +
        '<p>Hizmet "olduğu gibi" ve "mevcut haliyle" sunulur. İçeriklerin doğruluğu, güncelliği, yasallığı, telif durumu veya kesintisizliği konusunda hiçbir açık veya zımni garanti verilmez. Üçüncü taraf kaynakların içeriklerinden ve bu içeriklerin doğurabileceği hiçbir doğrudan veya dolaylı zarardan NOTFLİX sorumlu tutulamaz.</p>' +
        '<h3>3. Kullanıcı Yükümlülükleri</h3>' +
        '<p>Kullanıcı, platformu yürürlükteki mevzuata ve genel ahlak kurallarına uygun biçimde kullanmayı kabul eder. Bağlantı verilen üçüncü taraf içeriklerin kendi bölgelerindeki yasallığını değerlendirmek kullanıcının sorumluluğundadır.</p>' +
        '<h3>4. Üçüncü Taraf Bağlantıları</h3>' +
        '<p>Platformdaki bağlantılar üçüncü taraflara yönlendirir. NOTFLİX bu kaynakların sahibi, işleteni veya denetleyicisi değildir; söz konusu kaynakların kullanım koşulları ve politikaları geçerlidir.</p>' +
        '<h3>5. Değişiklikler</h3>' +
        '<p>NOTFLİX, hizmetini ve bu koşulları önceden bildirimde bulunmaksızın değiştirme, güncelleme veya sonlandırma hakkını saklı tutar. Güncel koşullar her zaman bu sayfada yayımlanır.</p>'
    },
    '/dmca-telif-hakki': {
      title: 'DMCA / Telif Hakkı',
      body:
        '<p>NOTFLİX, telif haklarına saygılı bir aracılık platformudur. Bu sayfa, telif hakkı bildirimlerinin nasıl işlendiğini açıklar.</p>' +
        '<h3>1. İçerik Barındırma Politikası</h3>' +
        '<p>NOTFLİX hiçbir ses veya video içeriğini kendi sunucularında barındırmaz, yayınlamaz veya dağıtmaz. Platform yalnızca üçüncü taraf internet kaynaklarına bağlantı verir. Bu nedenle telif hakkı ihlali iddialarında asıl muhatap, içeriği fiilen barındıran üçüncü taraf kaynak veya hosting sağlayıcısıdır.</p>' +
        '<h3>2. Başvuru Yolu</h3>' +
        '<p>Telif hakkı sahipleri, iddia ettikleri içerik için öncelikle ilgili üçüncü taraf kaynağa doğrudan başvurmalıdır. NOTFLİX, iyi niyetli ve usulüne uygun bildirimler üzerine bağlantıları kaldırma politikası uygular; bu uygulama bir nezaket jestidir ve herhangi bir yasal sorumluluğun kabulü anlamına gelmez.</p>' +
        '<h3>3. Geçerli Bildirim İçin Gerekli Bilgiler</h3>' +
        '<ul><li>Bildirimi yapan kişinin kimlik ve iletişim bilgileri,</li><li>Telif hakkı sahibi olunan eserin tanımı,</li><li>İhlal iddia edilen içeriğin üçüncü taraf kaynak URL\'si,</li><li>İyi niyetle yapıldığına dair beyan ve imza.</li></ul>' +
        '<h3>4. Aracı Hizmet Sağlayıcı</h3>' +
        '<p>NOTFLİX bir aracı hizmet sağlayıcıdır; üçüncü taraf içerikleri üzerinde kontrolü, sahipliği veya yükümlülüğü yoktur. Platform, içeriğin kaldırılması yönündeki talepleri bağlantı düzeyinde değerlendirir ve hiçbir içerik için sorumluluk kabul etmez.</p>' +
        '<h3>5. Yanlış Bildirimler</h3>' +
        '<p>Gerçeğe aykırı veya kötü niyetli bildirimlerden doğacak her türlü sorumluluk bildirimi yapan tarafa aittir. Bildirimler platform üzerindeki iletişim formu aracılığıyla iletilebilir.</p>'
    }
  };
  function rewriteLegal() {
    const path = (location.pathname || '').replace(/\/+$/, '');
    const L = LEGAL[path];
    if (!L) return;
    const main = document.querySelector('main');
    if (!main || main.querySelector('[data-nf-legal]')) return;
    main.innerHTML =
      '<div class="container-site py-section"><div class="mx-auto max-w-3xl" data-nf-legal="1">' +
      '<h1 style="margin:0;font-size:1.9rem;font-weight:800;letter-spacing:-.02em;color:#fff">' + L.title + '</h1>' +
      '<div class="prose-site mt-8 break-words">' + L.body + '</div>' +
      '</div></div>';
  }

  function apply() {
    // Logo: "Filmmodu" yazan ana sayfa linkleri → NOTFLİX kelime markası
    document.querySelectorAll('a').forEach(a => {
      if (done.has(a)) return;
      const href = a.getAttribute('href') || '';
      const txt = (a.textContent || '').replace(/\s/g, '');
      if (/^https?:\/\/filmmodu\.news\/?$/.test(href) && /filmmodu/i.test(txt)) {
        done.add(a);
        a.innerHTML = WORD;
        a.setAttribute('aria-label', 'NOTFLİX');
      }
    });
    // Giriş / İletişim / Premium: bizim panellere bağla
    const rewire = (sel, panel) => document.querySelectorAll(sel).forEach(a => {
      if (done.has(a)) return;
      done.add(a);
      a.setAttribute('href', '#');
      a.dataset.nfPanel = panel;
    });
    // Giriş Yap butonu artık görünmeyecek: tüm login bağlantıları kaldırılır.
    document.querySelectorAll('a[href*="/login"]').forEach(a => {
      const li = a.closest('li');
      a.remove();
      if (li && !li.textContent.trim()) li.remove();
    });
    rewire('a[href*="/iletisim"]', 'iletisim');
    // Premium: şimdilik arayüzden tamamen gizle
    document.querySelectorAll('a[href*="/premium"]').forEach(a => {
      const li = a.closest('li');
      a.remove();
      if (li && !li.textContent.trim()) li.remove();
    });
    // Forum: tamamen kaldır
    document.querySelectorAll('a[href*="/forum"]').forEach(a => {
      const li = a.closest('li');
      a.remove();
      if (li && !li.textContent.trim()) li.remove();
    });
    // Footer telif satırı
    document.querySelectorAll('footer p').forEach(p => {
      if (done.has(p)) return;
      if (/^\s*©/.test(p.textContent || '')) { done.add(p); p.textContent = '© 2027 NOTFLİX. Tüm hakları saklıdır.'; }
    });
    addCanliNav();
    removeLiveDots();
    addBagis();
    removeReport();
    hideRating();
    lockLang();
    rewriteLegal();
    scrubText();
    if (/filmmodu/i.test(document.title)) document.title = document.title.replace(/filmmodu/gi, 'NOTFLİX');
  }

  // Bizim panelleri açan tıklama delegasyonu (capture: sitenin router'ından önce)
  document.addEventListener('click', e => {
    const a = e.target && e.target.closest && e.target.closest('a[data-nf-panel]');
    if (a) { e.preventDefault(); e.stopPropagation(); open(a.dataset.nfPanel); }
  }, true);

  // Senkron observer: DOM değiştiği anda (paint'ten önce) yeniden markala → eski marka flaşı olmaz.
  let applying = false;
  const obs = new MutationObserver(() => {
    if (applying) return;
    applying = true;
    try { apply(); } finally { applying = false; }
  });
  obs.observe(document.documentElement, { childList: true, subtree: true, characterData: true });

  // Tam sayfa geçişinde eski marka bir an görünmesin: ayrılırken iframe'i gizle, hazır olunca göster.
  window.addEventListener('pagehide', () => post({ nf: 'hide' }));
  window.addEventListener('beforeunload', () => post({ nf: 'hide' }));

  apply();
  post({ nf: 'ready' });
})();
