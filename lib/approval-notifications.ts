import type { UserSession } from "@/context/SessionContext";
import {
    API_URL,
    canApproveAllBranches,
    canAccessBranchForUser,
    getSessionBranchCoverage,
    isViewOnlyUser,
} from "@/lib/constants";
import {
    fetchInstruksiLapanganList,
    fetchOpnameFinalList,
    fetchPertambahanSPKList,
    fetchProjekPlanningList,
    fetchRABList,
    fetchSPKList,
} from "@/lib/api";
import { fetchDendaActions } from "@/lib/denda-actions-api";

export type ApprovalType =
    | "RAB"
    | "SPK"
    | "PERTAMBAHAN_SPK"
    | "OPNAME"
    | "INSTRUKSI_LAPANGAN"
    | "PROJECT_PLANNING"
    | "SURAT_PERINGATAN";

export type ApprovalCounts = Record<ApprovalType, number>;

type ApprovalJabatan = "KOORDINATOR" | "MANAGER" | "DIREKTUR" | "DIREKTUR_KONTRAKTOR" | "KONTRAKTOR" | null;

type CountableApprovalItem = {
    tipe: ApprovalType;
    status: string;
    cabang?: string | null;
    raw?: unknown;
};

type ApprovalSourceRecord = Record<string, unknown>;

const toRecord = (value: unknown): ApprovalSourceRecord =>
    value && typeof value === "object" ? value as ApprovalSourceRecord : {};

const getNestedRecord = (value: unknown, key: string): ApprovalSourceRecord => {
    const nested = toRecord(value)[key];
    return toRecord(nested);
};

const getStringValue = (value: unknown, key: string) => {
    const field = toRecord(value)[key];
    return typeof field === "string" || typeof field === "number" ? String(field) : null;
};

const getTokoStringValue = (value: unknown, key: string) =>
    getStringValue(getNestedRecord(value, "toko"), key);

const getOpnameRows = (data: unknown): unknown[] => {
    if (Array.isArray(data)) return data;
    const nestedRows = toRecord(data).opname_final;
    return Array.isArray(nestedRows) ? nestedRows : [];
};

export const EMPTY_APPROVAL_COUNTS: ApprovalCounts = {
    RAB: 0,
    SPK: 0,
    PERTAMBAHAN_SPK: 0,
    OPNAME: 0,
    INSTRUKSI_LAPANGAN: 0,
    PROJECT_PLANNING: 0,
    SURAT_PERINGATAN: 0,
};

const ROLE_ACCESS: Record<ApprovalType, string[]> = {
    RAB: ["BRANCH BUILDING COORDINATOR", "BRANCH BUILDING & MAINTENANCE MANAGER", "DIREKTUR KONTRAKTOR", "DIREKTUR", "COORDINATOR", "MANAGER"],
    SPK: ["BRANCH MANAGER", "MANAGER"],
    PERTAMBAHAN_SPK: ["BRANCH MANAGER", "MANAGER"],
    OPNAME: ["BRANCH BUILDING COORDINATOR", "BRANCH BUILDING & MAINTENANCE MANAGER", "DIREKTUR KONTRAKTOR", "COORDINATOR", "MANAGER"],
    INSTRUKSI_LAPANGAN: ["BRANCH BUILDING COORDINATOR", "BRANCH BUILDING & MAINTENANCE MANAGER", "COORDINATOR", "MANAGER"],
    PROJECT_PLANNING: ["BRANCH BUILDING & MAINTENANCE MANAGER", "BUILDING & MAINTENANCE REGIONAL MANAGER", "PROJECT PLANNING & DEVELOPMENT SPECIALIST", "PROJECT PLANNING & DEVELOPMENT MANAGER"],
    SURAT_PERINGATAN: ["BRANCH BUILDING & MAINTENANCE MANAGER"],
};

const normalizeBranch = (branch?: string | null) => (branch ?? "").trim().toUpperCase();

const hasDirectorRole = (roles: string[]) =>
    roles.some(role => role === "DIREKTUR" || role === "DIREKTUR KONTRAKTOR" || role.includes("DIREKTUR"));

const isHeadOfficeDirector = (user: UserSession) =>
    normalizeBranch(user.cabang) === "HEAD OFFICE" && hasDirectorRole(user.roles);

const isContractorCompanyScopedRole = (roles: string[]) =>
    roles.some(role => role === "KONTRAKTOR" || role.includes("DIREKTUR KONTRAKTOR"));

const normalizeCompanyName = (value?: string | null) => {
    if (!value) return "";
    let normalized = String(value).trim().toUpperCase();
    
    // Remove common punctuation and spaces
    normalized = normalized.replace(/[,.\s]+/g, "");
    
    // Remove PT/CV prefix/suffix to handle both "CV NAME" and "NAME, CV" formats
    normalized = normalized.replace(/^(PT|CV)/g, "").replace(/(PT|CV)$/g, "");
    
    return normalized;
};

const isPendingApprovalStatus = (status?: string | null) => {
    const upper = String(status ?? "").trim().toUpperCase();
    return upper.includes("MENUNGGU") || upper.startsWith("PENDING") || upper.startsWith("WAITING");
};

const isCoordinatorApprovalStatus = (status?: string | null) => {
    const upper = String(status ?? "").trim().toUpperCase();
    return upper.includes("KOORDINATOR");
};

const isManagerApprovalStatus = (status?: string | null) => {
    const upper = String(status ?? "").trim().toUpperCase();
    return upper.includes("MANAGER") || upper.includes("MANAJER");
};

const isDirectorApprovalStatus = (status?: string | null) => {
    const upper = String(status ?? "").trim().toUpperCase();
    return upper.includes("DIREKTUR") || upper.includes("DIR.");
};

const isContractorDirectorApprovalStatus = (status?: string | null) => {
    const upper = String(status ?? "").trim().toUpperCase();
    return upper.includes("DIREKTUR KONTRAKTOR") || upper.includes("DIR. KONTRAKTOR") || upper.includes("DIR KONTRAKTOR");
};

const matchesUserCompany = (value: unknown, userCompany?: string | null) => {
    const normalizedUserCompany = normalizeCompanyName(userCompany);
    if (!normalizedUserCompany || !value || typeof value !== "object") return false;

    const candidates = [
        getStringValue(value, "nama_pt"),
        getStringValue(value, "nama_kontraktor"),
        getStringValue(value, "kontraktor"),
        getTokoStringValue(value, "nama_pt"),
        getTokoStringValue(value, "nama_kontraktor"),
        getStringValue(getNestedRecord(value, "opname_final"), "nama_kontraktor"),
        getStringValue(getNestedRecord(value, "opname_final"), "nama_pt"),
    ];

    return candidates.some(candidate => normalizeCompanyName(candidate) === normalizedUserCompany);
};

const getApprovalJabatan = (user: UserSession): ApprovalJabatan => {
    const roles = user.roles;
    if (user.isSuperHuman) return "MANAGER";
    if (roles.some(role => role === "DIREKTUR KONTRAKTOR")) return "DIREKTUR_KONTRAKTOR";
    if (roles.some(role => role.includes("DIREKTUR"))) return "DIREKTUR";
    if (roles.includes("KONTRAKTOR")) return "KONTRAKTOR";
    if (roles.includes("BRANCH BUILDING & MAINTENANCE MANAGER") || roles.includes("MANAGER")) return "MANAGER";
    if (roles.includes("BRANCH BUILDING COORDINATOR") || roles.includes("COORDINATOR")) return "KOORDINATOR";
    return null;
};

const canApproveSuratPeringatan = (user: UserSession) =>
    user.isSuperHuman || user.roles.some(role => {
        const normalized = role.trim().toUpperCase();
        return normalized === "BRANCH BUILDING & MAINTENANCE MANAGER"
            || normalized.includes("BRANCH BUILDING & MAINTENANCE MANAGER");
    });

export const getAccessibleApprovalTypes = (user: UserSession): ApprovalType[] => {
    // KONTRAKTOR role gets RAB type for revision tracking (rejected submissions)
    const isContractorOnly = user.roles.some(role => role.trim().toUpperCase() === 'KONTRAKTOR');
    
    // Exclude pure "KONTRAKTOR" role (without DIREKTUR prefix) dari approval types lain
    // tapi izinkan untuk RAB revisions
    const approvalRoles = user.roles.filter(role => {
        const normalized = role.trim().toUpperCase();
        // Exclude "KONTRAKTOR" murni untuk non-RAB approvals, tapi allow "DIREKTUR KONTRAKTOR"
        if (normalized === 'KONTRAKTOR') return false;
        return true;
    });

    const isHO = normalizeBranch(user.cabang) === "HEAD OFFICE";
    const isDirectorHO = isHeadOfficeDirector(user);
    const isProjectPlanningApprovalRole = approvalRoles.some(role =>
        role.includes("PROJECT PLANNING & DEVELOPMENT SPECIALIST") ||
        role.includes("PROJECT PLANNING & DEVELOPMENT MANAGER") ||
        role.includes("PP SPECIALIST") ||
        role.includes("PP MANAGER")
    );

    const allAccessibleTypes = new Set<ApprovalType>();
    
    // KONTRAKTOR gets RAB type for revisions (rejected submissions they need to fix)
    if (isContractorOnly) {
        allAccessibleTypes.add("RAB");
    }
    
    if (user.isSuperHuman) {
        (Object.keys(ROLE_ACCESS) as ApprovalType[]).forEach(type => allAccessibleTypes.add(type));
    } else if (isProjectPlanningApprovalRole && isHO) {
        allAccessibleTypes.add("PROJECT_PLANNING");
    } else if (isDirectorHO) {
        allAccessibleTypes.add("RAB");
        if (approvalRoles.some(role => role === "DIREKTUR KONTRAKTOR")) {
            allAccessibleTypes.add("OPNAME");
        }
    } else {
        approvalRoles.forEach(role => {
            (Object.keys(ROLE_ACCESS) as ApprovalType[]).forEach(type => {
                if (ROLE_ACCESS[type].some(allowedRole => allowedRole.toUpperCase() === role)) {
                    allAccessibleTypes.add(type);
                }
            });
        });
    }

    if (isHO && approvalRoles.some(role => ROLE_ACCESS.PROJECT_PLANNING.some(allowedRole => allowedRole.toUpperCase() === role))) {
        allAccessibleTypes.add("PROJECT_PLANNING");
    }

    return Array.from(allAccessibleTypes);
};

const isSameBranchScope = (itemCabang: string | null | undefined, user: UserSession) => {
    const userCabang = normalizeBranch(user.cabang);
    if (!userCabang || !itemCabang || itemCabang === "-") return true;
    return canAccessBranchForUser(itemCabang, user.roles, userCabang, getSessionBranchCoverage());
};

const canAccessApprovalBranch = (itemCabang: string | null | undefined, user: UserSession) => {
    if (canApproveAllBranches(user.roles, user.isSuperHuman)) return true;
    return isSameBranchScope(itemCabang, user);
};

const isPendingProcessStatus = (status: string, tipe: ApprovalType) => {
    const upper = (status ?? "").toUpperCase();
    if (!upper) return false;
    if (upper === "DRAFT") return false;
    if (upper === "MENUNGGU GANTT CHART") return false;
    
    // For RAB, REJECTED status is valid for KONTRAKTOR revisions
    // We'll check company matching in canCountForUser instead
    const isRejected = upper.includes("TOLAK") || upper.includes("DITOLAK") || upper === "REJECTED" || upper === "SPK_REJECTED";
    if (tipe === "RAB" && isRejected) return true; // Allow rejected RAB for revision tracking
    
    // For other types, rejected means done/closed
    if (isRejected) return false;
    
    if (upper.includes("DISETUJUI") || upper === "APPROVED" || upper === "SPK_APPROVED" || upper === "COMPLETED") return false;

    if (tipe === "SPK") return upper === "WAITING_FOR_BM_APPROVAL";
    if (tipe === "PERTAMBAHAN_SPK") return upper === "MENUNGGU PERSETUJUAN";
    if (tipe === "PROJECT_PLANNING") return upper.startsWith("WAITING_") || upper === "PP_DESIGN_3D_REQUIRED";
    return isPendingApprovalStatus(upper);
};

const canCountProjectPlanningForUser = (item: CountableApprovalItem, user: UserSession) => {
    const upper = item.status.toUpperCase();
    const userCabang = normalizeBranch(user.cabang);
    const isHOUser = userCabang === "HEAD OFFICE";
    const canSeeAll = canApproveAllBranches(user.roles, user.isSuperHuman);
    const roles = user.roles;
    const raw = item.raw ?? {};

    if (!canSeeAll && !isHOUser) return false;

    const isBmManager = roles.some(role =>
        role.includes("BRANCH BUILDING & MAINTENANCE MANAGER") ||
        role.includes("MAINTENANCE MANAGER") ||
        role.includes("BBMM")
    );
    const isBmRegionalManager = roles.some(role =>
        role.includes("BUILDING & MAINTENANCE REGIONAL MANAGER") ||
        role.includes("REGIONAL MANAGER")
    );
    const isPpSpecialist = roles.some(role =>
        role.includes("PROJECT PLANNING & DEVELOPMENT SPECIALIST") ||
        role.includes("PP SPECIALIST")
    );
    const isPpManager = roles.some(role =>
        role.includes("PROJECT PLANNING & DEVELOPMENT MANAGER") ||
        role.includes("PP MANAGER")
    );

    if (user.isSuperHuman) return true;

    const statusMatchesRole =
        (isBmManager && (upper === "WAITING_BM_APPROVAL" || upper === "WAITING_BM_APPROVAL_2")) ||
        (isBmRegionalManager && upper === "WAITING_BM_REGIONAL_APPROVAL") ||
        (isPpSpecialist && ["WAITING_PP_APPROVAL_1", "PP_DESIGN_3D_REQUIRED", "WAITING_PP_APPROVAL_2"].includes(upper)) ||
        (isPpManager && (
            upper === "WAITING_PP_MANAGER_APPROVAL" ||
            (upper === "WAITING_RAB_UPLOAD" && !!getStringValue(raw, "pp_manager_approver_email"))
        ));

    if (!statusMatchesRole) return false;
    if (canSeeAll) return true;
    if (isBmRegionalManager && normalizeBranch(item.cabang) === "HEAD OFFICE") return true;
    if (isHOUser || user.isRegionalManager) return canAccessApprovalBranch(item.cabang, user);
    return isSameBranchScope(item.cabang, user);
};

const canCountForUser = (item: CountableApprovalItem, user: UserSession, jabatan: ApprovalJabatan) => {
    if (!isPendingProcessStatus(item.status, item.tipe)) return false;
    if (item.tipe === "PROJECT_PLANNING") {
        return canCountProjectPlanningForUser(item, user);
    }

    if (isViewOnlyUser(user.roles, user.isSuperHuman)) return false;

    const upper = item.status.toUpperCase();
    const userCabang = normalizeBranch(user.cabang);
    const isDirectorHOUser = isHeadOfficeDirector(user);
    const canSeeAll = canApproveAllBranches(user.roles, user.isSuperHuman);
    const isContractorOnly = user.roles.some(role => role.trim().toUpperCase() === 'KONTRAKTOR') 
        && !user.roles.some(role => role.includes('DIREKTUR'));

    if (!canSeeAll && jabatan !== "DIREKTUR" && jabatan !== "DIREKTUR_KONTRAKTOR") {
        if (!canAccessApprovalBranch(item.cabang, user)) return false;
    }

    // RAB: Special logic for KONTRAKTOR to see rejected submissions they need to revise
    if (item.tipe === "RAB") {
        // KONTRAKTOR sees only REJECTED items from their company
        if (isContractorOnly || jabatan === "KONTRAKTOR") {
            const isRejected = upper.includes("DITOLAK") || upper.includes("REJECTED") || upper.includes("TOLAK");
            if (!isRejected) return false;
            // Must match company name
            if (!user.namaPt || !matchesUserCompany(item.raw, user.namaPt)) return false;
            return true;
        }
        
        // Other roles: approval flow (NOT rejected items)
        if (userCabang && !isDirectorHOUser && item.cabang) {
            if (!isSameBranchScope(item.cabang, user)) return false;
        }
        
        // Stage-based approval check
        if (jabatan === "KOORDINATOR") return isCoordinatorApprovalStatus(upper);
        if (jabatan === "MANAGER") return isManagerApprovalStatus(upper);
        if (jabatan === "DIREKTUR_KONTRAKTOR") return isContractorDirectorApprovalStatus(upper);
        if (jabatan === "DIREKTUR") return isDirectorApprovalStatus(upper);
        
        // Fallback for canSeeAll
        if (canSeeAll) return true;
        
        return false;
    }

    // OPNAME: Stage check first, then company scope for role kontraktor
    if (item.tipe === "OPNAME") {
        // Stage check first
        if (jabatan === "KOORDINATOR" && !isCoordinatorApprovalStatus(upper)) return false;
        if (jabatan === "MANAGER" && !isManagerApprovalStatus(upper)) return false;
        if (jabatan === "DIREKTUR_KONTRAKTOR" && !isContractorDirectorApprovalStatus(upper)) return false;
        
        // Company scope check HANYA untuk role kontraktor (KOORDINATOR/MANAGER dari kontraktor)
        // DIREKTUR_KONTRAKTOR tetap perlu check company
        if (isContractorCompanyScopedRole(user.roles)) {
            // Jika user punya nama_pt, harus cocok. Jika tidak punya, skip (fallback untuk super human)
            if (user.namaPt && !matchesUserCompany(item.raw, user.namaPt)) return false;
        }
        
        if (canSeeAll) return true;
        
        return true; // Stage sudah cocok dan company sudah valid (jika applicable)
    }

    // IL: Company scope check untuk role kontraktor
    if (item.tipe === "INSTRUKSI_LAPANGAN" && isContractorCompanyScopedRole(user.roles)) {
        if (!user.namaPt || !matchesUserCompany(item.raw, user.namaPt)) return false;
    }

    // SURAT_PERINGATAN: only Branch Building & Maintenance Manager approves SP.
    if (item.tipe === "SURAT_PERINGATAN") {
        if (jabatan === "KOORDINATOR") return upper.includes("REJECT");
        if (!canApproveSuratPeringatan(user)) return false;
        return upper === "WAITING_MANAGER";
    }

    if (canSeeAll) return true;
    if (item.tipe === "SPK") return upper === "WAITING_FOR_BM_APPROVAL";
    if (item.tipe === "PERTAMBAHAN_SPK") return upper === "MENUNGGU PERSETUJUAN";

    if (jabatan === "KOORDINATOR") return isCoordinatorApprovalStatus(upper);
    if (jabatan === "MANAGER") return isManagerApprovalStatus(upper);
    if (jabatan === "DIREKTUR_KONTRAKTOR") return isContractorDirectorApprovalStatus(upper);
    if (jabatan === "DIREKTUR") return isDirectorApprovalStatus(upper);
    if (jabatan === "KONTRAKTOR") return upper.includes("KONTRAKTOR");
    return true;
};

const countItems = (items: CountableApprovalItem[], user: UserSession, jabatan: ApprovalJabatan) =>
    items.filter(item => canCountForUser(item, user, jabatan)).length;

const hydrateApprovalBranchCoverage = async (user: UserSession) => {
    if (typeof window === "undefined" || canApproveAllBranches(user.roles, user.isSuperHuman)) return;

    const token = sessionStorage.getItem("spartaAccessToken");
    if (!token) return;

    try {
        const response = await fetch(`${API_URL.replace(/\/$/, "")}/api/user-cabang/my-coverage`, {
            headers: {
                Authorization: `Bearer ${token}`,
                "Content-Type": "application/json",
            },
        });
        if (!response.ok) return;
        const result = await response.json();
        const coverage = Array.isArray(result.data?.branches)
            ? result.data.branches.map((branch: unknown) => String(branch).trim().toUpperCase()).filter(Boolean)
            : [];
        sessionStorage.setItem("branchCoverage", JSON.stringify(coverage));
    } catch (error) {
        console.warn("Gagal memuat coverage approval:", error);
    }
};

export const fetchApprovalNotificationCounts = async (user: UserSession): Promise<ApprovalCounts> => {
    await hydrateApprovalBranchCoverage(user);
    const accessibleTypes = getAccessibleApprovalTypes(user);
    const jabatan = getApprovalJabatan(user);
    const counts = { ...EMPTY_APPROVAL_COUNTS };

    console.log('[fetchApprovalNotificationCounts] accessibleTypes:', accessibleTypes);
    console.log('[fetchApprovalNotificationCounts] jabatan:', jabatan);
    console.log('[fetchApprovalNotificationCounts] user.namaPt:', user.namaPt);

    for (const type of accessibleTypes) {
        try {
            if (type === "RAB") {
                // Do not filter by nama_pt before counting: legacy RAB rows may have a
                // wrong contractor value, but directors still need to approve by branch/status.
                const res = await fetchRABList(undefined, { suppressGlobalError: true });
                const rabItems = (res.data ?? []).map(item => ({
                    tipe: "RAB" as const,
                    status: item.status,
                    cabang: item.cabang ?? item.toko?.cabang,
                    raw: item,
                }));
                console.log('[RAB] Total items fetched:', rabItems.length);
                counts.RAB = countItems(rabItems, user, jabatan);
                console.log('[RAB] Count after filter:', counts.RAB);
            } else if (type === "SPK") {
                const res = await fetchSPKList({ status: "WAITING_FOR_BM_APPROVAL" }, { suppressGlobalError: true });
                counts.SPK = countItems((res.data ?? []).map((item: unknown) => ({
                    tipe: "SPK",
                    status: getStringValue(item, "status") ?? "",
                    cabang: getTokoStringValue(item, "cabang") ?? getStringValue(item, "cabang"),
                    raw: item,
                })), user, jabatan);
            } else if (type === "PERTAMBAHAN_SPK") {
                const res = await fetchPertambahanSPKList({ status_persetujuan: "Menunggu Persetujuan" }, { suppressGlobalError: true });
                counts.PERTAMBAHAN_SPK = countItems((res.data ?? []).map((item: unknown) => ({
                    tipe: "PERTAMBAHAN_SPK",
                    status: getStringValue(item, "status_persetujuan") ?? "",
                    cabang: getTokoStringValue(item, "cabang"),
                    raw: item,
                })), user, jabatan);
            } else if (type === "OPNAME") {
                const res = await fetchOpnameFinalList({ aksi: "terkunci", tipe_opname: "OPNAME_FINAL" }, { suppressGlobalError: true });
                const rows = getOpnameRows(res.data);
                const opnameItems = rows.map((item: unknown) => ({
                    tipe: "OPNAME" as const,
                    status: getStringValue(item, "status_opname_final") ?? "",
                    cabang: getStringValue(item, "cabang") ?? getTokoStringValue(item, "cabang"),
                    raw: item,
                }));
                console.log('[OPNAME] Total items fetched:', opnameItems.length);
                console.log('[OPNAME] Sample item:', opnameItems[0]);
                counts.OPNAME = countItems(opnameItems, user, jabatan);
                console.log('[OPNAME] Count after filter:', counts.OPNAME);
            } else if (type === "INSTRUKSI_LAPANGAN") {
                const res = await fetchInstruksiLapanganList(undefined, { suppressGlobalError: true });
                counts.INSTRUKSI_LAPANGAN = countItems((res.data ?? []).map((item: unknown) => ({
                    tipe: "INSTRUKSI_LAPANGAN",
                    status: getStringValue(item, "status") ?? "",
                    cabang: getStringValue(item, "cabang"),
                    raw: item,
                })), user, jabatan);
            } else if (type === "PROJECT_PLANNING") {
                const res = await fetchProjekPlanningList(undefined, { suppressGlobalError: true });
                counts.PROJECT_PLANNING = countItems((res.data ?? []).map((item: unknown) => ({
                    tipe: "PROJECT_PLANNING",
                    status: getStringValue(item, "status") ?? "",
                    cabang: getStringValue(item, "cabang"),
                    raw: item,
                })), user, jabatan);
            } else if (type === "SURAT_PERINGATAN") {
                if (isContractorCompanyScopedRole(user.roles)) {
                    counts.SURAT_PERINGATAN = 0;
                    continue;
                }
                const res = await fetchDendaActions(
                    jabatan === "KOORDINATOR" ? { action_type: "SP" } : { action_type: "SP" }
                );
                counts.SURAT_PERINGATAN = countItems((res.data ?? []).filter((item) => 
                    jabatan === "KOORDINATOR" 
                        ? String(item.status || '').toUpperCase().includes("REJECT")
                        : item.status === "WAITING_MANAGER"
                ).map((item) => ({
                    tipe: "SURAT_PERINGATAN" as const,
                    status: item.status,
                    cabang: item.cabang,
                    raw: item,
                })), user, jabatan);
            }
        } catch (error) {
            console.error(`[${type}] Error fetching approval notifications:`, error);
            counts[type] = 0;
        }
    }

    console.log('[fetchApprovalNotificationCounts] Final counts:', counts);
    return counts;
};

export type ApprovalNotificationItem = {
    id: string;
    tipe: ApprovalType;
    entity_id: number | string;
    title: string;
    subtitle: string;
    description: string;
    status: string;
    cabang?: string | null;
    action_url: string;
};

const getEntityId = (value: unknown) =>
    getStringValue(value, "id")
    ?? getStringValue(value, "pengajuan_spk_id")
    ?? getStringValue(value, "projek_planning_id")
    ?? "0";

const getTitleForApprovalItem = (type: ApprovalType, raw: unknown) => {
    const directName =
        getStringValue(raw, "nama_toko")
        ?? getStringValue(raw, "nama_lokasi")
        ?? getTokoStringValue(raw, "nama_toko")
        ?? getStringValue(raw, "nomor_ulok")
        ?? getTokoStringValue(raw, "nomor_ulok");

    if (directName) return directName;
    if (type === "PERTAMBAHAN_SPK") return getStringValue(raw, "nomor_spk") ?? "Pertambahan SPK";
    if (type === "PROJECT_PLANNING") return getStringValue(raw, "nama_project") ?? "Project Planning";
    return type;
};

const getSubtitleForApprovalItem = (raw: unknown) =>
    [
        getStringValue(raw, "nomor_ulok") ?? getTokoStringValue(raw, "nomor_ulok"),
        getStringValue(raw, "lingkup_pekerjaan") ?? getTokoStringValue(raw, "lingkup_pekerjaan"),
        getStringValue(raw, "cabang") ?? getTokoStringValue(raw, "cabang"),
    ].filter(Boolean).join(" | ");

const toApprovalNotificationItem = (item: CountableApprovalItem): ApprovalNotificationItem => {
    const raw = item.raw ?? {};
    const entityId = getEntityId(raw);
    return {
        id: `approval-${item.tipe}-${entityId}`,
        tipe: item.tipe,
        entity_id: entityId,
        title: getTitleForApprovalItem(item.tipe, raw),
        subtitle: getSubtitleForApprovalItem(raw) || item.tipe,
        description: item.status || "Menunggu persetujuan",
        status: item.status,
        cabang: item.cabang,
        action_url: `/approval?type=${item.tipe}&id=${entityId}`,
    };
};

export const fetchApprovalNotificationItems = async (user: UserSession): Promise<ApprovalNotificationItem[]> => {
    await hydrateApprovalBranchCoverage(user);
    const accessibleTypes = getAccessibleApprovalTypes(user);
    const jabatan = getApprovalJabatan(user);
    const items: ApprovalNotificationItem[] = [];

    for (const type of accessibleTypes) {
        try {
            let countableItems: CountableApprovalItem[] = [];
            if (type === "RAB") {
                const res = await fetchRABList(undefined, { suppressGlobalError: true });
                countableItems = (res.data ?? []).map(item => ({
                    tipe: "RAB",
                    status: item.status,
                    cabang: item.cabang ?? item.toko?.cabang,
                    raw: item,
                }));
            } else if (type === "SPK") {
                const res = await fetchSPKList({ status: "WAITING_FOR_BM_APPROVAL" }, { suppressGlobalError: true });
                countableItems = (res.data ?? []).map((item: unknown) => ({
                    tipe: "SPK",
                    status: getStringValue(item, "status") ?? "",
                    cabang: getTokoStringValue(item, "cabang") ?? getStringValue(item, "cabang"),
                    raw: item,
                }));
            } else if (type === "PERTAMBAHAN_SPK") {
                const res = await fetchPertambahanSPKList({ status_persetujuan: "Menunggu Persetujuan" }, { suppressGlobalError: true });
                countableItems = (res.data ?? []).map((item: unknown) => ({
                    tipe: "PERTAMBAHAN_SPK",
                    status: getStringValue(item, "status_persetujuan") ?? "",
                    cabang: getTokoStringValue(item, "cabang"),
                    raw: item,
                }));
            } else if (type === "OPNAME") {
                const res = await fetchOpnameFinalList({ aksi: "terkunci", tipe_opname: "OPNAME_FINAL" }, { suppressGlobalError: true });
                countableItems = getOpnameRows(res.data).map((item: unknown) => ({
                    tipe: "OPNAME",
                    status: getStringValue(item, "status_opname_final") ?? "",
                    cabang: getStringValue(item, "cabang") ?? getTokoStringValue(item, "cabang"),
                    raw: item,
                }));
            } else if (type === "INSTRUKSI_LAPANGAN") {
                const res = await fetchInstruksiLapanganList(undefined, { suppressGlobalError: true });
                countableItems = (res.data ?? []).map((item: unknown) => ({
                    tipe: "INSTRUKSI_LAPANGAN",
                    status: getStringValue(item, "status") ?? "",
                    cabang: getStringValue(item, "cabang"),
                    raw: item,
                }));
            } else if (type === "PROJECT_PLANNING") {
                const res = await fetchProjekPlanningList(undefined, { suppressGlobalError: true });
                countableItems = (res.data ?? []).map((item: unknown) => ({
                    tipe: "PROJECT_PLANNING",
                    status: getStringValue(item, "status") ?? "",
                    cabang: getStringValue(item, "cabang"),
                    raw: item,
                }));
            } else if (type === "SURAT_PERINGATAN") {
                if (isContractorCompanyScopedRole(user.roles)) {
                    countableItems = [];
                } else {
                const res = await fetchDendaActions(
                    jabatan === "KOORDINATOR" ? { action_type: "SP" } : { action_type: "SP" }
                );
                countableItems = (res.data ?? []).filter((item) => 
                    jabatan === "KOORDINATOR" 
                        ? String(item.status || '').toUpperCase().includes("REJECT")
                        : item.status === "WAITING_MANAGER"
                ).map((item) => ({
                    tipe: "SURAT_PERINGATAN" as const,
                    status: item.status,
                    cabang: item.cabang,
                    raw: item,
                }));
                }
            }

            items.push(...countableItems.filter(item => canCountForUser(item, user, jabatan)).map(toApprovalNotificationItem));
        } catch (error) {
            console.warn(`Gagal memuat detail notifikasi approval ${type}:`, error);
        }
    }

    return items;
};

export const getApprovalNotificationTotal = (counts: ApprovalCounts, types?: ApprovalType[]) =>
    (types ?? (Object.keys(counts) as ApprovalType[])).reduce((total, type) => total + (counts[type] ?? 0), 0);
