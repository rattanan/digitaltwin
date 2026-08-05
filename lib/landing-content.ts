export const landingFeatures = [
  {
    eyebrow: "01",
    title: "Unified City Data",
    titleTh: "รวมข้อมูลเมืองไว้ในมุมมองเดียว",
    description: "เชื่อมโยง CCTV, IoT, GIS และข้อมูลจากหน่วยงานให้พร้อมใช้งานจากศูนย์กลางเดียว",
  },
  {
    eyebrow: "02",
    title: "Real-time Monitoring",
    titleTh: "ติดตามสถานการณ์แบบใกล้เคียงเวลาจริง",
    description: "เห็นสัญญาณสำคัญ เหตุการณ์ และความผิดปกติ เพื่อให้ทีมปฏิบัติการตอบสนองได้เร็วขึ้น",
  },
  {
    eyebrow: "03",
    title: "AI-powered Insight",
    titleTh: "เปลี่ยนข้อมูลให้เป็น insight",
    description: "ใช้ AI ช่วยสรุปเหตุการณ์ ตรวจจับแนวโน้ม และตอบคำถามด้วยภาษาธรรมชาติ",
  },
  {
    eyebrow: "04",
    title: "Command & Decision Support",
    titleTh: "สนับสนุนการสั่งการและการตัดสินใจ",
    description: "วางภาพรวมสถานการณ์และข้อมูลที่จำเป็นไว้ตรงหน้าผู้บริหารและศูนย์บัญชาการ",
  },
] as const;

export const landingModules = [
  { icon: "Map", title: "City Map", titleTh: "แผนที่เมือง", description: "มองเห็นพื้นที่ จุดข้อมูล และสถานการณ์บนแผนที่เดียว", status: "Available" },
  { icon: "Camera", title: "CCTV Management", titleTh: "จัดการกล้อง CCTV", description: "ติดตามสถานะกล้องและภาพจากพื้นที่สำคัญ", status: "Pilot" },
  { icon: "RadioTower", title: "IoT Monitoring", titleTh: "ติดตามอุปกรณ์ IoT", description: "รวม telemetry จากอุปกรณ์และเซนเซอร์เมือง", status: "Pilot" },
  { icon: "Wind", title: "Environmental Monitoring", titleTh: "เฝ้าระวังสิ่งแวดล้อม", description: "ติดตาม PM2.5 ฝน อุณหภูมิ และคุณภาพอากาศ", status: "Pilot" },
  { icon: "CarFront", title: "Traffic Management", titleTh: "บริหารจัดการจราจร", description: "ดูความเร็วเฉลี่ย จุดหนาแน่น และแนวโน้มการเดินทาง", status: "Planned" },
  { icon: "Siren", title: "Incident Management", titleTh: "จัดการเหตุการณ์", description: "จัดลำดับความสำคัญและติดตามการตอบสนองต่อเหตุการณ์", status: "Available" },
  { icon: "ShieldCheck", title: "Public Safety", titleTh: "ความปลอดภัยสาธารณะ", description: "เชื่อมโยงแจ้งเตือนและพื้นที่เสี่ยงเพื่อการเฝ้าระวัง", status: "Planned" },
  { icon: "Building2", title: "Infrastructure", titleTh: "โครงสร้างพื้นฐาน", description: "ติดตามสินทรัพย์เมืองและโครงสร้างพื้นฐานที่สำคัญ", status: "Planned" },
  { icon: "BarChart3", title: "Analytics & Reports", titleTh: "วิเคราะห์และรายงาน", description: "สรุป KPI และแนวโน้มเพื่อสนับสนุนการวางแผน", status: "Available" },
  { icon: "Bot", title: "AI City Assistant", titleTh: "ผู้ช่วยเมืองด้วย AI", description: "ถามข้อมูลเมืองด้วยภาษาธรรมชาติจากข้อมูลที่ได้รับอนุญาต", status: "Planned" },
] as const;

export const landingBenefits = [
  "เพิ่มประสิทธิภาพการบริหารจัดการเมือง",
  "ลดเวลาในการตรวจสอบและตอบสนองต่อเหตุการณ์",
  "เชื่อมโยงข้อมูลจากหลายหน่วยงาน",
  "ใช้ข้อมูลสนับสนุนการตัดสินใจ",
  "เพิ่มความปลอดภัยของประชาชน",
  "วางแผนการใช้ทรัพยากรได้แม่นยำขึ้น",
  "รองรับการขยายไปยังจังหวัดและองค์กรปกครองส่วนท้องถิ่นอื่น",
  "พร้อมเชื่อมต่อ AI และระบบวิเคราะห์ในอนาคต",
] as const;

export const aiQuestions = [
  "ตอนนี้มีกล้อง CCTV Offline กี่ตัว?",
  "สรุปเหตุการณ์ผิดปกติในวันนี้",
  "พื้นที่ใดมีค่า PM2.5 สูงที่สุด?",
  "แสดงแนวโน้มระดับน้ำย้อนหลัง 7 วัน",
  "มีเหตุการณ์เร่งด่วนที่ยังไม่ได้ดำเนินการหรือไม่?",
  "สรุปภาพรวมสถานการณ์ของจังหวัดสิงห์บุรี",
] as const;

export const architectureSteps = [
  { label: "Data Sources", description: "CCTV · IoT · External Systems", icon: "RadioTower" },
  { label: "Integration Layer", description: "รับข้อมูล · ตรวจสอบ · จัดมาตรฐาน", icon: "GitBranch" },
  { label: "Data Platform", description: "MariaDB / MySQL · NAS/NFS · Time-series", icon: "Database" },
  { label: "Analytics & AI", description: "วิเคราะห์ · สรุป · ตรวจจับความผิดปกติ", icon: "BrainCircuit" },
  { label: "Command Center", description: "Dashboard · Decision Support · AI Assistant", icon: "LayoutDashboard" },
] as const;
