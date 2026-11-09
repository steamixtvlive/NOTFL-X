# NOTFL-X

NOTFLİX masaüstü uygulaması.

## Güncelleme yayınlama

1. `package.json` içindeki `version` alanını artır (örn. `1.0.1`).
2. Yeni setup dosyasını GitHub Releases'e yükle.
3. `update.json` içindeki `version` ve `url` alanlarını güncelle.
4. Değişiklikleri `main` dalına gönder.

Uygulama açılışta `update.json` dosyasını kontrol eder. Yeni sürüm varsa sağ altta bildirim gösterir; **İndir ve Kur** düğmesi tarayıcı açmadan program içinde arka planda indirir (ilerleme çubuğunda gösterir) ve indirilen setup dosyasını sessiz (`/S`) kurup uygulamayı kapatır. `url` alanı doğrudan `.exe` bağlantısı da olabilir, `…/releases/latest` sayfası da olabilir; sayfa verilirse uygulama GitHub API ile `.exe` assetini otomatik bulur. İndirme veya kurulum başarısız olursa bildirimde hata gösterir ve sayfayı açma seçeneği sunar.

## Geliştirme

```powershell
npm install
npm run dev
```
