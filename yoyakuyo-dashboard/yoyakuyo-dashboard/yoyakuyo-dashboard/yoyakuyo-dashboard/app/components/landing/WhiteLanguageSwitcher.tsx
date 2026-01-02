"use client";

import { LanguageSwitcher } from '../LanguageSwitcher';

export default function WhiteLanguageSwitcher() {
  return (
    <div className="[&>div>button]:!text-gray-700 [&>div>button]:!border-gray-300 [&>div>button]:!bg-transparent [&>div>button:hover]:!border-japanese-red [&>div>button:hover]:!text-japanese-red [&>div>button>span]:!text-gray-700 [&>div>button>svg]:!text-gray-700">
      <LanguageSwitcher />
    </div>
  );
}

