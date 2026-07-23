import { Link } from "wouter";

export function Footer() {
  return (
    <footer className="bg-card border-t border-border/60 pt-16 pb-8">
      <div className="max-w-7xl mx-auto px-6 md:px-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-12 mb-16">
          <div className="md:col-span-2">
            <div className="mb-5">
              <h2 className="text-2xl font-serif tracking-[0.18em] text-foreground leading-none">DAYBUILT</h2>
              <span className="text-[10px] tracking-[0.35em] text-primary uppercase font-sans">.indesign</span>
            </div>
            <p className="text-muted-foreground text-sm max-w-sm leading-relaxed mb-6">
              บริษัทออกแบบตกแต่งภายในและงานบิวท์อินระดับพรีเมียมในประเทศไทย ออกแบบพื้นที่ให้เป็นมากกว่าบ้าน ด้วยวัสดุคุณภาพและความประณีตในทุกรายละเอียด
            </p>
            <div className="space-y-2 text-sm text-muted-foreground">
              <p>ที่อยู่: อาคารอเนกวณิช ชั้น 8 สุขุมวิท 21 กรุงเทพฯ 10110</p>
              <p>โทร: 02-123-4567</p>
              <p>อีเมล: <a href="mailto:info@daybuilt.co.th" className="hover:text-primary transition-colors">info@daybuilt.co.th</a></p>
            </div>
          </div>
          <div>
            <h3 className="text-xs font-sans tracking-widest uppercase text-foreground/50 mb-6">เมนู</h3>
            <ul className="space-y-4 text-sm text-muted-foreground">
              <li><Link href="/" className="hover:text-primary transition-colors">หน้าหลัก</Link></li>
              <li><Link href="/about" className="hover:text-primary transition-colors">เกี่ยวกับเรา</Link></li>
              <li><Link href="/projects" className="hover:text-primary transition-colors">ผลงาน</Link></li>
              <li><Link href="/estimator" className="hover:text-primary transition-colors">ประเมินราคา</Link></li>
              <li><Link href="/design-studio" className="hover:text-primary transition-colors">Design Studio</Link></li>
              <li><Link href="/contact" className="hover:text-primary transition-colors">ติดต่อเรา</Link></li>
            </ul>
          </div>
          <div>
            <h3 className="text-xs font-sans tracking-widest uppercase text-foreground/50 mb-6">โซเชียลมีเดีย</h3>
            <ul className="space-y-4 text-sm text-muted-foreground">
              <li><a href="#" className="hover:text-primary transition-colors">Instagram @daybuilt.th</a></li>
              <li><a href="#" className="hover:text-primary transition-colors">Line @daybuilt</a></li>
              <li><a href="#" className="hover:text-primary transition-colors">Pinterest daybuilt</a></li>
              <li className="pt-4 text-primary text-xs tracking-widest uppercase">hello@daybuilt.co.th</li>
            </ul>
          </div>
        </div>
        <div className="border-t border-border/40 pt-8 flex flex-col md:flex-row items-center justify-between text-xs text-muted-foreground/50">
          <p>&copy; {new Date().getFullYear()} Daybuilt.indesign — Architecture & Interior Design. สงวนลิขสิทธิ์</p>
          <div className="flex gap-6 mt-4 md:mt-0">
            <Link href="#" className="hover:text-primary transition-colors">นโยบายความเป็นส่วนตัว</Link>
            <Link href="#" className="hover:text-primary transition-colors">ข้อกำหนดการใช้งาน</Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
