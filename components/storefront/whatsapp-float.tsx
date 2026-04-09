import Link from "next/link";

const WHATSAPP_NUMBER = "237691949858";

export function WhatsAppFloat() {
  return (
    <Link
      href={`https://wa.me/${WHATSAPP_NUMBER}`}
      target="_blank"
      rel="noopener noreferrer"
      className="fixed bottom-5 right-5 z-50 rounded-full bg-charcoal-900 px-3 sm:px-4 py-2 sm:py-3 text-xs sm:text-sm font-semibold text-cream-50 shadow-lg shadow-charcoal-900/30 transition hover:-translate-y-1 hover:bg-rose-gold-600 max-w-[calc(100vw-48px)]"
    >
      WhatsApp
    </Link>
  );
}
