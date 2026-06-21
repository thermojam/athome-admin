import {eq} from 'drizzle-orm';
import {db} from '@/lib/db';
import {DEFAULT_TRAINER_SETTINGS, trainers} from '@/lib/db/schema';
import {requireTrainerId} from '@/lib/auth/require-trainer';
import {SettingsForms} from '@/components/settings/SettingsForms';

export default async function SettingsPage() {
    const trainerId = await requireTrainerId();
    const [trainer] = await db
        .select({settings: trainers.settings})
        .from(trainers)
        .where(eq(trainers.id, trainerId))
        .limit(1);
    const settings = trainer?.settings ?? DEFAULT_TRAINER_SETTINGS;

    return (
        <div className="space-y-6">
            <h1 className="font-display uppercase text-[27px] tracking-wide">Настройки</h1>
            <SettingsForms settings={settings}/>
        </div>
    );
}
