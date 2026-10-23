import type { Category } from "./schema";

export const DEMOS: Array<{ id: string; label: string; category: Category; text: string }> = [
  {
    id: "usps",
    label: "Package text",
    category: "sms",
    text: "USPS: Your package is on hold due to an incomplete address. Please update your details within 24 hours or it will be returned to sender. A $1.99 redelivery fee applies: http://usps.com-track-redelivery.xyz/update",
  },
  {
    id: "job",
    label: "Remote job offer",
    category: "job",
    text: "Hi! Your resume was selected for a Remote Data Entry Assistant position. $45/hour, no experience needed, no interview required. Interviews are held on Telegram. We will mail you a check to purchase your home-office equipment — deposit it via mobile deposit and send the remaining balance to our approved vendor via Zelle. Please also provide your SSN for payroll setup. Text me at +1 (555) 013-2244. Details: https://bit.ly/3xRemoteJob",
  },
  {
    id: "marketplace",
    label: "Marketplace buyer",
    category: "marketplace",
    text: "Hi, is the couch still available? I'll pay $200 more than asking because I'm out of town for work. My mover will pick it up. I'll send payment by Zelle — please refund the difference to my mover after. Before we continue, I'm sending you a code to make sure you're real, please tell me the code. You can also text me on WhatsApp.",
  },
];
