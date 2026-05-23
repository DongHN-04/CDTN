import React from 'react';
import { Award, Heart, Leaf, Timer } from 'lucide-react';

const values = [
  {
    title: 'Chất lượng nguyên liệu',
    description: 'Mỗi phần ăn được chuẩn bị từ nguyên liệu chọn lọc, quy trình bếp rõ ràng và kiểm soát hằng ngày.',
    icon: Award,
  },
  {
    title: 'Phục vụ tận tâm',
    description: 'Đội ngũ Sơn Đông luôn ưu tiên tốc độ, sự thân thiện và trải nghiệm thoải mái cho từng khách hàng.',
    icon: Heart,
  },
  {
    title: 'Tươi ngon mỗi ngày',
    description: 'Món ăn được chế biến liên tục theo nhu cầu thực tế để giữ hương vị nóng giòn và ổn định.',
    icon: Leaf,
  },
  {
    title: 'Nhanh chóng tiện lợi',
    description: 'Từ đặt món online đến phục vụ tại quầy, mọi thao tác được tối ưu để khách nhận món nhanh hơn.',
    icon: Timer,
  },
];

const AboutPage = () => {
  return (
    <div className="bg-[#f8f5f2] text-slate-950">
      <section className="relative min-h-[430px] overflow-hidden">
        <img
          src="/images/home/hero-collage.png"
          alt="Sơn Đông FastFood"
          className="absolute inset-0 h-full w-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-r from-black/80 via-black/55 to-black/20" />
        <div className="relative mx-auto flex min-h-[430px] max-w-6xl items-center px-5 py-16">
          <div className="max-w-2xl text-white">
            <p className="mb-3 text-sm font-black uppercase tracking-[0.24em] text-red-200">Về chúng tôi</p>
            <h1 className="mb-5 text-4xl font-black leading-tight md:text-6xl">Về Sơn Đông FastFood</h1>
            <p className="max-w-xl text-base font-medium leading-8 text-white/90 md:text-lg">
              Hành trình đưa những món ăn nhanh nóng giòn, đậm vị và tiện lợi đến gần hơn với khách hàng Việt Nam.
              Sơn Đông FastFood phục vụ bằng tốc độ, sự chỉn chu và niềm vui trong từng phần ăn.
            </p>
          </div>
        </div>
      </section>

      <section className="mx-auto grid max-w-6xl items-center gap-10 px-5 py-16 lg:grid-cols-2">
        <div>
          <p className="mb-3 text-sm font-black uppercase tracking-[0.2em] text-[#c0392b]">Hành trình của chúng tôi</p>
          <h2 className="mb-5 text-3xl font-black tracking-tight text-slate-950">Từ căn bếp nhỏ đến thương hiệu fast food gần gũi</h2>
          <div className="space-y-4 text-[15px] leading-8 text-slate-600">
            <p>
              Sơn Đông FastFood được xây dựng với mong muốn tạo ra một địa chỉ quen thuộc cho những bữa ăn nhanh,
              ngon miệng và dễ lựa chọn. Từ burger, gà rán, đồ uống đến combo tiết kiệm, mỗi món đều được chuẩn bị
              để phù hợp với nhịp sống bận rộn của khách hàng.
            </p>
            <p>
              Chúng tôi tập trung vào công thức ổn định, nguyên liệu tươi mới và quy trình phục vụ rõ ràng.
              Mục tiêu không chỉ là giao món nhanh, mà còn là giữ được cảm giác hài lòng khi khách mở từng phần ăn.
            </p>
          </div>
        </div>
        <div className="overflow-hidden rounded-lg shadow-xl shadow-red-100">
          <img
            src="/images/home/product-burger.png"
            alt="Burger Sơn Đông"
            className="h-[360px] w-full object-cover"
          />
        </div>
      </section>

      <section className="bg-white py-16">
        <div className="mx-auto max-w-6xl px-5">
          <div className="mx-auto mb-10 max-w-2xl text-center">
            <p className="mb-3 text-sm font-black uppercase tracking-[0.2em] text-[#c0392b]">Giá trị cốt lõi</p>
            <h2 className="mb-4 text-3xl font-black tracking-tight text-slate-950">Những điều làm nên Sơn Đông FastFood</h2>
            <p className="text-[15px] leading-7 text-slate-500">
              Chúng tôi vận hành cửa hàng bằng sự nhất quán trong chất lượng món ăn, tốc độ phục vụ và trải nghiệm khách hàng.
            </p>
          </div>

          <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-4">
            {values.map(item => {
              const Icon = item.icon;
              return (
                <article key={item.title} className="rounded-lg border border-red-100 bg-[#fffaf8] p-6 text-center shadow-sm">
                  <div className="mx-auto mb-5 grid h-12 w-12 place-items-center rounded-full bg-red-50 text-[#c0392b]">
                    <Icon size={22} />
                  </div>
                  <h3 className="mb-3 text-base font-black text-slate-950">{item.title}</h3>
                  <p className="m-0 text-sm leading-7 text-slate-500">{item.description}</p>
                </article>
              );
            })}
          </div>
        </div>
      </section>

      <section className="mx-auto grid max-w-6xl items-center gap-10 px-5 py-16 lg:grid-cols-2">
        <div className="overflow-hidden rounded-lg shadow-xl shadow-red-100">
          <img
            src="/images/home/product-chicken.png"
            alt="Gà rán Sơn Đông"
            className="h-[360px] w-full object-cover"
          />
        </div>
        <div>
          <p className="mb-3 text-sm font-black uppercase tracking-[0.2em] text-[#c0392b]">Tầm nhìn</p>
          <h2 className="mb-5 text-3xl font-black tracking-tight text-slate-950">Trở thành lựa chọn quen thuộc cho bữa ăn nhanh chất lượng</h2>
          <p className="text-[15px] leading-8 text-slate-600">
            Sơn Đông FastFood hướng đến một hệ thống cửa hàng hiện đại, thân thiện và dễ tiếp cận. Chúng tôi muốn mỗi khách hàng
            có thể nhanh chóng tìm được món yêu thích, đặt hàng thuận tiện và nhận lại một phần ăn đúng kỳ vọng.
          </p>
        </div>
      </section>

      <section className="mx-auto grid max-w-6xl items-center gap-10 px-5 pb-20 lg:grid-cols-2">
        <div>
          <p className="mb-3 text-sm font-black uppercase tracking-[0.2em] text-[#c0392b]">Sứ mệnh</p>
          <h2 className="mb-5 text-3xl font-black tracking-tight text-slate-950">Mang đến bữa ăn tiện lợi nhưng vẫn chỉn chu</h2>
          <p className="text-[15px] leading-8 text-slate-600">
            Chúng tôi kết hợp công thức món ăn dễ yêu thích với quy trình bán hàng nhanh gọn, giúp khách hàng tiết kiệm thời gian
            mà vẫn có được một bữa ăn nóng, ngon và đáng tin cậy.
          </p>
        </div>
        <div className="overflow-hidden rounded-lg shadow-xl shadow-red-100">
          <img
            src="/images/home/product-pizza.png"
            alt="Món ăn Sơn Đông"
            className="h-[360px] w-full object-cover"
          />
        </div>
      </section>
    </div>
  );
};

export default AboutPage;
