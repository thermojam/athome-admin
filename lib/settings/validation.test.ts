import assert from 'node:assert/strict';
import test from 'node:test';
import {PasswordChangeSchema, TrainerSettingsFormSchema} from '@/lib/zod/settings';

const validSettings = {
    promptTemplate: 'Собери короткие личные сообщения по строкам ниже.',
    leadStaleDays: '3',
    activeFreshDays: '10',
    activeStaleDays: '21',
    cooledStaleDays: '30',
    silentDays: '45',
};

test('TrainerSettingsFormSchema trims prompt and coerces threshold strings', () => {
    const parsed = TrainerSettingsFormSchema.parse({
        ...validSettings,
        promptTemplate: `  ${validSettings.promptTemplate}  `,
    });

    assert.equal(parsed.promptTemplate, validSettings.promptTemplate);
    assert.deepEqual(parsed.thresholds, {
        leadStaleDays: 3,
        activeFreshDays: 10,
        activeStaleDays: 21,
        cooledStaleDays: 30,
        silentDays: 45,
    });
});

test('TrainerSettingsFormSchema rejects empty prompt and invalid active thresholds', () => {
    const parsed = TrainerSettingsFormSchema.safeParse({
        ...validSettings,
        promptTemplate: ' ',
        activeFreshDays: '21',
        activeStaleDays: '10',
    });

    assert.equal(parsed.success, false);
    if (!parsed.success) {
        const fields = parsed.error.issues.map((issue) => issue.path[0]);
        assert.equal(fields.includes('promptTemplate'), true);
        assert.equal(fields.includes('activeStaleDays'), true);
    }
});

test('PasswordChangeSchema accepts matching new passwords', () => {
    const parsed = PasswordChangeSchema.parse({
        currentPassword: 'old-password',
        newPassword: 'new-password',
        confirmPassword: 'new-password',
    });

    assert.equal(parsed.currentPassword, 'old-password');
    assert.equal(parsed.newPassword, 'new-password');
});

test('PasswordChangeSchema rejects short or mismatched new password', () => {
    const parsed = PasswordChangeSchema.safeParse({
        currentPassword: 'old-password',
        newPassword: 'short',
        confirmPassword: 'another-password',
    });

    assert.equal(parsed.success, false);
    if (!parsed.success) {
        const fields = parsed.error.issues.map((issue) => issue.path[0]);
        assert.equal(fields.includes('newPassword'), true);
        assert.equal(fields.includes('confirmPassword'), true);
    }
});
