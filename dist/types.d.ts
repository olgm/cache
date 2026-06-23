/**
 * Cache v0.3.0 — Shared types, constants, and interfaces.
 *
 * This release is a fundamentals rewrite: a static-mining economy (dedicated
 * container miners + haulers), RCL-scaled creep counts and body sizes, an
 * auto-construction planner, tower defense, and a gated multi-room expansion.
 * The legacy remote-mining subsystem was removed (premature for an early
 * single-room colony — re-introduce at RCL4+).
 */
export type CreepRole = "harvester" | "miner" | "hauler" | "upgrader" | "builder" | "remoteHarvester" | "defender" | "scout" | "claimer" | "pioneer";
declare global {
    interface CreepMemory {
        role: CreepRole;
        /** Room this creep belongs to and operates in (falls back to current room). */
        homeRoom?: string;
        /** Miner: the source it is assigned to. */
        sourceId?: Id<Source>;
        /** Scout/claimer/pioneer: the room to travel to. */
        targetRoom?: string;
        /** Builder/upgrader/harvester: true = spending energy, false = gathering. */
        working?: boolean;
        /** Upgrader: consecutive ticks parked idle at an empty controller container. */
        upgraderIdleTicks?: number;
        /** Hauler: true = delivering, false = collecting. */
        hauling?: boolean;
        /** Claimer: set once the target controller is claimed. */
        claimed?: boolean;
        /** True if this creep was spawned in emergency-bootstrap mode (undersized). */
        bootstrap?: boolean;
        /** Hauler: container ID it is currently targeting (for cross-hauler coordination). */
        targetContainer?: string;
    }
    interface RoomMemory {
        /** Base-layout anchor — the first spawn's position. Structures stamp around it. */
        anchor?: {
            x: number;
            y: number;
        };
        /** Tick the construction planner last ran a full pass (throttling). */
        lastPlan?: number;
        /** Tick roads were last planned (re-pathing is expensive; throttle hard). */
        lastRoadPlan?: number;
        /** Consecutive ticks the spawn wanted an economy creep it could not afford.
         *  Drives the recovery fallback (size to energy on hand) in the spawn manager. */
        spawnStall?: number;
        /** Map of sourceId → container id beside it (cached so dark/odd ticks are cheap). */
        sourceContainers?: Record<string, Id<StructureContainer>>;
    }
    interface Memory {
        expansion?: ExpansionMemory;
        stats?: CacheStats;
        /** Schema version, bumped to trigger one-time migrations in main.ts. */
        version?: number;
    }
}
export type ExpansionState = "idle" | "scouting" | "claiming" | "bootstrapping";
export interface RoomIntel {
    sources: number;
    /** Controller owner username, if any. */
    owner?: string;
    /** Reserved by another player. */
    reserved?: boolean;
    /** Hostiles or source-keeper lairs present. */
    hostile?: boolean;
    lastSeen: number;
}
export interface ExpansionMemory {
    state: ExpansionState;
    targetRoom?: string;
    /** roomName → last-scouted tick. */
    scoutedRooms: Record<string, number>;
    /** roomName → cached intel for target selection. */
    intel: Record<string, RoomIntel>;
}
export declare function defaultExpansionMemory(): ExpansionMemory;
export declare const BODY_COST: Record<BodyPartConstant, number>;
export interface CacheStats {
    /** Game tick this snapshot was written at (SPARSE's freshness signal). */
    tick: number;
    /** Wall-clock ms (Date.now()) when written. */
    time: number;
    gcl: {
        level: number;
        progress: number;
        progressTotal: number;
    };
    gpl: {
        level: number;
        progress: number;
        progressTotal: number;
    };
    cpu: {
        used: number;
        limit: number;
        bucket: number;
    };
    credits: number;
    shard: string;
    rooms: Record<string, {
        rcl: number;
        rclProgress: number;
        rclProgressTotal: number;
        energy: number;
        energyCapacity: number;
        storage: number;
        hostiles: number;
        myCreeps: number;
        income1k: number;
        sites: number;
        extensions: number;
        containers: number;
        towers: number;
    }>;
    creepsByRole: Record<string, number>;
    spawnQueues: number;
}
