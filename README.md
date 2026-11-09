# NOTFL-X

NOTFLİX masaüstü uygulaması.

## Güncelleme yayınlama

1. `package.json` içindeki `version` alanını artır (örn. `1.0.1`).
2. Yeni setup dosyasını GitHub Releases'e yükle.
3. `update.json` içindeki `version` ve `url` alanlarını güncelle.
4. Değişiklikleri `main` dalına gönder.

Uygulama açılışta `update.json` dosyasını kontrol eder. Yeni sürüm varsa sağ altta bildirim gösterir; **İndir** düğmesi setup bağlantısını tarayıcıda açar.

## Geliştirme

```powershell
npm install
npm run dev
```
