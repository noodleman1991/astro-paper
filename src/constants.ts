import { SITE } from "@/config";

interface Social {
  name: string;
  href: string;
  linkTitle: string;
  icon: string;
}

export const SOCIALS: Social[] = [
  {
    name: "LinkedIn",
    href: "https://www.linkedin.com/in/amit-lo/",
    linkTitle: `${SITE.title} on LinkedIn`,
    icon: "streamline-logos:linkedin-logo",
  },
  {
    name: "Mail",
    href: "mailto:hello@spiro-spero.zone",
    linkTitle: `Send an email to ${SITE.title}`,
    icon: "streamline-ultimate-color:send-email-envelope",
  },
] as const;

export const SHARE_LINKS: Social[] = [
  {
    name: "WhatsApp",
    href: "https://wa.me/?text=",
    linkTitle: `Share this post via WhatsApp`,
    icon: "streamline-logos:whatsapp-logo",
  },
  {
    name: "Facebook",
    href: "https://www.facebook.com/sharer.php?u=",
    linkTitle: `Share this post on Facebook`,
    icon: "streamline-logos:facebook-logo-1",
  },
  {
    name: "X",
    href: "https://x.com/intent/post?url=",
    linkTitle: `Share this post on X`,
    icon: "streamline-logos:x-twitter-logo",
  },
  {
    name: "Telegram",
    href: "https://t.me/share/url?url=",
    linkTitle: `Share this post via Telegram`,
    icon: "streamline-logos:telegram-logo-1",
  },
  {
    name: "Pinterest",
    href: "https://pinterest.com/pin/create/button/?url=",
    linkTitle: `Share this post on Pinterest`,
    icon: "streamline-logos:pinterest-logo",
  },
  {
    name: "Mail",
    href: "mailto:?subject=See%20this%20post&body=",
    linkTitle: `Share this post via email`,
    icon: "streamline-ultimate-color:send-email-envelope",
  },
] as const;
