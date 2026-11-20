"use client";

import { useServerInsertedHTML } from "next/navigation";

const THEME_INIT_SCRIPT = `(function(){try{if(window.location.pathname==='/'){document.documentElement.classList.remove('dark');return;}var t=localStorage.getItem('rp-theme')||'auto',d=false;if(t==='dark'){d=true;}else if(t==='light'){d=false;}else{var h=new Date().getHours();d=h>=18||h<6;}if(d){document.documentElement.classList.add('dark');}else{document.documentElement.classList.remove('dark');}}catch(e){}})();`;

export function ThemeScript() {
  // Gunakan useServerInsertedHTML agar script langsung di-inject ke stream HTML server
  // sehingga browser mengeksekusinya sebelum render body (mencegah FOUC),
  // sekaligus tidak me-render tag <script> di client React tree yang memicu peringatan React 19.
  useServerInsertedHTML(() => {
    return (
      <script
        key="rp-theme-init"
        dangerouslySetInnerHTML={{
          __html: THEME_INIT_SCRIPT,
        }}
      />
    );
  });

  return null;
}
