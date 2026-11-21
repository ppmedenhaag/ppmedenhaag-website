---
title: "Website kami pindah rumah: dari Hugo ke Astro, dari Netlify ke Cloudflare"
draft: false
date: "2026-11-21T12:00:00+01:00"
description: "Apa yang kami ubah di website PPME Den Haag, kenapa, dan apa yang akan Anda rasakan."
image: "images/blog/nieuwe-website.webp"
author: "PPME Den Haag"
categories: ["Blog"]
tags: ["Website"]
type: "post"
---

Assalamu'alaykum warrohmatullohi wabarokatuh

Mungkin Anda sudah menyadari: tampilan website PPME Den Haag sedikit berbeda. Sebagian besar perubahannya terjadi "di balik layar", jadi kami ingin menjelaskan secara singkat apa yang berubah dan mengapa.

## Sekilas menengok ke belakang

Website sebelumnya mulai tayang pada bulan Maret 2022, dibuat dengan Hugo dan di-host di Netlify. Untuk masa itu, pilihan tersebut sangat tepat: kami bisa meluncurkan website dengan cepat, dan tampilannya sudah responsif di ponsel. Website itu telah melayani kami dengan baik selama hampir lima tahun.

Hampir lima tahun adalah waktu yang panjang di dunia internet. Kebutuhan kami bertambah dan teknologi pun berkembang. Karena itu kami memilih teknologi baru, agar bisa berkomunikasi lebih baik dengan anggota maupun masyarakat umum, dan terus memberikan kontribusi kami bagi komunitas.

## Apa yang berubah?

- **Teknologi websitenya** diganti: dari Hugo ke Astro. Ini adalah "alat" yang dipakai untuk membuat halaman-halamannya.
- **Hosting-nya** pindah: dari Netlify ke Cloudflare. Ini adalah tempat website disimpan dan disajikan kepada pengunjung.
- **Tampilannya** dirapikan, supaya serasi dengan logo dan dengan aplikasi pendaftaran acara kami.

## Apa yang tetap sama?

Yang paling penting: **semua alamat (link) website tetap berfungsi**. Link yang pernah Anda simpan atau terima di grup WhatsApp tetap membawa Anda ke halaman yang benar. Link pendek di flyer, seperti `/zakat/`, juga masih jalan. Isinya sama, dan website tetap tersedia dalam bahasa Belanda, Indonesia, dan Inggris.

## Kenapa kami melakukannya?

Bukan satu alasan besar, melainkan beberapa alasan kecil:

- **Fondasi lama sudah tua.** Website sebelumnya berjalan di Hugo versi lama dengan tema yang penuh komponen lama. Setiap perubahan butuh usaha lebih banyak dari seharusnya, dan lama-lama sulit dirawat.
- **Mesin pencari dan tombol bagikan.** Website lama kekurangan beberapa hal dasar, sehingga Google kurang memahami halaman-halamannya dan link yang dibagikan di WhatsApp sering tidak menampilkan kartu pratinjau yang bagus.
- **Di ponsel bisa lebih baik.** Kebanyakan pengunjung membuka website lewat ponsel. Jadi website harus cepat terbuka dan nyaman dibaca.
- **Semua di satu tempat.** Dengan Cloudflare, hosting, caching, dan pengaturan keamanan kami atur di satu tempat. Setiap perubahan langsung tayang otomatis setelah kami simpan.

## Apa yang Anda rasakan?

Beberapa hal baru:

- **Pencarian.** Tekan `Ctrl + K` (atau `/`), atau ketuk ikon kaca pembesar, lalu cari di seluruh halaman.
- **Jadwal sholat** kini ada di website itu sendiri, di halaman depan dan di halaman jadwal tahunan di bawah menu Ibadah. Sebelumnya berupa halaman terpisah yang ditanam di dalam website.
- **Kalender dan berbagi.** Pada acara yang akan datang, Anda bisa menambahkannya ke kalender dengan satu klik dan membagikannya lewat WhatsApp.
- **Donasi.** Di halaman Sadaqah dan halaman depan kini ada tombol iDEAL, nomor rekening dengan tombol salin, dan kode QR.
- **Pratinjau link yang lebih bagus** saat halaman dibagikan.
- **Lebih cepat.** Lihat perbandingan di bawah.

## Lama dan baru berdampingan

Kami mengukur halaman depan di ponsel dengan Google PageSpeed Insights: kiri website lama, kanan website baru.

<div class="not-prose my-6 grid grid-cols-1 gap-4 sm:grid-cols-2">
  <figure class="m-0">
    <img src="/images/blog/pagespeed-hugo.webp" alt="Skor PageSpeed website lama: performa 80, aksesibilitas 85, best practices 88, SEO 100. Konten terbesar muncul setelah 4,6 detik." width="1000" height="845" loading="lazy" class="h-auto w-full rounded border border-slate-200" />
    <figcaption class="mt-2 text-center text-sm text-slate-500">Lama (Hugo + Netlify)</figcaption>
  </figure>
  <figure class="m-0">
    <img src="/images/blog/pagespeed-astro.webp" alt="Skor PageSpeed website baru: empat kali 100. Konten terbesar muncul setelah 1,5 detik." width="1000" height="845" loading="lazy" class="h-auto w-full rounded border border-slate-200" />
    <figcaption class="mt-2 text-center text-sm text-slate-500">Baru (Astro + Cloudflare)</figcaption>
  </figure>
</div>

Perbedaan terbesar: konten utama halaman kini tampil di layar sekitar 1,5 detik, dibanding 4,6 detik sebelumnya. Perlu diingat, ini satu kali pengukuran pada satu hari, dan skor seperti ini bisa naik-turun. Anggap sebagai gambaran arah, bukan janji.

## Apa yang belum ada?

Kami ingin jujur: tidak semuanya dipindahkan persis sama.

- Halaman-halaman lama untuk **tag, kategori, dan penulis** sudah tidak ada. Kalau Anda membuka link lama seperti itu, Anda akan otomatis dibawa ke halaman blog.
- Mungkin masih ada kesalahan kecil yang belum kami temukan. Halaman yang tampilannya aneh, link yang tidak berfungsi, teks yang keliru: semuanya mudah diperbaiki kalau kami tahu.

## Menemukan sesuatu yang aneh?

Kabari kami lewat [formulir kontak](/id/contact/). Ini sangat membantu, karena dengan begitu banyak halaman dalam tiga bahasa, kami sendiri tidak bisa melihat semuanya.

## Ingin ikut membantu?

Jika Anda anggota PPME Den Haag dan punya kemampuan IT, atau ingin belajar lebih banyak tentang IT dan pengembangan aplikasi web, silakan hubungi tim kami untuk ikut berkontribusi. Datang saja ke kantor PPME Den Haag di masjid, atau kirim email ke [info@ppmedenhaag.nl](mailto:info@ppmedenhaag.nl).

Jazakumullahu khairan, dan selamat menikmati website yang baru!

Salam hangat,

Tim IT PPME Den Haag
