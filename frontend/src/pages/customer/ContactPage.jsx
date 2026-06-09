import React from 'react';
import { Mail, MapPin, Phone } from 'lucide-react';

const contactCards = [
  {
    title: 'Hotline',
    subtitle: 'Hỗ trợ khách hàng 24/7',
    value: '0338869004 - 0386422292',
    icon: Phone,
    tone: 'bg-red-50 text-[#c0392b]',
  },
  {
    title: 'Email',
    subtitle: 'Gửi phản hồi cho chúng tôi',
    value: 'sondongfood@gmail.com',
    icon: Mail,
    tone: 'bg-cyan-50 text-cyan-700',
  },
  {
    title: 'Trụ sở chính',
    subtitle: 'Trung tâm điều hành',
    value: 'Kim Giang, Đại Kim, Hoàng Mai, Hà Nội',
    icon: MapPin,
    tone: 'bg-red-50 text-[#c0392b]',
  },
];

const ContactPage = () => {
  return (
    <div className="bg-[#fbf7f4] text-slate-950">
      <section className="relative overflow-hidden">
        <img
          src="/images/home/hero-collage.png"
          alt="Không gian Sơn Đông FastFood"
          className="absolute inset-0 h-full w-full object-cover opacity-20"
        />
        <div className="absolute inset-0 bg-gradient-to-r from-white via-white/90 to-white/60" />

        <div className="relative mx-auto max-w-6xl px-5 pb-16 pt-20">
          <div className="max-w-2xl">
            <p className="mb-3 text-sm font-black uppercase tracking-[0.22em] text-[#c0392b]">Liên hệ</p>
            <h1 className="mb-5 text-4xl font-black tracking-tight md:text-5xl">Liên hệ với chúng tôi</h1>
            <p className="text-[15px] font-medium leading-8 text-slate-600">
              Chúng tôi luôn sẵn sàng lắng nghe ý kiến đóng góp và giải đáp mọi thắc mắc của bạn.
              Hãy để Sơn Đông FastFood phục vụ bạn tốt hơn mỗi ngày.
            </p>
          </div>

          <div className="mt-14 grid gap-6 md:grid-cols-3">
            {contactCards.map(card => {
              const Icon = card.icon;
              return (
                <article key={card.title} className="rounded-lg border border-red-50 bg-white p-8 shadow-xl shadow-red-100/40">
                  <div className={`mb-6 grid h-12 w-12 place-items-center rounded-lg ${card.tone}`}>
                    <Icon size={21} />
                  </div>
                  <h2 className="mb-1 text-xl font-black text-slate-950">{card.title}</h2>
                  <p className="mb-4 text-sm font-medium text-slate-500">{card.subtitle}</p>
                  <p className="m-0 text-base font-black leading-7 text-[#c0392b]">{card.value}</p>
                </article>
              );
            })}
          </div>
        </div>
      </section>
    </div>
  );
};

export default ContactPage;
