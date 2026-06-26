'use client';

import {useState} from 'react';
import {clsx} from 'clsx';
import {Upload} from 'lucide-react';

type Props = {
    onFile: (file: File) => void;
    disabled?: boolean;
};

export function ImportDropzone({onFile, disabled}: Props) {
    const [over, setOver] = useState(false);

    return (
        <label
            className={clsx(
                'glass glass-strong flex min-h-64 cursor-pointer flex-col items-center justify-center rounded-[var(--radius-xl)] border-2 border-dashed p-8 text-center',
                'transition-[border-color,background-color,box-shadow,opacity] duration-200 ease-[var(--ease-soft)]',
                over ? 'border-cyan bg-cyan/5 shadow-[var(--shadow-glow)]' : 'border-line',
                disabled && 'pointer-events-none opacity-50',
            )}
            onDragOver={(e) => {e.preventDefault(); setOver(true);}}
            onDragLeave={() => setOver(false)}
            onDrop={(e) => {
                e.preventDefault();
                setOver(false);
                const f = e.dataTransfer.files[0];
                if (f) onFile(f);
            }}
        >
            <input
                type="file"
                accept=".csv,text/csv"
                className="hidden"
                onChange={(e) => {
                    const f = e.target.files?.[0];
                    if (f) onFile(f);
                }}
            />
            <Upload size={34} className="mb-4 text-cyan" aria-hidden="true"/>
            <p className="font-semibold text-tx">Перетащи CSV или выбери файл</p>
            <p className="mt-2 text-[12px] font-mono text-tx-3">15 колонок · до 5000 строк</p>
            <p className="mt-4 text-[13px] text-tx-2">UTF-8 или Windows-1251</p>
        </label>
    );
}
