export type SiteConfig = typeof siteConfig;

export const siteConfig = {
  name: "fógraí",
  title: "fógraí",
  description: "fógraí is an online classifieds platform for Ireland",
  keywords: "classifieds, ads, buy, sell, trade",
  navItems: [
    {
      label: "Home",
      href: "/",
    },
    {
      label: "Login",
      href: "/auth",
    },
  ],
  navMenuItems: [
    {
      label: "Profile",
      href: "/profile",
    },
    {
      label: "Logout",
      href: "/logout",
    },
  ],
  links: {
    github: "https://github.com/fograi/fogr.ai",
  },
};
