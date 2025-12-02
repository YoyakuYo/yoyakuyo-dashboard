"use client";

import { LanguageSwitcher } from '../LanguageSwitcher';

export default function WhiteLanguageSwitcher() {
  return (
    <div className="[&>div>button]:!text-white [&>div>button]:!border-white/30 [&>div>button]:!bg-transparent [&>div>button:hover]:!border-blue-300 [&>div>button:hover]:!text-blue-300 [&>div>button>span]:!text-white [&>div>button>svg]:!text-white">
      <LanguageSwitcher />
    </div>
  );
}

