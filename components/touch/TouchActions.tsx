'use client';

import {useState, useTransition} from 'react';
import {MessageCircle} from 'lucide-react';
import {Button} from '@/components/ui/Button';
import {Modal} from '@/components/ui/Modal';
import {Select} from '@/components/ui/Select';
import {Textarea} from '@/components/ui/Textarea';
import {recordTouch} from '@/lib/touches/actions';
import {TOUCH_TYPES, type TouchType} from '@/lib/db/schema';
import {TOUCH_TYPE_LABELS} from '@/lib/touches/labels';

export function TouchActions({clientId}: {clientId: string}) {
    const [open, setOpen] = useState(false);
    const [type, setType] = useState<TouchType>('message');
    const [note, setNote] = useState('');
    const [error, setError] = useState<string | null>(null);
    const [pending, startTransition] = useTransition();

    function close() {
        setOpen(false);
        setError(null);
        setNote('');
        setType('message');
    }

    function submit() {
        setError(null);
        startTransition(async () => {
            const res = await recordTouch(clientId, type, note);
            if (!res.ok) {
                setError(res.error);
                return;
            }
            close();
        });
    }

    return (
        <>
            <Button variant="primary" size="md" onClick={() => setOpen(true)}>
                <MessageCircle size={16} aria-hidden="true"/>
                Отметить касание
            </Button>
            <Modal open={open} onClose={close} title="Отметить касание">
                <div className="flex flex-col gap-4">
                    <Select
                        label="Тип"
                        name="type"
                        value={type}
                        onChange={(e) => setType(e.target.value as TouchType)}
                    >
                        {TOUCH_TYPES.map((t) => (
                            <option key={t} value={t}>{TOUCH_TYPE_LABELS[t]}</option>
                        ))}
                    </Select>
                    <Textarea
                        label="Заметка (необязательно)"
                        name="note"
                        value={note}
                        onChange={(e) => setNote(e.target.value)}
                        rows={3}
                        maxLength={500}
                    />
                    {error && <p className="text-orange text-[13px]">{error}</p>}
                    <div className="flex gap-3 justify-end">
                        <Button variant="ghost" size="md" onClick={close} disabled={pending}>
                            Отмена
                        </Button>
                        <Button variant="primary" size="md" onClick={submit} loading={pending}>
                            Записать
                        </Button>
                    </div>
                </div>
            </Modal>
        </>
    );
}
