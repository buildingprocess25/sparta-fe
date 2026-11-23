import type { SPKListItem } from './api';
import { parseCurrency } from './utils';

/** Presentation only: operational consumers continue to receive per-scope SPKs. */
export function presentSPK(row: SPKListItem): SPKListItem {
    if (!row.spk_group_id) return row;
    const members = row.group_members?.filter(member => member.spk_group_id === row.spk_group_id) ?? [];
    return {
        ...row,
        lingkup_pekerjaan: 'SIPIL + ME',
        grand_total: row.group_grand_total ?? (members.length ? members.reduce((sum, member) => sum + parseCurrency(member.grand_total), 0) : row.grand_total),
        // A member's terbilang describes its own cost; the combined PDF supplies total terbilang.
        terbilang: '',
    };
}

export function groupSPKForPresentation(rows: SPKListItem[]): SPKListItem[] {
    const groups = new Map<string, SPKListItem[]>();
    for (const row of rows) {
        const key = row.spk_group_id ? `group:${row.spk_group_id}` : `spk:${row.id}`;
        const members = groups.get(key) ?? [];
        if (!members.some(member => member.id === row.id)) members.push(row);
        groups.set(key, members);
    }
    return Array.from(groups.values(), members => {
        const row = members[0];
        return row.spk_group_id ? presentSPK({ ...row, group_members: members }) : row;
    });
}
