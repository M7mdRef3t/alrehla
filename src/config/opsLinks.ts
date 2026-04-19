export const opsLinks = [
  {
    category: "Product Links",
    items: [
      { name: "Alrehla (Main)", url: "https://www.alrehla.app/" },
      { name: "Dawayir (Diagnostic)", url: "https://dawayir.alrehla.app/" },
      { name: "Masarat (Paths)", url: "https://masarat.alrehla.app/" },
      { name: "Session OS", url: "https://session.alrehla.app/" },
      { name: "Atmosfera", url: "https://atmosfera.alrehla.app/" },
    ]
  },
  {
    category: "Admin Ops",
    items: [
      { name: "Discovery Engine", url: "/admin/discovery" },
      { name: "Admin Radar", url: "/admin/radar" },
      { name: "Oracle Intelligence", url: "/admin/intelligence" },
      { name: "Test Activation", url: "/activation" },
    ]
  },
  {
    category: "Dev & Infra",
    items: [
      { name: "GitHub Repo", url: "https://github.com/M7mdRef3t/alrehla" },
      { name: "Vercel Project", url: "https://vercel.com/m7mdref3t/alrehla" },
      { name: "Supabase Dashboard", url: "https://supabase.com/dashboard/project/acvcnktpsbayowhurcmn" },
    ]
  },
  {
    category: "Distribution & Social",
    items: [
      { name: "TikTok", url: "https://tiktok.com/@alrehla" },
      { name: "Facebook", url: "https://facebook.com/alrehla" },
      { name: "WhatsApp Business", url: "https://web.whatsapp.com/" },
    ]
  }
];

/**
 * Single source of truth for payment details.
 * Used by /activation wizard and /admin/ops cockpit.
 * Do NOT hardcode this number anywhere else.
 */
export const revenueConfig = {
  currentMethod: "Vodafone Cash",
  number: "011110795932"
};

