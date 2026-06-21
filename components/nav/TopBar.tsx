import Link from 'next/link';
import {Plus} from 'lucide-react';
import {Button} from '@/components/ui/Button';

export function TopBar() {
    return (
        <div className="hidden md:flex items-center justify-end px-8 py-4 border-b hairline">
            <Link href="/leads/new">
                <Button variant="secondary" size="sm">
                    <Plus size={16}/>
                    Лид
                </Button>
            </Link>
        </div>
    );
}
