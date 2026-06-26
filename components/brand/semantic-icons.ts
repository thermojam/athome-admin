import {
    BellOff,
    Circle,
    Clock3,
    Dumbbell,
    Ellipsis,
    MessageCircle,
    Phone,
    TriangleAlert,
    type LucideIcon,
} from 'lucide-react';
import type {TouchType} from '@/lib/db/schema';
import type {TriggerKind} from '@/lib/triggers/compute';
import type {GroupKey} from '@/lib/today/group';

export type SemanticTone = 'neutral' | 'cyan' | 'violet' | 'green' | 'orange';

export const TRIGGER_GROUP_VISUALS: Record<GroupKey, {icon: LucideIcon; tone: SemanticTone}> = {
    silent: {icon: BellOff, tone: 'orange'},
    high: {icon: TriangleAlert, tone: 'orange'},
    medium: {icon: Clock3, tone: 'violet'},
    low: {icon: Circle, tone: 'cyan'},
};

export const TRIGGER_KIND_VISUALS: Record<TriggerKind, {icon: LucideIcon; tone: SemanticTone}> = {
    silent: {icon: BellOff, tone: 'orange'},
    lead_stale: {icon: TriangleAlert, tone: 'orange'},
    vacation_no_prebook: {icon: Clock3, tone: 'violet'},
    active_stale: {icon: Clock3, tone: 'violet'},
    cooled_stale: {icon: Circle, tone: 'cyan'},
};

export const TOUCH_TYPE_ICONS: Record<TouchType, LucideIcon> = {
    message: MessageCircle,
    call: Phone,
    training: Dumbbell,
    other: Ellipsis,
};
