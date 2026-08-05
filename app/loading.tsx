import { NTLogo } from "@/components/branding/NTLogo";

export default function Loading() {
  return <main className="flex min-h-screen items-center justify-center bg-[var(--background-primary)] px-6 text-center"><div><NTLogo mode="dark" width={154} height={65} priority /><div className="mx-auto mt-7 flex items-center justify-center gap-2 text-sm text-[var(--text-secondary)]"><span className="size-2 animate-pulse rounded-full bg-[var(--nt-yellow)]" />กำลังเชื่อมต่อข้อมูลเมืองอัจฉริยะ...</div><div className="mx-auto mt-4 h-1 w-48 overflow-hidden rounded-full bg-white/[.08]"><span className="block h-full w-1/2 animate-pulse rounded-full bg-[var(--nt-blue-light)]" /></div></div></main>;
}
