# 🎨 Smart Pot - Panduan Customization Sidebar

## Quick Customization Guide

### 1. 🎨 Mengubah Warna Sidebar

Buka file: `assets/css/style.css`

Cari bagian `.sidebar` dan ubah gradient background:

```css
.sidebar {
    width: 280px;
    background: linear-gradient(180deg, #059669 0%, #047857 100%);
    /* Ubah warna di atas sesuai keinginan */
}
```

**Contoh warna alternatif:**

#### Biru Modern
```css
background: linear-gradient(180deg, #3b82f6 0%, #1e40af 100%);
```

#### Ungu Elegant
```css
background: linear-gradient(180deg, #8b5cf6 0%, #6d28d9 100%);
```

#### Dark Mode
```css
background: linear-gradient(180deg, #1f2937 0%, #111827 100%);
```

#### Orange Warm
```css
background: linear-gradient(180deg, #f97316 0%, #ea580c 100%);
```

---

### 2. 📏 Mengubah Lebar Sidebar

Cari `.sidebar` dan `.main-wrapper`:

```css
/* Lebar Sidebar Normal */
.sidebar {
    width: 280px; /* Ubah angka ini */
}

/* Lebar Sidebar Collapsed */
.sidebar.collapsed {
    width: 80px; /* Ubah angka ini */
}

/* Margin Content Area */
.main-wrapper {
    margin-left: 280px; /* Sesuaikan dengan lebar sidebar */
}

.sidebar.collapsed + .main-wrapper {
    margin-left: 80px; /* Sesuaikan dengan lebar collapsed */
}
```

**Rekomendasi:**
- Sempit: 240px / 70px
- Standar: 280px / 80px  
- Lebar: 320px / 90px

---

### 3. 🔤 Mengubah Font/Typography

#### Font Sidebar Title
```css
.sidebar-title {
    font-family: 'Garamond', 'Segoe UI', sans-serif; /* Ganti font */
    font-size: 28px; /* Ganti size */
    font-weight: 900; /* Ganti weight */
    letter-spacing: 2px; /* Ganti spacing */
}
```

**Font alternatives:**
- Modern: `'Inter', sans-serif`
- Elegant: `'Playfair Display', serif`
- Tech: `'Roboto Mono', monospace`
- Clean: `'Poppins', sans-serif`

#### Font Menu Items
```css
.menu-item span {
    font-size: 15px; /* Ganti size */
    font-weight: 500; /* Ganti weight */
}
```

---

### 4. 🎯 Mengubah Logo Size

```css
.sidebar-logo {
    width: 80px; /* Ubah lebar */
    height: 80px; /* Ubah tinggi */
    padding: 12px; /* Ubah padding */
}

/* Saat Collapsed */
.sidebar.collapsed .sidebar-logo {
    width: 50px;
    height: 50px;
    padding: 8px;
}
```

---

### 5. 🌟 Mengubah Efek Hover Menu

```css
.menu-item:hover {
    background: rgba(255, 255, 255, 0.1); /* Transparansi background */
    color: white;
    transform: translateX(5px); /* Geser ke kanan */
}
```

**Efek alternatif:**
```css
/* Scale Effect */
.menu-item:hover {
    transform: scale(1.05);
}

/* Shadow Effect */
.menu-item:hover {
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.2);
}

/* Border Left Effect */
.menu-item:hover {
    border-left: 4px solid white;
}
```

---

### 6. 🎨 Mengubah Active Menu Style

```css
.menu-item.active {
    background: rgba(255, 255, 255, 0.2); /* Background */
    color: white;
    font-weight: 600;
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
}

/* Indicator Bar */
.menu-item.active::before {
    content: '';
    position: absolute;
    left: 0;
    top: 50%;
    transform: translateY(-50%);
    width: 4px; /* Lebar bar */
    height: 40px; /* Tinggi bar */
    background: white; /* Warna bar */
    border-radius: 0 4px 4px 0;
}
```

---

### 7. 🔘 Mengubah Tombol Logout

```css
.btn-logout {
    width: 100%;
    background: rgba(220, 38, 38, 0.9); /* Warna merah */
    color: white;
    padding: 12px 16px;
    border-radius: 8px;
}

.btn-logout:hover {
    background: #dc2626; /* Warna hover */
    transform: translateY(-2px); /* Efek angkat */
}
```

**Warna alternatif:**
```css
/* Dark Gray */
background: rgba(75, 85, 99, 0.9);

/* Orange Warning */
background: rgba(249, 115, 22, 0.9);

/* Blue */
background: rgba(59, 130, 246, 0.9);
```

---

### 8. 📱 Mengubah Responsive Breakpoint

```css
@media (max-width: 768px) { /* Ubah angka ini */
    .sidebar {
        transform: translateX(-100%);
    }
    
    .main-wrapper {
        margin-left: 0 !important;
    }
}
```

**Breakpoints umum:**
- Small Mobile: 480px
- Mobile: 768px
- Tablet: 1024px
- Desktop: 1280px

---

### 9. ⏱️ Mengubah Animation Speed

```css
.sidebar {
    transition: all 0.3s ease; /* Ubah durasi (0.3s) */
}

.menu-item {
    transition: all 0.3s ease; /* Ubah durasi */
}
```

**Speed options:**
- Cepat: 0.2s
- Normal: 0.3s
- Lambat: 0.5s

---

### 10. 🎭 Mengubah Shadow/Elevation

```css
/* Sidebar Shadow */
.sidebar {
    box-shadow: 4px 0 15px rgba(0, 0, 0, 0.1); /* X Y Blur Color */
}

/* Top Header Shadow */
.top-header {
    box-shadow: 0 2px 10px rgba(0, 0, 0, 0.05);
}

/* Card Shadow */
.demo-card {
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
}
```

**Shadow alternatives:**
```css
/* Soft Shadow */
box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);

/* Strong Shadow */
box-shadow: 0 8px 24px rgba(0, 0, 0, 0.15);

/* No Shadow */
box-shadow: none;
border: 1px solid #e5e7eb;
```

---

### 11. 🎨 Mengubah Background Content Area

```css
.main-content {
    padding: 40px;
    flex: 1;
    background: #f3f4f6; /* Ubah warna background */
}
```

**Background alternatives:**
```css
/* Pure White */
background: #ffffff;

/* Light Gray */
background: #f9fafb;

/* Dark Mode */
background: #1f2937;

/* Gradient */
background: linear-gradient(135deg, #f3f4f6 0%, #e5e7eb 100%);
```

---

### 12. 🔲 Mengubah Border Radius

```css
/* Menu Items */
.menu-item {
    border-radius: 10px; /* Ubah nilai */
}

/* Cards */
.demo-card {
    border-radius: 12px;
}

/* Buttons */
.btn-logout {
    border-radius: 8px;
}
```

**Radius options:**
- Sharp: 0px
- Slight: 4px
- Medium: 8px
- Rounded: 12px
- Very Rounded: 16px

---

## 💡 Tips Customization

### 1. Gunakan CSS Variables untuk konsistensi
Tambahkan di bagian atas CSS:

```css
:root {
    --sidebar-bg-start: #059669;
    --sidebar-bg-end: #047857;
    --sidebar-width: 280px;
    --sidebar-width-collapsed: 80px;
    --transition-speed: 0.3s;
}

.sidebar {
    width: var(--sidebar-width);
    background: linear-gradient(180deg, var(--sidebar-bg-start) 0%, var(--sidebar-bg-end) 100%);
    transition: all var(--transition-speed) ease;
}
```

### 2. Test di berbagai device
- Desktop (1920x1080)
- Laptop (1366x768)
- Tablet (768x1024)
- Mobile (375x667)

### 3. Gunakan browser DevTools
- Inspect element untuk melihat CSS yang diapply
- Try different values live sebelum commit ke file

### 4. Backup file sebelum modifikasi
```bash
# Copy file CSS
cp assets/css/style.css assets/css/style.backup.css
```

---

## 🚀 Quick Color Schemes

### Scheme 1: Nature Green (Current)
```css
Sidebar: #059669 → #047857
Accent: #10b981
Background: #f3f4f6
```

### Scheme 2: Ocean Blue
```css
Sidebar: #0ea5e9 → #0284c7
Accent: #06b6d4
Background: #f0f9ff
```

### Scheme 3: Sunset Orange
```css
Sidebar: #f97316 → #ea580c
Accent: #fb923c
Background: #fff7ed
```

### Scheme 4: Royal Purple
```css
Sidebar: #8b5cf6 → #7c3aed
Accent: #a78bfa
Background: #faf5ff
```

### Scheme 5: Dark Professional
```css
Sidebar: #1f2937 → #111827
Accent: #10b981
Background: #f9fafb
```

---

## 📞 Need Help?

Jika mengalami masalah saat customization:

1. **Clear browser cache** - Ctrl+F5 atau Ctrl+Shift+R
2. **Check browser console** - F12 untuk melihat error
3. **Validate CSS** - Pastikan syntax CSS benar
4. **Test incremental** - Ubah satu hal dulu, test, baru lanjut

---

## ✅ Customization Checklist

Sebelum deploy perubahan:

- [ ] Test di Chrome/Edge
- [ ] Test di Firefox
- [ ] Test di Safari (jika available)
- [ ] Test responsive (mobile view)
- [ ] Test toggle collapse/expand
- [ ] Test active menu highlighting
- [ ] Verify logo masih terlihat baik
- [ ] Check font readability
- [ ] Verify color contrast
- [ ] Test hover effects
- [ ] Test logout button

---

**Happy Customizing! 🎨✨**
