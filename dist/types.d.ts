/**
 * Cache v0.0.1 — Shared types, constants, and interfaces.
 */
export interface RoomStats {
    gcl: number;
    cpu: {
        used: number;
        limit: number;
        bucket: number;
    };
    rooms: Record<string, unknown>;
}
export type CreepRole = "harvester" | "builder" | "upgrader";
declare global {
    interface CreepMemory {
        role?: CreepRole;
    }
}
export declare const BODY_COST: Record<BodyPartConstant, number>;
export interface SpawnRequest {
    role: CreepRole;
    body: BodyPartConstant[];
    priority: number;
}
export declare const TIER1_BODIES: Record<CreepRole, BodyPartConstant[]>;
export declare const TARGET_COUNTS: Record<CreepRole, number>;
export declare const ROLE_PRIORITY: Record<CreepRole, number>;
