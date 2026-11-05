"use client";

import { ArrowDown, ArrowUp, Check, Edit3, ImagePlus, LoaderCircle, Plus, Trash2, X } from "lucide-react";
import { FormEvent, useCallback, useEffect, useRef, useState } from "react";

type Banner = { id: string; title: string; subtitle: string; buttonLabel: string; actionUrl?: string; startsAt?: string|null; endsAt?: string|null; imageUrl: string; width: number; height: number; active: boolean; sortOrder: number };

export default function BannerManager({ notify }: { notify: (message: string) => void }) {
  const [banners, setBanners] = useState<Banner[]>([]);
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState(false);
  const [editing, setEditing] = useState<Banner | null>(null);
  const load = useCallback(async () => {
    const response = await fetch("/api/banners", { cache: "no-store" });
    const payload = await response.json() as { banners?: Banner[] };
    setBanners(payload.banners || []); setLoading(false);
  }, []);
  useEffect(() => { const timer = window.setTimeout(() => { void load(); }, 0); return () => window.clearTimeout(timer); }, [load]);
  const update = async (body: object) => { await fetch("/api/banners", { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) }); await load(); };
  const remove = async (id: string) => { await fetch(`/api/banners?id=${encodeURIComponent(id)}`, { method: "DELETE" }); await load(); notify("Баннер удалён"); };

  if (loading) return <div className="grid h-64 place-items-center rounded-2xl border border-[#e5e9e3] bg-white"><LoaderCircle className="animate-spin text-[#31584f]" /></div>;
  return <><div className="mb-4 flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-[#dfe5de] bg-[#edf3ee] px-5 py-4"><div><p className="text-[12px] font-semibold text-[#31584f]">Формат мобильного баннера: 8:5</p><p className="mt-1 text-[10px] text-[#70807b]">Рекомендуемый размер 1600×1000 px · JPG, PNG или WebP · до 5 МБ</p></div><button onClick={() => setModal(true)} className="flex h-10 items-center gap-2 rounded-xl bg-[#31584f] px-4 text-[11px] font-semibold text-white"><Plus size={15}/>Загрузить баннер</button></div><div className="grid gap-5 lg:grid-cols-2">{banners.map((banner, index) => <article key={banner.id} className="overflow-hidden rounded-2xl border border-[#e5e9e3] bg-white"><div className="relative aspect-[8/5] bg-cover bg-center" style={{ backgroundImage: `url("${banner.imageUrl.replaceAll('"', "%22")}")` }}><div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/10 to-transparent"/><div className="absolute bottom-0 p-6 text-white"><span className={`rounded-full px-2.5 py-1 text-[8px] font-bold ${banner.active ? "bg-[#dcef86] text-[#2f4c43]" : "bg-white/20 text-white"}`}>{banner.active ? "АКТИВЕН" : "СКРЫТ"}</span><h3 className="mt-3 whitespace-pre-line text-[24px] font-semibold leading-tight">{banner.title}</h3><p className="mt-2 text-[11px] text-white/70">{banner.subtitle}</p></div></div><div className="flex items-center gap-2 p-4"><div className="mr-auto"><p className="text-[10px] font-semibold">{banner.width}×{banner.height} px</p><p className="mt-1 text-[9px] text-[#929a97]">Позиция {index + 1}</p></div><button disabled={index === 0} onClick={() => void update({ id: banner.id, direction: "up" })} className="icon"><ArrowUp size={14}/></button><button disabled={index === banners.length - 1} onClick={() => void update({ id: banner.id, direction: "down" })} className="icon"><ArrowDown size={14}/></button><button onClick={()=>setEditing(banner)} className="icon"><Edit3 size={14}/></button><button onClick={() => void update({ id: banner.id, active: !banner.active })} className={`h-9 rounded-lg px-3 text-[10px] font-semibold ${banner.active ? "bg-[#eef2ed] text-[#5c6e68]" : "bg-[#31584f] text-white"}`}>{banner.active ? "Скрыть" : "Показать"}</button><button onClick={() => void remove(banner.id)} className="icon danger"><Trash2 size={14}/></button></div></article>)}{banners.length === 0 && <button onClick={() => setModal(true)} className="col-span-full grid min-h-[300px] place-items-center rounded-2xl border border-dashed border-[#cbd4cc] bg-white/50 text-[#60736d]"><span className="text-center text-[12px] font-semibold"><ImagePlus className="mx-auto mb-3" size={24}/>Загрузить первый баннер</span></button>}</div>{modal && <BannerUploadModal onClose={() => setModal(false)} onSaved={async () => { setModal(false); await load(); notify("Баннер загружен"); }} />}{editing&&<BannerEditModal banner={editing} close={()=>setEditing(null)} saved={async()=>{setEditing(null);await load();notify("Баннер обновлён")}}/>}</>;
}

function BannerUploadModal({ onClose, onSaved }: { onClose: () => void; onSaved: () => Promise<void> }) {
  const fileRef = useRef<HTMLInputElement>(null);
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState("");
  const [error, setError] = useState("");
  const [pending, setPending] = useState(false);
  const choose = (selected?: File) => {
    if (!selected) return;
    const url = URL.createObjectURL(selected);
    const image = new window.Image();
    image.onload = () => {
      const ratio = image.width / image.height;
      if (Math.abs(ratio - 8 / 5) > 0.04) { setError(`Изображение ${image.width}×${image.height}. Нужны пропорции 8:5, например 1600×1000 px.`); URL.revokeObjectURL(url); return; }
      setError(""); setFile(selected); setPreview(url);
    };
    image.src = url;
  };
  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault(); if (!file) { setError("Выберите изображение 8:5."); return; }
    setPending(true); const data = new FormData(event.currentTarget); data.set("image", file);
    const response = await fetch("/api/banners", { method: "POST", body: data });
    const payload = await response.json() as { error?: string };
    if (!response.ok) { setError(payload.error || "Не удалось загрузить баннер."); setPending(false); return; }
    await onSaved();
  };
  return <div className="fixed inset-0 z-[90] grid place-items-center overflow-y-auto bg-[#17201f]/50 p-4 backdrop-blur-sm"><div className="my-4 w-full max-w-[620px] rounded-[22px] bg-white shadow-2xl"><div className="flex items-center justify-between border-b border-[#e9ece8] px-6 py-5"><div><h2 className="text-[17px] font-semibold">Новый мобильный баннер</h2><p className="mt-1 text-[10px] text-[#89928f]">Пропорции 8:5 гарантируют совпадение с приложением</p></div><button onClick={onClose} className="icon"><X size={17}/></button></div><form onSubmit={submit} className="space-y-4 p-6"><input ref={fileRef} hidden type="file" accept="image/jpeg,image/png,image/webp" onChange={(event) => choose(event.target.files?.[0])}/><button type="button" onClick={() => fileRef.current?.click()} className="relative grid aspect-[8/5] w-full place-items-center overflow-hidden rounded-2xl border border-dashed border-[#bcc9c0] bg-[#f5f7f3] bg-cover bg-center" style={preview ? { backgroundImage: `url("${preview}")` } : undefined}>{preview ? <span className="absolute bottom-3 right-3 rounded-lg bg-black/55 px-3 py-2 text-[9px] font-semibold text-white">Заменить изображение</span> : <span className="text-center text-[11px] font-semibold text-[#5f716b]"><ImagePlus className="mx-auto mb-2"/>Выбрать изображение<span className="mt-1 block text-[9px] font-normal text-[#929b97]">1600×1000 px рекомендуется</span></span>}</button><div className="grid gap-4 sm:grid-cols-2"><Field label="Заголовок"><input required name="title" placeholder="Новая коллекция OSSO" /></Field><Field label="Текст кнопки"><input required name="buttonLabel" defaultValue="Смотреть" /></Field></div><Field label="Подзаголовок"><input required name="subtitle" placeholder="Скидки до 20% на новую коллекцию" /></Field><Field label="Ссылка кнопки"><input name="actionUrl" placeholder="/catalog или https://..."/></Field><div className="grid gap-4 sm:grid-cols-2"><Field label="Показывать с"><input name="startsAt" type="datetime-local"/></Field><Field label="Показывать до"><input name="endsAt" type="datetime-local"/></Field></div>{error && <p className="rounded-xl bg-[#fff0ec] px-3 py-3 text-[10px] font-medium text-[#a65340]">{error}</p>}<div className="flex justify-end"><button disabled={pending} className="primary">{pending ? <LoaderCircle size={15} className="animate-spin"/> : <Check size={15}/>}Загрузить</button></div></form></div></div>;
}

function BannerEditModal({banner,close,saved}:{banner:Banner;close:()=>void;saved:()=>Promise<void>}){const [pending,setPending]=useState(false),[error,setError]=useState("");return <div className="fixed inset-0 z-[90] grid place-items-center bg-black/50 p-4"><div className="w-full max-w-xl rounded-2xl bg-white"><div className="flex justify-between border-b p-5"><b>Редактировать баннер</b><button className="icon" onClick={close}><X size={16}/></button></div><form className="space-y-4 p-6" onSubmit={async e=>{e.preventDefault();setPending(true);const body=Object.fromEntries(new FormData(e.currentTarget));try{const r=await fetch("/api/banners",{method:"PATCH",headers:{"Content-Type":"application/json"},body:JSON.stringify({id:banner.id,...body})});const d=await r.json();if(!r.ok)throw new Error(d.error||"Ошибка");await saved()}catch(x){setError(x instanceof Error?x.message:"Ошибка");setPending(false)}}}><Field label="Заголовок"><input required name="title" defaultValue={banner.title}/></Field><Field label="Подзаголовок"><input required name="subtitle" defaultValue={banner.subtitle}/></Field><div className="grid grid-cols-2 gap-4"><Field label="Текст кнопки"><input name="buttonLabel" defaultValue={banner.buttonLabel}/></Field><Field label="Ссылка"><input name="actionUrl" defaultValue={banner.actionUrl}/></Field></div><div className="grid grid-cols-2 gap-4"><Field label="Показывать с"><input type="datetime-local" name="startsAt" defaultValue={banner.startsAt?.slice(0,16)}/></Field><Field label="Показывать до"><input type="datetime-local" name="endsAt" defaultValue={banner.endsAt?.slice(0,16)}/></Field></div>{error&&<p className="text-xs text-red-600">{error}</p>}<button disabled={pending} className="primary ml-auto">Сохранить</button></form></div></div>}

function Field({ label, children }: { label: string; children: React.ReactNode }) { return <label className="block"><span className="mb-2 block text-[10px] font-semibold text-[#65706d]">{label}</span><div className="[&_input]:h-11 [&_input]:w-full [&_input]:rounded-xl [&_input]:border [&_input]:border-[#dde2dc] [&_input]:px-3 [&_input]:text-[12px] [&_input]:outline-none [&_input]:focus:border-[#7c9c91]">{children}</div></label>; }
