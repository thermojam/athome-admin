import assert from 'node:assert/strict';
import test from 'node:test';
import {createElement} from 'react';
import {renderToStaticMarkup} from 'react-dom/server';
import {CircleAlert, Sparkles, TriangleAlert} from 'lucide-react';
import {Badge} from '@/components/ui/Badge';
import {Button} from '@/components/ui/Button';
import {Card} from '@/components/ui/Card';
import {EmptyState} from '@/components/ui/EmptyState';
import {IconBadge} from '@/components/ui/IconBadge';
import {Modal} from '@/components/ui/Modal';
import {PageHeader} from '@/components/ui/PageHeader';
import {StatusNotice} from '@/components/ui/StatusNotice';

test('loading button exposes busy state and stable label', () => {
    const html = renderToStaticMarkup(createElement(Button, {loading: true}, 'Сохранить'));
    assert.match(html, /aria-busy="true"/);
    assert.match(html, /disabled=""/);
    assert.match(html, /Сохранить/);
});

test('PageHeader renders one h1 and optional metadata', () => {
    const html = renderToStaticMarkup(createElement(PageHeader, {
        title: 'Сегодня',
        kicker: 'Пятничный ритуал',
        meta: '8 сигналов',
    }));
    assert.equal((html.match(/<h1/g) ?? []).length, 1);
    assert.match(html, /Пятничный ритуал/);
    assert.match(html, /8 сигналов/);
});

test('warning notice has alert semantics and icon', () => {
    const html = renderToStaticMarkup(
        <StatusNotice tone="warning" title="Нужен личный факт" icon={TriangleAlert}>
            Допиши факт.
        </StatusNotice>,
    );
    assert.match(html, /role="alert"/);
    assert.match(html, /Нужен личный факт/);
    assert.match(html, /Допиши факт/);
    assert.match(html, /svg/);
});

test('strong card appends glass-strong without dropping base glass styles', () => {
    const html = renderToStaticMarkup(createElement(Card, {variant: 'strong'}, 'Контент'));
    assert.match(html, /glass/);
    assert.match(html, /glass-strong/);
});

test('badge dot renders decorative marker and keeps label text', () => {
    const html = renderToStaticMarkup(createElement(Badge, {dot: true, tone: 'green'}, 'Готово'));
    assert.match(html, /aria-hidden="true"/);
    assert.match(html, /Готово/);
});

test('modal and empty state expose upgraded shared affordances', () => {
    const modalHtml = renderToStaticMarkup(
        <Modal open onClose={() => {}} title="Панель">
            Содержимое
        </Modal>,
    );
    assert.match(modalHtml, /role="dialog"/);
    assert.match(modalHtml, /glass-strong/);

    const emptyHtml = renderToStaticMarkup(createElement(EmptyState, {
        title: 'Пусто',
        hint: 'Пока ничего нет',
        icon: CircleAlert,
        action: createElement('button', null, 'Добавить'),
    }));
    assert.match(emptyHtml, /Пусто/);
    assert.match(emptyHtml, /Пока ничего нет/);
    assert.match(emptyHtml, /svg/);
    assert.match(emptyHtml, /Добавить/);
});

test('icon badge renders semantic icon and optional label', () => {
    const html = renderToStaticMarkup(createElement(IconBadge, {
        icon: Sparkles,
        tone: 'cyan',
        label: 'Новое',
    }));
    assert.match(html, /Новое/);
    assert.match(html, /svg/);
});
