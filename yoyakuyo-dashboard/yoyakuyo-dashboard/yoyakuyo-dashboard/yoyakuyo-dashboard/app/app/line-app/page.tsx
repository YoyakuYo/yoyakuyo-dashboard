import { redirect } from "next/navigation";

type SearchParams = Record<string, string | string[] | undefined>;

export default function LineAppAliasPage({ searchParams }: { searchParams: SearchParams }) {
  const qs = new URLSearchParams();
  for (const [k, v] of Object.entries(searchParams || {})) {
    if (typeof v === "string") qs.set(k, v);
    else if (Array.isArray(v)) v.forEach((item) => qs.append(k, item));
  }

  const suffix = qs.toString() ? `?${qs.toString()}` : "";
  redirect(`/line-app${suffix}`);
}


