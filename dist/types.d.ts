/**
 * Cache v0.0.4 — Shared types, constants, and interfaces.
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
export type CreepRole = "harvester" | "builder" | "upgrader" | "claimer" | "scout" | "remoteHarvester" | "remoteHauler";
declare global {
    interface CreepMemory {
        role?: CreepRole;
        targetRoom?: string;
        claimed?: boolean;
        sourceId?: Id<Source>;
        homeRoom?: string;
        hauling?: boolean;
    }
    interface Memory {
        expansion?: ExpansionMemory;
        remoteMining?: RemoteMiningMemory;
    }
}
export type ExpansionState = "idle" | "scouting" | "claiming" | "bootstrapping";
export interface ExpansionMemory {
    state: ExpansionState;
    targetRoom?: string;
    scoutDispatched: boolean;
    claimerSpawned: boolean;
    scoutedRooms: Record<string, number>;
}
export declare function defaultExpansionMemory(): ExpansionMemory;
export type RemoteMiningState = "idle" | "active";
export interface RemoteSourceInfo {
    id: string;
    x: number;
    y: number;
    roomName: string;
    assignedHarvesters: number;
    assignedHaulers: number;
}
export interface RemoteOp {
    roomName: string;
    state: RemoteMiningState;
    homeRoom: string;
    sources: RemoteSourceInfo[];
    lastEval: number;
}
export interface RemoteMiningMemory {
    ops: Record<string, RemoteOp>;
}
export declare function defaultRemoteMiningMemory(): RemoteMiningMemory;
export declare const BODY_COST: Record<BodyPartConstant, number>;
export interface SpawnRequest {
    role: CreepRole;
    body: BodyPartConstant[];
    priority: number;
}
export declare const TIER1_BODIES: Record<string, BodyPartConstant[]>;
export declare const EXPANSION_BODIES: Record<string, BodyPartConstant[]>;
export declare const REMOTE_BODIES: Record<string, BodyPartConstant[]>;
export declare const TARGET_COUNTS: Record<string, number>;
export declare const ROLE_PRIORITY: Record<string, number>;
