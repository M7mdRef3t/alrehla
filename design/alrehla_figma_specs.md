# Figma Design Specifications — الرحلة (Alrehla)
> مبني من `design/tokens.json` مباشرة · إصدار 1.0

---

## 1. هيكل الملف في Figma (File Architecture)

```
📁 Alrehla Design System
  ├── 📄 🎨 Tokens         ← Variables + Styles
  ├── 📄 🧩 Components     ← Base components
  ├── 📄 📱 Screens        ← Full-page frames
  └── 📄 🔀 Prototype Flow ← Connections & interactions
```

---

## 2. Design Tokens — Figma Variables

### إعداد المجموعات (Collections)

#### Collection: Color
| Variable Name | Value | Mode |
|--------------|-------|------|
| `color/space/void` | `#0a0e1f` | Dark (default) |
| `color/space/950` | `#0f1629` | Dark |
| `color/space/deep` | `#131a35` | Dark |
| `color/space/mid` | `#1a2242` | Dark |
| `color/space/nebula` | `#212b4f` | Dark |
| `color/space/aurora` | `#2a3560` | Dark |
| `color/brand/teal-400` | `#2dd4bf` | All |
| `color/brand/teal-500` | `#14b8a6` | All |
| `color/brand/amber-500` | `#f5a623` | All |
| `color/brand/emerald-500` | `#10b981` | All |
| `color/brand/rose-400` | `#f87171` | All |
| `color/text/primary` | `#f1f5f9` | Dark |
| `color/text/secondary` | `#94a3b8` | Dark |
| `color/text/muted` | `rgba(148,163,184,0.5)` | Dark |
| `color/border/default` | `rgba(255,255,255,0.07)` | Dark |
| `color/border/hover` | `rgba(255,255,255,0.14)` | Dark |
| `color/glass/default` | `rgba(15,23,42,0.6)` | Dark |
| `color/ring/safe` | `#2dd4bf` | All |
| `color/ring/caution` | `#f5a623` | All |
| `color/ring/danger` | `#f87171` | All |
| `color/ring/detached` | `#94a3b8` | All |

> **ملاحظة:** أنشئ Mode ثانياً (Light) في المستقبل إذا احتجته — الهيكل يدعمذلك.

---

#### Collection: Spacing
| Variable Name | Value |
|--------------|-------|
| `spacing/1` | `8` |
| `spacing/2` | `16` |
| `spacing/3` | `24` |
| `spacing/4` | `32` |
| `spacing/5` | `40` |
| `spacing/6` | `48` |
| `spacing/8` | `64` |
| `spacing/10` | `80` |
| `spacing/12` | `96` |

#### Collection: Radius
| Variable Name | Value |
|--------------|-------|
| `radius/sm` | `8` |
| `radius/base` | `12` |
| `radius/lg` | `20` |
| `radius/xl` | `28` |
| `radius/full` | `9999` |

#### Collection: Typography
| Variable Name | Value |
|--------------|-------|
| `font/family/display` | `Almarai` |
| `font/family/body` | `IBM Plex Sans Arabic` |
| `font/size/display` | `64` |
| `font/size/h1` | `36` |
| `font/size/h2` | `28` |
| `font/size/h3` | `22` |
| `font/size/h4` | `18` |
| `font/size/body-lg` | `16` |
| `font/size/body` | `14` |
| `font/size/caption` | `12` |
| `font/size/label` | `10` |
| `font/weight/display` | `800` |
| `font/weight/h` | `800` |
| `font/weight/body` | `400` |
| `font/weight/label` | `700` |
| `line-height/body` | `1.6` |
| `line-height/h` | `1.2` |

---

## 3. Text Styles (Figma Styles Panel)

> اضبط كل أسلوب نصي من `Type Style Panel` → `+`

| اسم الأسلوب | الخط | الحجم | الوزن | Line Height | Direction |
|------------|------|-------|-------|------------|-----------|
| `Display/Bold` | Almarai | 64 | 800 | 70 | RTL |
| `Heading/H1` | Almarai | 36 | 800 | 44 | RTL |
| `Heading/H2` | Almarai | 28 | 800 | 36 | RTL |
| `Heading/H3` | Almarai | 22 | 700 | 30 | RTL |
| `Heading/H4` | Almarai | 18 | 700 | 26 | RTL |
| `Body/LG` | IBM Plex Sans Arabic | 16 | 400 | 28 | RTL |
| `Body/Base` | IBM Plex Sans Arabic | 14 | 400 | 22 | RTL |
| `Caption` | IBM Plex Sans Arabic | 12 | 500 | 18 | RTL |
| `Label/Uppercase` | IBM Plex Sans Arabic | 10 | 700 | 14 | RTL |

---

## 4. الإطارات الرئيسية (Frame Structure)

### نقاط التوقف (Breakpoints)

| الاسم | العرض | الاستخدام |
|-------|-------|-----------|
| Mobile | 390 | iPhone 15 |
| Tablet | 768 | iPad |
| Desktop | 1280 | الشاشة الرئيسية |
| Wide | 1440 | Wide screens |

### إعدادات كل إطار

**Desktop Frame:**
```
Width: 1280   Height: Auto
Direction: Horizontal (صف)
Background: color/space/void
Overflow: Scroll (vertical)
```

**Sidebar Frame:**
```
Width: 240   Height: Fill Container
Direction: Vertical (عمود)
Background: color/space/deep
Padding: 24, 16
Gap: 8
```

**Content Area Frame:**
```
Width: Fill Container   Height: Auto
Direction: Vertical
Padding: 32 (all)
Gap: 24
```

---

## 5. إعدادات Auto-Layout المفصّلة

### المبدأ العام
```
جميع الإطارات: RTL ← Hebrew Direction (عكس الافتراضي)
Direction: الأعمدة الرأسية أولاً، ثم الصفوف الأفقية داخلها
```

---

### مكوّن: Button

**Frame Name:** `Button/Base`

```
Direction:         Horizontal (→)
Align Items:       Center
Justify Content:   Center
Padding:
  Horizontal:      {spacing/3} = 24px
  Vertical:        {spacing/2} = 16px  (md)
                   {spacing/1} = 8px   (sm)
Gap:               {spacing/1} = 8px
Border Radius:     {radius/full}
Min Width:         120px
Height:            Auto (Hug Content)
```

**خصائص المكوّن (Component Properties):**
| الاسم | النوع | القيم |
|-------|-------|-------|
| `variant` | Variant | primary, secondary, ghost |
| `size` | Variant | sm, md, lg |
| `state` | Variant | default, hover, active, disabled |
| `hasIcon` | Boolean | true / false |
| `iconPosition` | Variant | right, left |
| `label` | Text | "ابدأ الآن" |

**المتغيرات حسب variant:**
| variant | Background | Text Color | Border |
|---------|-----------|-----------|--------|
| primary | color/brand/teal-400 | #0a0e1f | none |
| secondary | color/glass/default | color/text/primary | color/border/default |
| ghost | transparent | color/brand/teal-400 | none |

---

### مكوّن: Card

**Frame Name:** `Card/Base`

```
Direction:         Vertical (↓)
Padding:           {spacing/3} = 24px (all)
Gap:               {spacing/2} = 16px
Border Radius:     {radius/lg} = 20px
Fill:              color/glass/default
Stroke:            color/border/default / 1px / Inside
Effects:           Drop Shadow {shadow/base}
Sizing:            Fill Container (width) / Hug Content (height)
```

**خصائص المكوّن:**
| الاسم | النوع | القيم |
|-------|-------|-------|
| `variant` | Variant | default, elevated, bordered |
| `hasPadding` | Boolean | true / false |

---

### مكوّن: Badge

**Frame Name:** `Badge/Base`

```
Direction:         Horizontal
Align Items:       Center
Padding:           4px (vertical) / 10px (horizontal)
Gap:               4px
Border Radius:     {radius/full}
Height:            Hug Content
```

**خصائص المكوّن:**
| الاسم | النوع | القيم |
|-------|-------|-------|
| `color` | Variant | teal, amber, rose, emerald, slate |
| `size` | Variant | sm, md |
| `label` | Text | "نشط" |

---

### مكوّن: Orbit Ring

**Frame Name:** `Orbit/Ring`

```
ملاحظة: يُبنى بـ Ellipse + Stroke، لا بـ Rectangle
Width & Height:    Equal (للدائرة)
  Inner ring:      120px
  Middle ring:     240px
  Outer ring:      360px

Stroke:            2px / Center
  safe:            color/ring/safe
  caution:         color/ring/caution
  danger:          color/ring/danger
  detached:        color/ring/detached

Effects (Glow):
  safe:            Drop Shadow 0 0 24px rgba(45,212,191,0.6)
  caution:         Drop Shadow 0 0 24px rgba(245,166,35,0.6)
  danger:          Drop Shadow 0 0 24px rgba(248,113,113,0.5)

Constraints:       Center / Center
```

**Person Node (نقطة الشخص):**
```
Type: Ellipse
Width: 40px / Height: 40px
Fill: Stroke Color (حسب orbit state)
Stroke: 2px white
Inner text: أول حرف من الاسم (Body/Base · Bold)
Positioned: Absolute, على محيط الدائرة المحددة
```

---

### مكوّن: InputField

**Frame Name:** `Input/Base`

```
Direction:         Vertical
Gap:               {spacing/1} = 8px
Width:             Fill Container

Label:
  Text Style: Label/Uppercase
  Color: color/text/secondary

Input Box:
  Direction:       Horizontal
  Padding:         12px vertical / 16px horizontal
  Gap:             8px
  Background:      color/space/mid
  Border:          1px Inside color/border/default
  Border Radius:   {radius/base}
  Height:          48px
  Align:           Center

Error State:
  Border Color:    color/ring/danger
  + Error text below (Caption / color/ring/danger)
```

---

### مكوّن: Navigation Sidebar Item

**Frame Name:** `Nav/Item`

```
Direction:         Horizontal
Gap:               {spacing/2} = 16px
Align Items:       Center
Padding:           12px (vertical) / 16px (horizontal)
Border Radius:     {radius/base}
Width:             Fill Container
Height:            Hug Content

States:
  default:   background = transparent
  hover:     background = color/space/nebula
  active:    background = color/space/aurora
             + 3px right border = color/brand/teal-400
```

---

## 6. الشبكة (Grid System)

**Desktop Layout Grid:**
```
Type:    Grid
Columns: 12
Gutter:  8px
Margin:  24px (left & right)
Color:   rgba(45,212,191,0.08)  ← للعرض فقط
```

**كيفية التطبيق في Figma:**
1. افتح الـ Frame الرئيسي
2. Panel right → Layout Grid → `+`
3. اختر: Column / 12 / Margin 24 / Gutter 8

---

## 7. القيود (Constraints)

| العنصر | Horizontal | Vertical |
|--------|------------|---------|
| الـ Sidebar | Left | Top & Bottom (Stretch) |
| Main Content | Left & Right (Stretch) | Top |
| Orbit Canvas | Center | Center |
| Modal Overlay | Left & Right | Top & Bottom |
| CTA Button | Right | Bottom |
| Toast/Alert | Center | Bottom |

---

## 8. قواعد الاستجابة (Responsive Rules)

### Desktop → Tablet (768px)
- Sidebar يصبح: Bottom Navigation Bar (height: 60px)
- Grid: 12 columns → 8 columns
- Orbit: يُصغَّر بنسبة 0.75
- Font Display: 64px → 40px

### Tablet → Mobile (390px)
- Sidebar يختفي: يُستبدل بـ Tab Bar + Bottom Sheet للإعدادات
- Grid: يصبح 4 columns / margin 16px
- Card: Full width (no side margins)
- Orbit: يتكيّف مع الشاشة (Max 340px)

**Auto-Layout Responsive Strategy:**
```
Frame الرئيسي:
  Desktop: Direction = Horizontal (Sidebar + Content جنب لجنب)
  Tablet:  Direction = Vertical (Sidebar يصبح top Nav)
  Mobile:  Direction = Vertical (محتوى كامل + Bottom Nav)

→ استخدم Component Property "viewport" = [Desktop, Tablet, Mobile]
  لتبديل الـ variants
```

---

## 9. تدفقات البروتوتايب (Prototype Flows)

### Flow 1: Onboarding
```
Splash Screen
  ↓ Tap anywhere (Animation: Dissolve 300ms ease)
Welcome Screen
  ↓ Tap "ابدأ" (Animation: Smart Animate 250ms)
Add First Person Modal
  ↓ Tap "حفظ"
Orbit Map (first use — empty state)
  ↓ Auto-transition 500ms
Orbit Map (with person added)
```

### Flow 2: Add Person
```
Orbit Map
  ↓ Tap "+" button
Add Person Sheet (Bottom Sheet — Slide Up 300ms)
  → Fill name field
  → Select orbit
  → Tap "حفظ"
Orbit Map (with new node — Scale In 400ms)
```

### Flow 3: View Person Details
```
Orbit Map
  ↓ Tap on Person Node (Scale 1.1 → 1 feedback)
Person Detail Panel (Slide from right — 250ms)
  → Tabs: الحالة / التاريخ / الملاحظات
  ↓ Swipe down / Tap X
Back to Orbit Map (Slide to right)
```

### Flow 4: Change Orbit
```
Person Detail Panel
  ↓ Tap "تغيير المدار"
Orbit Selector (full screen overlay — Dissolve 200ms)
  ↓ Select orbit
Confirm dialog
  ↓ Confirm
Return to Orbit Map — node animates to new ring (Smart Animate)
```

---

## 10. إعدادات تسليم المطور (Dev Handoff)

### CSS Snippets للمكوّنات

**Button/Primary:**
```css
/* Button Primary */
display: inline-flex;
align-items: center;
justify-content: center;
gap: 8px;
padding: 16px 24px;
background: var(--color-brand-teal-400, #2dd4bf);
color: #0a0e1f;
font-family: 'Almarai', sans-serif;
font-size: 14px;
font-weight: 700;
border-radius: 9999px;
border: none;
cursor: pointer;
transition: filter 150ms cubic-bezier(0.22, 1, 0.36, 1);

/* Hover */
:hover { filter: brightness(1.1); }

/* Disabled */
:disabled { opacity: 0.4; cursor: not-allowed; }
```

**Card:**
```css
background: rgba(15, 23, 42, 0.6);
border: 1px solid rgba(255, 255, 255, 0.07);
border-radius: 20px;
padding: 24px;
box-shadow: 0 4px 24px rgba(0, 0, 0, 0.4);
backdrop-filter: blur(12px);
```

**Orbit Ring (Safe):**
```css
width: 240px;
height: 240px;
border-radius: 50%;
border: 2px solid #2dd4bf;
box-shadow: 0 0 24px rgba(45, 212, 191, 0.6);
```

---

### قواعد التسمية (Naming Conventions)

**المكوّنات:**
```
Component/Variant/State
Button/Primary/Default
Button/Secondary/Hover
Card/Elevated/Default
Badge/Teal/SM
Input/Base/Error
Orbit/Ring/Safe
Nav/Item/Active
```

**الألوان:**
```
color/[category]/[name]
color/brand/teal-400
color/space/void
color/ring/safe
```

**الطبقات (Layers):**
```
[type].[name].[state]
frame.sidebar.default
icon.chevron-right
text.label.muted
ellipse.orbit-ring.safe
```

---

### إعدادات التصدير (Export Settings)

| العنصر | Format | Scale | Suffix |
|--------|--------|-------|--------|
| Icons | SVG | 1x | — |
| Illustrations | SVG | 1x | — |
| Raster images | WebP | 2x | @2x |
| App icon | PNG | 1x, 2x, 3x | @1x / @2x / @3x |

---

## 11. ملاحظات قابلية الوصول (Accessibility)

### Contrast Ratios (مستخرجة من tokens.json)
| النص | الخلفية | النسبة | المستوى |
|------|---------|--------|---------|
| color/text/primary `#f1f5f9` | color/space/void `#0a0e1f` | **16.4:1** | ✅ AAA |
| color/text/secondary `#94a3b8` | color/space/void | **6.2:1** | ✅ AA |
| color/brand/teal-400 `#2dd4bf` | color/space/void | **8.1:1** | ✅ AA Large |
| color/text/muted (50% opacity) | color/space/void | **3.1:1** | ⚠️ UI only |

> **تحذير:** `color/text/muted` لا يُستخدم لنصوص قابلة للقراءة — للعناصر الزخرفية فقط.

---

### Focus States
```
All interactive elements:
  Outline: 2px dashed color/brand/teal-400
  Outline Offset: 2px
  Border Radius: يرث من العنصر

→ في Figma: أضف Overlay علـ variant "Focus"
  بـ border: 2px dashed #2dd4bf داخل الـ component
```

### Touch Target Sizes
```
Minimum: 44px × 44px (WCAG 2.5.5)

Button SM: height 36px → أضف padding invisible 4px حوله
Person Node: 40px → أضف Hit Area 44px × 44px
Nav Item: 48px height ✅
```

### اتجاه النص (Text Direction)
```
جميع العناصر: direction = RTL
  → Figma: Text Box → Direction → RTL
  → Auto-Layout RTL: اضبط "Text Direction" = RTL من في Frame settings
```

### ARIA Labels (للمطور)
```
Button: aria-label = محتوى الزر
Orbit Node: aria-label = "شخص: {name}، المدار: {orbit}"
Input: aria-label = label text
Icon-only button: aria-label مطلوب دائماً
```

---

## 12. Plugin Recommendations

| Plugin | الغرض |
|--------|--------|
| **Tokens Studio** | استيراد tokens.json مباشرة لـ Figma Variables |
| **Variables Import** | مزامنة الـ Variables مع الكود |
| **Figma to Code** | توليد CSS/Tailwind من المكوّنات |
| **A11y — Focus Orderer** | ترتيب Focus للوصول |
| **Arabic Text Support** | دعم الخطوط العربية |
| **Auto Flow** | إنشاء تدفقات البروتوتايب تلقائياً |
