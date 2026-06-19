'use client';

import {useRef, useState} from 'react';

type Props = {
    onFile: (file: File) => void;
    disabled?: boolean;
};

export function ImportDropzone({onFile, disabled}: Props) {
    const inputRef = useRef<HTMLInputElement>(null);
    const [over, setOver] = useState(false);

    return (
        <label
            className={`block border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition ${over ? 'border-cyan-500 bg-cyan-50' : 'border-zinc-300'} ${disabled ? 'opacity-50 pointer-events-none' : ''}`}
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
                ref={inputRef}
                type="file"
                accept=".csv,text/csv"
                className="hidden"
                onChange={(e) => {
                    const f = e.target.files?.[0];
                    if (f) onFile(f);
                }}
            />
            <p className="text-zinc-600">Перетащи CSV или нажми, чтобы выбрать файл.</p>
            <p className="text-xs text-zinc-400 mt-1">15 колонок, до 5000 строк, UTF-8 или Windows-1251.</p>
        </label>
    );
}
