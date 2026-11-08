"use client";

import Image from "next/image";

const FullLogo = () => {
  return (
    <div className="flex items-center gap-2">
      {/* Lấy cái icon hình tròn tĩnh */}
      <Image
        src="/images/logos/logo-icon.svg"
        alt="e-Clinic Logo"
        width={32}
        height={32}
      />
      {/* Tự gõ chữ e-Clinic bên cạnh */}
      <span className="text-xl font-bold text-slate-800 dark:text-white tracking-wide">
        e-Clinic
      </span>
    </div>
  );
};

export default FullLogo;