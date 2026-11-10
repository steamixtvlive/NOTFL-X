// NOTFLİX Shell Renderer — hash-routed SPA with filmmodu 1:1 layout
(function () {
  const data = (window.notflix && window.notflix.content) || { hero: { slides: [] }, rails: {}, grids: {}, episodes: {} };
  const VOD = (window.notflix && window.notflix.vod) || null;
  const esc = s => (s == null ? '' : String(s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c])));

  // ========== İ18N (çoklu dil — arayüzün tamamı) ==========
  // Desteklenen Avrupa dilleri (>=12). Kod -> {etiket, TMDB dili}.
  const LANGS = {
    tr: { name: 'Türkçe', tmdb: 'tr-TR' }, en: { name: 'English', tmdb: 'en-US' },
    de: { name: 'Deutsch', tmdb: 'de-DE' }, fr: { name: 'Français', tmdb: 'fr-FR' },
    es: { name: 'Español', tmdb: 'es-ES' }, it: { name: 'Italiano', tmdb: 'it-IT' },
    pt: { name: 'Português', tmdb: 'pt-PT' }, nl: { name: 'Nederlands', tmdb: 'nl-NL' },
    pl: { name: 'Polski', tmdb: 'pl-PL' }, sv: { name: 'Svenska', tmdb: 'sv-SE' },
    no: { name: 'Norsk', tmdb: 'nb-NO' }, da: { name: 'Dansk', tmdb: 'da-DK' },
    fi: { name: 'Suomi', tmdb: 'fi-FI' }, ro: { name: 'Română', tmdb: 'ro-RO' },
    cs: { name: 'Čeština', tmdb: 'cs-CZ' }, ru: { name: 'Русский', tmdb: 'ru-RU' },
    uk: { name: 'Українська', tmdb: 'uk-UA' }, az: { name: 'Azərbaycan', tmdb: 'az-AZ' }
  };
  // Sözlük: önce EN tam, TR tam; diğer diller chrome anahtarlarını kapsar, eksikse EN'ye düşer.
  const DICT = {};
  DICT.tr = {
    'nav.films': 'Filmler', 'nav.series': 'Diziler', 'nav.anime': 'Animeler', 'nav.discover': 'Keşfet',
    'nav.calendar': 'Takvim', 'nav.library': 'Kütüphane', 'nav.live': 'Canlı TV', 'nav.genres': 'Türler', 'nav.signup': 'Kayıt Ol',
    'nav.signin': 'Giriş Yap', 'nav.browse': 'Kategoriye göz at', 'nav.lang': 'Dil seç',
    'common.watch': 'İzle', 'common.watchNow': 'Şimdi İzle', 'common.details': 'Detaylar', 'common.add': 'Listeme Ekle',
    'common.added': 'Listemde', 'library.title': 'Kütüphanem', 'library.sub': 'Listeme eklediğin film ve diziler burada.',
    'library.empty': 'Henüz listen boş. Beğendiğin içeriklerde "Listeme Ekle" butonuna bas.', 'library.goto': 'Keşfet',
    'common.viewAll': 'Tümünü Gör', 'common.search': 'Film, dizi veya oyuncu ara...', 'common.hd': 'HD',
    'common.film': 'Film', 'common.series': 'Dizi', 'common.anime': 'Anime', 'common.all': 'Tüm İçerikler',
    'common.home': 'Ana Sayfa', 'common.watch2': 'İzle', 'common.theater': 'Tiyatro', 'common.quality': 'Kalite',
    'common.speed': 'Hız', 'common.source': 'Kaynak', 'common.back': 'Detay Sayfası', 'common.play': 'Oynat', 'common.stop': 'Durdur',
    'hero.region': 'Öne çıkan film ve diziler', 'hero.trailer': 'Fragman', 'hero.trailerHint': 'Fragmanı oynatmak için butona bas.',
    'rails.trendFilm': 'Trend Filmler', 'rails.recentFilm': 'Son Eklenen Filmler', 'rails.trendSeries': 'Trend Diziler',
    'rails.recentEp': 'Son Eklenen Bölümler', 'rails.anime': 'Animeler', 'rails.recentAnime': 'Son Eklenen Animeler',
    'detail.imdb': 'IMDB Puanı', 'detail.year': 'Yıl', 'detail.genre': 'Tür', 'detail.season': 'Sezon',
    'detail.similarFilm': 'Benzer Filmler', 'detail.similarSeries': 'Benzer Diziler', 'detail.similarAnime': 'Benzer Animeler',
    'detail.cast': 'Oyuncu Kadrosu', 'detail.episodes': 'Bölümler', 'detail.seasonSelect': 'Sezon Seç', 'detail.ep': 'Bölüm',
    'catalog.count': 'içerik', 'catalog.page': 'sayfa', 'catalog.loadMore': 'Daha fazla yükle', 'catalog.none': 'Bu kategoride içerik yok.',
    'discover.byGenre': 'Türlere Göz At',
    'footer.discover': 'Keşfet', 'footer.wizard': 'Keşfet Sihirbazı', 'footer.trending': 'Trend İçerikler',
    'footer.collections': 'Koleksiyonlar', 'footer.premium': 'Premium', 'footer.corporate': 'Kurumsal',
    'footer.privacy': 'Gizlilik Politikası', 'footer.terms': 'Kullanım Koşulları', 'footer.dmca': 'DMCA / Telif Hakkı',
    'footer.contact': 'İletişim', 'footer.copyright': '© 2027 NOTFLİX. Tüm hakları saklıdır.',
    'footer.note': 'Bu platform içeriği barındırmaz; üçüncü taraf kaynaklara bağlantı verir.',
    'footer.about': 'NOTFLİX, film ve dizi tutkunlarını tek çatı altında buluşturur. Güncel katalog, pratik filtreleme ve kesintisiz oynatma ile yeni yapımları keşfet, favorilerini kaydet ve Full HD keyfini çıkar.',
    'contact.title': 'İletişim', 'contact.sub': 'Sorun, öneri, hata ya da şikayetini bize yaz. En geç 24 saat içinde dönüş yapıyoruz.',
    'contact.name': 'Ad Soyad', 'contact.email': 'E-posta (sana dönüş yapabilmemiz için)', 'contact.topic': 'Konu',
    'contact.tIssue': 'Sorun', 'contact.tSuggest': 'Öneri', 'contact.tBug': 'Hata Bildirimi', 'contact.tComplaint': 'Şikayet',
    'contact.message': 'Mesajın', 'contact.send': 'Mesajı Gönder', 'contact.sending': 'Gönderiliyor…',
    'contact.success': 'Mesajın bize ulaştı. En geç 24 saat içinde dönüş yapıyoruz.', 'contact.error': 'Gönderilemedi. Lütfen tekrar dene.',
    'giris.soon': 'Yakında aktif olacak', 'giris.soonDesc': 'Giriş ve hesap sistemi hazır olduğunda burada olacak. Şimdiden keyifli seyirler!',
    'giris.back': 'Ana sayfaya dön', 'premium.title': 'Premium', 'premium.desc': 'Reklamsız, en yüksek kalite ve öncelikli erişim yakında.',
    'premium.cta': 'Haber ver', 'trend.title': 'Trend İçerikler', 'collections.title': 'Koleksiyonlar',
    'wizard.title': 'Keşfet Sihirbazı', 'wizard.sub': 'Ruh halini seç, sana uygun içerikleri getirelim.', 'wizard.run': 'Bana bir şey öner',
    'splash.skip': 'Atla', 'splash.l1': 'Sunucuya bağlanılıyor…', 'splash.l2': 'Katalog hazırlanıyor…',
    'splash.l3': 'Yayın çizgileri denetleniyor…', 'splash.l4': 'Bağlanıldı',
    'live.title': 'Canlı TV', 'live.fullscreen': 'Tam Ekran', 'live.sub': 'Türkiye kanalları A–Z. Sadece kanal seçimi yapılabilir; başka bir alana erişim kapalıdır.',
    'legal.privacy': 'Gizlilik Politikası', 'legal.terms': 'Kullanım Koşulları', 'legal.dmca': 'DMCA / Telif Hakkı'
  };
  DICT.en = {
    'nav.films': 'Movies', 'nav.series': 'Series', 'nav.anime': 'Anime', 'nav.discover': 'Discover',
    'nav.calendar': 'Calendar', 'nav.library': 'Library', 'nav.live': 'Live TV', 'nav.genres': 'Genres', 'nav.signup': 'Sign Up',
    'nav.signin': 'Log In', 'nav.browse': 'Browse category', 'nav.lang': 'Select language',
    'common.watch': 'Watch', 'common.watchNow': 'Watch Now', 'common.details': 'Details', 'common.add': 'Add to List',
    'common.added': 'In My List', 'library.title': 'My Library', 'library.sub': 'The films and series you added to your list.',
    'library.empty': 'Your list is empty. Press "Add to List" on any title you like.', 'library.goto': 'Discover',
    'common.viewAll': 'View All', 'common.search': 'Search movies, series or actors...', 'common.hd': 'HD',
    'common.film': 'Film', 'common.series': 'Series', 'common.anime': 'Anime', 'common.all': 'All Content',
    'common.home': 'Home', 'common.watch2': 'Watch', 'common.theater': 'Theater', 'common.quality': 'Quality',
    'common.speed': 'Speed', 'common.source': 'Source', 'common.back': 'Detail Page', 'common.play': 'Play', 'common.stop': 'Stop',
    'hero.region': 'Featured films and series', 'hero.trailer': 'Trailer', 'hero.trailerHint': 'Press the button to play the trailer.',
    'rails.trendFilm': 'Trending Movies', 'rails.recentFilm': 'Recently Added Movies', 'rails.trendSeries': 'Trending Series',
    'rails.recentEp': 'Latest Episodes', 'rails.anime': 'Anime', 'rails.recentAnime': 'Recently Added Anime',
    'detail.imdb': 'IMDb Rating', 'detail.year': 'Year', 'detail.genre': 'Genre', 'detail.season': 'Season',
    'detail.similarFilm': 'Similar Movies', 'detail.similarSeries': 'Similar Series', 'detail.similarAnime': 'Similar Anime',
    'detail.cast': 'Cast', 'detail.episodes': 'Episodes', 'detail.seasonSelect': 'Select Season', 'detail.ep': 'Episode',
    'catalog.count': 'titles', 'catalog.page': 'page', 'catalog.loadMore': 'Load more', 'catalog.none': 'No content in this category.',
    'discover.byGenre': 'Browse by Genre',
    'footer.discover': 'Discover', 'footer.wizard': 'Discovery Wizard', 'footer.trending': 'Trending',
    'footer.collections': 'Collections', 'footer.premium': 'Premium', 'footer.corporate': 'Company',
    'footer.privacy': 'Privacy Policy', 'footer.terms': 'Terms of Use', 'footer.dmca': 'DMCA / Copyright',
    'footer.contact': 'Contact', 'footer.copyright': '© 2027 NOTFLIX. All rights reserved.',
    'footer.note': 'This platform hosts no content; it links to third-party sources.',
    'footer.about': 'NOTFLIX brings movie and series lovers together. Discover new titles with an up-to-date catalogue, easy filtering and seamless playback, save your favourites and enjoy Full HD.',
    'contact.title': 'Contact', 'contact.sub': 'Tell us your issue, suggestion, bug or complaint. We reply within 24 hours.',
    'contact.name': 'Full Name', 'contact.email': 'Email (so we can reply)', 'contact.topic': 'Topic',
    'contact.tIssue': 'Issue', 'contact.tSuggest': 'Suggestion', 'contact.tBug': 'Bug Report', 'contact.tComplaint': 'Complaint',
    'contact.message': 'Your Message', 'contact.send': 'Send Message', 'contact.sending': 'Sending…',
    'contact.success': 'Your message reached us. We will reply within 24 hours.', 'contact.error': 'Could not send. Please try again.',
    'giris.soon': 'Coming soon', 'giris.soonDesc': 'Login and accounts will appear here once ready. Enjoy the show in the meantime!',
    'giris.back': 'Back to home', 'premium.title': 'Premium', 'premium.desc': 'Ad-free, top quality and priority access coming soon.',
    'premium.cta': 'Notify me', 'trend.title': 'Trending Content', 'collections.title': 'Collections',
    'wizard.title': 'Discovery Wizard', 'wizard.sub': 'Pick a mood and we will find something for you.', 'wizard.run': 'Recommend me something',
    'splash.skip': 'Skip', 'splash.l1': 'Connecting to server…', 'splash.l2': 'Preparing catalogue…',
    'splash.l3': 'Checking broadcast lines…', 'splash.l4': 'Connected',
    'live.title': 'Live TV', 'live.fullscreen': 'Fullscreen', 'live.sub': 'Turkish channels A–Z. Only channel selection is allowed; no other area is accessible.',
    'legal.privacy': 'Privacy Policy', 'legal.terms': 'Terms of Use', 'legal.dmca': 'DMCA / Copyright'
  };
  // Diğer diller — chrome anahtarları; eksik anahtar EN'ye düşer.
  DICT.de = { 'nav.films':'Filme','nav.series':'Serien','nav.anime':'Anime','nav.discover':'Entdecken','nav.calendar':'Kalender','nav.live':'Live-TV','nav.genres':'Genres','nav.signup':'Registrieren','nav.signin':'Anmelden','common.watch':'Ansehen','common.watchNow':'Jetzt ansehen','common.details':'Details','common.add':'Zur Liste','common.viewAll':'Alle ansehen','common.home':'Startseite','footer.contact':'Kontakt','footer.privacy':'Datenschutz','footer.terms':'Nutzungsbedingungen','footer.corporate':'Unternehmen','footer.discover':'Entdecken','contact.title':'Kontakt','contact.send':'Senden','giris.soon':'Bald verfügbar','splash.skip':'Überspringen','splash.l1':'Verbindung…','detail.cast':'Besetzung' };
  DICT.fr = { 'nav.films':'Films','nav.series':'Séries','nav.anime':'Animés','nav.discover':'Découvrir','nav.calendar':'Calendrier','nav.live':'TV en direct','nav.genres':'Genres','nav.signup':"S'inscrire",'nav.signin':'Se connecter','common.watch':'Regarder','common.watchNow':'Regarder','common.details':'Détails','common.add':'Ajouter','common.viewAll':'Tout voir','common.home':'Accueil','footer.contact':'Contact','footer.privacy':'Confidentialité','footer.terms':'Conditions','footer.corporate':'Société','footer.discover':'Découvrir','contact.title':'Contact','contact.send':'Envoyer','giris.soon':'Bientôt disponible','splash.skip':'Passer','splash.l1':'Connexion…','detail.cast':'Distribution' };
  DICT.es = { 'nav.films':'Películas','nav.series':'Series','nav.anime':'Anime','nav.discover':'Descubrir','nav.calendar':'Calendario','nav.live':'TV en directo','nav.genres':'Géneros','nav.signup':'Registrarse','nav.signin':'Iniciar sesión','common.watch':'Ver','common.watchNow':'Ver ahora','common.details':'Detalles','common.add':'Añadir','common.viewAll':'Ver todo','common.home':'Inicio','footer.contact':'Contacto','footer.privacy':'Privacidad','footer.terms':'Términos','footer.corporate':'Empresa','footer.discover':'Descubrir','contact.title':'Contacto','contact.send':'Enviar','giris.soon':'Próximamente','splash.skip':'Saltar','splash.l1':'Conectando…','detail.cast':'Reparto' };
  DICT.it = { 'nav.films':'Film','nav.series':'Serie','nav.anime':'Anime','nav.discover':'Scopri','nav.calendar':'Calendario','nav.live':'TV diretta','nav.genres':'Generi','nav.signup':'Registrati','nav.signin':'Accedi','common.watch':'Guarda','common.watchNow':'Guarda ora','common.details':'Dettagli','common.add':'Aggiungi','common.viewAll':'Vedi tutto','common.home':'Home','footer.contact':'Contatti','footer.privacy':'Privacy','footer.terms':'Termini','footer.corporate':'Azienda','footer.discover':'Scopri','contact.title':'Contatti','contact.send':'Invia','giris.soon':'Prossimamente','splash.skip':'Salta','splash.l1':'Connessione…','detail.cast':'Cast' };
  DICT.pt = { 'nav.films':'Filmes','nav.series':'Séries','nav.anime':'Animes','nav.discover':'Descobrir','nav.calendar':'Calendário','nav.live':'TV ao vivo','nav.genres':'Gêneros','nav.signup':'Cadastrar','nav.signin':'Entrar','common.watch':'Assistir','common.watchNow':'Assistir','common.details':'Detalhes','common.add':'Adicionar','common.viewAll':'Ver tudo','common.home':'Início','footer.contact':'Contato','footer.privacy':'Privacidade','footer.terms':'Termos','footer.corporate':'Empresa','footer.discover':'Descobrir','contact.title':'Contato','contact.send':'Enviar','giris.soon':'Em breve','splash.skip':'Pular','splash.l1':'Conectando…','detail.cast':'Elenco' };
  DICT.nl = { 'nav.films':'Films','nav.series':'Series','nav.anime':'Anime','nav.discover':'Ontdekken','nav.calendar':'Agenda','nav.live':'Live TV','nav.genres':'Genres','nav.signup':'Registreren','nav.signin':'Inloggen','common.watch':'Kijken','common.details':'Details','common.viewAll':'Alles bekijken','common.home':'Start','footer.contact':'Contact','detail.cast':'Cast' };
  DICT.pl = { 'nav.films':'Filmy','nav.series':'Seriale','nav.anime':'Anime','nav.discover':'Odkrywaj','nav.calendar':'Kalendarz','nav.live':'TV na żywo','nav.genres':'Gatunki','nav.signup':'Zarejestruj','nav.signin':'Zaloguj','common.watch':'Oglądaj','common.details':'Szczegóły','common.viewAll':'Zobacz wszystko','common.home':'Start','footer.contact':'Kontakt','detail.cast':'Obsada' };
  DICT.sv = { 'nav.films':'Filmer','nav.series':'Serier','nav.anime':'Anime','nav.discover':'Upptäck','nav.calendar':'Kalender','nav.live':'Live-TV','nav.genres':'Genrer','nav.signup':'Registrera','nav.signin':'Logga in','common.watch':'Titta','common.details':'Detaljer','common.viewAll':'Visa alla','common.home':'Hem','footer.contact':'Kontakt','detail.cast':'Rollista' };
  DICT.no = { 'nav.films':'Filmer','nav.series':'Serier','nav.anime':'Anime','nav.discover':'Oppdag','nav.calendar':'Kalender','nav.live':'Direkte-TV','nav.genres':'Sjangre','nav.signup':'Registrer','nav.signin':'Logg inn','common.watch':'Se','common.details':'Detaljer','common.viewAll':'Vis alle','common.home':'Hjem','footer.contact':'Kontakt','detail.cast':'Rolleliste' };
  DICT.da = { 'nav.films':'Film','nav.series':'Serier','nav.anime':'Anime','nav.discover':'Opdag','nav.calendar':'Kalender','nav.live':'Live-TV','nav.genres':'Genrer','nav.signup':'Tilmeld','nav.signin':'Log ind','common.watch':'Se','common.details':'Detaljer','common.viewAll':'Se alle','common.home':'Hjem','footer.contact':'Kontakt','detail.cast':'Medvirkende' };
  DICT.fi = { 'nav.films':'Elokuvat','nav.series':'Sarjat','nav.anime':'Animet','nav.discover':'Löydä','nav.calendar':'Kalenteri','nav.live':'TV-lähetys','nav.genres':'Lajityypit','nav.signup':'Rekisteröidy','nav.signin':'Kirjaudu','common.watch':'Katso','common.details':'Tiedot','common.viewAll':'Näytä kaikki','common.home':'Etusivu','footer.contact':'Yhteys','detail.cast':'Näyttelijät' };
  DICT.ro = { 'nav.films':'Filme','nav.series':'Serii','nav.anime':'Anime','nav.discover':'Descoperă','nav.calendar':'Calendar','nav.live':'TV în direct','nav.genres':'Genuri','nav.signup':'Înregistrare','nav.signin':'Autentificare','common.watch':'Vezi','common.details':'Detalii','common.viewAll':'Vezi toate','common.home':'Acasă','footer.contact':'Contact','detail.cast':'Distribuție' };
  DICT.cs = { 'nav.films':'Filmy','nav.series':'Série','nav.anime':'Anime','nav.discover':'Objevit','nav.calendar':'Kalendář','nav.live':'Živé TV','nav.genres':'Žánry','nav.signup':'Registrace','nav.signin':'Přihlásit','common.watch':'Sledovat','common.details':'Detaily','common.viewAll':'Zobrazit vše','common.home':'Domů','footer.contact':'Kontakt','detail.cast':'Obsazení' };
  DICT.ru = { 'nav.films':'Фильмы','nav.series':'Сериалы','nav.anime':'Аниме','nav.discover':'Обзор','nav.calendar':'Календарь','nav.live':'ТВ онлайн','nav.genres':'Жанры','nav.signup':'Регистрация','nav.signin':'Войти','common.watch':'Смотреть','common.watchNow':'Смотреть','common.details':'Подробнее','common.add':'В список','common.viewAll':'Смотреть все','common.home':'Главная','footer.contact':'Контакты','footer.privacy':'Конфиденциальность','footer.terms':'Условия','footer.corporate':'Компания','footer.discover':'Обзор','contact.title':'Контакты','contact.send':'Отправить','giris.soon':'Скоро','detail.cast':'Актёры','splash.skip':'Пропустить' };
  DICT.uk = { 'nav.films':'Фільми','nav.series':'Серіали','nav.anime':'Аніме','nav.discover':'Огляд','nav.calendar':'Календар','nav.live':'ТБ онлайн','nav.genres':'Жанри','nav.signup':'Реєстрація','nav.signin':'Увійти','common.watch':'Дивитись','common.details':'Детальніше','common.viewAll':'Переглянути всі','common.home':'Головна','footer.contact':'Контакти','detail.cast':'Актори','splash.skip':'Пропустити' };
  DICT.az = { 'nav.films':'Filmlər','nav.series':'Seriallar','nav.anime':'Anime','nav.discover':'Kəşf et','nav.calendar':'Təqvim','nav.live':'Canlı TV','nav.genres':'Janrlar','nav.signup':'Qeydiyyat','nav.signin':'Daxil ol','common.watch':'Bax','common.watchNow':'İndi bax','common.details':'Detalları','common.add':'Siyasaya əlavə et','common.viewAll':'Hamısına bax','common.home':'Ana səhifə','footer.contact':'Əlaqə','detail.cast':'Aktyorlar','splash.skip':'Keç' };
  // Tür adları dil haritası (Türkçe kanonik -> dil). Eksikse TR adı kullanılır.
  const GENRE_I18N = {
    Aksiyon: { en: 'Action', de: 'Action', fr: 'Action', es: 'Acción', it: 'Azione', pt: 'Ação', ru: 'Боевик' },
    Animasyon: { en: 'Animation', de: 'Animation', fr: 'Animation', es: 'Animación', it: 'Animazione', pt: 'Animação', ru: 'Мультфильмы' },
    Komedi: { en: 'Comedy', de: 'Komödie', fr: 'Comédie', es: 'Comedia', it: 'Commedia', pt: 'Comédia', ru: 'Комедии' },
    Dram: { en: 'Drama', de: 'Drama', fr: 'Drame', es: 'Drama', it: 'Dramma', pt: 'Drama', ru: 'Драма' },
    Korku: { en: 'Horror', de: 'Horror', fr: 'Horreur', es: 'Terror', it: 'Horror', pt: 'Terror', ru: 'Ужасы' },
    'Bilim Kurgu': { en: 'Sci-Fi', de: 'Sci-Fi', fr: 'Science-fiction', es: 'Ciencia ficción', it: 'Fantascienza', pt: 'Ficção científica', ru: 'Фантастика' },
    Aile: { en: 'Family', de: 'Familie', fr: 'Famille', es: 'Familiar', it: 'Famiglia', pt: 'Família', ru: 'Семейное' },
    Belgesel: { en: 'Documentary', de: 'Doku', fr: 'Documentaire', es: 'Documental', it: 'Documentario', pt: 'Documentário', ru: 'Документальное' },
    Gerilim: { en: 'Thriller', de: 'Thriller', fr: 'Thriller', es: 'Thriller', it: 'Thriller', pt: 'Suspense', ru: 'Триллер' },
    Romantik: { en: 'Romance', de: 'Romanze', fr: 'Romance', es: 'Romance', it: 'Romantico', pt: 'Romance', ru: 'Мелодрама' },
    Suç: { en: 'Crime', de: 'Krimi', fr: 'Crime', es: 'Crimen', it: 'Crime', pt: 'Crime', ru: 'Криминал' },
    Fantastik: { en: 'Fantasy', de: 'Fantasy', fr: 'Fantastique', es: 'Fantasía', it: 'Fantasy', pt: 'Fantasia', ru: 'Фэнтези' },
    Macera: { en: 'Adventure', de: 'Abenteuer', fr: 'Aventure', es: 'Aventura', it: 'Avventura', pt: 'Aventura', ru: 'Приключения' },
    Savaş: { en: 'War', de: 'Krieg', fr: 'Guerre', es: 'Bélica', it: 'Guerra', pt: 'Guerra', ru: 'Военное' },
    Gizem: { en: 'Mystery', de: 'Mystery', fr: 'Mystère', es: 'Misterio', it: 'Mistero', pt: 'Mistério', ru: 'Детектив' },
    Tarih: { en: 'History', de: 'Geschichte', fr: 'Histoire', es: 'Historia', it: 'Storia', pt: 'História', ru: 'История' },
    Müzik: { en: 'Music', de: 'Musik', fr: 'Musique', es: 'Música', it: 'Musica', pt: 'Música', ru: 'Музыка' },
    Spor: { en: 'Sport', de: 'Sport', fr: 'Sport', es: 'Deporte', it: 'Sport', pt: 'Esporte', ru: 'Спорт' },
    'Vahşi Batı': { en: 'Western', de: 'Western', fr: 'Western', es: 'Western', it: 'Western', pt: 'Faroeste', ru: 'Вестерн' },
    'TV film': { en: 'TV Movie', de: 'TV-Film', fr: 'Téléfilm', es: 'Película TV', it: 'Film TV', pt: 'Filme TV', ru: 'Телефильм' }
  };
  // Kaynak tür adları karışık dilde gelebiliyor (İngilizce/Türkçe). Her yazımı kanonik Türkçe anahtara bağla.
  function normGenre(s) { return String(s || '').trim().toLowerCase().replace(/[-–—]/g, ' ').replace(/\s+/g, ' '); }
  const GENRE_ALIAS = {};
  Object.keys(GENRE_I18N).forEach(canonical => {
    GENRE_ALIAS[normGenre(canonical)] = canonical;
    const m = GENRE_I18N[canonical];
    Object.keys(m).forEach(code => { const a = normGenre(m[code]); if (!GENRE_ALIAS[a]) GENRE_ALIAS[a] = canonical; });
  });

  let lang = localStorage.getItem('nf_lang') || 'tr';
  if (!LANGS[lang]) lang = 'tr';
  function t(k) { const d = DICT[lang] || {}; return d[k] != null ? d[k] : (DICT.en[k] != null ? DICT.en[k] : (DICT.tr[k] != null ? DICT.tr[k] : k)); }
  function gName(genre) {
    const canonical = GENRE_ALIAS[normGenre(genre)] || genre;
    if (lang === 'tr') return canonical;
    const m = GENRE_I18N[canonical];
    return (m && (m[lang] || m.en)) || canonical;
  }
  // Ham tür adını kanonik Türkçe anahtara çevir (eşleştirme/gruplama için).
  function gCanon(name) { return GENRE_ALIAS[normGenre(name)] || name; }
  // Uygulamaya göre "film/series/anime" etiketleri.
  function kindLabel(k) { return k === 'dizi' ? t('common.series') : k === 'anime' ? t('common.anime') : t('common.film'); }

  // ========== LİSTE / KÜTÜPHANE (localStorage) ==========
  const FAV_KEY = 'nf_favs';
  function getFavs() { try { const a = JSON.parse(localStorage.getItem(FAV_KEY) || '[]'); return Array.isArray(a) ? a : []; } catch (e) { return []; } }
  function isFav(slug) { return getFavs().some(f => f.slug === slug); }
  function toggleFav(slug, kind, title) {
    const favs = getFavs(); const i = favs.findIndex(f => f.slug === slug); let added;
    if (i >= 0) { favs.splice(i, 1); added = false; } else { favs.unshift({ slug, kind, title: title || '', ts: Date.now() }); added = true; }
    localStorage.setItem(FAV_KEY, JSON.stringify(favs)); return added;
  }
  function favButtonHtml(slug, kind, title) {
    const on = isFav(slug);
    const cls = on ? 'border-accent/60 bg-accent/10 text-accent' : 'border-line text-content-secondary hover:text-white';
    const ico = on ? '<polyline points="20 6 9 17 4 12"/>' : '<path d="M12 5v14m-7-7h14"/>';
    return `<button data-fav="${esc(slug)}|${esc(kind)}|${esc(title || '')}" class="inline-flex min-h-[44px] items-center gap-2 rounded-pill border px-4 py-2.5 text-sm font-semibold transition ${cls}"><svg class="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">${ico}</svg><span>${esc(on ? t('common.added') : t('common.add'))}</span></button>`;
  }

  // Statik DOM'u ([data-i18n]) çevir; placeholder için [data-i18n-ph].
  function applyStatic () {
    document.querySelectorAll('[data-i18n]').forEach(el => { const v = t(el.getAttribute('data-i18n')); if (v != null) el.textContent = v; });
    document.querySelectorAll('[data-i18n-ph]').forEach(el => { el.setAttribute('placeholder', t(el.getAttribute('data-i18n-ph'))); });
    const lc = document.getElementById('langCode'); if (lc) lc.textContent = lang.toUpperCase();
    document.documentElement.setAttribute('lang', lang);
  }

  const normT = s => String(s || '').toLowerCase().replace(/ç/g,'c').replace(/ğ/g,'g').replace(/ı/g,'i').replace(/ö/g,'o').replace(/ş/g,'s').replace(/ü/g,'u').replace(/[^\p{L}\p{N}]+/gu, ' ').trim();

  // ========== TMDB (resmi ücretsiz API — detay + fragman) ==========
  const TMDB = (function () {
    const KEY = '21e3ff1da3bd38d1f167560193503c34';
    const IMG = (p, size) => p ? ('https://image.tmdb.org/t/p/' + (size || 'w500') + p) : '';
    const cache = {};
    const lcode = () => (LANGS[lang] && LANGS[lang].tmdb) || 'tr-TR';
    async function j(url) { try { const r = await fetch(url); return r.ok ? await r.json() : null; } catch (e) { return null; } }
    // Türkçe çeviri başlıkları TMDB'de farklı olabilir; eşleşme üstteki normT ile gevşetilir.
    function pickBest(results, want) {
      if (!results || !results.length) return null;
      const w = normT(want);
      let best = null, bs = 0;
      results.forEach(r => {
        [r.title, r.name, r.original_title, r.original_name].forEach(c => {
          if (!c) return; const n = normT(c);
          let sc = 0;
          if (n === w) sc = 1; else if (n.includes(w) || w.includes(n)) sc = 0.6 + Math.min(n.length, w.length) / Math.max(n.length, w.length) * 0.3;
          if (sc > bs) { bs = sc; best = r; }
        });
      });
      return best || results[0];
    }
    async function searchOne(k, q, y, language) {
      const d = await j(`https://api.themoviedb.org/3/search/${k}?query=${encodeURIComponent(q)}&include_adult=false${y ? ('&primary_release_year=' + y) : ''}&api_key=${KEY}&language=${language}`);
      return (d && d.results) || [];
    }
    async function find(kind, title, year) {
      const ck = 's|' + kind + '|' + title + '|' + year + '|' + lang; if (ck in cache) return cache[ck];
      const k = kind === 'dizi' ? 'tv' : 'movie';
      const lc = lcode();
      // Kademeli: yıl+dil → dil → en-US. İlk eşleşeni seç.
      let hit = pickBest(await searchOne(k, title, year, lc), title);
      if (!hit) hit = pickBest(await searchOne(k, title, '', lc), title);
      if (!hit) hit = pickBest(await searchOne(k, title, '', 'en-US'), title);
      cache[ck] = hit; return hit;
    }
    async function full(kind, id) {
      const ck = 'd|' + kind + '|' + id + '|' + lang; if (ck in cache) return cache[ck];
      const k = kind === 'dizi' ? 'tv' : 'movie';
      const d = await j(`https://api.themoviedb.org/3/${k}/${id}?append_to_response=videos,credits&api_key=${KEY}&language=${lcode()}`);
      // Mevcut dilde özet/kadro boşsa İngilizce'yi yedek olarak çek (hiç değilse bilgi gelsin).
      if (d && (!d.overview || !(d.cast || (d.credits && d.credits.cast) || []).length)) {
        const en = await j(`https://api.themoviedb.org/3/${k}/${id}?append_to_response=videos,credits&api_key=${KEY}&language=en-US`);
        if (en) { if (!d.overview) d.overview = en.overview; if (!(d.cast || (d.credits && d.credits.cast) || []).length && en.credits) d.credits = en.credits; }
      }
      cache[ck] = d; return d;
    }
    const trailerKey = d => { const v = (d && d.videos && d.videos.results) || []; return ((v.find(x => x.site === 'YouTube' && x.type === 'Trailer') || v.find(x => x.site === 'YouTube')) || {}).key || ''; };
    // Kırık/ölü poster hostları için: tek aramada TMDB poster + backdrop döndür (önbellekli).
    async function poster(kind, title, year) {
      const ck = 'p|' + kind + '|' + title + '|' + year; if (ck in cache) return cache[ck];
      const k = kind === 'dizi' ? 'tv' : 'movie';
      let hit = pickBest(await searchOne(k, title, year, 'en-US'), title);
      if (!hit) hit = pickBest(await searchOne(k, title, '', 'en-US'), title);
      const out = hit ? { poster: IMG(hit.poster_path, 'w500'), backdrop: IMG(hit.backdrop_path, 'w1280') } : null;
      cache[ck] = out; return out;
    }
    return { KEY, IMG, find, full, trailerKey, poster };
  })();


  // ========== VOD LAYER (gerçek m3u içeriği) ==========
  const V = (function () {
    if (!VOD) return null;
    const filmBySlug = new Map(VOD.films.map(f => [f.slug, f]));
    const seriesBySlug = new Map(VOD.series.map(s => [s.slug, s]));
    // clean a film display title: "TR - EN [tags] (year) - Dublaj" -> keep "TR - EN"
    const cleanTitle = t => (t || '').replace(/\s*\[[^\]]*\]/g, '').replace(/\s*\(\d{4}\)/, '').replace(/\s*-\s*(Dublaj|Altyaz[ıi]|Dublaj & Altyaz[ıi])\s*$/i, '').trim();
    const filmCard = f => ({ slug: f.slug, kind: 'film', title: cleanTitle(f.t) || f.t, year: f.y, img: f.img, genres: f.genres, rating: f.rating || '', desc: f.desc || '' });
    const seriesCard = s => ({ slug: s.slug, kind: s.anime ? 'anime' : 'dizi', title: s.name, year: s.y || '', img: s.img, genres: s.genres || [], rating: s.rating || '' });
    const animeSet = new Set(); // series whose name/genres suggest anime
    const isAnime = s => /anime|animasyon/i.test((s.name || '') + ' ' + Object.keys(s.seasons).join(' ')) || s.name;
    const rand = (arr, n) => arr.slice().sort(() => Math.random() - 0.5).slice(0, n);
    return { filmBySlug, seriesBySlug, cleanTitle, filmCard, seriesCard, rand,
      films: VOD.films, series: VOD.series, meta: VOD.meta };
  })();

  // ========== ROUTER ==========
  const routes = {};
  function navigate(hash) { location.hash = hash; }
  function currentRoute() { return location.hash.slice(1) || '/'; }
  function on(route, fn) { routes[route] = fn; }
  function resolve() {
    try {
      const path = currentRoute();
      const q = path.split('?')[0];
      // Exact-match static pages
      if (q === '/giris') { render(renderGiris()); return; }
      if (q === '/kayit') { render(renderKayit()); return; }
      if (q === '/kesfet') { render(renderKesfet()); return; }
      if (q === '/kutuphane') { render(renderKutuphane()); return; }
      if (q === '/kesfet-sihirbazi') { render(renderWizard()); return; }
      if (q === '/takvim') { render(renderTakvim()); return; }
      if (q === '/top250') { render(renderTop250()); return; }
      if (q === '/ara') { render(renderAra()); return; }
      if (q === '/trend') { render(renderTrend()); return; }
      if (q === '/koleksiyonlar') { render(renderCollections()); return; }
      if (q === '/premium') { render(renderPremium()); return; }
      if (q === '/iletisim') { render(renderIletisim()); return; }
      if (q === '/gizlilik') { render(renderLegal('privacy')); return; }
      if (q === '/kullanim') { render(renderLegal('terms')); return; }
      if (q === '/dmca') { render(renderLegal('dmca')); return; }
      // Try pattern match: /detay/:slug, /izle/:slug, /katalog/:tur
      const parts = q.split('/').filter(Boolean);
      if (parts[0] === 'detay' && parts[1]) { render(renderDetail(parts[1], parts[2] || 'film')); return; }
      if (parts[0] === 'izle' && parts[1]) { render(renderWatch(parts[1], parts[2] || 'film', parts[3], parts[4])); return; }
      if (parts[0] === 'katalog' && parts[1]) { render(renderCatalog(q.slice('/katalog/'.length))); return; }
      if (q === '/canli-tv') { render(renderCanliTv()); return; }
      // Default: home
      render(renderHome());
    } catch (err) {
      console.error('RESOLVE ERROR:', err && err.stack || err);
    }
  }
  window.addEventListener('hashchange', resolve);

  function render(html) {
    document.getElementById('app').innerHTML = html;
    bindEvents();
    resolvePosters();
    const q = currentRoute().split('?')[0].split('/').filter(Boolean);
    if (V && q[0] === 'detay' && q[1]) enrichDetail(q[1], q[2] || 'film');
    // Canlı TV açılış logosu (uzak sitenin kendi splash'ı) görünmesin: opak perdemiz ~2.2s sonra kalkar.
    const cover = document.getElementById('canliCover');
    if (cover) setTimeout(() => { cover.style.opacity = '0'; setTimeout(() => cover.remove(), 550); }, 2200);
    // Canlı TV'den ayrılırken native tam ekrandan çık.
    if (q[0] !== 'canli-tv' && _canliFs) { _canliFs = false; nativeFs(false); }
  }

  // ========== HOME PAGE ==========
  function renderHome() {
    if (V) return vodHome();
    const s = [];
    s.push(heroHtml());
    s.push(searchHtml());
    s.push('<div class="space-y-section py-section">');
    if (data.rails.trendDizi?.length) s.push(rankRail('Trend Diziler', data.rails.trendDizi, '/katalog/diziler'));
    if (data.rails.sonEkleDizi?.length) s.push(plainRail('Son Eklenen Diziler', data.rails.sonEkleDizi, '/katalog/diziler?sirala=yeni'));
    if (data.episodes.dizi?.length) s.push(episodeGrid('Son Eklenen Bölümler', data.episodes.dizi, 'grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4', '/katalog/diziler'));
    if (data.rails.trendFilm?.length) s.push(rankRail('Trend Filmler', data.rails.trendFilm, '/katalog/filmler'));
    if (data.grids.sonEkleFilm?.length) s.push(posterGrid('Son Eklenen Filmler', data.grids.sonEkleFilm, 'grid grid-cols-2 gap-x-4 gap-y-7 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6', '/katalog/filmler?sirala=yeni'));
    if (data.rails.trendAnime?.length) s.push(rankRail('Trend Animeler', data.rails.trendAnime, '/katalog/animes'));
    if (data.rails.sonEkleAnime?.length) s.push(plainRail('Son Eklenen Animeler', data.rails.sonEkleAnime, '/katalog/animes'));
    if (data.episodes.anime?.length) s.push(episodeGrid('Son Eklenen Anime Bölümleri', data.episodes.anime, 'grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4', '/katalog/animes'));
    s.push('</div>');
    return s.join('\n');
  }

  // ========== VOD HOME (gerçek içerikle ana sayfa) ==========
  function vodHome() {
    const films = V.films, series = V.series;
    // hero slides: 24+ karışık (film + dizi, Türkçe dahil, güncel)
    const pickFilms = films.filter(f => f.y).slice(0, 14);
    const pickSeries = series.slice(0, 10);
    data.hero.slides = [
      ...pickFilms.map(f => ({ title: V.cleanTitle(f.t), backdrop: f.backdrop || f.img, slug: f.slug, kind: 'Film', kindSlug: 'film', tags: [], year: f.y, genres: (f.genres || []).join(', '), rating: f.rating || '', desc: f.desc || '' })),
      ...pickSeries.map(s => ({ title: s.name, backdrop: s.backdrop || s.img, slug: s.slug, kind: 'Dizi', kindSlug: s.anime ? 'anime' : 'dizi', tags: [], year: s.y || '', genres: (s.genres || []).join(', '), rating: s.rating || '', desc: s.desc || '' }))
    ].slice(0, 24);
    const withRank = arr => arr.map((c, i) => Object.assign(c, { rank: i + 1 }));
    const recentEps = [];
    for (const s of series) {
      const sk = Object.keys(s.seasons).sort((a, b) => b - a)[0];
      const eps = s.seasons[sk] || [];
      if (!eps.length) continue;
      const ep = eps[eps.length - 1];
      recentEps.push({ img: s.img, title: s.name, season: sk + '. Sezon', ep: ep.e + '. Bölüm', ago: 'Yeni', slug: s.slug });
      if (recentEps.length >= 12) break;
    }
    const s = [];
    s.push(heroHtml());
    s.push(searchHtml());
    s.push('<div class="space-y-section py-section">');
    s.push(rankRail(t('rails.trendFilm'), withRank(V.rand(films, 10).map(V.filmCard)), '/katalog/filmler'));
    s.push(posterGrid(t('rails.recentFilm'), films.slice(0, 18).map(V.filmCard), 'grid grid-cols-2 gap-x-4 gap-y-7 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6', '/katalog/filmler?sirala=yeni'));
    s.push(rankRail(t('rails.trendSeries'), withRank(V.rand(series, 10).map(V.seriesCard)), '/katalog/diziler'));
    s.push(episodeGrid(t('rails.recentEp'), recentEps, 'grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4', '/katalog/diziler'));
    const animes = [...series.filter(x => x.anime).map(V.seriesCard), ...films.filter(f => (f.genres || []).some(g => /anim/i.test(g))).map(V.filmCard)].slice(0, 12);
    if (animes.length) s.push(plainRail(t('rails.anime'), animes, '/katalog/animes'));
    s.push('</div>');
    return s.join('\n');
  }

  // ========== HERO ==========
  function heroHtml() {
    const slides = data.hero.slides || [];
    if (!slides.length) return '';
    const dots = slides.map((_, i) => `<button class="h-1.5 w-6 rounded-pill transition-all ${i === 0 ? 'bg-white' : 'bg-white/30'}" data-slide="${i}"></button>`).join('');
    const slidesHtml = slides.map((s, i) => `
      <div class="slide absolute inset-0 ${i === 0 ? '' : 'hidden'}" data-idx="${i}">
        <div class="absolute inset-0 overflow-hidden">
          <img src="${esc(s.backdrop)}" alt="${esc(s.title)}" data-fb="${esc(s.title)}|${esc(s.year || '')}|${esc(s.kindSlug || 'film')}|backdrop" class="h-full w-full object-cover" style="object-position:${esc(s.objPos || '50% 50%')}">
          <div class="trailer-slot absolute inset-0 hidden overflow-hidden" data-q="${esc((s.title || '') + '|' + (s.year || '') + '|' + (s.kindSlug || 'film'))}"></div>
          <div class="absolute inset-0 bg-gradient-to-r from-bg-primary via-bg-primary/60 to-bg-primary/0"></div>
          <div class="absolute inset-0 bg-gradient-to-t from-bg-primary via-bg-primary/10 to-transparent"></div>
        </div>
        <div class="container-site relative flex h-full flex-col justify-end pb-14 sm:justify-center sm:pb-0">
          <div class="max-w-xl">
            <h1 class="text-display-sm font-display font-extrabold text-shadow-hero sm:text-display">${esc(s.title)}</h1>
            <div class="mt-4 flex flex-wrap items-center gap-x-3 gap-y-2 text-sm text-content-secondary">
              <span class="badge badge-${s.kindSlug === 'dizi' ? 'dizi' : s.kindSlug === 'anime' ? 'anime' : 'film'}">${esc(kindLabel(s.kindSlug))}</span>
              ${(s.tags || []).map(tt => `<span class="badge badge-soft">${esc(tt)}</span>`).join('')}
              <span class="badge badge-hd">${esc(t('common.hd'))}</span>
              ${s.rating ? `<span class="inline-flex items-center gap-1 font-semibold text-star">★ ${esc(s.rating)}</span>` : ''}
              ${s.year ? `<span>${esc(s.year)}</span>` : ''}
              ${s.genres ? `<span>·</span><span class="line-clamp-1">${esc(s.genres)}</span>` : ''}
            </div>
            ${s.desc ? `<p class="mt-4 line-clamp-2 max-w-lg text-sm text-content-secondary sm:line-clamp-3 sm:text-base">${esc(s.desc)}</p>` : ''}
            <div class="mt-7 flex flex-wrap items-center gap-3">
              <a href="#/izle/${esc(s.slug || 'uykucu')}/${esc(s.kindSlug || 'film')}" class="btn-accent"><svg class="h-4 w-4" viewBox="0 0 24 24" fill="currentColor"><path d="M8 5v14l11-7z"/></svg> ${esc(t('common.watch'))}</a>
              <a href="#/detay/${esc(s.slug || 'uykucu')}/${esc(s.kindSlug || 'film')}" class="btn-outline">${esc(t('common.details'))}</a>
            </div>
          </div>
        </div>
        ${trailerClusterHtml()}
      </div>`).join('');
    return `
      <section class="group/slider relative isolate overflow-hidden bg-bg-primary" role="region" aria-label="Öne çıkan film ve diziler" tabindex="0">
        <div class="relative h-[62svh] min-h-[380px] max-h-[660px] w-full">${slidesHtml}</div>
        <div class="absolute bottom-6 left-0 right-0 z-10 flex justify-center gap-2">${dots}</div>
        <button class="absolute left-4 top-1/2 z-20 flex h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full bg-black/70 text-white opacity-0 backdrop-blur transition hover:bg-accent group-hover/slider:opacity-100" data-nav="prev"><svg class="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="15 6 9 12 15 18"/></svg></button>
        <button class="absolute right-4 top-1/2 z-20 flex h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full bg-black/70 text-white opacity-0 backdrop-blur transition hover:bg-accent group-hover/slider:opacity-100" data-nav="next"><svg class="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="9 6 15 12 9 18"/></svg></button>
      </section>`;
  }

  // ========== SEARCH ==========
  function searchHtml() {
    return `<section class="border-b border-line bg-bg-secondary/30"><div class="container-site py-5"><div class="relative mx-auto max-w-xl"><form class="flex items-center gap-2 rounded-pill border border-line bg-bg-elevated/90 p-1.5 shadow-card" onsubmit="return false"><span class="pl-3 text-content-muted"><svg class="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="11" cy="11" r="7"/><path d="m20 20-3.5-3.5"/></svg></span><input type="search" name="q" placeholder="${esc(t('common.search'))}" class="w-full border-0 bg-transparent text-base text-white placeholder:text-content-muted focus:ring-0 sm:text-sm"><button type="submit" class="btn-accent btn-sm min-h-[44px] shrink-0 sm:min-h-0">${esc(t('nav.discover'))}</button></form></div></div></section>`;
  }

  // ========== POSTER CARD ==========
  function posterCard(item) {
    const badgeClass = item.kind === 'dizi' ? 'badge-dizi' : item.kind === 'anime' ? 'badge-anime' : 'badge-film';
    const badgeText = kindLabel(item.kind || 'film');
    const slug = item.slug || (item.href ? item.href.split('/').pop() : 'ornek');
    const kindSlug = item.kind || 'film';
    return `
      <a href="#/detay/${esc(slug)}/${esc(kindSlug)}" class="group block">
        <div class="relative aspect-[2/3] overflow-hidden rounded-card bg-bg-elevated tb-skeleton shadow-card transition duration-300 ease-smooth group-hover:shadow-poster">
          <img ${item.img ? `src="${esc(item.img)}"` : ''} alt="${esc(item.title)}" loading="lazy" decoding="async" data-fb="${esc(item.title)}|${esc(item.year || '')}|${esc(item.kind || 'film')}|poster" onload="this.parentElement.classList.remove('tb-skeleton')" class="absolute inset-0 h-full w-full object-cover transition duration-300 ease-smooth group-hover:scale-105">
          <div class="absolute inset-0 bg-gradient-to-t from-black/80 via-black/0 to-black/0 opacity-0 transition duration-300 group-hover:opacity-100"></div>
          <div class="absolute inset-0 flex items-center justify-center opacity-0 transition duration-300 group-hover:opacity-100"><span class="flex h-12 w-12 items-center justify-center rounded-full bg-accent/90 text-white shadow-lg"><svg class="h-5 w-5" viewBox="0 0 24 24" fill="currentColor"><path d="M8 5v14l11-7z"/></svg></span></div>
          <div class="absolute left-2 top-2 flex gap-1"><span class="badge ${badgeClass}">${esc(badgeText)}</span><span class="badge badge-hd hidden min-[400px]:inline-flex">HD</span></div>
          ${item.rating ? `<div class="absolute right-2 top-2"><span class="badge badge-rating">${esc(item.rating)}</span></div>` : ''}
        </div>
        <div class="mt-2.5 px-0.5"><h3 class="truncate text-sm font-semibold text-content-primary transition group-hover:text-accent">${esc(item.title)}</h3>${item.year ? `<p class="mt-0.5 text-xs text-content-muted">${esc(item.year)}</p>` : ''}</div>
      </a>`;
  }

  // ========== RANK RAIL ==========
  function rankRail(title, items, moreHref) {
    const track = items.map(it => `<div class="flex shrink-0 snap-start items-end"><span class="pointer-events-none -mr-5 select-none font-condensed text-[6rem] leading-[0.8] text-white/5 sm:-mr-7 sm:text-[9rem]" style="-webkit-text-stroke: 2px rgba(255,255,255,0.16);">${esc(it.rank)}</span><div class="w-32 sm:w-40">${posterCard(it)}</div></div>`).join('');
    return railShell(title, track, 'gap-2 pl-2', 'top-1/2 z-20', moreHref);
  }

  // ========== PLAIN RAIL ==========
  function plainRail(title, items, moreHref) {
    const track = items.map(it => `<div class="w-[42vw] max-w-44 shrink-0 snap-start sm:w-44 sm:max-w-none lg:w-48">${posterCard(it)}</div>`).join('');
    return railShell(title, track, 'gap-4', 'top-[38%] z-10', moreHref);
  }

  function railShell(title, track, trackCls, btnPos, moreHref) {
    return `<section class="container-site"><div class="mb-5 flex items-end justify-between gap-4"><h2 class="section-title">${esc(title)}</h2><a href="${moreHref ? '#' + moreHref : '#'}" class="link-accent shrink-0 py-3 -my-3 pl-3 -ml-3">${esc(t('common.viewAll'))}</a></div><div class="group/row relative"><button class="absolute -left-3 ${btnPos} hidden h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full bg-black/70 text-white opacity-0 backdrop-blur transition hover:bg-accent focus:opacity-100 group-hover/row:opacity-100 lg:flex" data-scroll="-1"><svg class="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="15 6 9 12 15 18"/></svg></button><div class="no-scrollbar flex snap-x snap-mandatory ${trackCls} overflow-x-auto scroll-smooth pb-2" data-track>${track}</div><button class="absolute -right-3 ${btnPos} hidden h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full bg-black/70 text-white opacity-0 backdrop-blur transition hover:bg-accent focus:opacity-100 group-hover/row:opacity-100 lg:flex" data-scroll="1"><svg class="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="9 6 15 12 9 18"/></svg></button></div></section>`;
  }

  // ========== POSTER GRID ==========
  function posterGrid(title, items, gridCls, moreHref) {
    return `<section class="container-site"><div class="mb-5 flex items-end justify-between gap-4"><h2 class="section-title">${esc(title)}</h2><a href="${moreHref ? '#' + moreHref : '#'}" class="link-accent shrink-0 py-3 -my-3 pl-3 -ml-3">${esc(t('common.viewAll'))}</a></div><div class="${gridCls}">${items.map(posterCard).join('')}</div></section>`;
  }

  // ========== EPISODE GRID ==========
  function episodeGrid(title, items, gridCls, moreHref) {
    const cards = items.map(it => {
      const slug = it.slug || (it.href ? it.href.split('/')[4] || 'dizi' : 'dizi');
      return `<a href="#/detay/${esc(slug)}/dizi" class="group block"><div class="relative aspect-video overflow-hidden rounded-card bg-bg-elevated shadow-card"><img src="${esc(it.img)}" alt="${esc(it.title)}" loading="lazy" class="absolute inset-0 h-full w-full object-cover transition duration-300 ease-smooth group-hover:scale-105"><div class="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent opacity-60 transition group-hover:opacity-90"></div><div class="absolute inset-0 flex items-center justify-center opacity-0 transition group-hover:opacity-100"><span class="flex h-11 w-11 items-center justify-center rounded-full bg-accent/90 text-white shadow-lg"><svg class="h-5 w-5" viewBox="0 0 24 24" fill="currentColor"><path d="M8 5v14l11-7z"/></svg></span></div><span class="badge badge-soft absolute left-2 top-2">${esc(it.season)}</span></div><div class="mt-2.5"><h3 class="truncate text-sm font-semibold text-content-primary transition group-hover:text-accent">${esc(it.title)}</h3><p class="mt-0.5 truncate text-xs text-content-secondary">${esc(it.ep)}</p><p class="mt-0.5 text-xs text-content-muted">${esc(it.ago)}</p></div></a>`;
    }).join('');
    return `<section class="container-site"><div class="mb-5 flex items-end justify-between gap-4"><h2 class="section-title">${esc(title)}</h2><a href="${moreHref ? '#' + moreHref : '#'}" class="link-accent shrink-0 py-3 -my-3 pl-3 -ml-3">${esc(t('common.viewAll'))}</a></div><div class="${gridCls}">${cards}</div></section>`;
  }

  // ========== DETAIL PAGE ==========
  function findItem(slug) {
    const all = [...(data.rails.trendDizi || []), ...(data.rails.sonEkleDizi || []), ...(data.rails.trendFilm || []), ...(data.rails.trendAnime || []), ...(data.rails.sonEkleAnime || []), ...(data.grids.sonEkleFilm || []), ...(data.episodes.dizi || []), ...(data.episodes.anime || [])];
    return all.find(it => { const s = it.href ? it.href.split('/').pop() : ''; return s === slug; }) || all[0];
  }

  function vodSeriesDetails(s) {
    const seasons = Object.keys(s.seasons).sort((a, b) => Number(a) - Number(b)).map(num => ({
      num,
      episodes: s.seasons[num].map(ep => ({ n: ep.e, title: V.cleanTitle(ep.t) || (s.name + ' — ' + num + '. Sezon ' + ep.e + '. Bölüm'), still: s.img }))
    }));
    return { seasonCount: seasons.length, seasons, cast: [] };
  }

  // Resolve the real stream for a slug (+ season/ep for series).
  function vodStream(slug, kind, season, ep) {
    if (!V) return null;
    const f = V.filmBySlug.get(slug);
    if (f) return { url: f.url, ref: f.ref, ua: f.ua, img: f.img, title: V.cleanTitle(f.t) || f.t, embed: f.embed, page: f.page || '' };
    const s = V.seriesBySlug.get(slug);
    if (s) {
      const sk = season || Object.keys(s.seasons).sort((a, b) => Number(a) - Number(b))[0];
      const list = s.seasons[sk] || [];
      const chosen = list.find(e => String(e.e) === String(ep)) || list[0];
      if (chosen) return { url: chosen.url, ref: chosen.ref, ua: chosen.ua, img: s.img, title: s.name + ' — ' + sk + '. Sezon ' + chosen.e + '. Bölüm', embed: chosen.embed, page: chosen.page || '' };
    }
    return null;
  }

  function renderDetail(slug, kind) {
    let item, details;
    if (V) {
      const f = V.filmBySlug.get(slug);
      const s = V.seriesBySlug.get(slug);
      if (f) { kind = 'film'; item = V.filmCard(f); details = null; }
      else if (s) { kind = s.anime ? 'anime' : 'dizi'; item = V.seriesCard(s); details = vodSeriesDetails(s); }
      else { item = V.filmCard(V.films[0]); kind = 'film'; details = null; }
    } else {
      item = findItem(slug);
      details = (data.details && data.details[slug]) || null;
    }
    if (!item) return '<div class="container-site py-20"><p class="text-content-muted">İçerik bulunamadı.</p></div>';
    const isSeries = kind === 'dizi' || kind === 'anime';
    const genres = (Array.isArray(item.genres) ? item.genres : String(item.genres || 'Aksiyon, Dram, Gerilim').split(',').map(g => g.trim())).filter(Boolean);
    const similarPool = kind === 'dizi' ? (data.rails.trendDizi || []) : kind === 'anime' ? (data.rails.trendAnime || []) : (data.rails.trendFilm || []);
    const similarTitle = kind === 'dizi' ? t('detail.similarSeries') : kind === 'anime' ? t('detail.similarAnime') : t('detail.similarFilm');
    let similar;
    if (V) {
      if (kind === 'dizi') similar = V.rand(V.series.filter(x => x.slug !== slug).map(V.seriesCard), 10);
      else {
        const gs = item.genres || [];
        similar = V.films.filter(f => f.slug !== slug && f.genres.some(g => gs.includes(g))).slice(0, 10).map(V.filmCard);
      }
    } else {
      similar = similarPool.filter(x => x !== item && (x.href || '').split('/').pop() !== slug).slice(0, 10);
    }
    return `
      <main class="min-h-[60vh] pb-[calc(4rem+env(safe-area-inset-bottom))] lg:pb-0">
        <section class="relative" data-trailer-host>
          <div class="absolute inset-0 h-[420px] overflow-hidden">
            <img src="${esc(item.img)}" alt="" class="h-full w-full object-cover" style="object-position:50% 30%; filter:blur(2px) brightness(0.4)">
            <div id="detail-bg-slot" class="trailer-slot absolute inset-0 hidden overflow-hidden"></div>
            <div class="absolute inset-0 bg-gradient-to-t from-bg-primary via-bg-primary/70 to-bg-primary/25"></div>
            <div class="absolute inset-0 bg-gradient-to-r from-bg-primary/90 via-bg-primary/40 to-transparent"></div>
          </div>
          ${trailerClusterHtml()}
          <div class="container-site relative pt-8 sm:pt-12">
            <nav class="mb-6 text-xs text-content-muted">
              <a href="#/" class="hover:text-white">${esc(t('common.home'))}</a><span class="px-1.5">/</span>
              <a href="#/katalog/${kind === 'dizi' ? 'diziler' : kind === 'anime' ? 'animes' : 'filmler'}" class="hover:text-white">${esc(kind === 'dizi' ? t('nav.series') : kind === 'anime' ? t('nav.anime') : t('nav.films'))}</a><span class="px-1.5">/</span>
              <span class="text-content-secondary">${esc(item.title)}</span>
            </nav>
            <div class="grid gap-8 md:grid-cols-[220px_1fr]">
              <div class="mx-auto w-44 md:mx-0 md:w-full">
                <div class="aspect-[2/3] overflow-hidden rounded-card-lg shadow-poster"><img src="${esc(item.img)}" alt="${esc(item.title)}" class="h-full w-full object-cover"></div>
              </div>
              <div>
                <h1 class="font-display text-display-sm font-bold tracking-tightest text-shadow-hero sm:text-display">${esc(item.title)}</h1>
                <div class="mt-3 flex flex-wrap gap-2">${genres.map(g => `<a href="#/katalog/tur/${encodeURIComponent(g)}" class="rounded-badge border border-accent/50 px-2.5 py-1 text-xs font-semibold text-accent transition hover:bg-accent/10">${esc(gName(g))}</a>`).join('')}</div>
                <div class="mt-5 flex flex-wrap items-center gap-2.5">
                  <button data-play="${esc(slug)}|${esc(kind)}" class="btn-accent"><svg class="h-4 w-4" viewBox="0 0 24 24" fill="currentColor"><path d="M8 5v14l11-7z"/></svg> ${isSeries && details && details.seasons && details.seasons[0] ? `S${details.seasons[0].num}.B${(details.seasons[0].episodes[0] || {}).n || 1} ${esc(t('common.watch'))}` : esc(t('common.watchNow'))}</button>
                  ${favButtonHtml(slug, kind, item.title)}
                </div>
                <div class="mt-6 flex flex-wrap gap-3">
                  <div class="rounded-card border border-line bg-bg-secondary/70 px-5 py-3"><p class="text-[11px] uppercase tracking-wide text-content-muted">${esc(t('detail.imdb'))}</p><p id="tmdb-rating" class="mt-0.5 flex items-center gap-1 font-display text-lg font-bold text-star">★ ${esc(item.rating || '—')}</p></div>
                  <div class="rounded-card border border-line bg-bg-secondary/70 px-5 py-3"><p class="text-[11px] uppercase tracking-wide text-content-muted">${esc(t('detail.year'))}</p><p id="tmdb-year" class="mt-0.5 font-display text-lg font-bold">${esc(item.year || '—')}</p></div>
                  <div class="rounded-card border border-line bg-bg-secondary/70 px-5 py-3"><p class="text-[11px] uppercase tracking-wide text-content-muted">${esc(t('detail.genre'))}</p><p class="mt-0.5 font-display text-lg font-bold">${esc(kindLabel(kind))}</p></div>
                  ${isSeries && details && details.seasonCount ? `<div class="rounded-card border border-line bg-bg-secondary/70 px-5 py-3"><p class="text-[11px] uppercase tracking-wide text-content-muted">${esc(t('detail.season'))}</p><p class="mt-0.5 font-display text-lg font-bold">${details.seasonCount}</p></div>` : ''}
                </div>
                <p id="tmdb-desc" class="mt-5 max-w-3xl leading-relaxed text-content-secondary">${esc(item.desc || '')}</p>
              </div>
            </div>
          </div>
        </section>
        ${isSeries ? seasonsSection(slug, details) : ''}
        ${isSeries ? castSection(details) : ''}
        ${similar.length ? similarSection(similarTitle, similar, kind) : ''}
      </main>`;
  }

  // ========== SEASONS + EPISODES ==========
  function seasonsSection(slug, details) {
    const seasons = (details && details.seasons) || [];
    if (!seasons.length) return '';
    const tabs = seasons.map((s, i) => {
      const active = i === 0;
      return `<a href="#" data-season="${s.num}" class="inline-flex min-h-[44px] items-center rounded-pill border px-4 py-2 text-sm font-semibold transition duration-200 ${active ? 'border-accent bg-accent text-white shadow-[0_8px_24px_-8px_rgba(229,9,20,0.6)]' : 'border-line bg-bg-elevated text-content-secondary hover:border-accent/50 hover:text-white'}">${s.num}. ${esc(t('detail.season'))}</a>`;
    }).join('');
    const panels = seasons.map((s, i) => {
      const cards = (s.episodes || []).map(ep => `
        <div class="group w-[62vw] max-w-[280px] shrink-0 snap-start sm:w-72">
          <a href="#" data-play="${esc(slug)}|dizi|${esc(s.num)}|${esc(ep.n)}" class="block">
            <div class="relative aspect-video overflow-hidden rounded-card bg-bg-elevated shadow-card transition duration-300 group-hover:shadow-poster">
              ${ep.still ? `<img src="${esc(ep.still)}" alt="${esc(ep.title)}" loading="lazy" class="h-full w-full object-cover transition duration-300 ease-smooth group-hover:scale-105">` : ''}
              <div class="absolute inset-0 flex items-center justify-center bg-black/30 opacity-0 transition group-hover:opacity-100"><svg class="h-8 w-8 text-white" viewBox="0 0 24 24" fill="currentColor"><path d="M8 5v14l11-7z"/></svg></div>
              <span class="absolute left-2 top-2 rounded-badge bg-black/70 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-white">${esc(t('detail.ep'))} ${ep.n}</span>
            </div>
            <p class="mt-2 truncate text-sm font-semibold text-content-primary group-hover:text-accent">${esc(ep.title)}</p>
            <p class="text-xs text-content-muted">${s.num}. ${esc(t('detail.season'))} ${ep.n}. ${esc(t('detail.ep'))}</p>
          </a>
        </div>`).join('');
      return `<div class="${i === 0 ? '' : 'hidden'}" data-season-view="${s.num}"><div class="group/row relative"><button class="absolute -left-3 top-1/2 z-20 hidden h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full bg-black/70 text-white opacity-0 backdrop-blur transition hover:bg-accent focus:opacity-100 group-hover/row:opacity-100 lg:flex" data-scroll="-1"><svg class="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="15 6 9 12 15 18"/></svg></button><div class="no-scrollbar flex snap-x snap-mandatory gap-4 overflow-x-auto scroll-smooth pb-2 pl-1" data-track>${cards}</div><button class="absolute -right-3 top-1/2 z-20 hidden h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full bg-black/70 text-white opacity-0 backdrop-blur transition hover:bg-accent focus:opacity-100 group-hover/row:opacity-100 lg:flex" data-scroll="1"><svg class="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="9 6 15 12 9 18"/></svg></button></div></div>`;
    }).join('');
    return `
      <section id="bolumler" class="container-site mt-10 scroll-mt-24">
        <h2 class="mb-4 flex items-center gap-2 section-title"><svg class="h-5 w-5 text-accent" viewBox="0 0 24 24" fill="currentColor"><path d="M5.566 4.657A4.505 4.505 0 0 1 6.75 4.5h10.5c.41 0 .806.055 1.183.157A3 3 0 0 0 15.75 3h-7.5a3 3 0 0 0-2.684 1.657ZM2.25 12a3 3 0 0 1 3-3h13.5a3 3 0 0 1 3 3v6a3 3 0 0 1-3 3H5.25a3 3 0 0 1-3-3v-6ZM5.25 7.5c-.41 0-.806.055-1.184.157A3 3 0 0 1 6.75 6h10.5a3 3 0 0 1 2.683 1.657A4.505 4.505 0 0 0 18.75 7.5H5.25Z"/></svg> ${esc(t('detail.episodes'))}</h2>
        <div class="mb-6 rounded-card-lg border border-line bg-bg-secondary p-3 sm:p-4">
          <p class="mb-2.5 flex items-center gap-1.5 text-xs font-bold uppercase tracking-widest text-content-muted">
            <svg class="h-4 w-4 text-accent" viewBox="0 0 24 24" fill="currentColor"><path d="M11.644 1.59a.75.75 0 0 1 .712 0l9.75 5.25a.75.75 0 0 1 0 1.32l-9.75 5.25a.75.75 0 0 1-.712 0l-9.75-5.25a.75.75 0 0 1 0-1.32l9.75-5.25Z"/><path d="m3.265 10.602 7.668 4.129a2.25 2.25 0 0 0 2.134 0l7.668-4.13 1.37.739a.75.75 0 0 1 0 1.32l-9.75 5.25a.75.75 0 0 1-.71 0l-9.75-5.25a.75.75 0 0 1 0-1.32l1.37-.738Z"/><path d="m10.933 19.231-7.668-4.13-1.37.739a.75.75 0 0 0 0 1.32l9.75 5.25c.221.12.489.12.71 0l9.75-5.25a.75.75 0 0 0 0-1.32l-1.37-.738-7.668 4.13a2.25 2.25 0 0 1-2.134-.001Z"/></svg>
            ${esc(t('detail.seasonSelect'))}
          </p>
          <div class="flex flex-wrap gap-2" data-season-tabs>${tabs}</div>
        </div>
        ${panels}
      </section>`;
  }

  // ========== CAST ==========
  function castSection(details) {
    const cast = (details && details.cast) || [];
    if (!cast.length) return '';
    const cards = cast.map(c => `
      <a href="#" class="group flex flex-col items-center rounded-card-lg text-center focus:outline-none focus-visible:ring-2 focus-visible:ring-accent/60 focus-visible:ring-offset-2 focus-visible:ring-offset-bg-primary">
        <div class="h-20 w-20 overflow-hidden rounded-full border-2 border-line bg-bg-elevated transition group-hover:border-accent sm:h-24 sm:w-24">
          ${c.photo ? `<img src="${esc(c.photo)}" alt="${esc(c.name)}" width="185" height="185" loading="lazy" decoding="async" class="h-full w-full object-cover transition duration-300 group-hover:scale-105">` : ''}
        </div>
        <p class="mt-2.5 w-full truncate text-[13px] font-semibold leading-4 text-content-primary group-hover:text-accent" title="${esc(c.name)}">${esc(c.name)}</p>
        ${c.role ? `<p class="w-full truncate text-[11px] leading-4 text-content-muted" title="${esc(c.role)}">${esc(c.role)}</p>` : ''}
      </a>`).join('');
    return `
      <section id="oyuncular" class="container-site mt-12">
        <h2 class="mb-4 flex items-center gap-2 section-title">
          <svg class="h-5 w-5 text-accent" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6"><path stroke-linecap="round" stroke-linejoin="round" d="M15 19.128a9.38 9.38 0 0 0 2.641.372 9.337 9.337 0 0 0 4.184-.997 9.346 9.346 0 0 1-6.825-8.33v-1.665a3.75 3.75 0 1 0-7.5 0v1.665A9.346 9.346 0 0 1 1 18.5c0 .823.096 1.626.277 2.397M15 19.128a9.38 9.38 0 0 1-2.625.372c-1.949 0-3.75-.68-5.161-1.815M18.086 9.352a2.911 2.911 0 1 0 0-5.822 2.911 2.911 0 0 0 0 5.822Z"/></svg>
          ${esc(t('detail.cast'))}
          <span class="badge badge-soft">${cast.length}</span>
        </h2>
        <div class="relative">
          <div class="grid grid-cols-3 auto-rows-[8rem] gap-4 sm:grid-cols-5 sm:auto-rows-[9rem] md:grid-cols-6 xl:grid-cols-9">
            ${cards}
          </div>
        </div>
      </section>`;
  }

  // ========== SIMILAR ==========
  function similarSection(title, items, kind) {
    const track = items.map(it => `<div class="w-[42vw] max-w-44 shrink-0 snap-start sm:w-44 sm:max-w-none lg:w-48">${posterCard(it)}</div>`).join('');
    const cat = kind === 'dizi' ? 'diziler' : kind === 'anime' ? 'animes' : 'filmler';
    return `<section id="benzer-rail" class="container-site mt-12"><div class="mb-5 flex items-end justify-between gap-4"><h2 class="section-title">${esc(title)}</h2><a href="#/katalog/${cat}" class="link-accent shrink-0 py-3 -my-3 pl-3 -ml-3">${esc(t('common.viewAll'))}</a></div><div class="group/row relative"><button class="absolute -left-3 top-[38%] z-10 hidden h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full bg-black/70 text-white opacity-0 backdrop-blur transition hover:bg-accent focus:opacity-100 group-hover/row:opacity-100 lg:flex" data-scroll="-1"><svg class="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="15 6 9 12 15 18"/></svg></button><div class="no-scrollbar flex snap-x snap-mandatory gap-4 overflow-x-auto scroll-smooth pb-2" data-track>${track}</div><button class="absolute -right-3 top-[38%] z-10 hidden h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full bg-black/70 text-white opacity-0 backdrop-blur transition hover:bg-accent focus:opacity-100 group-hover/row:opacity-100 lg:flex" data-scroll="1"><svg class="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="9 6 15 12 9 18"/></svg></button></div></section>`;
  }

  // ========== WATCH (PLAYER) PAGE ==========
  function renderWatch(slug, kind, season, ep) {
    if (V) return vodWatch(slug, kind, season, ep);
    const item = findItem(slug);
    if (!item) return '<div class="container-site py-20"><p class="text-content-muted">İçerik bulunamadı.</p></div>';
    return renderWatchShell(item, slug, kind, null);
  }

  function vodWatch(slug, kind, season, ep) {
    const stream = vodStream(slug, kind, season, ep);
    if (!stream) return '<div class="container-site py-20"><p class="text-content-muted">Bu içerik için kaynak bulunamadı.</p></div>';
    setTimeout(() => openPlayer(slug, kind, season, ep), 50);
    const item = { title: stream.title, img: stream.img, year: '' };
    return renderWatchShell(item, slug, kind, stream);
  }

  function renderWatchShell(item, slug, kind, stream) {
    const playerInner = stream
      ? (stream.embed
        ? `<iframe src="${esc(stream.url)}" class="absolute inset-0 h-full w-full border-0 bg-black" allow="autoplay; fullscreen; encrypted-media; picture-in-picture" allowfullscreen></iframe>`
        : `<video id="player" data-hls="${esc(stream.url)}" data-ref="${esc(stream.ref || '')}" data-ua="${esc(stream.ua || '')}" poster="${esc(stream.img)}" controls autoplay playsinline class="absolute inset-0 h-full w-full bg-black"></video>`)
      : `<div class="absolute inset-0 flex items-center justify-center"><div class="text-center"><div class="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-accent/20 ring-2 ring-accent/40"><svg class="h-8 w-8 text-accent" viewBox="0 0 24 24" fill="currentColor"><path d="M8 5v14l11-7z"/></svg></div><p class="mt-3 text-sm text-content-muted">Oynatıcı bağlanmayı bekliyor…</p></div></div>`;
    return `
      <main class="min-h-[60vh] pb-[calc(4rem+env(safe-area-inset-bottom))] lg:pb-0">
        <div class="container-site py-8">
          <nav class="mb-5 text-xs text-content-muted">
            <a href="#/" class="inline-block py-2 hover:text-white">${esc(t('common.home'))}</a><span class="px-1.5">/</span>
            <a href="#/katalog/${kind === 'dizi' ? 'diziler' : kind === 'anime' ? 'animes' : 'filmler'}" class="inline-block py-2 hover:text-white">${esc(kind === 'dizi' ? t('nav.series') : kind === 'anime' ? t('nav.anime') : t('nav.films'))}</a><span class="px-1.5">/</span>
            <a href="#/detay/${esc(slug)}/${esc(kind)}" class="inline-block py-2 hover:text-white">${esc(item.title)}</a><span class="px-1.5">/</span>
            <span class="text-content-secondary">${esc(t('common.watch2'))}</span>
          </nav>
          <div class="mx-auto max-w-5xl">
            <h1 class="mb-4 font-display text-xl font-bold tracking-tightest sm:text-2xl">${esc(item.title)} — ${esc(t('common.watch'))}</h1>
            <div class="tb-shell">
              <div class="tb-slot relative aspect-video w-full">
                <div class="tb-box overflow-hidden rounded-card-lg border border-line bg-black">${playerInner}</div>
              </div>
              <div class="relative mt-3 flex flex-wrap items-center gap-2">
                <button class="btn-sm rounded-pill border border-line px-3 py-2.5 text-[13px] text-content-secondary transition hover:border-white/25 hover:text-white" title="${esc(t('common.theater'))}"><svg class="mr-1 inline h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="2" y="4" width="20" height="14" rx="2"/></svg> ${esc(t('common.theater'))}</button>
                ${stream ? `<span class="ml-auto truncate rounded-pill border border-line px-3 py-2.5 text-[11px] text-content-muted" title="${esc(stream.url)}">${esc(t('common.source'))}: ${esc(stream.url)}</span>` : ''}
              </div>
            </div>
            <div class="mt-6 flex flex-wrap items-center justify-between gap-4 rounded-card-lg border border-line bg-bg-secondary p-5">
              <div class="flex items-center gap-4">
                <div class="hidden h-20 w-14 shrink-0 overflow-hidden rounded-card sm:block"><img src="${esc(item.img)}" alt="${esc(item.title)}" class="h-full w-full object-cover"></div>
                <div><h2 class="font-semibold text-content-primary">${esc(item.title)}</h2><p class="text-sm text-content-muted">${esc(item.year || '')} • ${esc(kindLabel(kind))}</p></div>
              </div>
              <a href="#/detay/${esc(slug)}/${esc(kind)}" class="btn-outline btn-sm">${esc(t('common.back'))} <svg class="ml-1 inline h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="9 6 15 12 9 18"/></svg></a>
            </div>
          </div>
        </div>
      </main>`;
  }

  // ========== CATALOG PAGE ==========
  function vodCatalogList(tur) {
    const route = currentRoute();
    const page = Number((new URLSearchParams(location.hash.split('?')[1] || '').get('sayfa')) || 1);
    const PER = 60;
    let items = [], title = t('common.all');
    if (tur.startsWith('filmler')) { items = V.films.map(V.filmCard); title = t('nav.films'); }
    else if (tur.startsWith('diziler')) { items = V.series.map(V.seriesCard); title = t('nav.series'); }
    else if (tur.startsWith('animes')) { items = [...V.series.filter(s => s.anime).map(V.seriesCard), ...V.films.filter(f => (f.genres || []).some(g => /anim/i.test(g))).map(V.filmCard)]; title = t('nav.anime'); }
    else if (tur.startsWith('canli')) { items = V.series.slice(0, 60).map(V.seriesCard); title = t('nav.live'); }
    else if (tur.startsWith('platform/')) {
      const slug = decodeURIComponent(tur.split('/')[1] || '');
      items = V.films.filter(f => f.platforms.some(p => p.toLowerCase() === slug.toLowerCase())).map(V.filmCard);
      title = slug.charAt(0).toUpperCase() + slug.slice(1);
    } else if (tur.startsWith('tur/')) {
      const name = decodeURIComponent(tur.split('/')[1] || '');
      const canon = gCanon(name);
      items = V.films.filter(f => f.genres.some(g => gCanon(g) === canon)).map(V.filmCard);
      title = gName(name);
    } else { items = [...V.films.map(V.filmCard), ...V.series.map(V.seriesCard)]; title = t('common.all'); }
    const total = items.length;
    const slice = items.slice((page - 1) * PER, page * PER);
    const pages = Math.ceil(total / PER);
    const more = page < pages
      ? `<div class="mt-10 text-center"><a href="#/katalog/${tur}?sayfa=${page + 1}" class="btn-outline btn-sm">${esc(t('catalog.loadMore'))} (${total - page * PER})</a></div>`
      : `<div class="mt-10 text-center text-sm text-content-muted">${total} ${esc(t('catalog.count'))}.</div>`;
    return `
      <main class="min-h-[60vh] pb-section">
        <div class="container-site pt-8">
          <nav class="mb-6 text-xs text-content-muted"><a href="#/" class="hover:text-white">${esc(t('common.home'))}</a><span class="px-1.5">/</span><span class="text-content-secondary">${esc(title)}</span></nav>
          <h1 class="section-title mb-2">${esc(title)}</h1>
          <p class="mb-6 text-sm text-content-muted">${total} ${esc(t('catalog.count'))} • ${esc(t('catalog.page'))} ${page}/${Math.max(pages, 1)}</p>
          <div class="grid grid-cols-2 gap-x-4 gap-y-7 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6">
            ${slice.map(posterCard).join('') || `<p class="text-content-muted">${esc(t('catalog.none'))}</p>`}
          </div>
          ${more}
        </div>
      </main>`;
  }

  function renderCatalog(tur) {
    if (V) return vodCatalogList(tur);
    let items = [];
    let title = '';
    if (tur.startsWith('filmler')) { items = data.grids.sonEkleFilm || []; title = 'Filmler'; }
    else if (tur.startsWith('diziler')) { items = data.rails.sonEkleDizi || []; title = 'Diziler'; }
    else if (tur.startsWith('animes')) { items = data.rails.sonEkleAnime || []; title = 'Animeler'; }
    else if (tur.startsWith('canli')) { items = [...(data.rails.trendDizi || [])].slice(0, 12); title = 'Canlı Diziler (7/24)'; }
    else if (tur.startsWith('platform/')) {
      const slug = tur.split('/')[1];
      const plat = (data.platforms || []).find(p => p.slug === slug);
      title = plat ? plat.name : 'Platform';
      items = [...(data.rails.trendFilm || []), ...(data.rails.trendDizi || [])].slice(0, 12);
    }
    else if (tur.startsWith('tur/')) { const slug = tur.split('/')[1]; const g = (data.genres || []).find(x => x.slug === slug); title = g ? g.name : decodeURIComponent(slug); items = [...(data.rails.trendFilm || []), ...(data.rails.trendDizi || [])].slice(0, 12); }
    else { items = [...(data.rails.trendFilm || []), ...(data.rails.trendDizi || []), ...(data.rails.trendAnime || [])]; title = 'Tüm İçerikler'; }
    return `
      <main class="min-h-[60vh] pb-section">
        <div class="container-site pt-8">
          <nav class="mb-6 text-xs text-content-muted"><a href="#/" class="hover:text-white">Ana Sayfa</a><span class="px-1.5">/</span><span class="text-content-secondary">${esc(title)}</span></nav>
          <h1 class="section-title mb-8">${esc(title)}</h1>
          <div class="grid grid-cols-2 gap-x-4 gap-y-7 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6">
            ${items.map(posterCard).join('')}
          </div>
        </div>
      </main>`;
  }

  // ========== CANLI TV (kanallara özel iframe) ==========
  let _canliFs = false;
  function renderCanliTv() {
    const SRC = 'http://131.123.43.89/#/channels';
    // Uzak sitenin daraltılmış sol rail genişliği = --rail-w (64 + 2*14 = 92px). Sadece bu kadar kaydır: içerik 92px'te başlar, kesilmez.
    const NAV_W = Number(localStorage.getItem('canliNavW') || 92);
    return `
      <style>
        #canliBox.canli-full{position:fixed!important;inset:0!important;height:100vh!important;width:100vw!important;z-index:2147483000!important;border:0!important;border-radius:0!important}
        #canliBox.canli-full iframe{left:-${NAV_W}px!important;width:calc(100vw + ${NAV_W}px)!important}
      </style>
      <main class="min-h-[60vh]">
        <div class="px-4 pt-6 sm:px-6">
          <div class="mb-3 flex flex-wrap items-end justify-between gap-3">
            <div>
              <nav class="mb-1 text-xs text-content-muted"><a href="#/" class="hover:text-white">${esc(t('common.home'))}</a><span class="px-1.5">/</span><span class="text-content-secondary">${esc(t('live.title'))}</span></nav>
              <h1 class="section-title mb-1">${esc(t('live.title'))}</h1>
              <p class="max-w-2xl text-sm text-content-secondary">${esc(t('live.sub'))}</p>
            </div>
            <button data-canli-full class="inline-flex items-center gap-2 rounded-pill border border-white/10 bg-black px-4 py-2 text-sm font-semibold text-content-secondary transition hover:border-accent/50 hover:text-white">
              <svg class="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M8 3H5a2 2 0 0 0-2 2v3m18 0V5a2 2 0 0 0-2-2h-3M3 16v3a2 2 0 0 0 2 2h3m8 0h3a2 2 0 0 0 2-2v-3"/></svg>
              <span>${esc(t('live.fullscreen'))}</span>
            </button>
          </div>
          <div id="canliBox" class="relative overflow-hidden rounded-card-lg border border-white/10 bg-black" style="height:calc(100vh - 224px)">
            <iframe id="canliFrame" src="${SRC}" title="${esc(t('live.title'))}" style="position:absolute;top:0;left:-${NAV_W}px;width:calc(100% + ${NAV_W}px);height:100%;border:0;background:#000;filter:saturate(.45) brightness(.8) contrast(1.15)" allow="autoplay; fullscreen; encrypted-media; picture-in-picture" referrerpolicy="no-referrer"></iframe>
            <div id="canliCover" style="position:absolute;inset:0;z-index:10;background:#000;display:flex;align-items:center;justify-content:center;transition:opacity .5s">
              <div class="font-display text-2xl font-extrabold tracking-tightest" style="color:#e50914">NOTFLİX</div>
            </div>
          </div>
        </div>
      </main>`;
  }

  // ========== AUTH PAGES (filmmodu şablonu — Supabase senkron öncesi hazır) ==========
  function authShell(kicker, title, formHtml, footHtml) {
    return `
      <main class="flex min-h-[calc(100vh-11rem)] items-center justify-center px-4 py-12">
        <div class="w-full max-w-md rounded-card-lg border border-line bg-bg-secondary p-6 shadow-card sm:p-8">
          <div class="mb-6 text-center">
            <p class="text-xs font-bold uppercase tracking-widest text-accent">${kicker}</p>
            <h1 class="mt-1 font-display text-2xl font-extrabold tracking-tightest">${title}</h1>
          </div>
          ${formHtml}
          ${footHtml}
        </div>
      </main>`;
  }

  function renderGiris() {
    // Kimlik doğrulama henüz bağlı değil: "yakında aktif olacak" durumu gösterilir.
    return `
      <main class="flex min-h-[calc(100vh-11rem)] items-center justify-center px-4 py-12">
        <div class="w-full max-w-md rounded-card-lg border border-line bg-bg-secondary p-8 text-center shadow-card">
          <div class="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-full bg-accent/15 ring-1 ring-inset ring-accent/30">
            <svg class="h-8 w-8 text-accent" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><circle cx="12" cy="8" r="4"/><path d="M4 21c0-4.4 3.6-8 8-8s8 3.6 8 8"/></svg>
          </div>
          <h1 class="font-display text-2xl font-extrabold tracking-tightest">${esc(t('giris.soon'))}</h1>
          <p class="mt-3 text-sm leading-relaxed text-content-secondary">${esc(t('giris.soonDesc'))}</p>
          <a href="#/" class="btn-accent mt-6 inline-flex w-full justify-center">${esc(t('giris.back'))}</a>
        </div>
      </main>`;
  }

  function renderKayit() {
    const form = `
      <form class="space-y-4" onsubmit="return false" autocomplete="on">
        <div>
          <label for="name" class="block text-sm font-semibold text-content-secondary">Ad Soyad</label>
          <input id="name" name="name" type="text" required placeholder="Adın Soyadın" autocomplete="name" class="field mt-1.5">
        </div>
        <div>
          <label for="email" class="block text-sm font-semibold text-content-secondary">E-posta</label>
          <input id="email" name="email" type="email" required placeholder="ornek@site.com" autocomplete="email" class="field mt-1.5">
        </div>
        <div>
          <label for="password" class="block text-sm font-semibold text-content-secondary">Şifre</label>
          <input id="password" name="password" type="password" required minlength="8" autocomplete="new-password" class="field mt-1.5">
          <p class="mt-1 text-[11px] text-content-muted">En az 8 karakter; bir harf ve bir rakam içermeli.</p>
        </div>
        <div>
          <label for="password_confirmation" class="block text-sm font-semibold text-content-secondary">Şifre (Tekrar)</label>
          <input id="password_confirmation" name="password_confirmation" type="password" required autocomplete="new-password" class="field mt-1.5">
        </div>
        <div>
          <label for="captcha" class="block text-sm font-semibold text-content-secondary">Güvenlik sorusu: 3 + 4 = ?</label>
          <input id="captcha" name="captcha" type="text" inputmode="numeric" required placeholder="Cevabı yaz" class="field mt-1.5">
        </div>
        <label class="flex cursor-pointer items-start gap-2 text-sm text-content-secondary">
          <input type="checkbox" name="terms" required class="mt-0.5 h-4 w-4 rounded border-line bg-bg-elevated text-accent focus:ring-accent/40">
          <span><a href="#" class="font-semibold text-accent hover:text-accent-hover">Kullanım Koşulları</a> ve <a href="#" class="font-semibold text-accent hover:text-accent-hover">Gizlilik Politikası</a>'nı okudum, kabul ediyorum.</span>
        </label>
        <button type="submit" class="btn-accent w-full justify-center">Hesap Oluştur</button>
      </form>`;
    const foot = `
      <p class="mt-6 text-center text-sm text-content-secondary">
        Zaten hesabın var mı? <a href="#/giris" class="font-semibold text-accent hover:text-accent-hover">Giriş Yap</a>
      </p>
      <p class="mt-4 text-center text-[11px] leading-relaxed text-content-muted">Bu form şablondur. Supabase'e bağlandığında şifre karakter sınırları ve güvenlik sorusu kuralları filmmodu ile birebir aynı olacaktır.</p>`;
    return authShell('Aramıza katıl', 'Kayıt Ol', form, foot);
  }

  // ========== KEŞFET (browsable şablon — gerçek site düzeni) ==========
  // VOD içeriğindeki gerçek türler (ad + adet), azalan sırada.
  function vodGenres() {
    if (!V) return [];
    const m = new Map();
    for (const f of V.films) for (const g of (f.genres || [])) { const k = (g || '').trim(); if (!k) continue; const c = gCanon(k); m.set(c, (m.get(c) || 0) + 1); }
    return [...m.entries()].filter(([g, n]) => n >= 3).sort((a, b) => b[1] - a[1]).map(([name, count]) => ({ name, count }));
  }

  function renderKesfet() {
    const genres = vodGenres();
    const genreTiles = genres.map(g => `
      <a href="#/katalog/tur/${encodeURIComponent(g.name)}" class="group flex items-center justify-between gap-3 rounded-card-lg border border-line bg-bg-secondary p-4 transition hover:border-accent/50 hover:bg-bg-elevated">
        <span class="flex items-center gap-3">
          <span class="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-accent/10 text-accent ring-1 ring-inset ring-accent/20 transition group-hover:bg-accent group-hover:text-white">
            <svg viewBox="0 0 24 24" class="h-5 w-5" fill="currentColor"><path d="M4 5h16v3H4zM4 10h16v3H4zM4 15h10v3H4z"/></svg>
          </span>
          <span class="truncate text-sm font-semibold text-content-primary">${esc(gName(g.name))}</span>
        </span>
        <span class="shrink-0 rounded-full bg-white/[0.06] px-2 py-0.5 text-[10px] font-semibold text-content-muted">${g.count}</span>
      </a>`).join('');
    const trendFilms = V ? V.rand(V.films, 10).map(V.filmCard) : [];
    const trendSeries = V ? V.rand(V.series, 10).map(V.seriesCard) : [];
    return `
      <main class="min-h-[60vh] pb-section">
        <div class="container-site pt-8">
          <nav class="mb-6 text-xs text-content-muted"><a href="#/" class="hover:text-white">${esc(t('common.home'))}</a><span class="px-1.5">/</span><span class="text-content-secondary">${esc(t('nav.discover'))}</span></nav>
          <h1 class="section-title mb-2">${esc(t('nav.discover'))}</h1>
          <p class="mb-8 max-w-2xl text-sm text-content-secondary">${esc(t('wizard.sub'))}</p>

          <h2 class="mb-4 section-title">${esc(t('discover.byGenre'))}</h2>
          <div class="mb-12 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">${genreTiles || `<p class="text-content-muted">${esc(t('catalog.none'))}</p>`}</div>

          ${trendFilms.length ? `<div class="mb-10">${rankRail(t('rails.trendFilm'), trendFilms.map((c, i) => Object.assign(c, { rank: i + 1 })), '/katalog/filmler')}</div>` : ''}
          ${trendSeries.length ? rankRail(t('rails.trendSeries'), trendSeries.map((c, i) => Object.assign(c, { rank: i + 1 })), '/katalog/diziler') : ''}
        </div>
      </main>`;
  }

  // ========== KEŞFET SİHİRBAZI (ruh haline göre öneri) ==========
  const MOODS = [
    { key: 'aksiyon', genre: 'Aksiyon' }, { key: 'komedi', genre: 'Komedi' },
    { key: 'korku', genre: 'Korku' }, { key: 'ask', genre: 'Romantik' },
    { key: 'dusun', genre: 'Dram' }, { key: 'bilim', genre: 'Bilim Kurgu' },
    { key: 'animasyon', genre: 'Animasyon' }, { key: 'gerilim', genre: 'Gerilim' }
  ];
  function renderWizard() {
    const chips = MOODS.map(m => `<button data-mood="${esc(m.genre)}" class="rounded-pill border border-line bg-bg-elevated px-4 py-2 text-sm font-semibold text-content-secondary transition hover:border-accent/50 hover:text-white">${esc(gName(m.genre))}</button>`).join('');
    return `
      <main class="min-h-[60vh] pb-section">
        <div class="container-site pt-8">
          <nav class="mb-6 text-xs text-content-muted"><a href="#/" class="hover:text-white">${esc(t('common.home'))}</a><span class="px-1.5">/</span><span class="text-content-secondary">${esc(t('wizard.title'))}</span></nav>
          <h1 class="section-title mb-2">${esc(t('wizard.title'))}</h1>
          <p class="mb-8 max-w-2xl text-sm text-content-secondary">${esc(t('wizard.sub'))}</p>
          <div class="mb-10 flex flex-wrap gap-2" data-mood-chips>${chips}</div>
          <div id="wizardResult"></div>
        </div>
      </main>`;
  }

  // ========== TREND / KOLEKSİYONLAR / PREMIUM ==========
  function renderTrend() {
    const films = V ? V.films.slice(0, 24).map(V.filmCard) : [];
    const series = V ? V.series.slice(0, 18).map(V.seriesCard) : [];
    return `<main class="min-h-[60vh] pb-section"><div class="container-site pt-8">
      <nav class="mb-6 text-xs text-content-muted"><a href="#/" class="hover:text-white">${esc(t('common.home'))}</a><span class="px-1.5">/</span><span class="text-content-secondary">${esc(t('trend.title'))}</span></nav>
      <h1 class="section-title mb-8">${esc(t('trend.title'))}</h1>
      ${films.length ? `<div class="mb-10">${posterGrid(t('rails.trendFilm'), films, 'grid grid-cols-2 gap-x-4 gap-y-7 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6', '/katalog/filmler')}</div>` : ''}
      ${series.length ? posterGrid(t('rails.trendSeries'), series, 'grid grid-cols-2 gap-x-4 gap-y-7 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6', '/katalog/diziler') : ''}
    </div></main>`;
  }

  function renderCollections() {
    const genres = vodGenres().slice(0, 8);
    const tiles = genres.map(g => `
      <a href="#/katalog/tur/${encodeURIComponent(g.name)}" class="group relative block overflow-hidden rounded-card-lg border border-line">
        <div class="aspect-[16/9] w-full bg-bg-elevated tb-skeleton">
          <img src="${esc(V ? (V.films.find(f => (f.genres || []).some(x => x === g.name)) || {}).img || '' : '')}" alt="" loading="lazy" class="h-full w-full object-cover transition duration-300 group-hover:scale-105" onload="this.parentElement.classList.remove('tb-skeleton')">
        </div>
        <div class="absolute inset-0 bg-gradient-to-t from-black/85 via-black/25 to-transparent"></div>
        <div class="absolute inset-x-0 bottom-0 p-4">
          <h3 class="font-display text-lg font-bold text-white">${esc(gName(g.name))}</h3>
          <p class="text-xs text-content-secondary">${g.count} ${esc(t('catalog.count'))}</p>
        </div>
      </a>`).join('');
    return `<main class="min-h-[60vh] pb-section"><div class="container-site pt-8">
      <nav class="mb-6 text-xs text-content-muted"><a href="#/" class="hover:text-white">${esc(t('common.home'))}</a><span class="px-1.5">/</span><span class="text-content-secondary">${esc(t('collections.title'))}</span></nav>
      <h1 class="section-title mb-8">${esc(t('collections.title'))}</h1>
      <div class="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">${tiles}</div>
    </div></main>`;
  }

  function renderPremium() {
    return `<main class="min-h-[60vh] pb-section"><div class="container-site pt-8">
      <nav class="mb-6 text-xs text-content-muted"><a href="#/" class="hover:text-white">${esc(t('common.home'))}</a><span class="px-1.5">/</span><span class="text-content-secondary">${esc(t('premium.title'))}</span></nav>
      <div class="mx-auto max-w-2xl rounded-card-lg border border-accent/30 bg-accent/[0.05] p-10 text-center">
        <h1 class="brand-word text-[3rem] leading-none" style="color:#e50914; text-shadow:0 0 .2em rgba(229,9,20,.4)">${esc(t('premium.title'))}</h1>
        <p class="mt-4 text-base leading-relaxed text-content-secondary">${esc(t('premium.desc'))}</p>
        <a href="#/iletisim" class="btn-accent mt-6 inline-flex">${esc(t('premium.cta'))}</a>
      </div>
    </div></main>`;
  }

  // ========== İLETİŞİM (kullanıcının kendi e-postası; alıcı arayüzde gizli) ==========
  function renderIletisim() {
    const topics = [['tIssue', t('contact.tIssue')], ['tSuggest', t('contact.tSuggest')], ['tBug', t('contact.tBug')], ['tComplaint', t('contact.tComplaint')]]
      .map(([k, label]) => `<option value="${esc(label)}">${esc(label)}</option>`).join('');
    return `<main class="min-h-[60vh] pb-section"><div class="container-site pt-8">
      <nav class="mb-6 text-xs text-content-muted"><a href="#/" class="hover:text-white">${esc(t('common.home'))}</a><span class="px-1.5">/</span><span class="text-content-secondary">${esc(t('contact.title'))}</span></nav>
      <div class="mx-auto max-w-xl">
        <h1 class="section-title mb-2">${esc(t('contact.title'))}</h1>
        <p class="mb-8 text-sm leading-relaxed text-content-secondary">${esc(t('contact.sub'))}</p>
        <form id="contactForm" class="space-y-4" onsubmit="return false" autocomplete="on">
          <div><label class="block text-sm font-semibold text-content-secondary">${esc(t('contact.name'))}</label><input name="name" type="text" required class="field mt-1.5"></div>
          <div><label class="block text-sm font-semibold text-content-secondary">${esc(t('contact.email'))}</label><input name="email" type="email" required class="field mt-1.5"></div>
          <div><label class="block text-sm font-semibold text-content-secondary">${esc(t('contact.topic'))}</label><select name="topic" class="field mt-1.5">${topics}</select></div>
          <div><label class="block text-sm font-semibold text-content-secondary">${esc(t('contact.message'))}</label><textarea name="message" rows="5" required class="field mt-1.5"></textarea></div>
          <button type="submit" class="btn-accent w-full justify-center">${esc(t('contact.send'))}</button>
          <p id="contactMsg" class="text-center text-sm"></p>
        </form>
      </div>
    </div></main>`;
  }

  // ========== KURUMSAL / HUKUKİ SAYFALAR ==========
  function renderLegal(kind) {
    const titles = { privacy: t('legal.privacy'), terms: t('legal.terms'), dmca: t('legal.dmca') };
    const title = titles[kind] || t('footer.corporate');
    // İçerik dili TR kalır; başlık çevrilir. Kendi uygulamasına uygun, genel metin.
    const paras = {
      privacy: [
        'NOTFLİX bir katalog arayüzüdür. Hesap, ödeme ve kimlik doğrulama sistemleri henüz etkin değildir; bu nedenle sizden kişisel veri toplanmaz.',
        'Uygulama yalnızca üçüncü taraf kaynaklara bağlantı verir. İzleme sırasında ilgili kaynak kendi içeriğini ve çerezlerini sunabilir; bu kaynakların gizlilik uygulamalarından üçüncü taraf sorumludur.',
        'İletişim formunda yazdığınız ad, e-posta ve mesaj yalnızca talebinize yanıt vermek için kullanılır, üçüncü taraflarla paylaşılmaz ve en geç 24 saat içinde yanıtlanır.'
      ],
      terms: [
        'NOTFLİX, film ve dizi içeriklerini tek bir katalogda toplayan bağımsız bir arayüz uygulamasıdır.',
        'Platform kendi sunucusunda film, dizi veya telifli materyal barındırmaz; yalnızca kamuya açık üçüncü taraf kaynaklara yönlendirir. Kullanılan kaynakların erişilebilirliği ve hukuki durumu kaynak sahibine aittir.',
        'Hesap, premium ve kayıt özellikleri yakında eklenecektir. Uygulama "olduğu gibi" sunulur; içerik kesintisi veya kaynak değişikliğinden doğan sonuçlar için garanti verilmez.'
      ],
      dmca: [
        'NOTFLİX telif haklarına saygı duyar ve hiçbir telifli materyali kendi sunucularında barındırmaz.',
        'Tüm oynatılan içerik üçüncü taraf kaynaklardan gelir. Bir yapımın sahibi veya yetkili temsilcisi iseniz ve kaynağın kaldırılmasını talep ediyorsanız, lütfen İletişim sayfasından içeriğin adını, bağlantısını ve hak sahipliğinizi belirterek bize yazın.',
        'Talepler değerlendirilir ve ilgili yönlendirme en kısa sürede kaldılır. Yanıtlar en geç 24 saat içinde gönderilir.'
      ]
    }[kind] || [];
    const body = paras.map(p => `<p class="mt-4 text-sm leading-relaxed text-content-secondary">${esc(p)}</p>`).join('');
    return `<main class="min-h-[60vh] pb-section"><div class="container-site pt-8">
      <nav class="mb-6 text-xs text-content-muted"><a href="#/" class="hover:text-white">${esc(t('common.home'))}</a><span class="px-1.5">/</span><span class="text-content-secondary">${esc(title)}</span></nav>
      <div class="mx-auto max-w-3xl">
        <h1 class="section-title mb-2">${esc(title)}</h1>
        ${body}
        <div class="mt-8"><a href="#/iletisim" class="btn-outline btn-sm">${esc(t('footer.contact'))}</a></div>
      </div>
    </div></main>`;
  }

  // ========== TAKVİM (gerçek yayın takvimi — TMDB, günlük önbellek) ==========
  function renderTakvim() {
    setTimeout(fillTakvim, 30);
    return `
      <main class="min-h-[60vh] pb-section">
        <div class="container-site pt-8">
          <nav class="mb-6 text-xs text-content-muted"><a href="#/" class="hover:text-white">${esc(t('common.home'))}</a><span class="px-1.5">/</span><span class="text-content-secondary">${esc(t('nav.calendar'))}</span></nav>
          <h1 class="section-title mb-2">Yayın Takvimi</h1>
          <p class="mb-8 max-w-2xl text-sm text-content-secondary">Bu hafta yeni bölümü yayınlanan diziler. Tarihler TMDB'den günlük olarak alınır; katalogda olanlar doğrudan açılır.</p>
          <div id="takvimGrid" class="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-7"><p class="col-span-full py-10 text-center text-sm text-content-muted">Takvim yükleniyor…</p></div>
        </div>
      </main>`;
  }
  async function takvimData() {
    const today = new Date();
    const key = 'nf_takvim_v1';
    const stamp = today.toISOString().slice(0, 10);
    try { const c = JSON.parse(localStorage.getItem(key) || 'null'); if (c && c.stamp === stamp && Array.isArray(c.items)) return c.items; } catch (e) {}
    const lc = (LANGS[lang] && LANGS[lang].tmdb) || 'tr-TR';
    const tr = await fetch(`https://api.themoviedb.org/3/trending/tv/week?api_key=${TMDB.KEY}&language=${lc}`).then(r => r.ok ? r.json() : null).catch(() => null);
    const pool = ((tr && tr.results) || []).slice(0, 24);
    const items = [];
    let i = 0;
    async function worker() {
      while (i < pool.length) {
        const s = pool[i++];
        try {
          const d = await fetch(`https://api.themoviedb.org/3/tv/${s.id}?api_key=${TMDB.KEY}&language=${lc}`).then(r => r.ok ? r.json() : null);
          if (!d) continue;
          const ep = d.next_episode_to_air || d.last_episode_to_air;
          if (!ep || !ep.air_date) continue;
          items.push({ id: s.id, name: d.name || s.name, poster: TMDB.IMG(d.poster_path, 'w342'), air: ep.air_date, code: 'S' + String(ep.season_number).padStart(2, '0') + 'E' + String(ep.episode_number).padStart(2, '0'), epName: ep.name || '' });
        } catch (e) {}
      }
    }
    await Promise.all([worker(), worker(), worker(), worker()]);
    try { localStorage.setItem(key, JSON.stringify({ stamp, items })); } catch (e) {}
    return items;
  }
  async function fillTakvim() {
    const grid = document.getElementById('takvimGrid');
    if (!grid) return;
    const items = await takvimData();
    if (!document.getElementById('takvimGrid')) return;
    const days = ['Pzt', 'Sal', 'Çar', 'Per', 'Cum', 'Cmt', 'Paz'];
    const today = new Date();
    const monday = new Date(today); monday.setDate(today.getDate() - ((today.getDay() + 6) % 7));
    const findSlug = name => {
      if (!V) return '';
      const n = normT(name);
      const s = V.series.find(x => normT(x.name) === n);
      return s ? s.slug : '';
    };
    const cols = days.map((d, i) => {
      const dt = new Date(monday); dt.setDate(monday.getDate() + i);
      const iso = dt.toISOString().slice(0, 10);
      const isToday = dt.toDateString() === today.toDateString();
      const picks = items.filter(x => x.air === iso);
      const cards = picks.map(p => {
        const slug = findSlug(p.name);
        const inner = `<div class="flex items-center gap-2.5 rounded-lg border border-line bg-bg-elevated/60 p-2 transition hover:border-accent/50">${p.poster ? `<img src="${esc(p.poster)}" alt="" loading="lazy" class="h-14 w-10 shrink-0 rounded object-cover">` : ''}<div class="min-w-0"><p class="truncate text-xs font-semibold text-content-primary">${esc(p.name)}</p><p class="mt-0.5 text-[10px] font-bold text-accent">${esc(p.code)}</p>${p.epName ? `<p class="truncate text-[10px] text-content-muted">${esc(p.epName)}</p>` : ''}${slug ? '' : '<p class="text-[9px] text-content-muted">katalogda yok</p>'}</div></div>`;
        return slug ? `<a href="#/detay/${esc(slug)}/dizi" class="block">${inner}</a>` : inner;
      }).join('');
      return `
        <div class="rounded-card-lg border ${isToday ? 'border-accent/60 bg-accent/[0.04]' : 'border-line'} bg-bg-secondary p-3">
          <div class="mb-3 flex items-baseline justify-between">
            <span class="text-sm font-bold ${isToday ? 'text-accent' : 'text-content-primary'}">${d}${isToday ? ' •' : ''}</span>
            <span class="text-xs text-content-muted">${String(dt.getDate()).padStart(2, '0')}.${String(dt.getMonth() + 1).padStart(2, '0')}</span>
          </div>
          <div class="space-y-2">${cards || '<p class="text-xs text-content-muted">Beklenen bölüm yok.</p>'}</div>
        </div>`;
    }).join('');
    grid.innerHTML = cols;
  }

  // ========== IMDB TOP 250 (gerçek liste, katalog eşleşmeli) ==========
  function renderTop250() {
    setTimeout(fillTop250, 30);
    return `
      <main class="min-h-[60vh] pb-section">
        <div class="container-site pt-8">
          <nav class="mb-6 text-xs text-content-muted"><a href="#/" class="hover:text-white">${esc(t('common.home'))}</a><span class="px-1.5">/</span><span class="text-content-secondary">IMDB Top 250</span></nav>
          <div class="mb-8 flex flex-wrap items-end justify-between gap-4">
            <div>
              <h1 class="section-title mb-2 flex items-center gap-3"><svg class="h-7 w-7 text-star" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2l2.9 6.3 6.9.8-5.1 4.7 1.4 6.8L12 17.2 5.9 20.6l1.4-6.8L2.2 9.1l6.9-.8z"/></svg>IMDB Top 250</h1>
              <p class="max-w-2xl text-sm text-content-secondary">Tüm zamanların en yüksek puanlı 250 filmi. Liste haftalık yenilenir; katalogda bulunanlar tek tıkla oynatılır.</p>
            </div>
            <span id="top250Count" class="rounded-full border border-line px-3 py-1 text-xs font-semibold text-content-muted"></span>
          </div>
          <div id="top250Grid" class="grid grid-cols-2 gap-x-4 gap-y-7 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6"><p class="col-span-full py-10 text-center text-sm text-content-muted">Liste yükleniyor…</p></div>
        </div>
      </main>`;
  }
  async function fillTop250() {
    const grid = document.getElementById('top250Grid');
    if (!grid) return;
    let data250 = null;
    try {
      if (window.notflix && notflix.data && notflix.data.top250) {
        const r = await notflix.data.top250();
        if (r && r.ok) data250 = r.data;
      }
      if (!data250) data250 = await fetch('assets/top250.json').then(r => r.json());
    } catch (e) {}
    if (!document.getElementById('top250Grid')) return;
    const items = (data250 && data250.items) || [];
    if (!items.length) { grid.innerHTML = '<p class="col-span-full py-10 text-center text-sm text-content-muted">Liste şu an alınamadı. İnternet bağlantını kontrol et.</p>'; return; }
    let inCat = 0;
    const matchFilm = m => {
      if (!V) return null;
      const n = normT(m.title);
      return V.films.find(f => normT(V.cleanTitle(f.t) || f.t) === n && (!m.year || !f.y || String(f.y) === String(m.year)))
        || V.films.find(f => normT(V.cleanTitle(f.t) || f.t) === n) || null;
    };
    const cards = items.map(m => {
      const f = matchFilm(m);
      if (f) inCat++;
      const slug = f ? f.slug : '';
      const img = m.img || (f && f.img) || '';
      const href = slug ? `#/detay/${esc(slug)}/film` : '';
      return `
        <div class="group relative">
          <${href ? `a href="${href}"` : 'div'} class="block">
            <div class="relative aspect-[2/3] overflow-hidden rounded-card bg-bg-elevated shadow-card transition duration-300 group-hover:shadow-poster">
              ${img ? `<img src="${esc(img)}" alt="${esc(m.title)}" loading="lazy" class="absolute inset-0 h-full w-full object-cover transition duration-300 group-hover:scale-105">` : ''}
              <div class="absolute inset-0 bg-gradient-to-t from-black/85 via-transparent to-black/30"></div>
              <span class="absolute left-2 top-2 rounded-badge bg-black/75 px-2 py-0.5 font-condensed text-lg font-bold text-star ring-1 ring-white/10">${m.rank}</span>
              <span class="absolute right-2 top-2 inline-flex items-center gap-1 rounded-badge bg-black/75 px-2 py-0.5 text-xs font-bold text-star ring-1 ring-white/10">★ ${esc(m.rating)}</span>
              ${slug ? '<div class="absolute inset-0 flex items-center justify-center opacity-0 transition group-hover:opacity-100"><span class="flex h-12 w-12 items-center justify-center rounded-full bg-accent/90 text-white shadow-lg"><svg class="h-5 w-5" viewBox="0 0 24 24" fill="currentColor"><path d="M8 5v14l11-7z"/></svg></span></div>' : ''}
              <div class="absolute bottom-2 left-2 right-2 flex items-center justify-between gap-2">
                <span class="text-[10px] font-semibold text-white/70">${esc(m.year)}</span>
                ${slug ? `<span class="rounded-badge bg-accent px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wide text-white">${esc(t('common.watch'))}</span>` : '<span class="rounded-badge bg-white/10 px-1.5 py-0.5 text-[9px] font-semibold text-white/50">katalogda yok</span>'}
              </div>
            </div>
            <div class="mt-2.5 px-0.5"><h3 class="truncate text-sm font-semibold text-content-primary transition group-hover:text-accent">${esc(m.title)}</h3><p class="mt-0.5 truncate text-xs text-content-muted">${esc((m.genres || []).slice(0, 2).map(g => gName(g)).join(', '))}</p></div>
          </${href ? 'a' : 'div'}>
        </div>`;
    }).join('');
    grid.innerHTML = cards;
    const c = document.getElementById('top250Count');
    if (c) c.textContent = items.length + ' film • ' + inCat + ' tanesi katalogda';
  }

  // ========== ARAMA ==========
  function renderAra() {
    const q = decodeURIComponent((location.hash.split('?q=')[1] || '')).replace(/\+/g, ' ');
    setTimeout(() => { const i = document.getElementById('araInput'); if (i) { i.value = q; i.focus(); } }, 30);
    let results = [];
    if (V && q.trim()) {
      const n = normT(q);
      results = [
        ...V.films.filter(f => normT(V.cleanTitle(f.t) || f.t).includes(n)).map(V.filmCard),
        ...V.series.filter(s => normT(s.name).includes(n)).map(V.seriesCard)
      ].slice(0, 120);
    }
    return `
      <main class="min-h-[60vh] pb-section">
        <div class="container-site pt-8">
          <h1 class="section-title mb-6">${esc(t('common.search'))}</h1>
          <form id="araForm" class="mb-8 flex max-w-xl items-center gap-2 rounded-pill border border-line bg-bg-elevated/90 p-1.5 shadow-card">
            <span class="pl-3 text-content-muted"><svg class="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="11" cy="11" r="7"/><path d="m20 20-3.5-3.5"/></svg></span>
            <input id="araInput" name="q" type="search" value="${esc(q)}" placeholder="${esc(t('common.search'))}" class="w-full border-0 bg-transparent text-base text-white placeholder:text-content-muted focus:ring-0 sm:text-sm">
            <button type="submit" class="btn-accent btn-sm shrink-0">${esc(t('nav.discover'))}</button>
          </form>
          ${q.trim() ? `<p class="mb-6 text-sm text-content-muted">${results.length} sonuç</p>` : ''}
          <div class="grid grid-cols-2 gap-x-4 gap-y-7 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6">
            ${results.map(posterCard).join('') || (q.trim() ? '<p class="col-span-full text-sm text-content-muted">Sonuç bulunamadı.</p>' : '')}
          </div>
        </div>
      </main>`;
  }

  function renderKutuphane() {
    const favs = getFavs();
    const items = [];
    if (V) {
      for (const f of favs) {
        const film = V.filmBySlug.get(f.slug);
        if (film) { items.push(V.filmCard(film)); continue; }
        const ser = V.seriesBySlug.get(f.slug);
        if (ser) items.push(V.seriesCard(ser));
      }
    }
    const grid = items.length
      ? `<div class="grid grid-cols-2 gap-x-4 gap-y-7 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6">${items.map(posterCard).join('')}</div>`
      : `<div class="flex flex-col items-center justify-center rounded-card-lg border border-line bg-bg-secondary px-6 py-16 text-center">
           <svg class="mb-4 h-12 w-12 text-content-muted" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M6 3h12a1 1 0 0 1 1 1v17l-7-4-7 4V4a1 1 0 0 1 1-1z"/></svg>
           <p class="mb-5 text-sm text-content-secondary">${esc(t('library.empty'))}</p>
           <a href="#/kesfet" class="btn-accent">${esc(t('library.goto'))}</a>
         </div>`;
    return `
      <main class="min-h-[60vh] pb-section">
        <div class="container-site pt-8">
          <nav class="mb-6 text-xs text-content-muted"><a href="#/" class="hover:text-white">${esc(t('common.home'))}</a><span class="px-1.5">/</span><span class="text-content-secondary">${esc(t('nav.library'))}</span></nav>
          <h1 class="section-title mb-2">${esc(t('library.title'))}</h1>
          <p class="mb-8 max-w-2xl text-sm text-content-secondary">${esc(t('library.sub'))}</p>
          ${grid}
        </div>
      </main>`;
  }

  // ========== TMDB DETAY ZENGİNLEŞTİRME ==========
  async function enrichDetail(slug, kind) {
    const f = V.filmBySlug.get(slug), s = V.seriesBySlug.get(slug);
    const title = f ? V.cleanTitle(f.t) : (s ? s.name : '');
    const year = f ? f.y : '';
    const tk = (kind === 'dizi' || s) ? 'dizi' : 'film';
    const hit = await TMDB.find(tk, title, year);
    if (!hit) return;
    const d = await TMDB.full(tk, hit.id);
    if (!d) return;
    const descEl = document.getElementById('tmdb-desc'); if (descEl && d.overview) descEl.textContent = d.overview;
    const rEl = document.getElementById('tmdb-rating'); if (rEl && d.vote_average) rEl.textContent = '★ ' + d.vote_average.toFixed(1);
    const yEl = document.getElementById('tmdb-year'); const yy = String(d.release_date || d.first_air_date || '').slice(0, 4); if (yEl && yy) yEl.textContent = yy;
    const poster = TMDB.IMG(d.poster_path, 'w500');
    if (poster) { const big = document.querySelector('#app .aspect-\\[2\\/3\\] img'); if (big) big.src = poster; }
    const bd = TMDB.IMG(d.backdrop_path, 'w1280');
    if (bd) { const hero = document.querySelector('#app section img'); if (hero) hero.src = bd; }
    const key = TMDB.trailerKey(d);
    const bg = document.getElementById('detail-bg-slot');
    if (bg && key) { bg.dataset.key = key; inject(bg, key); const host = bg.closest('[data-trailer-host]'); if (host) setPlaying(host, true); }
    const credits = d.credits || {};
    const cast = (credits.cast || credits.guest_stars || d.cast || []).slice(0, 12);
    if (cast.length) mountCast(cast);
  }
  function mountCast(cast) {
    const app = document.getElementById('app'); if (!app) return;
    const cards = cast.map(c => `<a class="group flex flex-col items-center text-center"><div class="h-20 w-20 overflow-hidden rounded-full border-2 border-line bg-bg-elevated sm:h-24 sm:w-24">${c.profile_path ? `<img src="${TMDB.IMG(c.profile_path, 'w185')}" alt="" class="h-full w-full object-cover">` : ''}</div><p class="mt-2 w-full truncate px-1 text-[12px] font-semibold text-content-primary group-hover:text-accent" title="${esc(c.name)}">${esc(c.name)}</p>${c.character ? `<p class="w-full truncate px-1 text-[11px] text-content-muted">${esc(c.character)}</p>` : ''}</a>`).join('');
    const sec = document.createElement('section');
    sec.id = 'oyuncular';
    sec.className = 'container-site mt-12 scroll-mt-24';
    sec.innerHTML = `<h2 class="mb-4 section-title">${esc(t('detail.cast'))}</h2><div class="grid grid-cols-3 gap-4 sm:grid-cols-5 md:grid-cols-6">${cards}</div>`;
    const old = document.getElementById('oyuncular'); if (old) old.remove();
    const similar = document.getElementById('benzer-rail');
    if (similar && similar.parentNode) similar.parentNode.insertBefore(sec, similar);
    else app.appendChild(sec);
  }

  // ========== FULLSCREEN PLAYER (modern, gerçek kontroller) ==========
  let _player = null, _hls = null;
  // Electron penceresini OS seviyesinde tam ekrana al/çıkar: her şeyin önüne geçer, gerçek büyük tam ekran.
  // Shot testinde pencere tam ekrana girerse çekimler bozulur → orada no-op.
  const IS_SHOT = (location.search || '').indexOf('shot=1') !== -1;
  function nativeFs(on) { if (IS_SHOT) return; try { if (window.notflix && notflix.win && notflix.win.fullscreen) notflix.win.fullscreen(on); } catch (e) {} }
  // Tam ekran aç/kapa: player'I ASLA kapatmaz; girerken kontrolleri görünür yap.
  function setPlayerFs(overlay, on) {
    overlay._fs = on;
    nativeFs(on);
    if (overlay._setUI) overlay._setUI(true);
  }
  function openPlayer(slug, kind, season, ep) {
    const stream = V ? vodStream(slug, kind, season, ep) : null;
    closePlayer();
    // Stream bulunamasa bile player her zaman açılır: poster + bilgi gösterilir.
    let poster = '', title = '';
    if (V) {
      const f = V.filmBySlug.get(slug); const s = V.seriesBySlug.get(slug);
      if (f) { poster = f.img || ''; title = V.cleanTitle(f.t) || f.t; }
      else if (s) { poster = s.img || ''; title = s.name; }
    }
    const overlay = document.createElement('div');
    overlay.id = 'fsPlayer';
    overlay.style.cssText = 'position:fixed;inset:0;z-index:2147483000;background:#000;display:flex;flex-direction:column';
    const closeBtn = `<button data-pclose style="position:fixed;top:14px;right:16px;z-index:2147483006;transition:opacity .3s" class="flex h-10 w-10 items-center justify-center rounded-full bg-black/60 text-white ring-1 ring-white/15 backdrop-blur hover:bg-accent"><svg class="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M18 6 6 18M6 6l12 12"/></svg></button>`;
    let inner;
    if (!stream) {
      inner = `
        <div style="position:absolute;inset:0;background:#000 url('${esc(poster)}') center/contain no-repeat">
          ${poster ? '<div style="position:absolute;inset:0;background:linear-gradient(180deg,rgba(0,0,0,.4),rgba(0,0,0,.85))"></div>' : ''}
          ${closeBtn}
          <div style="position:absolute;inset:0;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:10px;padding:24px;text-align:center;color:#fff">
            ${title ? `<div style="font-size:1.1rem;font-weight:600;max-width:60ch">${esc(title)}</div>` : ''}
            <div style="color:rgba(255,255,255,.7);font-size:.9rem">Bu içerik için şu an oynatılabilir kaynak bulunamadı.</div>
          </div>
        </div>`;
    } else {
      const media = stream.embed
        ? `<iframe src="${esc(stream.url)}${stream.url.includes('?') ? '&' : '?'}autoplay=1" allow="autoplay; fullscreen; encrypted-media; picture-in-picture" allowfullscreen style="display:block;width:100%;height:100%;border:0;background:#000"></iframe>`
        : `<video id="fsVideo" playsinline style="display:block;width:100%;height:100%;background:#000;object-fit:contain"></video>`;
      inner = `
        <div style="position:relative;flex:1;min-height:0">
          ${media}
          ${closeBtn}
          ${stream.embed ? `
          <div data-controls style="position:fixed;left:0;right:0;bottom:0;z-index:2147483005;display:flex;justify-content:flex-end;padding:14px 18px;background:linear-gradient(transparent,rgba(0,0,0,.85));transition:opacity .3s">
            <button data-fs class="flex h-10 w-10 items-center justify-center rounded-full bg-black/60 text-white ring-1 ring-white/15 backdrop-blur hover:bg-accent" title="Tam ekran"><svg class="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M8 3H5a2 2 0 0 0-2 2v3m18 0V5a2 2 0 0 0-2-2h-3M3 16v3a2 2 0 0 0 2 2h3m8 0h3a2 2 0 0 0 2-2v-3"/></svg></button>
          </div>` : `
          <div data-controls style="position:fixed;left:0;right:0;bottom:0;z-index:2147483005;padding:14px 18px;background:linear-gradient(transparent,rgba(0,0,0,.85));transition:opacity .3s">
          <div data-seek class="group h-1.5 w-full cursor-pointer rounded-full bg-white/25"><div data-buffer class="h-full rounded-full bg-white/40" style="width:0"></div></div>
          <div style="display:flex;align-items:center;gap:14px;margin-top:10px;color:#fff">
            <button data-play class="flex h-10 w-10 items-center justify-center rounded-full bg-accent text-white hover:brightness-110"><svg data-ico-play class="h-5 w-5" viewBox="0 0 24 24" fill="currentColor"><path d="M8 5v14l11-7z"/></svg><svg data-ico-pause class="h-5 w-5 hidden" viewBox="0 0 24 24" fill="currentColor"><rect x="6" y="5" width="4" height="14" rx="1"/><rect x="14" y="5" width="4" height="14" rx="1"/></svg></button>
            <span data-time class="text-xs tabular-nums">0:00 / 0:00</span>
            <div style="display:flex;align-items:center;gap:6px"><button data-mute class="text-white hover:text-accent"><svg class="h-5 w-5" viewBox="0 0 24 24" fill="currentColor"><path d="M3 10v4h4l5 5V5L7 10H3z"/></svg></button><input data-vol type="range" min="0" max="1" step="0.05" value="1" style="width:70px;accent-color:#e50914"></div>
            <div style="margin-left:auto;display:flex;align-items:center;gap:12px">
              <div style="position:relative"><button data-qual class="rounded-pill border border-white/20 px-2.5 py-1 text-xs hover:border-white/50">${esc(t('common.quality'))}: Auto ▾</button><div data-qualmenu class="hidden absolute bottom-full right-0 mb-2 w-40 overflow-hidden rounded-card border border-white/10 bg-black/90 text-sm"></div></div>
              <div style="position:relative"><button data-speed class="rounded-pill border border-white/20 px-2.5 py-1 text-xs hover:border-white/50">1x ▾</button><div data-speedmenu class="hidden absolute bottom-full right-0 mb-2 w-28 overflow-hidden rounded-card border border-white/10 bg-black/90 text-sm"></div></div>
              <button data-pip class="text-white hover:text-accent"><svg class="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="5" width="18" height="14" rx="2"/><rect x="12" y="11" width="7" height="5" rx="1"/></svg></button>
              <button data-fs class="text-white hover:text-accent"><svg class="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M8 3H5a2 2 0 0 0-2 2v3m18 0V5a2 2 0 0 0-2-2h-3M3 16v3a2 2 0 0 0 2 2h3m8 0h3a2 2 0 0 0 2-2v-3"/></svg></button>
            </div>
          </div>
        </div>`}
        </div>`;
    }
    overlay.innerHTML = inner;
    document.body.appendChild(overlay);
    _player = overlay;
    if (stream && !stream.embed) {
      // Taze token: arka planda çözülmüş güncel adresi bekle; gelmezse katalogdaki adresle başla.
      const start = s => { if (_player === overlay) wirePlayer(overlay, s); };
      if (stream.page && window.notflix && notflix.stream && notflix.stream.resolve) {
        const ld = document.createElement('div');
        ld.style.cssText = 'position:absolute;inset:0;display:flex;flex-direction:column;gap:14px;align-items:center;justify-content:center;background:rgba(0,0,0,.72);z-index:2147483004;color:#fff';
        ld.innerHTML = '<div style="width:42px;height:42px;border-radius:50%;border:3px solid rgba(255,255,255,.15);border-top-color:#e50914;animation:nfSpin .8s linear infinite"></div><div style="font-size:.85rem;letter-spacing:.08em;color:rgba(255,255,255,.75)">Yayın hazırlanıyor…</div>';
        overlay.appendChild(ld);
        const timeout = new Promise(r => setTimeout(() => r(null), 12000));
        Promise.race([notflix.stream.resolve(stream.page).catch(() => null), timeout]).then(r => {
          ld.remove();
          start(r && r.ok && r.url ? Object.assign({}, stream, { url: r.url }) : stream);
        });
      } else start(stream);
    }
    // Gerçek OS tam ekran: pencere tüm ekrana yayılır, player her şeyin önüne geçer.
    nativeFs(true);
    overlay._fs = true;
    // Embed player: iframe fare olaylarını yuttuğu için auto-hide YOK; kontroller + X her zaman görünür.
    if (stream && stream.embed) {
      const fsBtn = overlay.querySelector('[data-fs]');
      if (fsBtn) fsBtn.addEventListener('click', () => { setPlayerFs(overlay, !overlay._fs); });
    }
    overlay.addEventListener('click', e => { if (e.target.closest('[data-pclose]')) closePlayer(); });
  }
  function closePlayer() {
    if (_hls) { try { _hls.destroy(); } catch (e) {} _hls = null; }
    if (_player) { _player.remove(); _player = null; }
    nativeFs(false);
    try { if (document.fullscreenElement) document.exitFullscreen(); } catch (e) {}
  }
  function wirePlayer(overlay, stream) {
    const v = overlay.querySelector('#fsVideo');
    const fmt = t => { t = Math.max(0, t | 0); const h = (t / 3600) | 0, m = ((t % 3600) / 60) | 0, s = t % 60; return (h ? h + ':' + String(m).padStart(2, '0') : m) + ':' + String(s).padStart(2, '0'); };
    const timeEl = overlay.querySelector('[data-time]'), seek = overlay.querySelector('[data-seek]'), buf = overlay.querySelector('[data-buffer]');
    const playBtn = overlay.querySelector('[data-play]'), iPlay = overlay.querySelector('[data-ico-play]'), iPause = overlay.querySelector('[data-ico-pause]');
    if (window.Hls && window.Hls.isSupported()) {
      _hls = new window.Hls({ maxBufferLength: 30 });
      _hls.attachMedia(v);
      _hls.on(window.Hls.Events.MANIFEST_PARSED, () => { v.play().catch(() => { v.muted = true; v.play().catch(() => {}); }); });
      _hls.loadSource(stream.url);
    } else { v.src = stream.url; v.play().catch(() => { v.muted = true; v.play().catch(() => {}); }); }
    v.addEventListener('play', () => { iPlay.classList.add('hidden'); iPause.classList.remove('hidden'); });
    v.addEventListener('pause', () => { iPlay.classList.remove('hidden'); iPause.classList.add('hidden'); });
    v.addEventListener('timeupdate', () => {
      timeEl.textContent = fmt(v.currentTime) + ' / ' + fmt(v.duration);
      let fill = seek.querySelector('[data-fill]');
      if (!fill) { fill = document.createElement('div'); fill.className = 'h-full rounded-full bg-accent'; fill.setAttribute('data-fill', '1'); fill.style.width = '0'; seek.insertBefore(fill, seek.firstChild); }
      fill.style.width = (v.duration ? v.currentTime / v.duration * 100 : 0) + '%';
    });
    v.addEventListener('progress', () => { if (v.buffered.length) { const b = v.buffered.end(v.buffered.length - 1) / v.duration * 100; if (buf) buf.style.width = b + '%'; } });
    playBtn.addEventListener('click', () => { v.paused ? v.play() : v.pause(); });
    seek.addEventListener('click', e => { const r = seek.getBoundingClientRect(); v.currentTime = (e.clientX - r.left) / r.width * (v.duration || 0); });
    overlay.querySelector('[data-mute]').addEventListener('click', () => { v.muted = !v.muted; });
    overlay.querySelector('[data-vol]').addEventListener('input', e => { v.volume = +e.target.value; v.muted = false; });
    overlay.querySelector('[data-fs]').addEventListener('click', () => { setPlayerFs(overlay, !overlay._fs); });
    overlay._fs = true; // açılışta native tam ekran zaten açık
    overlay.querySelector('[data-pip]').addEventListener('click', () => { try { document.pictureInPictureElement ? document.exitPictureInPicture() : v.requestPictureInPicture(); } catch (e) {} });
    // speed
    const smenu = overlay.querySelector('[data-speedmenu]'), sbtn = overlay.querySelector('[data-speed]');
    [0.5, 0.75, 1, 1.25, 1.5, 2].forEach(r => { const b = document.createElement('button'); b.textContent = r + 'x'; b.className = 'block w-full px-3 py-2 text-left hover:bg-white/10'; b.onclick = () => { v.playbackRate = r; sbtn.textContent = r + 'x ▾'; smenu.classList.add('hidden'); }; smenu.appendChild(b); });
    sbtn.addEventListener('click', () => smenu.classList.toggle('hidden'));
    // quality (hls levels)
    const qmenu = overlay.querySelector('[data-qualmenu]'), qbtn = overlay.querySelector('[data-qual]');
    function buildQuality() {
      if (!_hls) return;
      qmenu.innerHTML = '';
      const auto = document.createElement('button'); auto.textContent = 'Auto'; auto.className = 'block w-full px-3 py-2 text-left hover:bg-white/10'; auto.onclick = () => { _hls.currentLevel = -1; qbtn.textContent = t('common.quality') + ': Auto ▾'; qmenu.classList.add('hidden'); }; qmenu.appendChild(auto);
      (_hls.levels || []).forEach((lv, i) => { const b = document.createElement('button'); b.textContent = (lv.height ? lv.height + 'p' : Math.round((lv.bitrate || 0) / 1000) + 'k'); b.className = 'block w-full px-3 py-2 text-left hover:bg-white/10'; b.onclick = () => { _hls.currentLevel = i; qbtn.textContent = t('common.quality') + ': ' + b.textContent + ' ▾'; qmenu.classList.add('hidden'); }; qmenu.appendChild(b); });
    }
    if (_hls) _hls.on(window.Hls.Events.LEVELS_UPDATED, buildQuality);
    qbtn.addEventListener('click', () => { buildQuality(); qmenu.classList.toggle('hidden'); });
    // auto-hide UI: kontroller VE kapatma (X) butonu birlikte. Oynarken hareketsizlikte gizlenir
    // (pointer-events de kapanır → görünmezken yanlışlıkla tıklanamaz), fare hareketiyle anında gelir.
    const ctr = overlay.querySelector('[data-controls]');
    const xbtn = overlay.querySelector('[data-pclose]');
    let hideT;
    function setUI(on) {
      [ctr, xbtn].forEach(el => { if (!el) return; el.style.opacity = on ? '1' : '0'; el.style.pointerEvents = on ? 'auto' : 'none'; });
    }
    overlay._setUI = setUI;
    // Tam ekranda kontroller (kalite/X) HER ZAMAN görünür; sadece pencere modunda hareketsizlikte gizlenir.
    function wakeUI() { setUI(true); clearTimeout(hideT); hideT = setTimeout(() => { if (!v.paused && !overlay._fs) setUI(false); }, 3000); }
    overlay.addEventListener('mousemove', wakeUI);
    overlay.addEventListener('touchstart', wakeUI);
    v.addEventListener('play', wakeUI);
    v.addEventListener('pause', () => { clearTimeout(hideT); setUI(true); });
    wakeUI();
  }

  // ========== EVENT BINDING ==========
  let _eventsBound = false;
  function bindEvents() {
    const app = document.getElementById('app');
    if (!_eventsBound) {
      _eventsBound = true;
      app.addEventListener('click', handler);
      initImgFallback();
      initTrailerGuard();
      // ESC: tam ekrandaysa önce tam ekrandan çık (player kapanmaz); değilse player'ı kapat.
      document.addEventListener('keydown', e => {
        if (e.key !== 'Escape') return;
        if (_player) { if (_player._fs) setPlayerFs(_player, false); else closePlayer(); return; }
        if (_canliFs) { _canliFs = false; nativeFs(false); const b = document.getElementById('canliBox'); if (b) b.classList.remove('canli-full'); }
      });
    }
    initHero();
    initPlayer();
  }
  // Ölü/404 poster hostları: görsel hata verince TMDB poster/backdrop'una düş (tek arama, önbellekli).
  // Eşzamanlı arama limiti: API'yi doyurup detay/hero zenginleştirmesini engellemesin.
  const _fbQueue = []; let _fbActive = 0;
  function _fbPump() {
    while (_fbActive < 4 && _fbQueue.length) {
      const job = _fbQueue.shift(); _fbActive++;
      job().catch(() => {}).then(() => { _fbActive--; _fbPump(); });
    }
  }
  // Posterler doğrudan TMDB'den: src'siz bırakılan her poster için TMDB aramasını kuyruğa al.
  function resolvePosters() {
    document.querySelectorAll('#app img[data-fb]:not([src])').forEach(img => {
      if (img.dataset.fbQueued) return; img.dataset.fbQueued = '1';
      const [title, year, kind, type] = img.dataset.fb.split('|');
      if (!title) return;
      _fbQueue.push(() => TMDB.poster(kind === 'dizi' ? 'dizi' : 'film', title, year).then(p => {
        const url = p ? (type === 'backdrop' ? (p.backdrop || p.poster) : (p.poster || p.backdrop)) : '';
        if (url) img.src = url;
      }));
    });
    _fbPump();
  }
  function initImgFallback() {
    document.addEventListener('error', e => {
      const img = e.target;
      if (!img || img.tagName !== 'IMG') return;
      const fb = img.dataset.fb; if (!fb || img.dataset.fbDone) return;
      img.dataset.fbDone = '1';
      const [title, year, kind, type] = fb.split('|');
      if (!title) return;
      _fbQueue.push(() => TMDB.poster(kind === 'dizi' ? 'dizi' : 'film', title, year).then(p => {
        if (!p) return;
        const url = type === 'backdrop' ? (p.backdrop || p.poster) : (p.poster || p.backdrop);
        if (url) img.src = url;
      }));
      _fbPump();
    }, true);
  }

  // ========== HLS PLAYER ==========
  function initPlayer() {
    const v = document.querySelector('video[data-hls]');
    if (!v) return;
    const url = v.dataset.hls;
    try {
      if (window.Hls && window.Hls.isSupported()) {
        const hls = new window.Hls({ maxBufferLength: 30 });
        hls.attachMedia(v);
        hls.on(window.Hls.Events.MANIFEST_PARSED, () => v.play().catch(() => {}));
        hls.on(window.Hls.Events.ERROR, (e, d) => { if (d.fatal) console.error('HLS fatal:', d.type, d.details); });
        hls.loadSource(url);
      } else {
        v.src = url; v.play().catch(() => {});
      }
    } catch (err) { console.error('PLAYER ERROR', err && err.message || err); }
  }
  function handler(e) {
    const play = e.target.closest('[data-play]');
    if (play) {
      e.preventDefault();
      const [slug, kind, season, ep] = (play.dataset.play || '').split('|');
      openPlayer(slug, kind, season, ep);
      return;
    }
    const favBtn = e.target.closest('[data-fav]');
    if (favBtn) {
      e.preventDefault();
      const [slug, kind, title] = (favBtn.dataset.fav || '').split('|');
      toggleFav(slug, kind, title);
      favBtn.outerHTML = favButtonHtml(slug, kind, title);
      return;
    }
    const canliFull = e.target.closest('[data-canli-full]');
    if (canliFull) {
      // Native pencere tam ekranı: iframe içi kanal seçimi/yönlendirmesi tam ekranı düşürmez.
      _canliFs = !_canliFs;
      nativeFs(_canliFs);
      const box = document.getElementById('canliBox');
      if (box) box.classList.toggle('canli-full', _canliFs);
      return;
    }
    const scrollBtn = e.target.closest('[data-scroll]');
    if (scrollBtn) {
      const dir = Number(scrollBtn.dataset.scroll);
      const track = scrollBtn.parentElement.querySelector('[data-track]');
      if (track) track.scrollBy({ left: dir * track.clientWidth * 0.8, behavior: 'smooth' });
      return;
    }
    const dot = e.target.closest('[data-slide]');
    if (dot) { setSlide(Number(dot.dataset.slide)); return; }
    const nav = e.target.closest('[data-nav]');
    if (nav) {
      const cur = document.querySelector('.slide:not(.hidden)');
      const total = document.querySelectorAll('.slide').length;
      const idx = cur ? Number(cur.dataset.idx) : 0;
      setSlide(nav.dataset.nav === 'prev' ? (idx - 1 + total) % total : (idx + 1) % total);
      return;
    }
    const trailerBtn = e.target.closest('[data-trailer-toggle]');
    if (trailerBtn) { toggleTrailer(trailerBtn); return; }
    const muteBtn = e.target.closest('[data-trailer-mute]');
    if (muteBtn) { toggleMute(muteBtn); return; }
    const seasonTab = e.target.closest('[data-season]');
    if (seasonTab) {
      e.preventDefault();
      const num = seasonTab.dataset.season;
      document.querySelectorAll('[data-season]').forEach(el => {
        const active = el.dataset.season === num;
        el.classList.toggle('border-accent', active);
        el.classList.toggle('bg-accent', active);
        el.classList.toggle('text-white', active);
        el.classList.toggle('border-line', !active);
        el.classList.toggle('bg-bg-elevated', !active);
        el.classList.toggle('text-content-secondary', !active);
      });
      document.querySelectorAll('[data-season-view]').forEach(el => el.classList.toggle('hidden', el.dataset.seasonView !== num));
      return;
    }
    const mood = e.target.closest('[data-mood]');
    if (mood) {
      e.preventDefault();
      document.querySelectorAll('[data-mood]').forEach(el => {
        const active = el === mood;
        el.classList.toggle('border-accent', active); el.classList.toggle('bg-accent', active); el.classList.toggle('text-white', active);
        el.classList.toggle('border-line', !active); el.classList.toggle('bg-bg-elevated', !active); el.classList.toggle('text-content-secondary', !active);
      });
      runWizard(mood.dataset.mood);
      return;
    }
  }

  // ========== HERO SLIDER LOGIC ==========
  let slideTimer = null;
  let heroAutoSkip = 0;
  function setSlide(i, auto) {
    document.querySelectorAll('.slide').forEach((el, k) => el.classList.toggle('hidden', k !== i));
    document.querySelectorAll('[data-slide]').forEach((el, k) => { el.classList.toggle('bg-white', k === i); el.classList.toggle('bg-white/30', k !== i); });
    const active = document.querySelectorAll('.slide')[i];
    if (active) { document.querySelectorAll('.trailer-slot').forEach(s => { if (s !== active.querySelector('.trailer-slot')) stopTrailer(s.closest('.slide')); }); playTrailer(active, auto); }
    resetTimer();
  }
  function resetTimer() {
    if (slideTimer) clearInterval(slideTimer);
    const total = document.querySelectorAll('.slide').length;
    if (total > 1) slideTimer = setInterval(() => {
      const cur = document.querySelector('.slide:not(.hidden)');
      setSlide(cur ? (Number(cur.dataset.idx) + 1) % total : 0, true);
    }, 3500);
  }
  function initHero() { heroAutoSkip = 0; const a = document.querySelector('.slide:not(.hidden)') || document.querySelector('.slide'); if (a) playTrailer(a, true); resetTimer(); }

  // TMDB fragman: YouTube iframe (sessiz döngü). Otomatik modda aktif slaytta fragman yoksa bir sonrakine hızlı geç.
  async function playTrailer(slide, auto) {
    if (!slide) return;
    const slot = slide.querySelector('.trailer-slot');
    if (!slot) return;
    if (slot.dataset.key === undefined) {
      slot.dataset.key = '';
      const [title, year, kind] = (slot.dataset.q || '').split('|');
      const hit = await TMDB.find(kind === 'dizi' ? 'dizi' : 'film', title, year);
      if (hit) {
        const d = await TMDB.full(kind === 'dizi' ? 'dizi' : 'film', hit.id);
        slot.dataset.key = TMDB.trailerKey(d) || '';
        const bimg = slide.querySelector('img');
        if (bimg && d && d.backdrop_path) { bimg.src = TMDB.IMG(d.backdrop_path, 'w1280'); bimg.dataset.fbDone = '1'; }
      }
    }
    const key = slot.dataset.key;
    if (!key) return; // fragman yoksa backdrop kalır; slayt atlanmaz, 3.5s'de bir sonraki geçer
    if (!slide.classList.contains('hidden')) { inject(slot, key); setPlaying(slide, true); }
  }
  function inject(slot, key) {
    if (slot.querySelector('iframe')) return;
    const f = document.createElement('iframe');
    f.src = `https://www.youtube.com/embed/${key}?autoplay=1&mute=1&controls=0&loop=1&playlist=${key}&rel=0&playsinline=1&disablekb=1&fs=0&enablejsapi=1&modestbranding=1&showinfo=0&iv_load_policy=3`;
    f.allow = 'autoplay; encrypted-media; picture-in-picture';
    f.style.cssText = 'position:absolute;top:50%;left:50%;width:100vw;height:56.25vw;min-height:100%;min-width:100%;transform:translate(-50%,-50%);border:0;pointer-events:none;opacity:0;transition:opacity .6s;filter:saturate(1.18) brightness(1.1) contrast(1.02)';
    f.addEventListener('load', () => { f.style.opacity = '1'; });
    slot.appendChild(f); slot.classList.remove('hidden');
  }
  // YouTube arayüzünü gizle: duraklayınca otomatik oynat (ortada play çıkmaz), hata olursa iframe'i kaldır (hata yazısı çıkmaz).
  function initTrailerGuard() {
    window.addEventListener('message', e => {
      if (!/youtube/.test(e.origin || '')) return;
      let d = e.data; if (typeof d === 'string') { try { d = JSON.parse(d); } catch (_) { return; } }
      if (!d || !d.event) return;
      const src = e.source;
      const frame = Array.from(document.querySelectorAll('.trailer-slot iframe')).find(fr => fr.contentWindow === src);
      if (!frame) return;
      const slot = frame.parentElement;
      const cmd = (func, args) => { try { src.postMessage(JSON.stringify({ event: 'command', func, args: args || [] }), '*'); } catch (_) {} };
      if (d.event === 'onReady') { cmd('mute'); cmd('playVideo'); frame.style.opacity = '1'; }
      else if (d.event === 'onStateChange') { const s = (d.info !== undefined ? d.info : (d.data && d.data.info)); if (s === 2 || s === 0 || s === 5) cmd('playVideo'); }
      else if (d.event === 'onError') { frame.remove(); slot.classList.add('hidden'); const host = slot.closest('.slide') || slot.closest('[data-trailer-host]'); if (host) setPlaying(host, false); }
    });
  }
  function stopTrailer(slide) { if (!slide) return; const slot = slide.querySelector('.trailer-slot'); if (slot) { const f = slot.querySelector('iframe'); if (f) f.remove(); slot.classList.add('hidden'); } setPlaying(slide, false); }
  function setPlaying(slide, on) {
    const btn = slide.querySelector('[data-trailer-toggle]'); if (!btn) return;
    btn.querySelector('.play-icon')?.classList.toggle('hidden', on);
    btn.querySelector('.stop-icon')?.classList.toggle('hidden', !on);
  }
  function trailerClusterHtml() {
    const bs = 'inline-flex h-9 w-9 items-center justify-center rounded-full border border-white/25 bg-black/55 text-white backdrop-blur-md transition hover:border-white/40 hover:bg-black/70';
    return `<div style="position:absolute;bottom:20px;right:20px;z-index:30;display:flex;gap:8px">
      <button data-trailer-mute data-muted="1" class="${bs}" title="Sesi aç / kapat">
        <svg class="vol-off h-4 w-4" viewBox="0 0 24 24" fill="currentColor"><path d="M3 9v6h4l5 5V4L7 9H3z"/><path d="M16 9l5 6M21 9l-5 6" stroke="currentColor" stroke-width="2" fill="none" stroke-linecap="round"/></svg>
        <svg class="vol-on h-4 w-4 hidden" viewBox="0 0 24 24" fill="currentColor"><path d="M3 9v6h4l5 5V4L7 9H3z"/><path d="M16 8.5a5 5 0 0 1 0 7" stroke="currentColor" stroke-width="2" fill="none" stroke-linecap="round"/></svg>
      </button>
      <button data-trailer-toggle class="${bs}" title="Fragmanı oynat / durdur">
        <svg class="play-icon h-4 w-4" viewBox="0 0 24 24" fill="currentColor"><path d="M8 5v14l11-7z"/></svg>
        <svg class="stop-icon h-4 w-4 hidden" viewBox="0 0 24 24" fill="currentColor"><rect x="6" y="6" width="12" height="12" rx="2"/></svg>
      </button>
    </div>`;
  }
  function hostOf(btn) { return btn.closest('.slide') || btn.closest('[data-trailer-host]'); }
  function toggleTrailer(btn) {
    const host = hostOf(btn);
    const slot = host && host.querySelector('.trailer-slot');
    if (!slot) return;
    if (slot.classList.contains('hidden')) {
      const key = slot.dataset.key;
      if (key) { inject(slot, key); setPlaying(host, true); }
      else if (host.classList.contains('slide')) playTrailer(host);
    } else stopTrailer(host);
  }
  function toggleMute(btn) {
    const host = hostOf(btn);
    const slot = host && host.querySelector('.trailer-slot');
    const f = slot && slot.querySelector('iframe');
    const muted = btn.dataset.muted !== '0';
    const next = !muted;
    if (f) { try { f.contentWindow.postMessage(JSON.stringify({ event: 'command', func: next ? 'mute' : 'unMute', args: [] }), '*'); } catch (e) {} }
    btn.dataset.muted = next ? '1' : '0';
    btn.querySelector('.vol-on')?.classList.toggle('hidden', next);
    btn.querySelector('.vol-off')?.classList.toggle('hidden', !next);
  }

  // ========== DİL / TÜR MENÜLERİ ==========
  function populateLangDropdown() {
    const grid = document.querySelector('#langDropdown [data-lang-grid]'); if (!grid) return;
    grid.innerHTML = Object.keys(LANGS).map(code => `
      <button data-lang="${code}" class="flex w-full items-center justify-between gap-2 px-4 py-2 text-sm ${code === lang ? 'text-white' : 'text-content-secondary'} transition-colors hover:bg-white/[0.06] hover:text-white">
        <span class="truncate">${esc(LANGS[code].name)}</span>
        <span class="shrink-0 text-[10px] font-semibold uppercase tracking-wider ${code === lang ? 'text-accent' : 'text-content-muted'}">${code === lang ? '✓' : code.toUpperCase()}</span>
      </button>`).join('');
  }
  function setLang(code) {
    if (!LANGS[code]) return;
    lang = code; localStorage.setItem('nf_lang', code);
    applyStatic(); populateLangDropdown(); populateGenresDropdown(); populateFooterGenres();
    resolve(); // mevcut rotayı yeni dille yeniden kur
  }
  // Türler dropdown'u yalnızca içeriğimizin gerçekten kapsadığı türlerden oluşur.
  function populateGenresDropdown() {
    const grid = document.querySelector('#turlerDropdown [data-dd-grid]'); if (!grid) return;
    const genres = vodGenres();
    grid.innerHTML = genres.map(g => `
      <a href="#/katalog/tur/${encodeURIComponent(g.name)}" class="group flex items-center gap-2 rounded-lg px-3 py-2 text-sm text-content-secondary transition-colors hover:bg-white/[0.06] hover:text-white">
        <svg viewBox="0 0 20 20" class="h-4 w-4 shrink-0 text-content-muted transition-colors group-hover:text-accent" fill="currentColor"><path d="M4 5h16v3H4zM4 10h16v3H4zM4 15h10v3H4z"/></svg>
        <span class="min-w-0 flex-1 truncate">${esc(gName(g.name))}</span>
        <span class="shrink-0 text-[10px] text-content-muted">${g.count}</span>
      </a>`).join('');
    const cnt = document.querySelector('#turlerDropdown [data-count]'); if (cnt) cnt.textContent = genres.length;
  }
  function populateFooterGenres() {
    const ul = document.querySelector('[data-footer-genres]'); if (!ul) return;
    const genres = vodGenres().slice(0, 7);
    ul.innerHTML = genres.map(g => `<li><a href="#/katalog/tur/${encodeURIComponent(g.name)}" data-genre="${esc(g.name)}" class="inline-block py-1 text-content-secondary transition hover:text-white">${esc(gName(g.name))}</a></li>`).join('');
  }

  // ========== KEŞFET SİHİRBAZI ÇIKTISI ==========
  function runWizard(genre) {
    const res = document.getElementById('wizardResult'); if (!res) return;
    let pool = V ? V.films.filter(f => (f.genres || []).some(g => g.toLowerCase() === (genre || '').toLowerCase())) : [];
    if (pool.length < 6) pool = (V ? V.films : []).slice();
    const cards = V.rand(pool, 12).map(V.filmCard);
    res.innerHTML = `<h2 class="mb-4 section-title">${esc(gName(genre))} · ${esc(t('wizard.title'))}</h2>
      <div class="grid grid-cols-2 gap-x-4 gap-y-7 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6">${cards.map(posterCard).join('')}</div>`;
    res.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }

  // ========== İLETİŞİM GÖNDERİMİ (alıcı arayüzde gizli) ==========
  async function handleContact(form) {
    const msg = document.getElementById('contactMsg');
    const fd = new FormData(form);
    const payload = { name: (fd.get('name') || '').toString(), email: (fd.get('email') || '').toString(), topic: (fd.get('topic') || '').toString(), message: (fd.get('message') || '').toString() };
    if (!payload.name || !payload.email || !payload.message) { if (msg) { msg.textContent = t('contact.error'); msg.style.color = '#ffa3aa'; } return; }
    const btn = form.querySelector('button[type=submit]'); const orig = btn ? btn.textContent : '';
    if (btn) { btn.disabled = true; btn.textContent = t('contact.sending'); }
    if (msg) msg.textContent = '';
    let ok = false;
    try { const r = await window.notflix.mail.send(payload); ok = !!(r && r.ok); } catch (e) { ok = false; }
    if (btn) { btn.disabled = false; btn.textContent = orig; }
    if (msg) { msg.textContent = ok ? t('contact.success') : t('contact.error'); msg.style.color = ok ? '#12d9a0' : '#ffa3aa'; }
    if (ok) form.reset();
  }

  // ========== SPLASH SÜRÜCÜSÜ (worker ile aynı ritüel) ==========
  function runSplash() {
    const sp = document.getElementById('splash'); if (!sp) return;
    const shot = location.search.indexOf('shot=1') !== -1;
    if (shot) { sp.remove(); return; }
    const LINES = ['splash.l1', 'splash.l2', 'splash.l3', 'splash.l4'];
    const hint = document.getElementById('splashHint');
    const enter = document.getElementById('splashEnter');
    let done = false; let i = 0;
    const hide = () => { if (done) return; done = true; clearInterval(timer); sp.classList.add('gone'); setTimeout(() => sp.remove(), 500); };
    enter && enter.addEventListener('click', hide);
    if (hint) hint.textContent = t(LINES[0]);
    const timer = setInterval(() => {
      i++; if (i < LINES.length) { if (hint) hint.textContent = t(LINES[i]); }
      else { clearInterval(timer); }
    }, 2600);
    setTimeout(hide, 10400);
  }

  // ========== THEME (shot modu çekimleri için) ==========
  const link = document.getElementById('themeCss');
  const RAW = 'assets/css/filmmodu.raw.css';
  const ALT = 'assets/css/filmmodu.notflix.css';
  let tema = 'site';
  window.setTema = function (ad) {
    tema = ad;
    document.documentElement.dataset.tema = ad;
    if (link) link.href = ad === 'site' ? RAW : ALT;
  };

  // ========== BİLDİRİMLER (zil + modal havuz) ==========
  const NOTIFS = [
    {
      id: 'mobil-tvbox', tag: 'Duyuru', date: '10 Kasım 2026', icon: 'devices',
      title: 'Android Mobil & TV Box — Çok Yakında',
      body: 'Büyük ekran keyfi artık her ekranda. Android mobil uygulamamız ve TV Box sürümümüz çok yakında sizlerle: televizyonunuzda kumandayla, telefonunuzda yanınızda — aynı liste, aynı kalite, aynı sinema deneyimi. Geliştirme tüm hızıyla sürüyor; hazır olduğunda ilk burada duyuracağız.',
      devices: true
    },
    {
      id: 'vizyon-durus', tag: 'Vizyon ve Duruş', date: '10 Kasım 2026', icon: 'flag',
      title: 'Yolumuz Uzun, Adımlarımız Emin',
      body: 'Projemize yapılan yapıcı ya da olumsuz her türlü eleştiriye saygımız sonsuz; her geri bildirim bizi daha ileri taşır. Ancak vizyonumuzu gölgelemeye çalışanlara inat, Android ve TV Box projemizi hayata geçirme kararı aldık. Bu adımlarla artık kimsenin ne dediğine kulak asmadan, bu yolda gidebildiği kadar uzun süre, emin adımlarla yürüyeceğiz. Sözümüz aynı: sizlere evinizde sinema keyfini ve canlı kanal deneyimini en üst seviyede yaşatmaya devam edeceğiz. Bize inanan herkesin yanındayız.'
    },
    {
      id: 'sistem-kalite', tag: 'Sistem', date: '10 Kasım 2026', icon: 'spark',
      title: 'Arayüz ve Oynatma Baştan Yenilendi',
      body: 'NOTFLİX artık tamamen kendi yerel arayüzüyle çalışıyor: sayfalar daha hızlı açılıyor, menüler ve kartlar tek bir düzen dilinde birleşti. Oynatıcıya kalite seçimi, oynatma hızı, resim içinde resim ve gerçek tam ekran eklendi; yayın adresleri arka planda sessizce tazeleniyor, böylece "açılmıyor" sorunları en aza iniyor. Katalog, afişler ve içerik bilgileri düzenli olarak güncelleniyor. Kısacası sistem kalitesi gözle görülür şekilde yükseldi — güncel kalmanız için her sürümde bu iyileştirmeler sürecek.'
    },
    {
      id: 'yeni-sekmeler', tag: 'Arayüz', date: '9 Kasım 2026', icon: 'grid',
      title: 'Takvim ve IMDB Top 250 Geldi',
      body: 'Üst menüye iki yeni sekme eklendi. Yayın Takvimi, bu hafta yeni bölümü çıkan dizileri gün gün listeler; katalogda olanlar tek tıkla açılır. IMDB Top 250 ise tüm zamanların en iyi filmlerini sıralar — katalogda bulunanlar doğrudan oynatılır.'
    },
    {
      id: 'oynatici', tag: 'Oynatıcı', date: '8 Kasım 2026', icon: 'play',
      title: 'Yeni Nesil Oynatıcı',
      body: 'Kalite seçimi (Auto / 1080p / 720p), 0.5x–2x hız, ses düzeyi, tam ekran ve resim içinde resim tek bir kontrol çubuğunda. Fareyi bıraktığında kontroller kaybolur, hareket ettirdiğinde anında geri gelir; izlerken hiçbir şey ekranı kapatmaz.'
    },
    {
      id: 'kutuphane', tag: 'Arayüz', date: '7 Kasım 2026', icon: 'bookmark',
      title: 'Kütüphane: Listen Hep Yanında',
      body: 'Beğendiğin film ve dizileri "Listeme Ekle" ile kaydet; Kütüphane sekmesinden hepsine tek yerde ulaş. Listen cihazında saklanır, kaybolmaz.'
    },
    {
      id: 'canli-tv', tag: 'Canlı TV', date: '6 Kasım 2026', icon: 'live',
      title: 'Canlı TV Türkiye Kanalları A–Z',
      body: 'Canlı TV sekmesinde Türkiye kanalları alfabetik sırada. Kanalını seç, tam ekran yap; gerisini bize bırak. Yayınlar kesintisiz izlenir.'
    }
  ];
  const NF_READ_KEY = 'nf_notif_read';
  function nfReadSet() { try { return new Set(JSON.parse(localStorage.getItem(NF_READ_KEY) || '[]')); } catch (e) { return new Set(); } }
  function nfSaveRead(s) { try { localStorage.setItem(NF_READ_KEY, JSON.stringify([...s])); } catch (e) {} }
  function updateBellDot() {
    const dot = document.getElementById('nfBellDot');
    if (!dot) return;
    const read = nfReadSet();
    dot.classList.toggle('hidden', NOTIFS.every(n => read.has(n.id)));
  }
  const NF_ICONS = {
    devices: '<rect x="2" y="4" width="13" height="9" rx="1.5"/><path d="M6 16h5M8.5 13v3"/><rect x="16" y="9" width="5" height="10" rx="1.2"/><path d="M18 17h1"/>',
    flag: '<path d="M5 21V4m0 1h12l-2.5 3.5L17 12H5"/>',
    spark: '<path d="M12 2v4m0 12v4M2 12h4m12 0h4M5 5l2.5 2.5M16.5 16.5 19 19M19 5l-2.5 2.5M7.5 16.5 5 19"/>',
    grid: '<rect x="3" y="3" width="7" height="7" rx="1.5"/><rect x="14" y="3" width="7" height="7" rx="1.5"/><rect x="3" y="14" width="7" height="7" rx="1.5"/><rect x="14" y="14" width="7" height="7" rx="1.5"/>',
    play: '<circle cx="12" cy="12" r="9"/><path d="M10 8.5v7l5.5-3.5z"/>',
    bookmark: '<path d="M6 3h12a1 1 0 0 1 1 1v17l-7-4-7 4V4a1 1 0 0 1 1-1z"/>',
    live: '<circle cx="12" cy="12" r="2.2" fill="currentColor" stroke="none"/><path d="M7.5 7.5a6.4 6.4 0 0 0 0 9M16.5 7.5a6.4 6.4 0 0 1 0 9M4.7 4.7a10.4 10.4 0 0 0 0 14.6M19.3 4.7a10.4 10.4 0 0 1 0 14.6"/>'
  };
  function devicesSvg() {
    return `<div class="nf-devices" aria-hidden="true"><svg viewBox="0 0 320 120" fill="none">
      <g class="nf-phone-g"><rect x="52" y="30" width="34" height="62" rx="6" stroke="#8a8f98" stroke-width="2"/><rect class="nf-screen" x="57" y="37" width="24" height="44" rx="2" fill="#e50914" opacity=".7"/><circle cx="69" cy="86" r="2" fill="#8a8f98"/></g>
      <g><rect x="130" y="22" width="120" height="72" rx="8" stroke="#8a8f98" stroke-width="2"/><rect class="nf-screen" x="138" y="30" width="104" height="56" rx="4" fill="#e50914" opacity=".55"/><path d="M172 102h36" stroke="#8a8f98" stroke-width="3" stroke-linecap="round"/><path d="M190 94v8" stroke="#8a8f98" stroke-width="3"/></g>
      <g stroke="#ff6b72" stroke-width="2" stroke-linecap="round"><path class="nf-wave" d="M268 48a14 14 0 0 1 0 24"/><path class="nf-wave w2" d="M276 40a26 26 0 0 1 0 40"/></g>
      <text x="160" y="116" text-anchor="middle" fill="rgba(255,255,255,.45)" font-size="9" letter-spacing="3" font-family="sans-serif">ÇOK YAKINDA</text>
    </svg></div>`;
  }
  let _nfModal = null;
  function closeNotifications() { if (_nfModal) { _nfModal.remove(); _nfModal = null; } }
  function openNotifications() {
    closeNotifications();
    const read = nfReadSet();
    const items = NOTIFS.map(n => `
      <article class="nf-notif ${read.has(n.id) ? '' : 'unread'}">
        ${read.has(n.id) ? '' : '<span class="nf-unread-dot"></span>'}
        <div class="flex items-center justify-between gap-3">
          <span class="nf-tag"><svg class="h-3 w-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">${NF_ICONS[n.icon] || NF_ICONS.spark}</svg>${esc(n.tag)}</span>
          <span class="nf-date">${esc(n.date)}</span>
        </div>
        <h3>${esc(n.title)}</h3>
        ${n.devices ? devicesSvg() : ''}
        <p>${esc(n.body)}</p>
      </article>`).join('');
    const el = document.createElement('div');
    el.className = 'nf-modal-backdrop';
    el.innerHTML = `
      <div class="nf-modal" role="dialog" aria-label="Bildirimler">
        <div class="nf-modal-head">
          <span class="flex h-10 w-10 items-center justify-center rounded-full bg-accent/15 text-accent ring-1 ring-accent/30"><svg class="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M6 8a6 6 0 1 1 12 0c0 7 3 8 3 8H3s3-1 3-8"/><path d="M10 20a2 2 0 0 0 4 0"/></svg></span>
          <div class="min-w-0 flex-1">
            <h2 class="text-base font-bold text-white">Bildirimler</h2>
            <p class="text-xs text-content-muted">${NOTIFS.length} bildirim • duyurular ve yenilikler</p>
          </div>
          <button data-nf-readall class="rounded-pill border border-white/10 px-3 py-1.5 text-[11px] font-semibold text-content-secondary transition hover:border-accent/50 hover:text-white">Tümünü okundu işaretle</button>
          <button data-nf-close class="flex h-9 w-9 items-center justify-center rounded-full text-content-secondary transition hover:bg-white/10 hover:text-white" aria-label="Kapat"><svg class="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M18 6 6 18M6 6l12 12"/></svg></button>
        </div>
        <div class="nf-pool">${items}</div>
      </div>`;
    el.addEventListener('click', e => {
      if (e.target === el || e.target.closest('[data-nf-close]')) { closeNotifications(); return; }
      if (e.target.closest('[data-nf-readall]')) {
        nfSaveRead(new Set(NOTIFS.map(n => n.id)));
        el.querySelectorAll('.nf-notif.unread').forEach(a => { a.classList.remove('unread'); const d = a.querySelector('.nf-unread-dot'); if (d) d.remove(); });
        updateBellDot();
      }
    });
    document.body.appendChild(el);
    _nfModal = el;
    // Açılışta havuzdaki her şey okundu sayılır; zil noktası söner.
    nfSaveRead(new Set(NOTIFS.map(n => n.id)));
    updateBellDot();
  }
  function initNotifications() {
    const bell = document.getElementById('nfBell');
    if (bell) bell.addEventListener('click', openNotifications);
    updateBellDot();
    document.addEventListener('keydown', e => {
      if (e.key !== 'Escape') return;
      if (_gateOpen) { e.stopImmediatePropagation(); return; }
      if (_nfModal) { e.stopImmediatePropagation(); closeNotifications(); }
    }, true);
  }

  // ========== ZORUNLU GÜNCELLEME KAPISI ==========
  let _gateOpen = false, _gateEl = null;
  function showUpdateGate(r) {
    if (_gateOpen) return;
    _gateOpen = true;
    closeNotifications();
    const el = document.createElement('div');
    el.className = 'nf-gate';
    el.innerHTML = `
      <div class="nf-gate-card" role="alertdialog" aria-label="Güncelleme gerekli">
        <div class="nf-gate-ico"><svg class="h-8 w-8" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 3v12m0 0 4.5-4.5M12 15l-4.5-4.5"/><path d="M4 17v2a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-2"/></svg></div>
        <p class="text-[11px] font-bold uppercase tracking-[0.22em] text-accent">Güncelleme gerekli</p>
        <h2 class="mt-2 text-2xl font-bold text-white">Yeni sürüm hazır: ${esc(r.latest)}</h2>
        <p class="mt-3 text-sm leading-relaxed text-content-secondary">Daha iyi bir deneyim için güncelleme geldi. En son iyileştirmelerden faydalanabilmen için şimdi güncellemen gerekiyor; güncelleme tamamlanana kadar uygulama kullanılamaz. İndirme bitince kurulum otomatik başlar.</p>
        ${r.notes ? `<p class="mt-3 rounded-card border border-white/10 bg-white/[0.03] px-4 py-2.5 text-xs text-content-muted">${esc(r.notes)}</p>` : ''}
        <p class="mt-3 text-xs text-content-muted">Mevcut sürüm: ${esc(r.current)} → Yeni sürüm: ${esc(r.latest)}</p>
        <div class="nf-gate-bar" data-gate-bar hidden><i></i></div>
        <p class="mt-2 text-xs text-content-secondary" data-gate-status hidden></p>
        <button data-gate-go class="btn-accent mt-6 w-full justify-center py-3 text-base">Şimdi Güncelle</button>
        <p class="mt-3 text-[11px] text-content-muted" data-gate-err></p>
      </div>`;
    document.body.appendChild(el);
    _gateEl = el;
    const go = el.querySelector('[data-gate-go]');
    const bar = el.querySelector('[data-gate-bar]');
    const fill = bar.querySelector('i');
    const status = el.querySelector('[data-gate-status]');
    const err = el.querySelector('[data-gate-err]');
    const u = window.notflix && notflix.update;
    if (u && u.onProgress) u.onProgress(p => {
      if (!_gateOpen) return;
      bar.hidden = false; status.hidden = false;
      if (p.percent != null) { fill.style.width = p.percent + '%'; status.textContent = 'İndiriliyor… %' + p.percent; }
      else { fill.style.width = '100%'; status.textContent = 'İndiriliyor… ' + Math.round((p.downloaded || 0) / 1048576) + ' MB'; }
      if (p.phase === 'done') status.textContent = 'İndirme tamamlandı, kurulum başlıyor…';
    });
    go.addEventListener('click', async () => {
      go.disabled = true; go.textContent = 'İndiriliyor…'; err.textContent = '';
      bar.hidden = false; status.hidden = false; status.textContent = 'Başlatılıyor…';
      let d;
      try { d = await u.download(r.url); } catch (e) { d = { ok: false, error: String(e && e.message || e) }; }
      if (!d || !d.ok) {
        err.textContent = 'İndirme başarısız: ' + ((d && d.error) || 'bilinmeyen hata') + '. Tekrar deneyebilirsin.';
        go.disabled = false; go.textContent = 'Tekrar Dene';
        return;
      }
      go.textContent = 'Kuruluyor…'; status.textContent = 'Kurulum açılıyor, uygulama kapanacak…';
      try { await u.install(d.filePath); } catch (e) {
        err.textContent = 'Kurulum başlatılamadı. Tekrar dene.';
        go.disabled = false; go.textContent = 'Tekrar Dene';
      }
    });
  }
  async function checkUpdateGate() {
    if (_gateOpen) return;
    const u = window.notflix && notflix.update;
    if (!u || !u.check) return;
    let r; try { r = await u.check(); } catch (e) { return; }
    if (r && r.ok && r.update && r.url) showUpdateGate(r);
  }
  async function showJustInstalled() {
    const u = window.notflix && notflix.update;
    if (!u || !u.justInstalled) return;
    let r; try { r = await u.justInstalled(); } catch (e) { return; }
    if (!r || !r.ok) return;
    const el = document.createElement('div');
    el.className = 'nf-toast';
    el.innerHTML = '<svg class="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="20 6 9 17 4 12"/></svg> Güncelleme tamamlandı — en son sürümdesin.';
    document.body.appendChild(el);
    setTimeout(() => { el.style.opacity = '0'; el.style.transition = 'opacity .4s'; setTimeout(() => el.remove(), 450); }, 5000);
  }

  // ========== START ==========
  // Dil tercihini statik chrome'a uygula, menüleri VOD içeriğiyle doldur, splash'ı başlat.
  applyStatic();
  populateLangDropdown();
  populateGenresDropdown();
  populateFooterGenres();
  runSplash();
  initNotifications();
  checkUpdateGate();
  setInterval(checkUpdateGate, 6 * 3600 * 1000);
  showJustInstalled();

  // Dil menüsü tıklaması (header, #app dışında → doküman seviyesinde).
  document.addEventListener('click', e => {
    const li = e.target.closest('[data-lang]');
    if (li) { setLang(li.dataset.lang); document.querySelectorAll('.dd-panel').forEach(p => p.classList.add('hidden')); }
  });
  // İletişim formu gönderimi (#app içinde, submit olayı).
  document.addEventListener('submit', e => { if (e.target && e.target.id === 'contactForm') { e.preventDefault(); handleContact(e.target); } });
  // Arama: ana sayfa formu + arama sayfası formu + üst bardaki büyüteç.
  document.addEventListener('submit', e => {
    const f = e.target;
    if (!f || f.id === 'contactForm' || f.id === 'nfAuthForm') return;
    const inp = f.querySelector('input[name="q"]');
    if (!inp) return;
    e.preventDefault();
    const q = String(inp.value || '').trim();
    if (q) location.hash = '#/ara?q=' + encodeURIComponent(q);
  });
  const searchBtn = document.getElementById('nfSearchBtn');
  if (searchBtn) searchBtn.addEventListener('click', () => { location.hash = '#/ara'; });

  resolve();
  window.__notflixReady = true;
})();
