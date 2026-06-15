# Screeps World — Official API Reference

> Auto-compiled from the official documentation at <https://docs.screeps.com/api/> (source: github.com/screeps/docs, `api/source`). REFERENCE material for the Cache agents — consult it whenever you are unsure about an API call's signature, behavior, CPU cost, or return codes. **Do not edit, import into Cache, or deploy this file.**
>
> Method headings show the signature and a CPU-cost note. "Action" methods change game state and cost an extra 0.2 CPU when they return `OK`. Most in-room objects inherit from **RoomObject** (`pos`, `room`, `effects`); structures also inherit from **Structure** (`hits`, `hitsMax`, `id`, `structureType`, `destroy`, `isActive`, `notifyWhenAttacked`); owned structures from **OwnedStructure** (`my`, `owner`). Inherited members are repeated inline and tagged "(inherited from …)".
>
> When the docs are ambiguous, read the ground-truth engine source under `reference/engine/src` (see `reference/README.md`).

_Regenerate with `node reference/build-api-md.mjs`._

---

## Global objects

### Game

The main global game object containing all the game play information.

#### `Game.constructionSites` : object<string, ConstructionSite>

A hash containing all your construction sites with their id as hash keys.

#### `Game.cpu` : object

A global object containing information about your CPU usage and methods. See the [documentation](#Game-cpu) below.

#### `Game.creeps` : object<string, Creep>

```javascript
for(const i in Game.creeps) {
    Game.creeps[i].moveTo(flag);
}
```

A hash containing all your creeps with creep names as hash keys.

#### `Game.flags` : object<string, Flag>

```javascript
creep.moveTo(Game.flags.Flag1);
```

A hash containing all your flags with flag names as hash keys.

#### `Game.gcl` : object

Your <a href="/control.html#Global-Control-Level">Global Control Level</a>, an object with the following properties :

| parameter | type | description |
|---|---|---|
| `level` | number | The current level. |
| `progress` | number | The current progress to the next level. |
| `progressTotal` | number | The progress required to reach the next level. |

#### `Game.gpl` : object

Your Global Power Level, an object with the following properties :

| parameter | type | description |
|---|---|---|
| `level` | number | The current level. |
| `progress` | number | The current progress to the next level. |
| `progressTotal` | number | The progress required to reach the next level. |

#### `Game.map` : object

A global object representing world map. See the [documentation](#Game-map) below.

#### `Game.market` : object

A global object representing the in-game market. See the [documentation](#Game-market) below.

#### `Game.powerCreeps` : object<string, PowerCreep>

```javascript
Game.powerCreeps['PC1'].moveTo(flag);
```

A hash containing all your power creeps with their names as hash keys. Even power creeps 
not spawned in the world can be accessed here. 

#### `Game.resources` : object

An object with your global resources that are bound to the account, like pixels or cpu unlocks. Each object key is a resource constant, values are resources amounts.

#### `Game.rooms` : object<string, Room>

A hash containing all the rooms available to you with room names as hash keys. A room is visible if you have a creep or an owned structure in it.

#### `Game.shard` : object

A global object describing the world shard where your script is currently being executed in. See the [documentation](#Game-shard) below.

#### `Game.spawns` : object<string, StructureSpawn>

```javascript
for(const i in Game.spawns) {
    Game.spawns[i].createCreep(body);
}
```

A hash containing all your spawns with spawn names as hash keys.

#### `Game.structures` : object<string, Structure>

A hash containing all your structures with structure id as hash keys.

#### `Game.time` : number

```javascript
console.log(Game.time);
```

System game tick counter. It is automatically incremented on every tick. <a href="/game-loop.html">Learn more</a>

#### `Game.getObjectById(id)`

_CPU cost: low._

```javascript
creep.memory.sourceId = creep.pos.findClosestByRange(FIND_SOURCES).id;
const source = Game.getObjectById(creep.memory.sourceId);
```

Get an object with the specified unique ID. It may be a game object of any type. Only objects from the rooms which are visible to you can be accessed.

| parameter | type | description |
|---|---|---|
| `id` | string | The unique identificator. |

**Return value**

Returns an object instance or null if it cannot be found.

#### `Game.notify(message, [groupInterval])`

_Action: changes game state; +0.2 CPU added to its natural cost when it returns OK._

```javascript
if(creep.hits < creep.memory.lastHits) {
    Game.notify('Creep '+creep+' has been attacked at '+creep.pos+'!');
}
creep.memory.lastHits = creep.hits;
```

```javascript
if(Game.spawns['Spawn1'].energy == 0) {
    Game.notify(
        'Spawn1 is out of energy',
        180  // group these notifications for 3 hours
    );
}

```

Send a custom message at your profile email. This way, you can set up notifications to yourself on any occasion within the game. You can schedule up to 20 notifications during one game tick. Not available in the Simulation Room.

| parameter | type | description |
|---|---|---|
| `message` | string | Custom text which will be sent in the message. Maximum length is 1000 characters. |
| `groupInterval` | number | If set to 0 (default), the notification will be scheduled immediately. Otherwise, it will be grouped with other notifications and mailed out later using the specified time in minutes. |

---

### Game.cpu

A global object containing information about your CPU usage.

#### `Game.cpu.limit` : number

Your assigned CPU limit for the current shard.

#### `Game.cpu.tickLimit` : number

An amount of available CPU time at the current game tick. Usually it is higher than <code>Game.cpu.limit</code>. <a href="/cpu-limit.html">Learn more</a>

#### `Game.cpu.bucket` : number

An amount of unused CPU accumulated in your <a href="/cpu-limit.html#Bucket">bucket</a>.

#### `Game.cpu.shardLimits` : object<string,number>

An object with limits for each shard with shard names as keys. You can use [`setShardLimits`](#Game.cpu.setShardLimits) method to re-assign them.

#### `Game.cpu.unlocked` : boolean

Whether full CPU is currently unlocked for your account.

#### `Game.cpu.unlockedTime` : number

The time <a href="https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Date/getTime#Syntax">in milliseconds since UNIX epoch time</a> until full CPU is unlocked for your account. This property is not defined when full CPU is not unlocked for your account or it's unlocked with a subscription.

#### `Game.cpu.getHeapStatistics()`

_CPU cost: low._

```javascript
let heap = Game.cpu.getHeapStatistics();
console.log(`Used ${heap.total_heap_size} / ${heap.heap_size_limit}`);
```

Use this method to get heap statistics for your virtual machine. The return value is almost identical to the Node.js function [`v8.getHeapStatistics()`](https://nodejs.org/dist/latest-v8.x/docs/api/v8.html#v8_v8_getheapstatistics). This function returns one additional property: `externally_allocated_size` which is the total amount of currently allocated memory which is not included in the v8 heap but counts against this isolate's memory limit. `ArrayBuffer` instances over a certain size are externally allocated and will be counted here.

**Return value**

Returns an objects with heap statistics in the following format:

```javascript-content
{
  "total_heap_size": 29085696,
  "total_heap_size_executable": 3670016,
  "total_physical_size": 26447928,
  "total_available_size": 319649520,
  "used_heap_size": 17493824,
  "heap_size_limit": 343932928,
  "malloced_memory": 8192,
  "peak_malloced_memory": 1060096,
  "does_zap_garbage": 0,
  "externally_allocated_size": 38430000
}
```

#### `Game.cpu.getUsed()`

_CPU cost: low._

```javascript
if(Game.cpu.getUsed() > Game.cpu.tickLimit / 2) {
    console.log("Used half of CPU already!");
}
```

```javascript
for(const name in Game.creeps) {
    const startCpu = Game.cpu.getUsed();

    // creep logic goes here

    const elapsed = Game.cpu.getUsed() - startCpu;
    console.log('Creep '+name+' has used '+elapsed+' CPU time');
}

```

Get amount of CPU time used from the beginning of the current game tick. Always returns 0 in the Simulation mode.

**Return value**

Returns currently used CPU time as a float number.

#### `Game.cpu.halt()`

_CPU cost: low._

```javascript
Game.cpu.halt();
```

Reset your runtime environment and wipe all data in heap memory.

#### `Game.cpu.setShardLimits(limits)`

_CPU cost: low._

```javascript
Game.cpu.setShardLimits({shard0: 20, shard1: 10});
```

Allocate CPU limits to different shards. Total amount of CPU should remain equal to 
 [`Game.cpu.shardLimits`](#Game.cpu.shardLimits). This method can be used only once per 12 hours.

| parameter | type | description |
|---|---|---|
| `limits` | object<string, number> | An object with CPU values for each shard in the same format as `Game.cpu.shardLimits`. |

**Return value**

One of the following codes:

| code | value | description |
|---|---|---|
| `OK` | 0 | The operation has been scheduled successfully. |
| `ERR_BUSY` | -4 | 12-hours cooldown period is not over yet. |
| `ERR_INVALID_ARGS` | -10 | The argument is not a valid shard limits object. |

#### `Game.cpu.unlock()`

_CPU cost: low._

```javascript
if(Game.cpu.unlockedTime && ((Game.cpu.unlockedTime - Date.now()) < 1000*60*60*24)) {
    Game.cpu.unlock();
}
```

Unlock full CPU for your account for additional 24 hours. This method will consume 1 CPU unlock bound to your account (See [`Game.resources`](#Game.resources)).
If full CPU is not currently unlocked for your account, it may take some time (up to 5 minutes) before unlock is applied to your account.

**Return value**

One of the following codes:

| code | value | description |
|---|---|---|
| `OK` | 0 | The operation has been scheduled successfully. |
| `ERR_FULL` | -8 | Your CPU is unlocked with a subscription. |
| `ERR_NOT_ENOUGH_RESOURCES` | -6 | Your account does not have enough `cpuUnlock` resource. |

#### `Game.cpu.generatePixel()`

_CPU cost: high._

```javascript
if(Game.cpu.bucket == 10000) {
    Game.cpu.generatePixel();
}
```

Generate 1 pixel resource unit for 10000 CPU from your bucket.

**Return value**

One of the following codes:

| code | value | description |
|---|---|---|
| `OK` | 0 | The operation has been scheduled successfully. |
| `ERR_NOT_ENOUGH_RESOURCES` | -6 | Your bucket does not have enough CPU. |

---

### InterShardMemory

`InterShardMemory` object provides an interface for communicating between shards. Your script is executed separatedly 
on each shard, and their [`Memory`](#Memory) objects are isolated from each other. In order to pass messages and 
data between shards, you need to use `InterShardMemory` instead.

Every shard can have its own 100 KB of data in string format that can be accessed by all other shards. 
A shard can write only to its own data, other shards' data is read-only.

This data has nothing to do with `Memory` contents, it's a separate data container.      

#### `InterShardMemory.getLocal()`

_CPU cost: insignificant._

Returns the string contents of the current shard's data. 

#### `InterShardMemory.setLocal(value)`

_CPU cost: insignificant._

```javascript
var data = JSON.parse(InterShardMemory.getLocal() || "{}");
data.message = "hello from another shard!";
InterShardMemory.setLocal(JSON.stringify(data));
```

Replace the current shard's data with the new value.

| parameter | type | description |
|---|---|---|
| `value` | string | New data value in string format. |

#### `InterShardMemory.getRemote(shard)`

_CPU cost: insignificant._

```javascript
var data = JSON.parse(InterShardMemory.getRemote('shard0') || "{}");
console.log(data.message);
```

Returns the string contents of another shard's data.

| parameter | type | description |
|---|---|---|
| `shard` | string | Shard name. |

---

### Game.map

A global object representing world map. Use it to navigate between rooms.

#### `Game.map.describeExits(roomName)`

_CPU cost: low._

```javascript
const exits = Game.map.describeExits('W8N3');
```

List all exits available from the room with the given name.

| parameter | type | description |
|---|---|---|
| `roomName` | string | The room name. |

**Return value**

The exits information in the following format, or null if the room not found.

```javascript-content
{
    "1": "W8N4",    // TOP
    "3": "W7N3",    // RIGHT
	"5": "W8N2",    // BOTTOM
	"7": "W9N3"     // LEFT
}
```

#### `Game.map.findExit(fromRoom, toRoom, [opts])`

_CPU cost: high._

```javascript
if(creep.room != anotherRoomName) {
    const exitDir = Game.map.findExit(creep.room, anotherRoomName);
    const exit = creep.pos.findClosestByRange(exitDir);
    creep.moveTo(exit);
}
else {
    // go to some place in another room
}
```

```javascript
creep.moveTo(new RoomPosition(25, 25, anotherRoomName));
```

Find the exit direction from the given room en route to another room.

| parameter | type | description |
|---|---|---|
| `fromRoom` | string, Room | Start room name or room object. |
| `toRoom` | string, Room | Finish room name or room object. |
| `opts` _(optional)_ | object | An object with the pathfinding options. See `findRoute`. |

**Return value**

The room direction constant, one of the following:

* `FIND_EXIT_TOP`
* `FIND_EXIT_RIGHT`
* `FIND_EXIT_BOTTOM`
* `FIND_EXIT_LEFT`
			
Or one of the following error codes:

| code | value | description |
|---|---|---|
| `ERR_NO_PATH` | -2 | Path can not be found. |
| `ERR_INVALID_ARGS` | -10 | The location is incorrect. |

#### `Game.map.findRoute(fromRoom, toRoom, [opts])`

_CPU cost: high._

```javascript
const route = Game.map.findRoute(creep.room, anotherRoomName);
if(route.length > 0) {
    console.log('Now heading to room '+route[0].room);
    const exit = creep.pos.findClosestByRange(route[0].exit);
    creep.moveTo(exit);
}
```

```javascript
const route = Game.map.findRoute(creep.room, anotherRoomName, {
	routeCallback(roomName, fromRoomName) {
		if(roomName == 'W10S10') {	// avoid this room
			return Infinity;
		}
		return 1;
	}});
```

```javascript
let from = new RoomPosition(25, 25, 'E1N1');
let to = new RoomPosition(25, 25, 'E4N1');

// Use `findRoute` to calculate a high-level plan for this path,
// prioritizing highways and owned rooms
let allowedRooms = { [ from.roomName ]: true };
Game.map.findRoute(from.roomName, to.roomName, {
	routeCallback(roomName) {
		let parsed = /^[WE]([0-9]+)[NS]([0-9]+)$/.exec(roomName);
		let isHighway = (parsed[1] % 10 === 0) || 
		                (parsed[2] % 10 === 0);
		let isMyRoom = Game.rooms[roomName] &&
			Game.rooms[roomName].controller &&
			Game.rooms[roomName].controller.my;
		if (isHighway || isMyRoom) {
			return 1;
		} else {
			return 2.5;
		}
	}
}).forEach(function(info) {
	allowedRooms[info.room] = true;
});

// Invoke PathFinder, allowing access only to rooms from `findRoute`
let ret = PathFinder.search(from, to, {
	roomCallback(roomName) {
		if (allowedRooms[roomName] === undefined) {
			return false;
		}
	}
});

console.log(ret.path);
```

Find route from the given room to another room.

| parameter | type | description |
|---|---|---|
| `fromRoom` | string, Room | Start room name or room object. |
| `toRoom` | string, Room | Finish room name or room object. |
| `opts` _(optional)_ | object | An object with the following options: routeCallback function This callback accepts two arguments: `function(roomName, fromRoomName)`. It can be used to calculate the cost of entering that room. You can use this to do things like prioritize your own rooms, or avoid some rooms. You can return a floating point cost or `Infinity` to block the room. |

**Return value**

The route array in the following format:

```javascript-content
[
    { exit: FIND_EXIT_RIGHT, room: 'arena21' },
    { exit: FIND_EXIT_BOTTOM, room: 'arena22' },
    ...
]
```

Or one of the following error codes:

| code | value | description |
|---|---|---|
| `ERR_NO_PATH` | -2 | Path can not be found. |

#### `Game.map.getRoomLinearDistance(roomName1, roomName2, [continuous])`

_CPU cost: insignificant._

```javascript
Game.map.getRoomLinearDistance('W1N1', 'W4N2'); // 3
Game.map.getRoomLinearDistance('E65S55','W65S55', false) // 131
Game.map.getRoomLinearDistance('E65S55','W65S55', true) // 11
```

Get the linear distance (in rooms) between two rooms. You can use this function to estimate the energy cost of sending resources through terminals, or using observers and nukes.

| parameter | type | description |
|---|---|---|
| `roomName1` | string | The name of the first room. |
| `roomName2` | string | The name of the second room. |
| `continuous` _(optional)_ | boolean | Whether to treat the world map continuous on borders. Set to true if you want to calculate the trade or terminal send cost. Default is false. |

**Return value**

A number of rooms between the given two rooms.

#### `Game.map.getRoomTerrain(roomName)`

_CPU cost: insignificant._

```javascript
const terrain = Game.map.getRoomTerrain("E2S7");
switch(terrain.get(10,15)) {
    case TERRAIN_MASK_WALL:
        break;
    case TERRAIN_MASK_SWAMP:
        break;
    case 0:
        break;
}
```

Get a <a href="#Room-Terrain">`Room.Terrain`</a> object which provides fast access to static terrain data. This method works for any room in the world even if you have no access to it.

| parameter | type | description |
|---|---|---|
| `roomName` | string | The room name. |

**Return value**

Returns new <a href="#Room-Terrain">`Room.Terrain`</a> object.

#### `Game.map.getTerrainAt(x, y, roomName) / Game.map.getTerrainAt(pos)`

_CPU cost: low._

> **Deprecated method — will be removed.** Please use a faster method [`Game.map.getRoomTerrain`](#Game.map.getRoomTerrain) instead.

```javascript
console.log(Game.map.getTerrainAt(25,20,'W10N10'));
```

```javascript
console.log(Game.map.getTerrainAt(new RoomPosition(25,20,'W10N10'));
```

Get terrain type at the specified room position. This method works for any room in the world even if you have no access to it.

| parameter | type | description |
|---|---|---|
| `x` | number | X position in the room. |
| `y` | number | Y position in the room. |
| `roomName` | string | The room name. |
| `pos` | RoomPosition | The position object. |

**Return value**

One of the following string values:
<ul>
				<li><code>plain</code></li>
				<li><code>swamp</code></li>
				<li><code>wall</code></li>
			</ul>

#### `Game.map.getWorldSize()`

_CPU cost: insignificant._

Returns the world size as a number of rooms between world corners. For example, for a world with rooms from W50N50 
to E50S50 this method will return 102.

#### `Game.map.isRoomAvailable(roomName)`

_CPU cost: medium._

> **Deprecated method — will be removed.** Please use [`Game.map.getRoomStatus`](#Game.map.getRoomStatus) instead.

```javascript
if(Game.map.isRoomAvailable(room.name)) {
    creep.moveTo(room.getPositionAt(25,25));
}
```

Check if the room is available to move into.

| parameter | type | description |
|---|---|---|
| `roomName` | string | The room name. |

**Return value**

A boolean value.

#### `Game.map.getRoomStatus(roomName)`

_CPU cost: medium._

```javascript
if(Game.map.getRoomStatus(room.name).status == 'normal') {
    nuker.launchNuke(room.getPositionAt(25,25));
}
```

Gets availablity status of the room with the specified name. Learn more about starting areas from [this article](/start-areas.html).

| parameter | type | description |
|---|---|---|
| `roomName` | string | The room name. |

**Return value**

An object containing the following properties:

property | type | description
---|---
`status` | string | One of the following string values: <ul><li><code>normal</code> &ndash; the room has no restrictions</li><li><code>closed</code> &ndash; the room is not available</li><li><code>novice</code> &ndash; the room is part of a novice area</li><li><code>respawn</code> &ndash; the room is part of a respawn area</li></ul>
`timestamp` | number | Status expiration time <a href="https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Date/getTime#Syntax">in milliseconds since UNIX epoch time</a>. This property is null if the status is permanent.  

---

### Game.map.visual

Map visuals provide a way to show various visual debug info on the game map. You can use the `Game.map.visual` object to draw simple shapes that are visible only to you. 

Map visuals are not stored in the database, their only purpose is to display something in your browser. All drawings will persist for one tick and will disappear if not updated. All `Game.map.visual` calls have no added CPU cost (their cost is natural and mostly related to simple `JSON.serialize` calls). However, there is a usage limit: you cannot post more than 1000 KB of serialized data. 

All draw coordinates are measured in global game coordinates ([`RoomPosition`](#RoomPosition)).

#### `line(pos1, pos2, [style])`

_CPU cost: insignificant._

```javascript
Game.map.visual.line(creep.pos, target.pos,
    {color: '#ff0000', lineStyle: 'dashed'});
```

Draw a line.

| parameter | type | description |
|---|---|---|
| `pos1` | RoomPosition | The start position object. |
| `pos2` | RoomPosition | The finish position object. |
| `style` _(optional)_ | object | An object with the following properties: width number Line width, default is 0.1. color string Line color in the following format: `#ffffff` (hex triplet). Default is #ffffff. opacity number Opacity value, default is 0.5. lineStyle string Either `undefined` (solid line), `dashed`, or `dotted`. Default is undefined. |

**Return value**

The <code>MapVisual</code> object itself, so that you can chain calls.

#### `circle(pos, [style])`

_CPU cost: insignificant._

```javascript
Game.map.visual.circle(new RoomPosition(25,25,'E2S7'));
```

```javascript
Game.map.visual.circle(nuker.pos, {fill: 'transparent', radius: NUKE_RANGE*50, stroke: '#ff0000'});
```

Draw a circle.

| parameter | type | description |
|---|---|---|
| `pos` | RoomPosition | The position object of the center. |
| `style` _(optional)_ | object | An object with the following properties: radius number Circle radius, default is 10. fill string Fill color in the following format: `#ffffff` (hex triplet). Default is #ffffff. opacity number Opacity value, default is 0.5. stroke string Stroke color in the following format: `#ffffff` (hex triplet). Default is undefined (no stroke). strokeWidth number Stroke line width, default is 0.5. lineStyle string Either `undefined` (solid line), `dashed`, or `dotted`. Default is undefined. |

**Return value**

The <code>MapVisual</code> object itself, so that you can chain calls.

#### `rect(topLeftPos, width, height, [style])`

_CPU cost: insignificant._

```javascript
// the max efficiency area of the tower
Game.map.visual.rect(new RoomPosition(tower.pos.x - 5, tower.pos.y - 5, tower.pos.roomName), 
    11, 11,
    {fill: 'transparent', stroke: '#ff0000'});
```

Draw a rectangle.

| parameter | type | description |
|---|---|---|
| `topLeftPos` | RoomPosition | The position object of the top-left corner. |
| `width` | number | The width of the rectangle. |
| `height` | number | The height of the rectangle. |
| `style` _(optional)_ | object | An object with the following properties: fill string Fill color in the following format: `#ffffff` (hex triplet). Default is #ffffff. opacity number Opacity value, default is 0.5. stroke string Stroke color in the following format: `#ffffff` (hex triplet). Default is undefined (no stroke). strokeWidth number Stroke line width, default is 0.5. lineStyle string Either `undefined` (solid line), `dashed`, or `dotted`. Default is undefined. |

**Return value**

The <code>MapVisual</code> object itself, so that you can chain calls.

#### `poly(points, [style])`

_CPU cost: insignificant._

```javascript
const points = [];
points.push(creep1.pos);
points.push(Game.rooms.E2S7.storage.pos);
points.push(new RoomPosition(20,21,'W1N1'));
Game.map.visual.poly(points, {fill: 'aqua'}); 
```

```javascript
// visualize the path
const path = PathFinder.search(creep.pos, creep.room.storage.pos).path;
Game.map.visual.poly(path, {stroke: '#ffffff', strokeWidth: .8, opacity: .2, lineStyle: 'dashed'});
```

Draw a polyline.

| parameter | type | description |
|---|---|---|
| `points` | array | An array of points. Every item should be a `RoomPosition` object. |
| `style` _(optional)_ | object | An object with the following properties: fill string Fill color in the following format: `#ffffff` (hex triplet). Default is `undefined` (no fill). opacity number Opacity value, default is 0.5. stroke string Stroke color in the following format: `#ffffff` (hex triplet). Default is #ffffff. strokeWidth number Stroke line width, default is 0.5. lineStyle string Either `undefined` (solid line), `dashed`, or `dotted`. Default is undefined. |

**Return value**

The <code>MapVisual</code> object itself, so that you can chain calls.

#### `text(text, pos, [style])`

_CPU cost: insignificant._

```javascript
Game.map.visual.text("Target💥", new RoomPosition(11,14,'E2S7'), {color: '#FF0000', fontSize: 10}); 
```

Draw a text label. You can use any valid Unicode characters, including <a href="http://unicode.org/emoji/charts/emoji-style.txt" target="_blank">emoji</a>.

| parameter | type | description |
|---|---|---|
| `text` | string | The text message. |
| `pos` | RoomPosition | The position object of the label baseline. |
| `style` _(optional)_ | object | An object with the following properties: color string Font color in the following format: `#ffffff` (hex triplet). Default is #ffffff. fontFamily string The font family, default is `sans-serif` fontSize number The font size in game coordinates, default is 10 fontStyle string The font style ('normal', 'italic' or 'oblique') fontVariant string The font variant ('normal' or 'small-caps') stroke string Stroke color in the following format: `#ffffff` (hex triplet). Default is undefined (no stroke). strokeWidth number Stroke width, default is 0.15. backgroundColor string Background color in the following format: `#ffffff` (hex triplet). Default is undefined (no background). When background is enabled, text vertical align is set to middle (default is baseline). backgroundPadding number Background rectangle padding, default is 2. align string Text align, either `center`, `left`, or `right`. Default is `center`. opacity number Opacity value, default is 0.5. |

**Return value**

The <code>MapVisual</code> object itself, so that you can chain calls.

#### `clear()`

_CPU cost: insignificant._

```javascript
Game.map.visual.clear();
```

Remove all visuals from the map.

**Return value**

The <code>MapVisual</code> object itself, so that you can chain calls.

#### `getSize()`

_CPU cost: insignificant._

```javascript
if(Game.map.visual.getSize() >= 1024000) {
    // cannot add more visuals in this tick
}
```

Get the stored size of all visuals added on the map in the current tick. It must not exceed 1024,000 (1000 KB).

**Return value**

The size of the visuals in bytes.

#### `export()`

_CPU cost: insignificant._

```javascript
Memory.MapVisualData = Game.map.visual.export();
```

Returns a compact representation of all visuals added on the map in the current tick.

**Return value**

A string with visuals data. There's not much you can do with the string besides store them for later.

#### `import(val)`

_CPU cost: insignificant._

```javascript
Game.map.visual.import(Memory.MapVisualData);
```

Add previously exported (with <a href="#Game.map-visual.export">Game.map.visual.export</a>) map visuals to the map visual data of the current tick. 

| parameter | type | description |
|---|---|---|
| `val` | string | The string returned from Game.map.visual.export. |

**Return value**

The <code>MapVisual</code> object itself, so that you can chain calls.

---

### Game.market

A global object representing the in-game market. You can use this object to track resource transactions to/from your terminals, and your buy/sell orders.

Learn more about the market system from [this article](/market.html).

#### `Game.market.credits` : number

Your current credits balance.

#### `Game.market.incomingTransactions` : array

```javascript
[{
    transactionId : "56dec546a180ce641dd65960",
    time : 10390687,
    sender : {username: "Sender"},
    recipient : {username: "Me"},
    resourceType : "U",
    amount : 100,
    from : "W0N0",
    to : "W10N10",
    description : "trade contract #1",
	order: {		// optional
		id : "55c34a6b5be41a0a6e80c68b",
		type : "sell",
		price : 2.95
	}
}]
```

An array of the last 100 incoming transactions to your terminals with the following format:

#### `Game.market.outgoingTransactions` : array

```javascript
[{
    transactionId : "56dec546a180ce641dd65960",
    time : 10390687,
    sender : {username: "Me"},
    recipient : {username: "Recipient"},
    resourceType : "U",
    amount : 100,
    from : "W0N0",
    to : "W10N10",
    description : "trade contract #1",
	order: {		// optional
		id : "55c34a6b5be41a0a6e80c68b",
		type : "sell",
		price : 2.95
	}
}]
```

An array of the last 100 outgoing transactions from your terminals with the following format:

#### `Game.market.orders` : object

```javascript
{
	"55c34a6b5be41a0a6e80c68b": {
		id : "55c34a6b5be41a0a6e80c68b",
		created : 13131117,
		active: true,
		type : "sell"
		resourceType : "OH",
		roomName : "W1N1",
		amount : 15821,
		remainingAmount : 30000,
		totalAmount : 50000,
		price : 2.95
	},
	"55c34a6b52411a0a6e80693a": {
		id : "55c34a6b52411a0a6e80693a",
		created : 13134122,
		active: true,
		type : "buy"
		resourceType : "energy",
		roomName : "W1N1",
		amount : 94000,
		remainingAmount : 94000,
		totalAmount : 94000
		price : 0.45
	},
	"55c34a6b5be41a0a6e80c123": {
		id : "55c34a6b5be41a0a6e80c123",
		created : 13105123,
		active: false,
		type : "sell"
		resourceType : "token",
		amount : 0,
		remainingAmount : 10,
		totalAmount : 10,
		price : 50000
	}
}
```

An object with your active and inactive buy/sell orders on the market.
See
<a href="#getAllOrders"><code>getAllOrders</code></a>
for properties explanation.

#### `Game.market.calcTransactionCost(amount, roomName1, roomName2)`

_CPU cost: insignificant._

```javascript
const cost = Game.market.calcTransactionCost(1000, 'W0N0', 'W10N5');
// -> 284 energy units
```

Estimate the energy transaction cost of <a href="#StructureTerminal.send"><code>StructureTerminal.send</code></a> and <a href="#Game.market.deal"><code>Game.market.deal</code></a> methods. 
The formula:

```javascript-content
Math.ceil( amount * ( 1 - Math.exp(-distanceBetweenRooms/30) ) )
```

| parameter | type | description |
|---|---|---|
| `amount` | number | Amount of resources to be sent. |
| `roomName1` | string | The name of the first room. |
| `roomName2` | string | The name of the second room. |

**Return value**

The amount of energy required to perform the transaction.

#### `Game.market.cancelOrder(orderId)`

_Action: changes game state; +0.2 CPU added to its natural cost when it returns OK._

```javascript
for(const id in Game.market.orders) {
    Game.market.cancelOrder(id);
}
```

Cancel a previously created order. The 5% fee is not returned.

| parameter | type | description |
|---|---|---|
| `orderId` | string | The order ID as provided in `Game.market.orders`. |

**Return value**

One of the following codes:

| code | value | description |
|---|---|---|
| `OK` | 0 | The operation has been scheduled successfully. |
| `ERR_INVALID_ARGS` | -10 | The order ID is not valid. |

#### `Game.market.changeOrderPrice(orderId, newPrice)`

_Action: changes game state; +0.2 CPU added to its natural cost when it returns OK._

```javascript
Game.market.changeOrderPrice('57bec1bf77f4d17c4c011960', 9.95);
```

Change the price of an existing order. If <code>newPrice</code> is greater than old price, you will be charged <code>(newPrice-oldPrice)\*remainingAmount\*0.05</code> credits.

| parameter | type | description |
|---|---|---|
| `orderId` | string | The order ID as provided in `Game.market.orders`. |
| `newPrice` | number | The new order price. |

**Return value**

One of the following codes:

| code | value | description |
|---|---|---|
| `OK` | 0 | The operation has been scheduled successfully. |
| `ERR_NOT_OWNER` | -1 | You are not the owner of the room's terminal or there is no terminal. |
| `ERR_NOT_ENOUGH_RESOURCES` | -6 | You don't have enough credits to pay a fee. |
| `ERR_INVALID_ARGS` | -10 | The arguments provided are invalid. |

#### `Game.market.createOrder(params)`

_Action: changes game state; +0.2 CPU added to its natural cost when it returns OK._

```javascript
Game.market.createOrder({
    type: ORDER_SELL,
    resourceType: RESOURCE_GHODIUM,
    price: 9.95,
    totalAmount: 10000,
    roomName: "W1N1"   
});
```

Create a market order in your terminal. You will be charged <code>price\*amount\*0.05</code> credits when the order is placed. The maximum orders count is 300 per player. You can create an order at any time with any amount, it will be automatically activated and deactivated depending on the resource/credits availability.

| parameter | type | description |
|---|---|---|
| `params` | object | An object with the following params: type string The order type, either `ORDER_SELL` or `ORDER\_BUY`. resourceType string Either one of the `RESOURCE_*` constants or one of account-bound resources (See `INTERSHARD_RESOURCES` constant). If your Terminal doesn't have the specified resource, the order will be temporary inactive. price number The price for one resource unit in credits. Can be a decimal number. totalAmount number The amount of resources to be traded in total. roomName (optional) string The room where your order will be created. You must have your own Terminal structure in this room, otherwise the created order will be temporary inactive. This argument is not used when `resourceType` is one of account-bound resources (See `INTERSHARD_RESOURCES` constant). |

**Return value**

One of the following codes:

| code | value | description |
|---|---|---|
| `OK` | 0 | The operation has been scheduled successfully. |
| `ERR_NOT_OWNER` | -1 | You are not the owner of the room's terminal or there is no terminal. |
| `ERR_NOT_ENOUGH_RESOURCES` | -6 | You don't have enough credits to pay a fee. |
| `ERR_FULL` | -8 | You cannot create more than 50 orders. |
| `ERR_INVALID_ARGS` | -10 | The arguments provided are invalid. |

#### `Game.market.deal(orderId, amount, [yourRoomName])`

_Action: changes game state; +0.2 CPU added to its natural cost when it returns OK._

```javascript
Game.market.deal('57cd2b12cda69a004ae223a3', 1000, "W1N1");
```

```javascript
const amountToBuy = 2000, maxTransferEnergyCost = 500;
const orders = Game.market.getAllOrders({type: ORDER_SELL, resourceType: RESOURCE_GHODIUM});

for(let i=0; i<orders.length; i++) {
    const transferEnergyCost = Game.market.calcTransactionCost(
        amountToBuy, 'W1N1', orders[i].roomName);

    if(transferEnergyCost < maxTransferEnergyCost) {
        Game.market.deal(orders[i].id, amountToBuy, "W1N1");
        break;
    }
}
```

Execute a trade deal from your Terminal in <code>yourRoomName</code> to another player's Terminal using the specified buy/sell order. Your Terminal will be charged energy units of transfer cost regardless of the order resource type. You can use <a href="#calcTransactionCost"><code>Game.market.calcTransactionCost</code></a> method to estimate it. When multiple players try to execute the same deal, the one with the shortest distance takes precedence. You cannot execute more than 10 deals during one tick.

| parameter | type | description |
|---|---|---|
| `orderId` | string | The order ID as provided in `Game.market.getAllOrders`. |
| `amount` | number | The amount of resources to transfer. |
| `yourRoomName` _(optional)_ | string | The name of your room which has to contain an active Terminal with enough amount of energy. This argument is not used when the order resource type is one of account-bound resources (See `INTERSHARD_RESOURCES` constant). |

**Return value**

One of the following codes:

| code | value | description |
|---|---|---|
| `OK` | 0 | The operation has been scheduled successfully. |
| `ERR_NOT_OWNER` | -1 | You don't have a terminal in the target room. |
| `ERR_NOT_ENOUGH_RESOURCES` | -6 | You don't have enough credits or resource units. |
| `ERR_FULL` | -8 | You cannot execute more than 10 deals during one tick. |
| `ERR_INVALID_ARGS` | -10 | The arguments provided are invalid. |
| `ERR_TIRED` | -11 | The target terminal is still cooling down. |

#### `Game.market.extendOrder(orderId, addAmount)`

_Action: changes game state; +0.2 CPU added to its natural cost when it returns OK._

```javascript
Game.market.extendOrder('57bec1bf77f4d17c4c011960', 10000);
```

Add more capacity to an existing order. It will affect <code>remainingAmount</code> and <code>totalAmount</code> properties. You will be charged <code>price\*addAmount\*0.05</code> credits.

| parameter | type | description |
|---|---|---|
| `orderId` | string | The order ID as provided in `Game.market.orders`. |
| `addAmount` | number | How much capacity to add. Cannot be a negative value. |

**Return value**

One of the following codes:

| code | value | description |
|---|---|---|
| `OK` | 0 | The operation has been scheduled successfully. |
| `ERR_NOT_ENOUGH_RESOURCES` | -6 | You don't have enough credits to pay a fee. |
| `ERR_INVALID_ARGS` | -10 | The arguments provided are invalid. |

#### `Game.market.getAllOrders([filter])`

_CPU cost: high._

```javascript
Game.market.getAllOrders(); // slow
```

```javascript
Game.market.getAllOrders({type: ORDER_SELL, resourceType: RESOURCE_GHODIUM}); // fast
```

```javascript
const targetRoom = "W1N1";
Game.market.getAllOrders(order => order.resourceType == RESOURCE_GHODIUM &&
	order.type == ORDER_SELL &&
    Game.market.calcTransactionCost(1000, targetRoom, order.roomName) < 500); // slow
```

```javascript
// Output:

[{
	id : "55c34a6b5be41a0a6e80c68b",
	created : 13131117,
	type : "sell",
	resourceType : "OH",
	roomName : "W1N1",
	amount : 15821,
	remainingAmount : 30000,
	price : 2.95
}, {
    createdTimestamp: 1543253147522,
    type: "sell",
    amount: 1000,
    remainingAmount: 1000,
    resourceType: "O",
    price: 1,
    roomName: "E2S7",
    created: 12010056,
    id: "5bfc2c9bd719fb605037c06d"
}, {
	id : "55c34a6b5be41a0a6e80c123",
	createdTimestamp: 1543253155580,
	type : "sell",
	resourceType : "token",
	amount : 3,
	remainingAmount : 10,
	price : 50000
}]
```

Get other players' orders currently active on the market. This method supports internal indexing by `resourceType`.

| parameter | type | description |
|---|---|---|
| `filter` _(optional)_ | object, function | An object or function that will filter the resulting list using the `lodash.filter` method. |

**Return value**

An orders array in the following form:

property | description
---|---
`id` | The unique order ID.
`created` | The order creation time in game ticks. This property is absent for orders of the inter-shard market.
`createdTimestamp` | The order creation time <a href="https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Date/getTime#Syntax">in milliseconds since UNIX epoch time</a>. This property is absent for old orders.
`type` | Either <code>ORDER_SELL</code> or <code>ORDER_BUY</code>.
`resourceType` | Either one of the <code>RESOURCE_*</code> constants or one of account-bound resources (See <code>INTERSHARD_RESOURCES</code> constant).
`roomName` | The room where this order is placed.
`amount` | Currently available amount to trade.
`remainingAmount` | How many resources are left to trade via this order. 
`price` | The current price per unit.

#### `Game.market.getHistory([resourceType])`

_CPU cost: low._

Get daily price history of the specified resource on the market for the last 14 days. 

| parameter | type | description |
|---|---|---|
| `resourceType` _(optional)_ | string | One of the `RESOURCE_*` constants. If undefined, returns history data for all resources. |

**Return value**

Returns an array of objects with the following format:
```json-content
[{
    "resourceType": "L",
    "date": "2019-06-24",
    "transactions": 4,
    "volume": 400,
    "avgPrice": 3.63,
    "stddevPrice": 0.27
}]    
``` 

#### `Game.market.getOrderById(id)`

_CPU cost: low._

```javascript
const order = Game.market.getOrderById('55c34a6b5be41a0a6e80c123');
```

Retrieve info for specific market order.

| parameter | type | description |
|---|---|---|
| `id` | string | The order ID. |

**Return value**

An object with the order info. See
<a href="#getAllOrders"><code>getAllOrders</code></a>
for properties explanation.

---

### Game.shard

An object describing the world shard where your script is currently being executed in.

#### `Game.shard.name` : string

The name of the shard.

#### `Game.shard.type` : string

Currently always equals to `normal`.

#### `Game.shard.ptr` : boolean

Whether this shard belongs to the [PTR](/ptr.html).

#### `Game.shard.access` : boolean

Whether you currently have access to this shard. Always `true` on non-restricted shards. On restricted shards, requires either an active [`ACCESS_KEY`](#Constants) resource or an unlimited access subscription. Use [`Game.shard.activateAccess`](#Game.shard.activateAccess) to activate access.

#### `Game.shard.accessTime` : number

The time <a href="https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Date/getTime#Syntax">in milliseconds since UNIX epoch time</a> until access to this restricted shard is active. This property is not defined when access is unlimited or when access is not currently active.

#### `Game.shard.activateAccess()`

_CPU cost: low._

```javascript
if(Game.shard.access && Game.shard.accessTime && ((Game.shard.accessTime - Date.now()) < 1000*60*60*24*7)) {
    Game.shard.activateAccess();
}
```

Activate access to the current restricted shard for additional 30 days. This method will consume 1 [`ACCESS_KEY`](#Constants) resource bound to your account (See [`Game.resources`](#Game.resources)). This method is only available on restricted shards (when `Game.shard.access` is defined).

**Return value**

One of the following codes:

| code | value | description |
|---|---|---|
| `OK` | 0 | The operation has been scheduled successfully. |
| `ERR_INVALID_TARGET` | -7 | This shard is not restricted. |
| `ERR_FULL` | -8 | Your access is unlimited. |
| `ERR_NOT_ENOUGH_RESOURCES` | -6 | Your account does not have enough `accessKey` resource. |

---

### Memory

A global plain object which can contain arbitrary data. You can access it both using the API and the Memory UI in the game editor.
Learn how to work with memory from [this article](http://docs.screeps.com/global-objects.html#Memory-object).

---

### PathFinder
 
 Contains powerful methods for pathfinding in the game world. This module is written in fast native C++ code and supports custom navigation costs and paths which span multiple rooms. 

#### `PathFinder.search(origin, goal, [opts])`

_CPU cost: high._

```javascript
  let creep = Game.creeps.John;

  let goals = _.map(creep.room.find(FIND_SOURCES), function(source) {
    // We can't actually walk on sources-- set `range` to 1 
    // so we path next to it.
    return { pos: source.pos, range: 1 };
  });

  let ret = PathFinder.search(
    creep.pos, goals,
    {
      // We need to set the defaults costs higher so that we
      // can set the road cost lower in `roomCallback`
      plainCost: 2,
      swampCost: 10,

      roomCallback: function(roomName) {

        let room = Game.rooms[roomName];
        // In this example `room` will always exist, but since 
        // PathFinder supports searches which span multiple rooms 
        // you should be careful!
        if (!room) return;
        let costs = new PathFinder.CostMatrix;

        room.find(FIND_STRUCTURES).forEach(function(struct) {
          if (struct.structureType === STRUCTURE_ROAD) {
            // Favor roads over plain tiles
            costs.set(struct.pos.x, struct.pos.y, 1);
          } else if (struct.structureType !== STRUCTURE_CONTAINER &&
                     (struct.structureType !== STRUCTURE_RAMPART ||
                      !struct.my)) {
            // Can't walk through non-walkable buildings
            costs.set(struct.pos.x, struct.pos.y, 0xff);
          }
        });

        // Avoid creeps in the room
        room.find(FIND_CREEPS).forEach(function(creep) {
          costs.set(creep.pos.x, creep.pos.y, 0xff);
        });

        return costs;
      },
    }
  );

  let pos = ret.path[0];
  creep.move(creep.pos.getDirectionTo(pos));
```

Find an optimal path between <code>origin</code> and <code>goal</code>.

| parameter | type | description |
|---|---|---|
| `origin` | RoomPosition | The start position. |
| `goal` | object | A goal or an array of goals. If more than one goal is supplied then the cheapest path found out of all the goals will be returned. A goal is either a RoomPosition or an object as defined below. Important: Please note that if your goal is not walkable (for instance, a source) then you should set `range` to at least 1 or else you will waste many CPU cycles searching for a target that you can't walk on. pos `RoomPosition` The target. range number Range to `pos` before goal is considered reached. The default is 0. |
| `opts` _(optional)_ | object | An object containing additional pathfinding flags. roomCallback function Request from the pathfinder to generate a `CostMatrix` for a certain room. The callback accepts one argument, `roomName`. This callback will only be called once per room per search. If you are running multiple pathfinding operations in a single room and in a single tick you may consider caching your CostMatrix to speed up your code. Please read the CostMatrix documentation below for more information on CostMatrix. If you return `false` from the callback the requested room will not be searched, and it won't count against `maxRooms` plainCost number Cost for walking on plain positions. The default is 1. swampCost number Cost for walking on swamp positions. The default is 5. flee boolean Instead of searching for a path to the goals this will search for a path away from the goals. The cheapest path that is out of `range` of every goal will be returned. The default is false. maxOps number The maximum allowed pathfinding operations. You can limit CPU time used for the search based on ratio 1 op ~ 0.001 CPU. The default value is 2000. maxRooms number The maximum allowed rooms to search. The default is 16, maximum is 64. maxCost number The maximum allowed cost of the path returned. If at any point the pathfinder detects that it is impossible to find a path with a cost less than or equal to `maxCost` it will immediately halt the search. The default is Infinity. heuristicWeight number Weight to apply to the heuristic in the A\* formula `F = G + weight \* H`. Use this option only if you understand the underlying A\* algorithm mechanics! The default value is 1.2. |

**Return value**

An object containing the following properties:

property | description
---|---
`path` | An array of RoomPosition objects.
`ops` | Total number of operations performed before this path was calculated.
`cost` | The total cost of the path as derived from `plainCost`, `swampCost` and any given CostMatrix instances.
`incomplete` | If the pathfinder fails to find a complete path, this will be true. Note that `path` will still be populated with a partial path which represents the closest path it could find given the search parameters.			

#### `PathFinder.use(isEnabled)`

_CPU cost: insignificant._

> **Deprecated method — will be removed.**

```javascript
PathFinder.use(true);
Game.creeps.John.moveTo(Game.spawns['Spawn1']);
```

Specify whether to use this new experimental pathfinder in game objects methods. This method should be invoked every tick. It affects the following methods behavior: <a href="#Room.findPath"><code>Room.findPath</code></a>, <a href="#RoomPosition.findPathTo"><code>RoomPosition.findPathTo</code></a>, <a href="#RoomPosition.findClosestByPath"><code>RoomPosition.findClosestByPath</code></a>, <a href="#Creep.moveTo"><code>Creep.moveTo</code></a>.

| parameter | type | description |
|---|---|---|
| `isEnabled` | boolean | Whether to activate the new pathfinder or deactivate. The default is `true`. |

---

### RawMemory

RawMemory object allows to implement your own memory stringifier instead of built-in serializer 
based on `JSON.stringify`. It also allows to request up to 10 MB of additional memory 
using asynchronous memory segments feature.

You can also access memory segments of other players using methods below.

#### `RawMemory.segments` : object

```javascript
RawMemory.setActiveSegments([0,3]);
// on the next tick
console.log(RawMemory.segments[0]);
console.log(RawMemory.segments[3]);
RawMemory.segments[3] = '{"foo": "bar", "counter": 15}';
```

An object with asynchronous memory segments available on this tick. Each object key is the segment ID with data in string values. Use [`setActiveSegments`](#RawMemory.setActiveSegments)</code> to fetch segments on the next tick. Segments data is saved automatically in the end of the tick. The maximum size per segment is 100 KB.

#### `RawMemory.foreignSegment` : object

```javascript
RawMemory.setActiveForeignSegment('player');
// on the next tick
console.log(RawMemory.foreignSegment); 
// --> {"username": "player", "id": 40, "data": "Hello!"} 

```

An object with a memory segment of another player available on this tick. Use [`setActiveForeignSegment`](#RawMemory.setActiveForeignSegment) to fetch segments on the next tick. 
The object consists of the following properties:

| parameter | type | description |
|---|---|---|
| `username` | string | Another player's name. |
| `id` | number | The ID of the requested memory segment. |
| `data` | string | The segment contents. |

#### `RawMemory.interShardSegment` : string

> **Deprecated property — will be removed.** Please use [`InterShardMemory`](#InterShardMemory) instead.

```javascript
RawMemory.interShardSegment = JSON.stringify({
    creeps: {
        Bob: {role: 'claimer'}
    }
});

// on another shard
var interShardData = JSON.parse(RawMemory.interShardSegment);
if(interShardData.creeps[creep.name]) {
    creep.memory = interShardData[creep.name];
    delete interShardData.creeps[creep.name];
}
RawMemory.interShardSegment = JSON.stringify(interShardData);
```

A string with a shared memory segment available on every world shard. Maximum string length is 100 KB.

**Warning:** this segment is not safe for concurrent usage! All shards have shared access to the same instance of data. 
When the segment contents is changed by two shards simultaneously, you may lose some data, since the segment string 
value is written all at once atomically. You must implement your own system to determine when each shard is allowed to 
rewrite the inter-shard memory, e.g. based on [mutual exclusions](https://en.wikipedia.org/wiki/Mutual_exclusion).  

 

#### `RawMemory.get()`

_CPU cost: insignificant._

```javascript
const myMemory = JSON.parse(RawMemory.get());
```

Get a raw string representation of the <code>Memory</code> object.

**Return value**

Returns a string value.

#### `RawMemory.set(value)`

_CPU cost: insignificant._

```javascript
RawMemory.set(JSON.stringify(myMemory));
```

Set new <code>Memory</code> value.

| parameter | type | description |
|---|---|---|
| `value` | string | New memory value as a string. |

#### `RawMemory.setActiveSegments(ids)`

_CPU cost: insignificant._

```javascript
RawMemory.setActiveSegments([0,3]);
```

Request memory segments using the list of their IDs. Memory segments will become available on the next tick in [`segments`](#RawMemory.segments)</code> object.

| parameter | type | description |
|---|---|---|
| `ids` | array | An array of segment IDs. Each ID should be a number from 0 to 99. Maximum 10 segments can be active at the same time. Subsequent calls of `setActiveSegments` override previous ones. |

#### `RawMemory.setActiveForeignSegment(username, [id])`

_CPU cost: insignificant._

```javascript
RawMemory.setActiveForeignSegment('player');
```
```javascript
RawMemory.setActiveForeignSegment('player', 10);
```
```javascript
RawMemory.setActiveForeignSegment(null);
```

Request a memory segment of another user. The segment should be marked by its owner as public using [`setPublicSegments`](#RawMemory.setPublicSegments). 
The segment data will become available on the next tick in [`foreignSegment`](#RawMemory.foreignSegment) object. 
You can only have access to one foreign segment at the same time.   

| parameter | type | description |
|---|---|---|
| `username` | string \| null | The name of another user. Pass `null` to clear the foreign segment. |
| `id` _(optional)_ | number | The ID of the requested segment from 0 to 99. If undefined, the user's default public segment is requested as set by [`setDefaultPublicSegment`](#RawMemory.setDefaultPublicSegment). |

#### `RawMemory.setDefaultPublicSegment(id)`

_CPU cost: insignificant._

```javascript
RawMemory.setPublicSegments([5,20,21]);
RawMemory.setDefaultPublicSegment(5);
```
```javascript
RawMemory.setDefaultPublicSegment(null);
```

Set the specified segment as your default public segment. It will be returned if no `id` parameter is passed to [`setActiveForeignSegment`](#RawMemory.setActiveForeignSegment) by another user.   

| parameter | type | description |
|---|---|---|
| `id` | number \| null | The ID of the memory segment from 0 to 99. Pass `null` to remove your default public segment. |

#### `RawMemory.setPublicSegments(ids)`

_CPU cost: insignificant._

```javascript
RawMemory.setPublicSegments([5,3]);
```
```javascript
RawMemory.setPublicSegments([]);
```

Set specified segments as public. Other users will be able to request access to them using [`setActiveForeignSegment`](#RawMemory.setActiveForeignSegment).     

| parameter | type | description |
|---|---|---|
| `ids` | array | An array of segment IDs. Each ID should be a number from 0 to 99. Subsequent calls of `setPublicSegments` override previous ones. |

---

### Constants

All the following constant names are available in the global scope:

```javascript
Object.assign(exports, {
    OK: 0,
    ERR_NOT_OWNER: -1,
    ERR_NO_PATH: -2,
    ERR_NAME_EXISTS: -3,
    ERR_BUSY: -4,
    ERR_NOT_FOUND: -5,
    ERR_NOT_ENOUGH_ENERGY: -6,
    ERR_NOT_ENOUGH_RESOURCES: -6,
    ERR_INVALID_TARGET: -7,
    ERR_FULL: -8,
    ERR_NOT_IN_RANGE: -9,
    ERR_INVALID_ARGS: -10,
    ERR_TIRED: -11,
    ERR_NO_BODYPART: -12,
    ERR_NOT_ENOUGH_EXTENSIONS: -6,
    ERR_RCL_NOT_ENOUGH: -14,
    ERR_GCL_NOT_ENOUGH: -15,
    ERR_ACCESS_DENIED: -16,

    FIND_EXIT_TOP: 1,
    FIND_EXIT_RIGHT: 3,
    FIND_EXIT_BOTTOM: 5,
    FIND_EXIT_LEFT: 7,
    FIND_EXIT: 10,
    FIND_CREEPS: 101,
    FIND_MY_CREEPS: 102,
    FIND_HOSTILE_CREEPS: 103,
    FIND_SOURCES_ACTIVE: 104,
    FIND_SOURCES: 105,
    FIND_DROPPED_RESOURCES: 106,
    FIND_STRUCTURES: 107,
    FIND_MY_STRUCTURES: 108,
    FIND_HOSTILE_STRUCTURES: 109,
    FIND_FLAGS: 110,
    FIND_CONSTRUCTION_SITES: 111,
    FIND_MY_SPAWNS: 112,
    FIND_HOSTILE_SPAWNS: 113,
    FIND_MY_CONSTRUCTION_SITES: 114,
    FIND_HOSTILE_CONSTRUCTION_SITES: 115,
    FIND_MINERALS: 116,
    FIND_NUKES: 117,
    FIND_TOMBSTONES: 118,
    FIND_POWER_CREEPS: 119,
    FIND_MY_POWER_CREEPS: 120,
    FIND_HOSTILE_POWER_CREEPS: 121,
    FIND_DEPOSITS: 122,
    FIND_RUINS: 123,

    TOP: 1,
    TOP_RIGHT: 2,
    RIGHT: 3,
    BOTTOM_RIGHT: 4,
    BOTTOM: 5,
    BOTTOM_LEFT: 6,
    LEFT: 7,
    TOP_LEFT: 8,

    COLOR_RED: 1,
    COLOR_PURPLE: 2,
    COLOR_BLUE: 3,
    COLOR_CYAN: 4,
    COLOR_GREEN: 5,
    COLOR_YELLOW: 6,
    COLOR_ORANGE: 7,
    COLOR_BROWN: 8,
    COLOR_GREY: 9,
    COLOR_WHITE: 10,

    LOOK_CREEPS: "creep",
    LOOK_ENERGY: "energy",
    LOOK_RESOURCES: "resource",
    LOOK_SOURCES: "source",
    LOOK_MINERALS: "mineral",
    LOOK_DEPOSITS: "deposit",
    LOOK_STRUCTURES: "structure",
    LOOK_FLAGS: "flag",
    LOOK_CONSTRUCTION_SITES: "constructionSite",
    LOOK_NUKES: "nuke",
    LOOK_TERRAIN: "terrain",
    LOOK_TOMBSTONES: "tombstone",
    LOOK_POWER_CREEPS: "powerCreep",
    LOOK_RUINS: "ruin",

    OBSTACLE_OBJECT_TYPES: ["spawn", "creep", "powerCreep", "source", "mineral", "deposit", "controller", "constructedWall", "extension", "link", "storage", "tower", "observer", "powerSpawn", "powerBank", "lab", "terminal", "nuker", "factory", "invaderCore"],

    MOVE: "move",
    WORK: "work",
    CARRY: "carry",
    ATTACK: "attack",
    RANGED_ATTACK: "ranged_attack",
    TOUGH: "tough",
    HEAL: "heal",
    CLAIM: "claim",

    BODYPART_COST: {
        "move": 50,
        "work": 100,
        "attack": 80,
        "carry": 50,
        "heal": 250,
        "ranged_attack": 150,
        "tough": 10,
        "claim": 600
    },

    // WORLD_WIDTH and WORLD_HEIGHT constants are deprecated, please use Game.map.getWorldSize() instead
    WORLD_WIDTH: 202,
    WORLD_HEIGHT: 202,

    CREEP_LIFE_TIME: 1500,
    CREEP_CLAIM_LIFE_TIME: 600,
    CREEP_CORPSE_RATE: 0.2,
    CREEP_PART_MAX_ENERGY: 125,

    CARRY_CAPACITY: 50,
    HARVEST_POWER: 2,
    HARVEST_MINERAL_POWER: 1,
    HARVEST_DEPOSIT_POWER: 1,
    REPAIR_POWER: 100,
    DISMANTLE_POWER: 50,
    BUILD_POWER: 5,
    ATTACK_POWER: 30,
    UPGRADE_CONTROLLER_POWER: 1,
    RANGED_ATTACK_POWER: 10,
    HEAL_POWER: 12,
    RANGED_HEAL_POWER: 4,
    REPAIR_COST: 0.01,
    DISMANTLE_COST: 0.005,

    RAMPART_DECAY_AMOUNT: 300,
    RAMPART_DECAY_TIME: 100,
    RAMPART_HITS: 1,
    RAMPART_HITS_MAX: {2: 300000, 3: 1000000, 4: 3000000, 5: 10000000, 6: 30000000, 7: 100000000, 8: 300000000},

    ENERGY_REGEN_TIME: 300,
    ENERGY_DECAY: 1000,

    SPAWN_HITS: 5000,
    SPAWN_ENERGY_START: 300,
    SPAWN_ENERGY_CAPACITY: 300,
    CREEP_SPAWN_TIME: 3,
    SPAWN_RENEW_RATIO: 1.2,

    SOURCE_ENERGY_CAPACITY: 3000,
    SOURCE_ENERGY_NEUTRAL_CAPACITY: 1500,
    SOURCE_ENERGY_KEEPER_CAPACITY: 4000,

    WALL_HITS: 1,
    WALL_HITS_MAX: 300000000,

    EXTENSION_HITS: 1000,
    EXTENSION_ENERGY_CAPACITY: {0: 50, 1: 50, 2: 50, 3: 50, 4: 50, 5: 50, 6: 50, 7: 100, 8: 200},

    ROAD_HITS: 5000,
    ROAD_WEAROUT: 1,
    ROAD_WEAROUT_POWER_CREEP: 100,
    ROAD_DECAY_AMOUNT: 100,
    ROAD_DECAY_TIME: 1000,

    LINK_HITS: 1000,
    LINK_HITS_MAX: 1000,
    LINK_CAPACITY: 800,
    LINK_COOLDOWN: 1,
    LINK_LOSS_RATIO: 0.03,

    STORAGE_CAPACITY: 1000000,
    STORAGE_HITS: 10000,

    STRUCTURE_SPAWN: "spawn",
    STRUCTURE_EXTENSION: "extension",
    STRUCTURE_ROAD: "road",
    STRUCTURE_WALL: "constructedWall",
    STRUCTURE_RAMPART: "rampart",
    STRUCTURE_KEEPER_LAIR: "keeperLair",
    STRUCTURE_PORTAL: "portal",
    STRUCTURE_CONTROLLER: "controller",
    STRUCTURE_LINK: "link",
    STRUCTURE_STORAGE: "storage",
    STRUCTURE_TOWER: "tower",
    STRUCTURE_OBSERVER: "observer",
    STRUCTURE_POWER_BANK: "powerBank",
    STRUCTURE_POWER_SPAWN: "powerSpawn",
    STRUCTURE_EXTRACTOR: "extractor",
    STRUCTURE_LAB: "lab",
    STRUCTURE_TERMINAL: "terminal",
    STRUCTURE_CONTAINER: "container",
    STRUCTURE_NUKER: "nuker",
    STRUCTURE_FACTORY: "factory",
    STRUCTURE_INVADER_CORE: "invaderCore",

    CONSTRUCTION_COST: {
        "spawn": 15000,
        "extension": 3000,
        "road": 300,
        "constructedWall": 1,
        "rampart": 1,
        "link": 5000,
        "storage": 30000,
        "tower": 5000,
        "observer": 8000,
        "powerSpawn": 100000,
        "extractor": 5000,
        "lab": 50000,
        "terminal": 100000,
        "container": 5000,
        "nuker": 100000,
        "factory": 100000
    },
    CONSTRUCTION_COST_ROAD_SWAMP_RATIO: 5,
    CONSTRUCTION_COST_ROAD_WALL_RATIO: 150,

    CONTROLLER_LEVELS: {1: 200, 2: 45000, 3: 135000, 4: 405000, 5: 1215000, 6: 3645000, 7: 10935000},
    CONTROLLER_STRUCTURES: {
        "spawn": {0: 0, 1: 1, 2: 1, 3: 1, 4: 1, 5: 1, 6: 1, 7: 2, 8: 3},
        "extension": {0: 0, 1: 0, 2: 5, 3: 10, 4: 20, 5: 30, 6: 40, 7: 50, 8: 60},
        "link": {1: 0, 2: 0, 3: 0, 4: 0, 5: 2, 6: 3, 7: 4, 8: 6},
        "road": {0: 2500, 1: 2500, 2: 2500, 3: 2500, 4: 2500, 5: 2500, 6: 2500, 7: 2500, 8: 2500},
        "constructedWall": {1: 0, 2: 2500, 3: 2500, 4: 2500, 5: 2500, 6: 2500, 7: 2500, 8: 2500},
        "rampart": {1: 0, 2: 2500, 3: 2500, 4: 2500, 5: 2500, 6: 2500, 7: 2500, 8: 2500},
        "storage": {1: 0, 2: 0, 3: 0, 4: 1, 5: 1, 6: 1, 7: 1, 8: 1},
        "tower": {1: 0, 2: 0, 3: 1, 4: 1, 5: 2, 6: 2, 7: 3, 8: 6},
        "observer": {1: 0, 2: 0, 3: 0, 4: 0, 5: 0, 6: 0, 7: 0, 8: 1},
        "powerSpawn": {1: 0, 2: 0, 3: 0, 4: 0, 5: 0, 6: 0, 7: 0, 8: 1},
        "extractor": {1: 0, 2: 0, 3: 0, 4: 0, 5: 0, 6: 1, 7: 1, 8: 1},
        "terminal": {1: 0, 2: 0, 3: 0, 4: 0, 5: 0, 6: 1, 7: 1, 8: 1},
        "lab": {1: 0, 2: 0, 3: 0, 4: 0, 5: 0, 6: 3, 7: 6, 8: 10},
        "container": {0: 5, 1: 5, 2: 5, 3: 5, 4: 5, 5: 5, 6: 5, 7: 5, 8: 5},
        "nuker": {1: 0, 2: 0, 3: 0, 4: 0, 5: 0, 6: 0, 7: 0, 8: 1},
        "factory": {1: 0, 2: 0, 3: 0, 4: 0, 5: 0, 6: 0, 7: 1, 8: 1}
    },
    CONTROLLER_DOWNGRADE: {1: 20000, 2: 10000, 3: 20000, 4: 40000, 5: 80000, 6: 120000, 7: 150000, 8: 200000},
    CONTROLLER_DOWNGRADE_RESTORE: 100,
    CONTROLLER_DOWNGRADE_SAFEMODE_THRESHOLD: 5000,
    CONTROLLER_CLAIM_DOWNGRADE: 300,
    CONTROLLER_RESERVE: 1,
    CONTROLLER_RESERVE_MAX: 5000,
    CONTROLLER_MAX_UPGRADE_PER_TICK: 15,
    CONTROLLER_ATTACK_BLOCKED_UPGRADE: 1000,
    CONTROLLER_NUKE_BLOCKED_UPGRADE: 200,

    SAFE_MODE_DURATION: 20000,
    SAFE_MODE_COOLDOWN: 50000,
    SAFE_MODE_COST: 1000,

    TOWER_HITS: 3000,
    TOWER_CAPACITY: 1000,
    TOWER_ENERGY_COST: 10,
    TOWER_POWER_ATTACK: 600,
    TOWER_POWER_HEAL: 400,
    TOWER_POWER_REPAIR: 800,
    TOWER_OPTIMAL_RANGE: 5,
    TOWER_FALLOFF_RANGE: 20,
    TOWER_FALLOFF: 0.75,

    OBSERVER_HITS: 500,
    OBSERVER_RANGE: 10,

    POWER_BANK_HITS: 2000000,
    POWER_BANK_CAPACITY_MAX: 5000,
    POWER_BANK_CAPACITY_MIN: 500,
    POWER_BANK_CAPACITY_CRIT: 0.3,
    POWER_BANK_DECAY: 5000,
    POWER_BANK_HIT_BACK: 0.5,

    POWER_SPAWN_HITS: 5000,
    POWER_SPAWN_ENERGY_CAPACITY: 5000,
    POWER_SPAWN_POWER_CAPACITY: 100,
    POWER_SPAWN_ENERGY_RATIO: 50,

    EXTRACTOR_HITS: 500,
    EXTRACTOR_COOLDOWN: 5,

    LAB_HITS: 500,
    LAB_MINERAL_CAPACITY: 3000,
    LAB_ENERGY_CAPACITY: 2000,
    LAB_BOOST_ENERGY: 20,
    LAB_BOOST_MINERAL: 30,
    LAB_COOLDOWN: 10,           // not used
    LAB_REACTION_AMOUNT: 5,
    LAB_UNBOOST_ENERGY: 0,
    LAB_UNBOOST_MINERAL: 15,

    GCL_POW: 2.4,
    GCL_MULTIPLY: 1000000,
    GCL_NOVICE: 3,

    MODE_SIMULATION: null,
    MODE_WORLD: null,

    TERRAIN_MASK_WALL: 1,
    TERRAIN_MASK_SWAMP: 2,
    TERRAIN_MASK_LAVA: 4,

    MAX_CONSTRUCTION_SITES: 100,
    MAX_CREEP_SIZE: 50,

    MINERAL_REGEN_TIME: 50000,
    MINERAL_MIN_AMOUNT: {
        "H": 35000,
        "O": 35000,
        "L": 35000,
        "K": 35000,
        "Z": 35000,
        "U": 35000,
        "X": 35000
    },
    MINERAL_RANDOM_FACTOR: 2,

    MINERAL_DENSITY: {
        1: 15000,
        2: 35000,
        3: 70000,
        4: 100000
    },
    MINERAL_DENSITY_PROBABILITY  : {
        1: 0.1,
        2: 0.5,
        3: 0.9,
        4: 1.0
    },
    MINERAL_DENSITY_CHANGE: 0.05,

    DENSITY_LOW: 1,
    DENSITY_MODERATE: 2,
    DENSITY_HIGH: 3,
    DENSITY_ULTRA: 4,

    DEPOSIT_EXHAUST_MULTIPLY: 0.001,
    DEPOSIT_EXHAUST_POW: 1.2,
    DEPOSIT_DECAY_TIME: 50000,

    TERMINAL_CAPACITY: 300000,
    TERMINAL_HITS: 3000,
    TERMINAL_SEND_COST: 0.1,
    TERMINAL_MIN_SEND: 100,
    TERMINAL_COOLDOWN: 10,

    CONTAINER_HITS: 250000,
    CONTAINER_CAPACITY: 2000,
    CONTAINER_DECAY: 5000,
    CONTAINER_DECAY_TIME: 100,
    CONTAINER_DECAY_TIME_OWNED: 500,

    NUKER_HITS: 1000,
    NUKER_COOLDOWN: 100000,
    NUKER_ENERGY_CAPACITY: 300000,
    NUKER_GHODIUM_CAPACITY: 5000,
    NUKE_LAND_TIME: 50000,
    NUKE_RANGE: 10,
    NUKE_DAMAGE: {
        0: 10000000,
        2: 5000000
    },

    FACTORY_HITS: 1000,
    FACTORY_CAPACITY: 50000,

    TOMBSTONE_DECAY_PER_PART: 5,
    TOMBSTONE_DECAY_POWER_CREEP: 500,

    RUIN_DECAY: 500,
    RUIN_DECAY_STRUCTURES: {
        'powerBank': 10
    },

    PORTAL_DECAY: 30000,

    ORDER_SELL: "sell",
    ORDER_BUY: "buy",

    MARKET_FEE: 0.05,

    MARKET_MAX_ORDERS: 300,
    MARKET_ORDER_LIFE_TIME: 1000*60*60*24*30,

    FLAGS_LIMIT: 10000,

    SUBSCRIPTION_TOKEN: "token",
    CPU_UNLOCK: "cpuUnlock",
    PIXEL: "pixel",
    ACCESS_KEY: "accessKey",

    PIXEL_CPU_COST: 10000,

    RESOURCE_ENERGY: "energy",
    RESOURCE_POWER: "power",

    RESOURCE_HYDROGEN: "H",
    RESOURCE_OXYGEN: "O",
    RESOURCE_UTRIUM: "U",
    RESOURCE_LEMERGIUM: "L",
    RESOURCE_KEANIUM: "K",
    RESOURCE_ZYNTHIUM: "Z",
    RESOURCE_CATALYST: "X",
    RESOURCE_GHODIUM: "G",

    RESOURCE_SILICON: 'silicon',
    RESOURCE_METAL: 'metal',
    RESOURCE_BIOMASS: 'biomass',
    RESOURCE_MIST: 'mist',

    RESOURCE_HYDROXIDE: "OH",
    RESOURCE_ZYNTHIUM_KEANITE: "ZK",
    RESOURCE_UTRIUM_LEMERGITE: "UL",

    RESOURCE_UTRIUM_HYDRIDE: "UH",
    RESOURCE_UTRIUM_OXIDE: "UO",
    RESOURCE_KEANIUM_HYDRIDE: "KH",
    RESOURCE_KEANIUM_OXIDE: "KO",
    RESOURCE_LEMERGIUM_HYDRIDE: "LH",
    RESOURCE_LEMERGIUM_OXIDE: "LO",
    RESOURCE_ZYNTHIUM_HYDRIDE: "ZH",
    RESOURCE_ZYNTHIUM_OXIDE: "ZO",
    RESOURCE_GHODIUM_HYDRIDE: "GH",
    RESOURCE_GHODIUM_OXIDE: "GO",

    RESOURCE_UTRIUM_ACID: "UH2O",
    RESOURCE_UTRIUM_ALKALIDE: "UHO2",
    RESOURCE_KEANIUM_ACID: "KH2O",
    RESOURCE_KEANIUM_ALKALIDE: "KHO2",
    RESOURCE_LEMERGIUM_ACID: "LH2O",
    RESOURCE_LEMERGIUM_ALKALIDE: "LHO2",
    RESOURCE_ZYNTHIUM_ACID: "ZH2O",
    RESOURCE_ZYNTHIUM_ALKALIDE: "ZHO2",
    RESOURCE_GHODIUM_ACID: "GH2O",
    RESOURCE_GHODIUM_ALKALIDE: "GHO2",

    RESOURCE_CATALYZED_UTRIUM_ACID: "XUH2O",
    RESOURCE_CATALYZED_UTRIUM_ALKALIDE: "XUHO2",
    RESOURCE_CATALYZED_KEANIUM_ACID: "XKH2O",
    RESOURCE_CATALYZED_KEANIUM_ALKALIDE: "XKHO2",
    RESOURCE_CATALYZED_LEMERGIUM_ACID: "XLH2O",
    RESOURCE_CATALYZED_LEMERGIUM_ALKALIDE: "XLHO2",
    RESOURCE_CATALYZED_ZYNTHIUM_ACID: "XZH2O",
    RESOURCE_CATALYZED_ZYNTHIUM_ALKALIDE: "XZHO2",
    RESOURCE_CATALYZED_GHODIUM_ACID: "XGH2O",
    RESOURCE_CATALYZED_GHODIUM_ALKALIDE: "XGHO2",

    RESOURCE_OPS: "ops",

    RESOURCE_UTRIUM_BAR: 'utrium_bar',
    RESOURCE_LEMERGIUM_BAR: 'lemergium_bar',
    RESOURCE_ZYNTHIUM_BAR: 'zynthium_bar',
    RESOURCE_KEANIUM_BAR: 'keanium_bar',
    RESOURCE_GHODIUM_MELT: 'ghodium_melt',
    RESOURCE_OXIDANT: 'oxidant',
    RESOURCE_REDUCTANT: 'reductant',
    RESOURCE_PURIFIER: 'purifier',
    RESOURCE_BATTERY: 'battery',

    RESOURCE_COMPOSITE: 'composite',
    RESOURCE_CRYSTAL: 'crystal',
    RESOURCE_LIQUID: 'liquid',

    RESOURCE_WIRE: 'wire',
    RESOURCE_SWITCH: 'switch',
    RESOURCE_TRANSISTOR: 'transistor',
    RESOURCE_MICROCHIP: 'microchip',
    RESOURCE_CIRCUIT: 'circuit',
    RESOURCE_DEVICE: 'device',

    RESOURCE_CELL: 'cell',
    RESOURCE_PHLEGM: 'phlegm',
    RESOURCE_TISSUE: 'tissue',
    RESOURCE_MUSCLE: 'muscle',
    RESOURCE_ORGANOID: 'organoid',
    RESOURCE_ORGANISM: 'organism',

    RESOURCE_ALLOY: 'alloy',
    RESOURCE_TUBE: 'tube',
    RESOURCE_FIXTURES: 'fixtures',
    RESOURCE_FRAME: 'frame',
    RESOURCE_HYDRAULICS: 'hydraulics',
    RESOURCE_MACHINE: 'machine',

    RESOURCE_CONDENSATE: 'condensate',
    RESOURCE_CONCENTRATE: 'concentrate',
    RESOURCE_EXTRACT: 'extract',
    RESOURCE_SPIRIT: 'spirit',
    RESOURCE_EMANATION: 'emanation',
    RESOURCE_ESSENCE: 'essence',

    REACTIONS: {
        H: {
            O: "OH",
            L: "LH",
            K: "KH",
            U: "UH",
            Z: "ZH",
            G: "GH"
        },
        O: {
            H: "OH",
            L: "LO",
            K: "KO",
            U: "UO",
            Z: "ZO",
            G: "GO"
        },
        Z: {
            K: "ZK",
            H: "ZH",
            O: "ZO"
        },
        L: {
            U: "UL",
            H: "LH",
            O: "LO"
        },
        K: {
            Z: "ZK",
            H: "KH",
            O: "KO"
        },
        G: {
            H: "GH",
            O: "GO"
        },
        U: {
            L: "UL",
            H: "UH",
            O: "UO"
        },
        OH: {
            UH: "UH2O",
            UO: "UHO2",
            ZH: "ZH2O",
            ZO: "ZHO2",
            KH: "KH2O",
            KO: "KHO2",
            LH: "LH2O",
            LO: "LHO2",
            GH: "GH2O",
            GO: "GHO2"
        },
        X: {
            UH2O: "XUH2O",
            UHO2: "XUHO2",
            LH2O: "XLH2O",
            LHO2: "XLHO2",
            KH2O: "XKH2O",
            KHO2: "XKHO2",
            ZH2O: "XZH2O",
            ZHO2: "XZHO2",
            GH2O: "XGH2O",
            GHO2: "XGHO2"
        },
        ZK: {
            UL: "G"
        },
        UL: {
            ZK: "G"
        },
        LH: {
            OH: "LH2O"
        },
        ZH: {
            OH: "ZH2O"
        },
        GH: {
            OH: "GH2O"
        },
        KH: {
            OH: "KH2O"
        },
        UH: {
            OH: "UH2O"
        },
        LO: {
            OH: "LHO2"
        },
        ZO: {
            OH: "ZHO2"
        },
        KO: {
            OH: "KHO2"
        },
        UO: {
            OH: "UHO2"
        },
        GO: {
            OH: "GHO2"
        },
        LH2O: {
            X: "XLH2O"
        },
        KH2O: {
            X: "XKH2O"
        },
        ZH2O: {
            X: "XZH2O"
        },
        UH2O: {
            X: "XUH2O"
        },
        GH2O: {
            X: "XGH2O"
        },
        LHO2: {
            X: "XLHO2"
        },
        UHO2: {
            X: "XUHO2"
        },
        KHO2: {
            X: "XKHO2"
        },
        ZHO2: {
            X: "XZHO2"
        },
        GHO2: {
            X: "XGHO2"
        }
    },

    BOOSTS: {
        work: {
            UO: {
                harvest: 3
            },
            UHO2: {
                harvest: 5
            },
            XUHO2: {
                harvest: 7
            },
            LH: {
                build: 1.5,
                repair: 1.5
            },
            LH2O: {
                build: 1.8,
                repair: 1.8
            },
            XLH2O: {
                build: 2,
                repair: 2
            },
            ZH: {
                dismantle: 2
            },
            ZH2O: {
                dismantle: 3
            },
            XZH2O: {
                dismantle: 4
            },
            GH: {
                upgradeController: 1.5
            },
            GH2O: {
                upgradeController: 1.8
            },
            XGH2O: {
                upgradeController: 2
            }
        },
        attack: {
            UH: {
                attack: 2
            },
            UH2O: {
                attack: 3
            },
            XUH2O: {
                attack: 4
            }
        },
        ranged_attack: {
            KO: {
                rangedAttack: 2,
                rangedMassAttack: 2
            },
            KHO2: {
                rangedAttack: 3,
                rangedMassAttack: 3
            },
            XKHO2: {
                rangedAttack: 4,
                rangedMassAttack: 4
            }
        },
        heal: {
            LO: {
                heal: 2,
                rangedHeal: 2
            },
            LHO2: {
                heal: 3,
                rangedHeal: 3
            },
            XLHO2: {
                heal: 4,
                rangedHeal: 4
            }
        },
        carry: {
            KH: {
                capacity: 2
            },
            KH2O: {
                capacity: 3
            },
            XKH2O: {
                capacity: 4
            }
        },
        move: {
            ZO: {
                fatigue: 2
            },
            ZHO2: {
                fatigue: 3
            },
            XZHO2: {
                fatigue: 4
            }
        },
        tough: {
            GO: {
                damage: .7
            },
            GHO2: {
                damage: .5
            },
            XGHO2: {
                damage: .3
            }
        }
    },

    REACTION_TIME: {
        OH: 20,
        ZK: 5,
        UL: 5,
        G: 5,
        UH: 10,
        UH2O: 5,
        XUH2O: 60,
        UO: 10,
        UHO2: 5,
        XUHO2: 60,
        KH: 10,
        KH2O: 5,
        XKH2O: 60,
        KO: 10,
        KHO2: 5,
        XKHO2: 60,
        LH: 15,
        LH2O: 10,
        XLH2O: 65,
        LO: 10,
        LHO2: 5,
        XLHO2: 60,
        ZH: 20,
        ZH2O: 40,
        XZH2O: 160,
        ZO: 10,
        ZHO2: 5,
        XZHO2: 60,
        GH: 10,
        GH2O: 15,
        XGH2O: 80,
        GO: 10,
        GHO2: 30,
        XGHO2: 150,
    },

    PORTAL_UNSTABLE: 10*24*3600*1000,
    PORTAL_MIN_TIMEOUT: 12*24*3600*1000,
    PORTAL_MAX_TIMEOUT: 22*24*3600*1000,

    POWER_BANK_RESPAWN_TIME: 50000,

    INVADERS_ENERGY_GOAL: 100000,

    SYSTEM_USERNAME: 'Screeps',

    // SIGN_NOVICE_AREA and SIGN_RESPAWN_AREA constants are deprecated, please use SIGN_PLANNED_AREA instead
    SIGN_NOVICE_AREA: 'A new Novice or Respawn Area is being planned somewhere in this sector. Please make sure all important rooms are reserved.',
    SIGN_RESPAWN_AREA: 'A new Novice or Respawn Area is being planned somewhere in this sector. Please make sure all important rooms are reserved.',
    SIGN_PLANNED_AREA: 'A new Novice or Respawn Area is being planned somewhere in this sector. Please make sure all important rooms are reserved.',

    EVENT_ATTACK: 1,
    EVENT_OBJECT_DESTROYED: 2,
    EVENT_ATTACK_CONTROLLER: 3,
    EVENT_BUILD: 4,
    EVENT_HARVEST: 5,
    EVENT_HEAL: 6,
    EVENT_REPAIR: 7,
    EVENT_RESERVE_CONTROLLER: 8,
    EVENT_UPGRADE_CONTROLLER: 9,
    EVENT_EXIT: 10,
    EVENT_POWER: 11,
    EVENT_TRANSFER: 12,

    EVENT_ATTACK_TYPE_MELEE: 1,
    EVENT_ATTACK_TYPE_RANGED: 2,
    EVENT_ATTACK_TYPE_RANGED_MASS: 3,
    EVENT_ATTACK_TYPE_DISMANTLE: 4,
    EVENT_ATTACK_TYPE_HIT_BACK: 5,
    EVENT_ATTACK_TYPE_NUKE: 6,

    EVENT_HEAL_TYPE_MELEE: 1,
    EVENT_HEAL_TYPE_RANGED: 2,

    POWER_LEVEL_MULTIPLY: 1000,
    POWER_LEVEL_POW: 2,
    POWER_CREEP_SPAWN_COOLDOWN: 8*3600*1000,
    POWER_CREEP_DELETE_COOLDOWN: 24*3600*1000,
    POWER_CREEP_MAX_LEVEL: 25,
    POWER_CREEP_LIFE_TIME: 5000,

    POWER_CLASS: {
        OPERATOR: 'operator'
    },

    PWR_GENERATE_OPS: 1,
    PWR_OPERATE_SPAWN: 2,
    PWR_OPERATE_TOWER: 3,
    PWR_OPERATE_STORAGE: 4,
    PWR_OPERATE_LAB: 5,
    PWR_OPERATE_EXTENSION: 6,
    PWR_OPERATE_OBSERVER: 7,
    PWR_OPERATE_TERMINAL: 8,
    PWR_DISRUPT_SPAWN: 9,
    PWR_DISRUPT_TOWER: 10,
    PWR_DISRUPT_SOURCE: 11,
    PWR_SHIELD: 12,
    PWR_REGEN_SOURCE: 13,
    PWR_REGEN_MINERAL: 14,
    PWR_DISRUPT_TERMINAL: 15,
    PWR_OPERATE_POWER: 16,
    PWR_FORTIFY: 17,
    PWR_OPERATE_CONTROLLER: 18,
    PWR_OPERATE_FACTORY: 19,

    EFFECT_INVULNERABILITY: 1001,
    EFFECT_COLLAPSE_TIMER: 1002,

    INVADER_CORE_HITS: 100000,
    INVADER_CORE_CREEP_SPAWN_TIME: {
        0: 0, 1: 0, 2: 6, 3: 3, 4: 2, 5: 1
    },
    INVADER_CORE_EXPAND_TIME: { 1: 4000, 2: 3500, 3: 3000, 4: 2500, 5: 2000 },
    INVADER_CORE_CONTROLLER_POWER: 2,
    INVADER_CORE_CONTROLLER_DOWNGRADE: 5000,
    STRONGHOLD_RAMPART_HITS: { 0: 0, 1: 100000, 2: 200000, 3: 500000, 4: 1000000, 5: 2000000 },
    STRONGHOLD_DECAY_TICKS: 75000
});

Object.assign(exports, {
    POWER_INFO: {
        [exports.PWR_GENERATE_OPS]: {
            className: exports.POWER_CLASS.OPERATOR,
            level: [0, 2, 7, 14, 22],
            cooldown: 50,
            effect: [1, 2, 4, 6, 8]
        },
        [exports.PWR_OPERATE_SPAWN]: {
            className: exports.POWER_CLASS.OPERATOR,
            level: [0, 2, 7, 14, 22],
            cooldown: 300,
            duration: 1000,
            range: 3,
            ops: 100,
            effect: [0.9, 0.7, 0.5, 0.35, 0.2]
        },
        [exports.PWR_OPERATE_TOWER]: {
            className: exports.POWER_CLASS.OPERATOR,
            level: [0, 2, 7, 14, 22],
            cooldown: 10,
            duration: 100,
            range: 3,
            ops: 10,
            effect: [1.1, 1.2, 1.3, 1.4, 1.5]
        },
        [exports.PWR_OPERATE_STORAGE]: {
            className: exports.POWER_CLASS.OPERATOR,
            level: [0, 2, 7, 14, 22],
            cooldown: 800,
            duration: 1000,
            range: 3,
            ops: 100,
            effect: [500000,1000000,2000000,4000000,7000000]
        },
        [exports.PWR_OPERATE_LAB]: {
            className: exports.POWER_CLASS.OPERATOR,
            level: [0, 2, 7, 14, 22],
            cooldown: 50,
            duration: 1000,
            range: 3,
            ops: 10,
            effect: [2,4,6,8,10]
        },
        [exports.PWR_OPERATE_EXTENSION]: {
            className: exports.POWER_CLASS.OPERATOR,
            level: [0, 2, 7, 14, 22],
            cooldown: 50,
            range: 3,
            ops: 2,
            effect: [0.2, 0.4, 0.6, 0.8, 1.0]
        },
        [exports.PWR_OPERATE_OBSERVER]: {
            className: exports.POWER_CLASS.OPERATOR,
            level: [0, 2, 7, 14, 22],
            cooldown: 400,
            duration: [200,400,600,800,1000],
            range: 3,
            ops: 10,
        },
        [exports.PWR_OPERATE_TERMINAL]: {
            className: exports.POWER_CLASS.OPERATOR,
            level: [0, 2, 7, 14, 22],
            cooldown: 500,
            duration: 1000,
            range: 3,
            ops: 100,
            effect: [0.9, 0.8, 0.7, 0.6, 0.5]
        },
        [exports.PWR_DISRUPT_SPAWN]: {
            className: exports.POWER_CLASS.OPERATOR,
            level: [0, 2, 7, 14, 22],
            cooldown: 5,
            range: 20,
            ops: 10,
            duration: [1,2,3,4,5]
        },
        [exports.PWR_DISRUPT_TOWER]: {
            className: exports.POWER_CLASS.OPERATOR,
            level: [0, 2, 7, 14, 22],
            cooldown: 0,
            duration: 5,
            range: 50,
            ops: 10,
            effect: [0.9, 0.8, 0.7, 0.6, 0.5],
        },
        [exports.PWR_DISRUPT_SOURCE]: {
            className: exports.POWER_CLASS.OPERATOR,
            level: [0, 2, 7, 14, 22],
            cooldown: 100,
            range: 3,
            ops: 100,
            duration: [100, 200, 300, 400, 500]
        },
        [exports.PWR_SHIELD]: {
            className: exports.POWER_CLASS.OPERATOR,
            level: [0, 2, 7, 14, 22],
            effect: [5000, 10000, 15000, 20000, 25000],
            duration: 50,
            cooldown: 20,
            energy: 100,
        },
        [exports.PWR_REGEN_SOURCE]: {
            className: exports.POWER_CLASS.OPERATOR,
            level: [10, 11, 12, 14, 22],
            cooldown: 100,
            duration: 300,
            range: 3,
            effect: [50,100,150,200,250],
            period: 15
        },
        [exports.PWR_REGEN_MINERAL]: {
            className: exports.POWER_CLASS.OPERATOR,
            level: [10, 11, 12, 14, 22],
            cooldown: 100,
            duration: 100,
            range: 3,
            effect: [2,4,6,8,10],
            period: 10
        },
        [exports.PWR_DISRUPT_TERMINAL]: {
            className: exports.POWER_CLASS.OPERATOR,
            level: [20, 21, 22, 23, 24],
            cooldown: 8,
            duration: 10,
            range: 50,
            ops: [50,40,30,20,10]

        },
        [exports.PWR_FORTIFY]: {
            className: exports.POWER_CLASS.OPERATOR,
            level: [0, 2, 7, 14, 22],
            cooldown: 5,
            range: 3,
            ops: 5,
            duration: [1, 2, 3, 4, 5]
        },
        [exports.PWR_OPERATE_POWER]: {
            className: exports.POWER_CLASS.OPERATOR,
            level: [10, 11, 12, 14, 22],
            cooldown: 800,
            range: 3,
            duration: 1000,
            ops: 200,
            effect: [1, 2, 3, 4, 5]
        },
        [exports.PWR_OPERATE_CONTROLLER]: {
            className: exports.POWER_CLASS.OPERATOR,
            level: [20, 21, 22, 23, 24],
            cooldown: 800,
            range: 3,
            duration: 1000,
            ops: 200,
            effect: [10, 20, 30, 40, 50]
        },
        [exports.PWR_OPERATE_FACTORY]: {
            className: exports.POWER_CLASS.OPERATOR,
            level: [0, 2, 7, 14, 22],
            cooldown: 800,
            range: 3,
            duration: 1000,
            ops: 100
        },
    },

    BODYPARTS_ALL: [
        exports.MOVE,
        exports.WORK,
        exports.CARRY,
        exports.ATTACK,
        exports.RANGED_ATTACK,
        exports.TOUGH,
        exports.HEAL,
        exports.CLAIM
    ],
    RESOURCES_ALL: [
        exports.RESOURCE_ENERGY,
        exports.RESOURCE_POWER,

        exports.RESOURCE_HYDROGEN,
        exports.RESOURCE_OXYGEN,
        exports.RESOURCE_UTRIUM,
        exports.RESOURCE_KEANIUM,
        exports.RESOURCE_LEMERGIUM,
        exports.RESOURCE_ZYNTHIUM,
        exports.RESOURCE_CATALYST,
        exports.RESOURCE_GHODIUM,

        exports.RESOURCE_HYDROXIDE,
        exports.RESOURCE_ZYNTHIUM_KEANITE,
        exports.RESOURCE_UTRIUM_LEMERGITE,

        exports.RESOURCE_UTRIUM_HYDRIDE,
        exports.RESOURCE_UTRIUM_OXIDE,
        exports.RESOURCE_KEANIUM_HYDRIDE,
        exports.RESOURCE_KEANIUM_OXIDE,
        exports.RESOURCE_LEMERGIUM_HYDRIDE,
        exports.RESOURCE_LEMERGIUM_OXIDE,
        exports.RESOURCE_ZYNTHIUM_HYDRIDE,
        exports.RESOURCE_ZYNTHIUM_OXIDE,
        exports.RESOURCE_GHODIUM_HYDRIDE,
        exports.RESOURCE_GHODIUM_OXIDE,

        exports.RESOURCE_UTRIUM_ACID,
        exports.RESOURCE_UTRIUM_ALKALIDE,
        exports.RESOURCE_KEANIUM_ACID,
        exports.RESOURCE_KEANIUM_ALKALIDE,
        exports.RESOURCE_LEMERGIUM_ACID,
        exports.RESOURCE_LEMERGIUM_ALKALIDE,
        exports.RESOURCE_ZYNTHIUM_ACID,
        exports.RESOURCE_ZYNTHIUM_ALKALIDE,
        exports.RESOURCE_GHODIUM_ACID,
        exports.RESOURCE_GHODIUM_ALKALIDE,

        exports.RESOURCE_CATALYZED_UTRIUM_ACID,
        exports.RESOURCE_CATALYZED_UTRIUM_ALKALIDE,
        exports.RESOURCE_CATALYZED_KEANIUM_ACID,
        exports.RESOURCE_CATALYZED_KEANIUM_ALKALIDE,
        exports.RESOURCE_CATALYZED_LEMERGIUM_ACID,
        exports.RESOURCE_CATALYZED_LEMERGIUM_ALKALIDE,
        exports.RESOURCE_CATALYZED_ZYNTHIUM_ACID,
        exports.RESOURCE_CATALYZED_ZYNTHIUM_ALKALIDE,
        exports.RESOURCE_CATALYZED_GHODIUM_ACID,
        exports.RESOURCE_CATALYZED_GHODIUM_ALKALIDE,

        exports.RESOURCE_OPS,

        exports.RESOURCE_SILICON,
        exports.RESOURCE_METAL,
        exports.RESOURCE_BIOMASS,
        exports.RESOURCE_MIST,

        exports.RESOURCE_UTRIUM_BAR,
        exports.RESOURCE_LEMERGIUM_BAR,
        exports.RESOURCE_ZYNTHIUM_BAR,
        exports.RESOURCE_KEANIUM_BAR,
        exports.RESOURCE_GHODIUM_MELT,
        exports.RESOURCE_OXIDANT,
        exports.RESOURCE_REDUCTANT,
        exports.RESOURCE_PURIFIER,
        exports.RESOURCE_BATTERY,
        exports.RESOURCE_COMPOSITE,
        exports.RESOURCE_CRYSTAL,
        exports.RESOURCE_LIQUID,

        exports.RESOURCE_WIRE,
        exports.RESOURCE_SWITCH,
        exports.RESOURCE_TRANSISTOR,
        exports.RESOURCE_MICROCHIP,
        exports.RESOURCE_CIRCUIT,
        exports.RESOURCE_DEVICE,

        exports.RESOURCE_CELL,
        exports.RESOURCE_PHLEGM,
        exports.RESOURCE_TISSUE,
        exports.RESOURCE_MUSCLE,
        exports.RESOURCE_ORGANOID,
        exports.RESOURCE_ORGANISM,

        exports.RESOURCE_ALLOY,
        exports.RESOURCE_TUBE,
        exports.RESOURCE_FIXTURES,
        exports.RESOURCE_FRAME,
        exports.RESOURCE_HYDRAULICS,
        exports.RESOURCE_MACHINE,

        exports.RESOURCE_CONDENSATE,
        exports.RESOURCE_CONCENTRATE,
        exports.RESOURCE_EXTRACT,
        exports.RESOURCE_SPIRIT,
        exports.RESOURCE_EMANATION,
        exports.RESOURCE_ESSENCE
    ],
    COLORS_ALL: [
        exports.COLOR_RED,
        exports.COLOR_PURPLE,
        exports.COLOR_BLUE,
        exports.COLOR_CYAN,
        exports.COLOR_GREEN,
        exports.COLOR_YELLOW,
        exports.COLOR_ORANGE,
        exports.COLOR_BROWN,
        exports.COLOR_GREY,
        exports.COLOR_WHITE
    ],
    INTERSHARD_RESOURCES: [
        exports.SUBSCRIPTION_TOKEN,
        exports.CPU_UNLOCK,
        exports.PIXEL,
        exports.ACCESS_KEY
    ],
    COMMODITIES: {
        [exports.RESOURCE_UTRIUM_BAR]: {
            amount: 100,
            cooldown: 20,
            components: {
                [exports.RESOURCE_UTRIUM]: 500,
                [exports.RESOURCE_ENERGY]: 200
            }
        },
        [exports.RESOURCE_UTRIUM]: {
            amount: 500,
            cooldown: 20,
            components: {
                [exports.RESOURCE_UTRIUM_BAR]: 100,
                [exports.RESOURCE_ENERGY]: 200
            }
        },
        [exports.RESOURCE_LEMERGIUM_BAR]: {
            amount: 100,
            cooldown: 20,
            components: {
                [exports.RESOURCE_LEMERGIUM]: 500,
                [exports.RESOURCE_ENERGY]: 200
            }
        },
        [exports.RESOURCE_LEMERGIUM]: {
            amount: 500,
            cooldown: 20,
            components: {
                [exports.RESOURCE_LEMERGIUM_BAR]: 100,
                [exports.RESOURCE_ENERGY]: 200
            }
        },
        [exports.RESOURCE_ZYNTHIUM_BAR]: {
            amount: 100,
            cooldown: 20,
            components: {
                [exports.RESOURCE_ZYNTHIUM]: 500,
                [exports.RESOURCE_ENERGY]: 200
            }
        },
        [exports.RESOURCE_ZYNTHIUM]: {
            amount: 500,
            cooldown: 20,
            components: {
                [exports.RESOURCE_ZYNTHIUM_BAR]: 100,
                [exports.RESOURCE_ENERGY]: 200
            }
        },
        [exports.RESOURCE_KEANIUM_BAR]: {
            amount: 100,
            cooldown: 20,
            components: {
                [exports.RESOURCE_KEANIUM]: 500,
                [exports.RESOURCE_ENERGY]: 200
            }
        },
        [exports.RESOURCE_KEANIUM]: {
            amount: 500,
            cooldown: 20,
            components: {
                [exports.RESOURCE_KEANIUM_BAR]: 100,
                [exports.RESOURCE_ENERGY]: 200
            }
        },
        [exports.RESOURCE_GHODIUM_MELT]: {
            amount: 100,
            cooldown: 20,
            components: {
                [exports.RESOURCE_GHODIUM]: 500,
                [exports.RESOURCE_ENERGY]: 200
            }
        },
        [exports.RESOURCE_GHODIUM]: {
            amount: 500,
            cooldown: 20,
            components: {
                [exports.RESOURCE_GHODIUM_MELT]: 100,
                [exports.RESOURCE_ENERGY]: 200
            }
        },
        [exports.RESOURCE_OXIDANT]: {
            amount: 100,
            cooldown: 20,
            components: {
                [exports.RESOURCE_OXYGEN]: 500,
                [exports.RESOURCE_ENERGY]: 200
            }
        },
        [exports.RESOURCE_OXYGEN]: {
            amount: 500,
            cooldown: 20,
            components: {
                [exports.RESOURCE_OXIDANT]: 100,
                [exports.RESOURCE_ENERGY]: 200
            }
        },
        [exports.RESOURCE_REDUCTANT]: {
            amount: 100,
            cooldown: 20,
            components: {
                [exports.RESOURCE_HYDROGEN]: 500,
                [exports.RESOURCE_ENERGY]: 200
            }
        },
        [exports.RESOURCE_HYDROGEN]: {
            amount: 500,
            cooldown: 20,
            components: {
                [exports.RESOURCE_REDUCTANT]: 100,
                [exports.RESOURCE_ENERGY]: 200
            }
        },
        [exports.RESOURCE_PURIFIER]: {
            amount: 100,
            cooldown: 20,
            components: {
                [exports.RESOURCE_CATALYST]: 500,
                [exports.RESOURCE_ENERGY]: 200
            }
        },
        [exports.RESOURCE_CATALYST]: {
            amount: 500,
            cooldown: 20,
            components: {
                [exports.RESOURCE_PURIFIER]: 100,
                [exports.RESOURCE_ENERGY]: 200
            }
        },
        [exports.RESOURCE_BATTERY]: {
            amount: 50,
            cooldown: 10,
            components: {
                [exports.RESOURCE_ENERGY]: 600
            }
        },
        [exports.RESOURCE_ENERGY]: {
            amount: 500,
            cooldown: 10,
            components: {
                [exports.RESOURCE_BATTERY]: 50
            }
        },
        [exports.RESOURCE_COMPOSITE]: {
            level: 1,
            amount: 20,
            cooldown: 50,
            components: {
                [exports.RESOURCE_UTRIUM_BAR]: 20,
                [exports.RESOURCE_ZYNTHIUM_BAR]: 20,
                [exports.RESOURCE_ENERGY]: 20
            }
        },
        [exports.RESOURCE_CRYSTAL]: {
            level: 2,
            amount: 6,
            cooldown: 21,
            components: {
                [exports.RESOURCE_LEMERGIUM_BAR]: 6,
                [exports.RESOURCE_KEANIUM_BAR]: 6,
                [exports.RESOURCE_PURIFIER]: 6,
                [exports.RESOURCE_ENERGY]: 45
            }
        },
        [exports.RESOURCE_LIQUID]: {
            level: 3,
            amount: 12,
            cooldown: 60,
            components: {
                [exports.RESOURCE_OXIDANT]: 12,
                [exports.RESOURCE_REDUCTANT]: 12,
                [exports.RESOURCE_GHODIUM_MELT]: 12,
                [exports.RESOURCE_ENERGY]: 90
            }
        },

        [exports.RESOURCE_WIRE]: {
            amount: 20,
            cooldown: 8,
            components: {
                [exports.RESOURCE_UTRIUM_BAR]: 20,
                [exports.RESOURCE_SILICON]: 100,
                [exports.RESOURCE_ENERGY]: 40
            }
        },
        [exports.RESOURCE_SWITCH]: {
            level: 1,
            amount: 5,
            cooldown: 70,
            components: {
                [exports.RESOURCE_WIRE]: 40,
                [exports.RESOURCE_OXIDANT]: 95,
                [exports.RESOURCE_UTRIUM_BAR]: 35,
                [exports.RESOURCE_ENERGY]: 20
            }
        },
        [exports.RESOURCE_TRANSISTOR]: {
            level: 2,
            amount: 1,
            cooldown: 59,
            components: {
                [exports.RESOURCE_SWITCH]: 4,
                [exports.RESOURCE_WIRE]: 15,
                [exports.RESOURCE_REDUCTANT]: 85,
                [exports.RESOURCE_ENERGY]: 8
            }
        },
        [exports.RESOURCE_MICROCHIP]: {
            level: 3,
            amount: 1,
            cooldown: 250,
            components: {
                [exports.RESOURCE_TRANSISTOR]: 2,
                [exports.RESOURCE_COMPOSITE]: 50,
                [exports.RESOURCE_WIRE]: 117,
                [exports.RESOURCE_PURIFIER]: 25,
                [exports.RESOURCE_ENERGY]: 16
            }
        },
        [exports.RESOURCE_CIRCUIT]: {
            level: 4,
            amount: 1,
            cooldown: 800,
            components: {
                [exports.RESOURCE_MICROCHIP]: 1,
                [exports.RESOURCE_TRANSISTOR]: 5,
                [exports.RESOURCE_SWITCH]: 4,
                [exports.RESOURCE_OXIDANT]: 115,
                [exports.RESOURCE_ENERGY]: 32
            }
        },
        [exports.RESOURCE_DEVICE]: {
            level: 5,
            amount: 1,
            cooldown: 600,
            components: {
                [exports.RESOURCE_CIRCUIT]: 1,
                [exports.RESOURCE_MICROCHIP]: 3,
                [exports.RESOURCE_CRYSTAL]: 110,
                [exports.RESOURCE_GHODIUM_MELT]: 150,
                [exports.RESOURCE_ENERGY]: 64
            }
        },

        [exports.RESOURCE_CELL]: {
            amount: 20,
            cooldown: 8,
            components: {
                [exports.RESOURCE_LEMERGIUM_BAR]: 20,
                [exports.RESOURCE_BIOMASS]: 100,
                [exports.RESOURCE_ENERGY]: 40
            }
        },
        [exports.RESOURCE_PHLEGM]: {
            level: 1,
            amount: 2,
            cooldown: 35,
            components: {
                [exports.RESOURCE_CELL]: 20,
                [exports.RESOURCE_OXIDANT]: 36,
                [exports.RESOURCE_LEMERGIUM_BAR]: 16,
                [exports.RESOURCE_ENERGY]: 8
            }
        },
        [exports.RESOURCE_TISSUE]: {
            level: 2,
            amount: 2,
            cooldown: 164,
            components: {
                [exports.RESOURCE_PHLEGM]: 10,
                [exports.RESOURCE_CELL]: 10,
                [exports.RESOURCE_REDUCTANT]: 110,
                [exports.RESOURCE_ENERGY]: 16
            }
        },
        [exports.RESOURCE_MUSCLE]: {
            level: 3,
            amount: 1,
            cooldown: 250,
            components: {
                [exports.RESOURCE_TISSUE]: 3,
                [exports.RESOURCE_PHLEGM]: 3,
                [exports.RESOURCE_ZYNTHIUM_BAR]: 50,
                [exports.RESOURCE_REDUCTANT]: 50,
                [exports.RESOURCE_ENERGY]: 16
            }
        },
        [exports.RESOURCE_ORGANOID]: {
            level: 4,
            amount: 1,
            cooldown: 800,
            components: {
                [exports.RESOURCE_MUSCLE]: 1,
                [exports.RESOURCE_TISSUE]: 5,
                [exports.RESOURCE_PURIFIER]: 208,
                [exports.RESOURCE_OXIDANT]: 256,
                [exports.RESOURCE_ENERGY]: 32
            }
        },
        [exports.RESOURCE_ORGANISM]: {
            level: 5,
            amount: 1,
            cooldown: 600,
            components: {
                [exports.RESOURCE_ORGANOID]: 1,
                [exports.RESOURCE_LIQUID]: 150,
                [exports.RESOURCE_TISSUE]: 6,
                [exports.RESOURCE_CELL]: 310,
                [exports.RESOURCE_ENERGY]: 64
            }
        },

        [exports.RESOURCE_ALLOY]: {
            amount: 20,
            cooldown: 8,
            components: {
                [exports.RESOURCE_ZYNTHIUM_BAR]: 20,
                [exports.RESOURCE_METAL]: 100,
                [exports.RESOURCE_ENERGY]: 40
            }
        },
        [exports.RESOURCE_TUBE]: {
            level: 1,
            amount: 2,
            cooldown: 45,
            components: {
                [exports.RESOURCE_ALLOY]: 40,
                [exports.RESOURCE_ZYNTHIUM_BAR]: 16,
                [exports.RESOURCE_ENERGY]: 8
            }
        },
        [exports.RESOURCE_FIXTURES]: {
            level: 2,
            amount: 1,
            cooldown: 115,
            components: {
                [exports.RESOURCE_COMPOSITE]: 20,
                [exports.RESOURCE_ALLOY]: 41,
                [exports.RESOURCE_OXIDANT]: 161,
                [exports.RESOURCE_ENERGY]: 8
            }
        },
        [exports.RESOURCE_FRAME]: {
            level: 3,
            amount: 1,
            cooldown: 125,
            components: {
                [exports.RESOURCE_FIXTURES]: 2,
                [exports.RESOURCE_TUBE]: 4,
                [exports.RESOURCE_REDUCTANT]: 330,
                [exports.RESOURCE_ZYNTHIUM_BAR]: 31,
                [exports.RESOURCE_ENERGY]: 16
            }
        },
        [exports.RESOURCE_HYDRAULICS]: {
            level: 4,
            amount: 1,
            cooldown: 800,
            components: {
                [exports.RESOURCE_LIQUID]: 150,
                [exports.RESOURCE_FIXTURES]: 3,
                [exports.RESOURCE_TUBE]: 15,
                [exports.RESOURCE_PURIFIER]: 208,
                [exports.RESOURCE_ENERGY]: 32
            }
        },
        [exports.RESOURCE_MACHINE]: {
            level: 5,
            amount: 1,
            cooldown: 600,
            components: {
                [exports.RESOURCE_HYDRAULICS]: 1,
                [exports.RESOURCE_FRAME]: 2,
                [exports.RESOURCE_FIXTURES]: 3,
                [exports.RESOURCE_TUBE]: 12,
                [exports.RESOURCE_ENERGY]: 64
            }
        },

        [exports.RESOURCE_CONDENSATE]: {
            amount: 20,
            cooldown: 8,
            components: {
                [exports.RESOURCE_KEANIUM_BAR]: 20,
                [exports.RESOURCE_MIST]: 100,
                [exports.RESOURCE_ENERGY]: 40
            }
        },
        [exports.RESOURCE_CONCENTRATE]: {
            level: 1,
            amount: 3,
            cooldown: 41,
            components: {
                [exports.RESOURCE_CONDENSATE]: 30,
                [exports.RESOURCE_KEANIUM_BAR]: 15,
                [exports.RESOURCE_REDUCTANT]: 54,
                [exports.RESOURCE_ENERGY]: 12
            }
        },
        [exports.RESOURCE_EXTRACT]: {
            level: 2,
            amount: 2,
            cooldown: 128,
            components: {
                [exports.RESOURCE_CONCENTRATE]: 10,
                [exports.RESOURCE_CONDENSATE]: 30,
                [exports.RESOURCE_OXIDANT]: 60,
                [exports.RESOURCE_ENERGY]: 16
            }
        },
        [exports.RESOURCE_SPIRIT]: {
            level: 3,
            amount: 1,
            cooldown: 200,
            components: {
                [exports.RESOURCE_EXTRACT]: 2,
                [exports.RESOURCE_CONCENTRATE]: 6,
                [exports.RESOURCE_REDUCTANT]: 90,
                [exports.RESOURCE_PURIFIER]: 20,
                [exports.RESOURCE_ENERGY]: 16
            }
        },
        [exports.RESOURCE_EMANATION]: {
            level: 4,
            amount: 1,
            cooldown: 800,
            components: {
                [exports.RESOURCE_SPIRIT]: 2,
                [exports.RESOURCE_EXTRACT]: 2,
                [exports.RESOURCE_CONCENTRATE]: 3,
                [exports.RESOURCE_KEANIUM_BAR]: 112,
                [exports.RESOURCE_ENERGY]: 32
            }
        },
        [exports.RESOURCE_ESSENCE]: {
            level: 5,
            amount: 1,
            cooldown: 600,
            components: {
                [exports.RESOURCE_EMANATION]: 1,
                [exports.RESOURCE_SPIRIT]: 3,
                [exports.RESOURCE_CRYSTAL]: 110,
                [exports.RESOURCE_GHODIUM_MELT]: 150,
                [exports.RESOURCE_ENERGY]: 64
            }
        },
    }
});
```

---

## Prototypes

### ConstructionSite

A site of a structure which is currently under construction. A construction site can be created using the 'Construct' button at the left of the game field or the [`Room.createConstructionSite`](#Room.createConstructionSite) method.

To build a structure on the construction site, give a worker creep some amount of energy and perform [`Creep.build`](#Creep.build) action.

You can remove enemy construction sites by moving a creep on it.

#### `effects` : array  _(inherited from RoomObject)_

Applied effects, an array of objects with the following properties:

| parameter | type | description |
|---|---|---|
| `effect` | number | Effect ID of the applied effect. Can be either natural effect ID or Power ID. |
| `level` _(optional)_ | number | Power level of the applied effect. Absent if the effect is not a Power effect. |
| `ticksRemaining` | number | How many ticks will the effect last. |

#### `pos` : RoomPosition  _(inherited from RoomObject)_

An object representing the position of this object in the room.

#### `room` : Room  _(inherited from RoomObject)_

The link to the Room object. May be undefined in case if an object is a flag or a construction site and is placed in a room that is not visible to you.

#### `id` : string

 

A unique object identificator. You can use <a href="#Game.getObjectById"><code>Game.getObjectById</code></a> method to retrieve an object instance by its <code>id</code>.

#### `my` : boolean

Whether this is your own construction site.

#### `owner` : object

An object with the structure’s owner info containing the following properties:

| parameter | type | description |
|---|---|---|
| `username` | string | The name of the owner user. |

#### `progress` : number

The current construction progress.

#### `progressTotal` : number

The total construction progress needed for the structure to be built.

#### `structureType` : string

One of the <code>STRUCTURE_*</code> constants.

#### `remove()`

_Action: changes game state; +0.2 CPU added to its natural cost when it returns OK._

Remove the construction site.

**Return value**

One of the following codes:

| code | value | description |
|---|---|---|
| `OK` | 0 | The operation has been scheduled successfully. |
| `ERR_NOT_OWNER` | -1 | You are not the owner of this construction site, and it's not in your room. |

---

### Creep

Creeps are your units. Creeps can move, harvest energy, construct structures, attack another creeps, and perform other actions. Each creep consists of up to 50 body parts with the following possible types:
![](img/bodyparts.png)   

<table class="table gameplay-info">
    <tbody>
    <tr>
        <th style="width: 20%;">Body part</th>
        <th style="width: 8%;">Build cost</th>
        <th>Effect per one body part</th>
    </tr>
    <tr>
        <td><code style="background: #333; color: #a9b7c6;">MOVE</code></td>
        <td>50</td>
        <td>Decreases fatigue by 2 points per tick.</td>
    </tr>
    <tr>
        <td><code style="background: #333; color: #ffe56d;">WORK</code></td>
        <td>100</td>
        <td>
            <p>Harvests 2 energy units from a source per tick.</p>
            <p>Harvests 1 resource unit from a mineral or a deposit per tick.</p>
            <p>Builds a structure for 5 energy units per tick.</p>
            <p>Repairs a structure for 100 hits per tick consuming 1 energy unit per tick.</p>
            <p>Dismantles a structure for 50 hits per tick returning 0.25 energy unit per tick.</p>
            <p>Upgrades a controller for 1 energy unit per tick.</p>
        </td>
    </tr>
    <tr>
        <td><code style="background: #333; color: #777;">CARRY</code></td>
        <td>50</td>
        <td>Can contain up to 50 resource units.</td>
    </tr>
    <tr>
        <td><code style="background: #333; color: #f93842;">ATTACK</code></td>
        <td>80</td>
        <td>Attacks another creep/structure with 30 hits per tick in a short-ranged attack.</td>
    </tr>
    <tr>
        <td><code style="background: #333; color: #5d80b2;">RANGED_ATTACK</code></td>
        <td>150</td>
        <td>
            <p>Attacks another single creep/structure with 10 hits per tick in a long-range attack up to 3 squares long.</p>
            <p>Attacks all hostile creeps/structures within 3 squares range with 1-4-10 hits (depending on the range).</p>
        </td>
    </tr>
    <tr>
        <td><code style="background: #333; color: #65fd62;">HEAL</code></td>
        <td>250</td>
        <td>Heals self or another creep restoring 12 hits per tick in short range or 4 hits per tick at a distance.</td>
    </tr>
    <tr>
        <td><code style="background: #333; color: #b99cfb;">CLAIM</code></td>
        <td>600</td>
        <td>
            <p>Claims a neutral room controller.</p>
            <p>Reserves a neutral room controller for 1 tick per body part.</p>
            <p>Attacks a hostile room controller downgrading its timer by 300 ticks per body parts.</p>
            <p>Attacks a neutral room controller reservation timer by 1 tick per body parts.</p>
            <p>A creep with this body part will have a reduced life time of 600 ticks and cannot be renewed.</p>
        </td>
    </tr>
    <tr>
        <td><code style="background: #333; color: #fff;">TOUGH</code></td>
        <td>10</td>
        <td>No effect, just additional hit points to the creep's body. Can be boosted to resist damage.</td>
    </tr>
    </tbody>
</table>

#### `effects` : array  _(inherited from RoomObject)_

Applied effects, an array of objects with the following properties:

| parameter | type | description |
|---|---|---|
| `effect` | number | Effect ID of the applied effect. Can be either natural effect ID or Power ID. |
| `level` _(optional)_ | number | Power level of the applied effect. Absent if the effect is not a Power effect. |
| `ticksRemaining` | number | How many ticks will the effect last. |

#### `pos` : RoomPosition  _(inherited from RoomObject)_

An object representing the position of this object in the room.

#### `room` : Room  _(inherited from RoomObject)_

The link to the Room object. May be undefined in case if an object is a flag or a construction site and is placed in a room that is not visible to you.

#### `body` : array

An array describing the creep’s body. Each element contains the following properties:

| parameter | type | description |
|---|---|---|
| `boost` | string \| undefined | If the body part is boosted, this property specifies the mineral type which is used for boosting. One of the `RESOURCE_*` constants. Learn more |
| `type` | string | One of the body part types constants. |
| `hits` | number | The remaining amount of hit points of this body part. |

#### `carry` : object

> **Deprecated property — will be removed.**

An alias for [`Creep.store`](#Creep.store). 

#### `carryCapacity` : number

> **Deprecated property — will be removed.**

An alias for [`Creep.store.getCapacity()`](#Store.getCapacity).

#### `fatigue` : number

The movement fatigue indicator. If it is greater than zero, the creep cannot move.

#### `hits` : number

The current amount of hit points of the creep.

#### `hitsMax` : number

The maximum amount of hit points of the creep.

#### `id` : string

A unique object identificator. You can use <a href="#Game.getObjectById"><code>Game.getObjectById</code></a> method to retrieve an object instance by its <code>id</code>.

#### `memory` : any

```javascript
creep.memory.task = 'building';
```

A shorthand to <code>Memory.creeps[creep.name]</code>. You can use it for quick access the creep’s specific memory data object. <a href="/global-objects.html#Memory-object">Learn more about memory</a>

#### `my` : boolean

Whether it is your creep or foe.

#### `name` : string

Creep’s name. You can choose the name while creating a new creep, and it cannot be changed later. This name is a hash key to access the creep via the <a href="#Game.creeps">Game.creeps</a> object.

#### `owner` : object

An object with the creep’s owner info containing the following properties:

| parameter | type | description |
|---|---|---|
| `username` | string | The name of the owner user. |

#### `saying` : string

The text message that the creep was saying at the last tick.

#### `spawning` : boolean

Whether this creep is still being spawned.

#### `store` : Store

```javascript
if(creep.store[RESOURCE_ENERGY] < creep.store.getCapacity()) {
    goHarvest(creep);
}
```

A [`Store`](#Store) object that contains cargo of this creep.

#### `ticksToLive` : number

The remaining amount of game ticks after which the creep will die.

#### `attack(target)`

_Action: changes game state; +0.2 CPU added to its natural cost when it returns OK._

```javascript
const target = creep.pos.findClosestByRange(FIND_HOSTILE_CREEPS);
if(target) {
    if(creep.attack(target) == ERR_NOT_IN_RANGE) {
        creep.moveTo(target);
    }
}

```

Attack another creep, power creep, or structure in a short-ranged attack. Requires the <code>ATTACK</code> body part. If the target is inside a rampart, then the rampart is attacked instead. The target has to be at adjacent square to the creep. If the target is a creep with <code>ATTACK</code> body parts and is not inside a rampart, it will automatically hit back at the attacker.

| parameter | type | description |
|---|---|---|
| `target` | Creep, PowerCreep, Structure | The target object to be attacked. |

**Return value**

One of the following codes:

| code | value | description |
|---|---|---|
| `OK` | 0 | The operation has been scheduled successfully. |
| `ERR_NOT_OWNER` | -1 | You are not the owner of this creep. |
| `ERR_BUSY` | -4 | The creep is still being spawned. |
| `ERR_INVALID_TARGET` | -7 | The target is not a valid attackable object. |
| `ERR_NOT_IN_RANGE` | -9 | The target is too far away. |
| `ERR_NO_BODYPART` | -12 | There are no `ATTACK` body parts in this creep’s body. |

#### `attackController(target)`

_Action: changes game state; +0.2 CPU added to its natural cost when it returns OK._

```javascript
if(creep.room.controller && !creep.room.controller.my) {
    if(creep.attackController(creep.room.controller) == ERR_NOT_IN_RANGE) {
        creep.moveTo(creep.room.controller);
    }
}

```

Decreases the controller's downgrade timer by 300 ticks per every <code>CLAIM</code> body part, or reservation timer by 1 tick per every <code>CLAIM</code> body part. If the controller under attack is owned, it cannot be upgraded or attacked again for the next 1,000 ticks. The target has to be at adjacent square to the creep.

| parameter | type | description |
|---|---|---|
| `target` | StructureController | The target controller object. |

**Return value**

One of the following codes:

| code | value | description |
|---|---|---|
| `OK` | 0 | The operation has been scheduled successfully. |
| `ERR_NOT_OWNER` | -1 | You are not the owner of this creep. |
| `ERR_BUSY` | -4 | The creep is still being spawned. |
| `ERR_INVALID_TARGET` | -7 | The target is not a valid owned or reserved controller object. |
| `ERR_NOT_IN_RANGE` | -9 | The target is too far away. |
| `ERR_NO_BODYPART` | -12 | There are not enough `CLAIM` body parts in this creep’s body. |
| `ERR_TIRED` | -11 | You have to wait until the next attack is possible. |

#### `build(target)`

_Action: changes game state; +0.2 CPU added to its natural cost when it returns OK._

```javascript
const target = creep.pos.findClosestByRange(FIND_CONSTRUCTION_SITES);
if(target) {
    if(creep.build(target) == ERR_NOT_IN_RANGE) {
        creep.moveTo(target);
    }
}

```

Build a structure at the target construction site using carried energy. Requires <code>WORK</code> and <code>CARRY</code> body parts. The target has to be within 3 squares range of the creep.

| parameter | type | description |
|---|---|---|
| `target` | ConstructionSite | The target construction site to be built. |

**Return value**

One of the following codes:

| code | value | description |
|---|---|---|
| `OK` | 0 | The operation has been scheduled successfully. |
| `ERR_NOT_OWNER` | -1 | You are not the owner of this creep. |
| `ERR_BUSY` | -4 | The creep is still being spawned. |
| `ERR_NOT_ENOUGH_RESOURCES` | -6 | The creep does not have any carried energy. |
| `ERR_INVALID_TARGET` | -7 | The target is not a valid construction site object or the structure cannot be built here (probably because of a creep at the same square). |
| `ERR_NOT_IN_RANGE` | -9 | The target is too far away. |
| `ERR_NO_BODYPART` | -12 | There are no `WORK` body parts in this creep’s body. |

#### `cancelOrder(methodName)`

_CPU cost: insignificant._

```javascript
creep.move(LEFT);
creep.cancelOrder('move');
//The creep will not move in this game tick
```

Cancel the order given during the current game tick.

| parameter | type | description |
|---|---|---|
| `methodName` | string | The name of a creep's method to be cancelled. |

**Return value**

One of the following codes:

| code | value | description |
|---|---|---|
| `OK` | 0 | The operation has been cancelled successfully. |
| `ERR_NOT_FOUND` | -5 | The order with the specified name is not found. |

#### `claimController(target)`

_Action: changes game state; +0.2 CPU added to its natural cost when it returns OK._

```javascript
if(creep.room.controller) {
    if(creep.claimController(creep.room.controller) == ERR_NOT_IN_RANGE) {
        creep.moveTo(creep.room.controller);
    }
}

```

Claims a neutral controller under your control. Requires the <code>CLAIM</code> body part. The target has to be at adjacent square to the creep. You need to have the corresponding Global Control Level in order to claim a new room. If you don't have enough GCL, consider <a href="#reserveController">reserving</a> this room instead. <a href="/control.html#Global-Control-Level">Learn more</a>

| parameter | type | description |
|---|---|---|
| `target` | StructureController | The target controller object. |

**Return value**

One of the following codes:

| code | value | description |
|---|---|---|
| `OK` | 0 | The operation has been scheduled successfully. |
| `ERR_NOT_OWNER` | -1 | You are not the owner of this creep. |
| `ERR_BUSY` | -4 | The creep is still being spawned. |
| `ERR_INVALID_TARGET` | -7 | The target is not a valid neutral controller object. |
| `ERR_FULL` | -8 | You cannot claim more than 3 rooms in the Novice Area. |
| `ERR_NOT_IN_RANGE` | -9 | The target is too far away. |
| `ERR_NO_BODYPART` | -12 | There are no `CLAIM` body parts in this creep’s body. |
| `ERR_GCL_NOT_ENOUGH` | -15 | Your Global Control Level is not enough. |
| `ERR_ACCESS_DENIED` | -16 | You do not have access to this restricted shard. Use [`Game.shard.activateAccess`](#Game.shard.activateAccess) to activate access. |

#### `dismantle(target)`

_Action: changes game state; +0.2 CPU added to its natural cost when it returns OK._

```javascript
const target = creep.pos.findClosestByRange(FIND_STRUCTURES,
	{filter: {structureType: STRUCTURE_WALL}});
if(target) {
    if(creep.dismantle(target) == ERR_NOT_IN_RANGE) {
        creep.moveTo(target);
    }
}

```

Dismantles any structure that can be constructed (even hostile) returning 50% of the energy spent on its repair. Requires the <code>WORK</code> body part. If the creep has an empty <code>CARRY</code> body part, the energy is put into it; otherwise it is dropped on the ground. The target has to be at adjacent square to the creep.

| parameter | type | description |
|---|---|---|
| `target` | Structure | The target structure. |

**Return value**

One of the following codes:

| code | value | description |
|---|---|---|
| `OK` | 0 | The operation has been scheduled successfully. |
| `ERR_NOT_OWNER` | -1 | You are not the owner of this creep. |
| `ERR_BUSY` | -4 | The creep is still being spawned. |
| `ERR_INVALID_TARGET` | -7 | The target is not a valid structure object. |
| `ERR_NOT_IN_RANGE` | -9 | The target is too far away. |
| `ERR_NO_BODYPART` | -12 | There are no `WORK` body parts in this creep’s body. |

#### `drop(resourceType, [amount])`

_Action: changes game state; +0.2 CPU added to its natural cost when it returns OK._

```javascript
creep.drop(RESOURCE_ENERGY);
```

```javascript
// drop all resources
for(const resourceType in creep.carry) {
	creep.drop(resourceType);
}
```

Drop this resource on the ground.

| parameter | type | description |
|---|---|---|
| `resourceType` | string | One of the `RESOURCE_*` constants. |
| `amount` _(optional)_ | number | The amount of resource units to be dropped. If omitted, all the available carried amount is used. |

**Return value**

One of the following codes:

| code | value | description |
|---|---|---|
| `OK` | 0 | The operation has been scheduled successfully. |
| `ERR_NOT_OWNER` | -1 | You are not the owner of this creep. |
| `ERR_BUSY` | -4 | The creep is still being spawned. |
| `ERR_INVALID_ARGS` | -10 | The resourceType is not a valid `RESOURCE_*` constants. |
| `ERR_NOT_ENOUGH_RESOURCES` | -6 | The creep does not have the given amount of resources. |

#### `generateSafeMode(target)`

_Action: changes game state; +0.2 CPU added to its natural cost when it returns OK._

```javascript
if(creep.generateSafeMode(creep.room.controller) == ERR_NOT_IN_RANGE) {
    creep.moveTo(creep.room.controller);
}

```

Add one more available safe mode activation to a room controller. The creep has to be at adjacent square to the target room controller and have 1000 ghodium resource.

| parameter | type | description |
|---|---|---|
| `target` | StructureController | The target room controller. |

**Return value**

One of the following codes:

| code | value | description |
|---|---|---|
| `OK` | 0 | The operation has been scheduled successfully. |
| `ERR_NOT_OWNER` | -1 | You are not the owner of this creep. |
| `ERR_BUSY` | -4 | The creep is still being spawned. |
| `ERR_NOT_ENOUGH_RESOURCES` | -6 | The creep does not have enough ghodium. |
| `ERR_INVALID_TARGET` | -7 | The target is not a valid controller object. |
| `ERR_NOT_IN_RANGE` | -9 | The target is too far away. |

#### `getActiveBodyparts(type)`

_CPU cost: insignificant._

```javascript
const target = creep.pos.findClosestByRange(FIND_HOSTILE_CREEPS, {
    filter: function(object) {
        return object.getActiveBodyparts(ATTACK) == 0;
    }
});
if(target) {
    creep.moveTo(target);
}
```

Get the quantity of live body parts of the given type. Fully damaged parts do not count.

| parameter | type | description |
|---|---|---|
| `type` | string | A body part type, one of the following body part constants: `MOVE` `WORK` `CARRY` `ATTACK` `RANGED_ATTACK` `HEAL` `TOUGH` |

**Return value**

A number representing the quantity of body parts.

#### `harvest(target)`

_Action: changes game state; +0.2 CPU added to its natural cost when it returns OK._

```javascript
const target = creep.pos.findClosestByRange(FIND_SOURCES_ACTIVE);
if(target) {
    if(creep.harvest(target) == ERR_NOT_IN_RANGE) {
        creep.moveTo(target);
    }
}

```

Harvest energy from the source or resources from minerals and deposits. Requires the <code>WORK</code> body part. If the creep has an empty <code>CARRY</code> body part, the harvested resource is put into it; otherwise it is dropped on the ground. The target has to be at an adjacent square to the creep.

| parameter | type | description |
|---|---|---|
| `target` | Source, Mineral, Deposit | The object to be harvested. |

**Return value**

One of the following codes:

| code | value | description |
|---|---|---|
| `OK` | 0 | The operation has been scheduled successfully. |
| `ERR_NOT_OWNER` | -1 | You are not the owner of this creep, or the room controller is owned or reserved by another player. |
| `ERR_BUSY` | -4 | The creep is still being spawned. |
| `ERR_NOT_FOUND` | -5 | Extractor not found. You must build an extractor structure to harvest minerals. Learn more |
| `ERR_NOT_ENOUGH_RESOURCES` | -6 | The target does not contain any harvestable energy or mineral. |
| `ERR_INVALID_TARGET` | -7 | The target is not a valid source or mineral object. |
| `ERR_NOT_IN_RANGE` | -9 | The target is too far away. |
| `ERR_TIRED` | -11 | The extractor or the deposit is still cooling down. |
| `ERR_NO_BODYPART` | -12 | There are no `WORK` body parts in this creep’s body. |

#### `heal(target)`

_Action: changes game state; +0.2 CPU added to its natural cost when it returns OK._

```javascript
const target = creep.pos.findClosestByRange(FIND_MY_CREEPS, {
    filter: function(object) {
        return object.hits < object.hitsMax;
    }
});
if(target) {
    if(creep.heal(target) == ERR_NOT_IN_RANGE) {
        creep.moveTo(target);
    }
}

```

Heal self or another creep. It will restore the target creep’s damaged body parts function and increase the hits counter. Requires the <code>HEAL</code> body part. The target has to be at adjacent square to the creep.

| parameter | type | description |
|---|---|---|
| `target` | Creep, PowerCreep | The target creep object. |

**Return value**

One of the following codes:

| code | value | description |
|---|---|---|
| `OK` | 0 | The operation has been scheduled successfully. |
| `ERR_NOT_OWNER` | -1 | You are not the owner of this creep. |
| `ERR_BUSY` | -4 | The creep is still being spawned. |
| `ERR_INVALID_TARGET` | -7 | The target is not a valid creep object. |
| `ERR_NOT_IN_RANGE` | -9 | The target is too far away. |
| `ERR_NO_BODYPART` | -12 | There are no `HEAL` body parts in this creep’s body. |

#### `move(direction)`

_Action: changes game state; +0.2 CPU added to its natural cost when it returns OK._

```javascript
creep.move(RIGHT);
```

```javascript
const path = creep.pos.findPathTo(Game.flags.Flag1);
if(path.length > 0) {
	creep.move(path[0].direction);
}
```

```javascript
creep1.move(TOP);
creep1.pull(creep2);
creep2.move(creep1);
```

Move the creep one square in the specified direction. Requires the <code>MOVE</code> body part, or another creep nearby <a href="#Creep.pull">pulling</a> the creep. In case if you call <code>move</code> on a creep nearby, the <code>ERR_TIRED</code> and the <code>ERR_NO_BODYPART</code> checks will be bypassed; otherwise, the <code>ERR_NOT_IN_RANGE</code> check will be bypassed. 

| parameter | type | description |
|---|---|---|
| `direction` | Creep\|number | A creep nearby, or one of the following constants: `TOP` `TOP_RIGHT` `RIGHT` `BOTTOM_RIGHT` `BOTTOM` `BOTTOM_LEFT` `LEFT` `TOP_LEFT` |

**Return value**

One of the following codes:

| code | value | description |
|---|---|---|
| `OK` | 0 | The operation has been scheduled successfully. |
| `ERR_NOT_OWNER` | -1 | You are not the owner of this creep. |
| `ERR_BUSY` | -4 | The creep is still being spawned. |
| `ERR_TIRED` | -11 | The fatigue indicator of the creep is non-zero. |
| `ERR_NO_BODYPART` | -12 | There are no MOVE body parts in this creep’s body. |
| `ERR_INVALID_ARGS` | -10 | The provided direction is incorrect. |
| `ERR_NOT_IN_RANGE` | -9 | The target creep is too far away |

#### `moveByPath(path)`

_Action: changes game state; +0.2 CPU added to its natural cost when it returns OK._

```javascript
const path = spawn.room.findPath(spawn, source);
creep.moveByPath(path);
```

```javascript
if(!creep.memory.path) {
    creep.memory.path = creep.pos.findPathTo(target);
}
creep.moveByPath(creep.memory.path);
```

Move the creep using the specified predefined path. Requires the <code>MOVE</code> body part.

| parameter | type | description |
|---|---|---|
| `path` | array\|string | A path value as returned from `Room.findPath`, `RoomPosition.findPathTo`, or `PathFinder.search` methods. Both array form and serialized string form are accepted. |

**Return value**

One of the following codes:

| code | value | description |
|---|---|---|
| `OK` | 0 | The operation has been scheduled successfully. |
| `ERR_NOT_OWNER` | -1 | You are not the owner of this creep. |
| `ERR_BUSY` | -4 | The creep is still being spawned. |
| `ERR_NOT_FOUND` | -5 | The specified path doesn't match the creep's location. |
| `ERR_INVALID_ARGS` | -10 | `path` is not a valid path array. |
| `ERR_TIRED` | -11 | The fatigue indicator of the creep is non-zero. |
| `ERR_NO_BODYPART` | -12 | There are no `MOVE` body parts in this creep’s body. |

#### `moveTo(x, y, [opts]) / moveTo(target, [opts])`

_CPU cost: high._

```javascript
creep.moveTo(10, 20);
```

```javascript
creep.moveTo(Game.flags.Flag1);
```

```javascript
creep.moveTo(new RoomPosition(25, 20, 'W10N5'));
```

```javascript
creep.moveTo(pos, {reusePath: 50});
```

```javascript
// Execute moves by cached paths at first
for(const name in Game.creeps) {
    Game.creeps[name].moveTo(target, {noPathFinding: true});
}

// Perform pathfinding only if we have enough CPU
if(Game.cpu.tickLimit - Game.cpu.getUsed() > 20) {
    for(const name in Game.creeps) {
        Game.creeps[name].moveTo(target);
    }
}
```

Find the optimal path to the target within the same room and move to it. A shorthand to consequent calls of <a href="#RoomPosition.findPathTo">pos.findPathTo()</a> and <a href="#Creep.move">move()</a> methods. If the target is in another room, then the corresponding exit will be used as a target. Requires the <code>MOVE</code> body part.

| parameter | type | description |
|---|---|---|
| `x` | number | X position of the target in the same room. |
| `y` | number | Y position of the target in the same room. |
| `target` | object | Can be a RoomPosition object or any object containing RoomPosition. The position doesn't have to be in the same room with the creep. |
| `opts` _(optional)_ | object | An object containing additional options: reusePath number This option enables reusing the path found along multiple game ticks. It allows to save CPU time, but can result in a slightly slower creep reaction behavior. The path is stored into the creep's memory to the `_move` property. The `reusePath` value defines the amount of ticks which the path should be reused for. The default value is 5. Increase the amount to save more CPU, decrease to make the movement more consistent. Set to 0 if you want to disable path reusing. serializeMemory boolean If `reusePath` is enabled and this option is set to true, the path will be stored in memory in the short serialized form using `Room.serializePath`. The default value is true. noPathFinding boolean If this option is set to true, `moveTo` method will return `ERR_NOT_FOUND` if there is no memorized path to reuse. This can significantly save CPU time in some cases. The default value is false. visualizePathStyle object Draw a line along the creep’s path using `RoomVisual.poly`. You can provide either an empty object or custom style parameters. The default style is equivalent to: `{ fill: 'transparent', stroke: '#fff', lineStyle: 'dashed', strokeWidth: .15, opacity: .1 }` Any options supported by `Room.findPath` method. |

**Return value**

One of the following codes:

| code | value | description |
|---|---|---|
| `OK` | 0 | The operation has been scheduled successfully. |
| `ERR_NOT_OWNER` | -1 | You are not the owner of this creep. |
| `ERR_BUSY` | -4 | The creep is still being spawned. |
| `ERR_TIRED` | -11 | The fatigue indicator of the creep is non-zero. |
| `ERR_NO_BODYPART` | -12 | There are no MOVE body parts in this creep’s body. |
| `ERR_INVALID_TARGET` | -7 | The target provided is invalid. |
| `ERR_NO_PATH` | -2 | No path to the target could be found. |
| `ERR_NOT_FOUND` | -5 | The creep has no memorized path to reuse. |

#### `notifyWhenAttacked(enabled)`

_Action: changes game state; +0.2 CPU added to its natural cost when it returns OK._

```javascript
if(creep.memory.role == 'scout') {
	creep.notifyWhenAttacked(false);
}
else {
	creep.notifyWhenAttacked(true);
}
```

Toggle auto notification when the creep is under attack. The notification will be sent to your account email. Turned on by default.

| parameter | type | description |
|---|---|---|
| `enabled` | boolean | Whether to enable notification or disable. |

**Return value**

One of the following codes:

| code | value | description |
|---|---|---|
| `OK` | 0 | The operation has been scheduled successfully. |
| `ERR_NOT_OWNER` | -1 | You are not the owner of this creep. |
| `ERR_BUSY` | -4 | The creep is still being spawned. |
| `ERR_INVALID_ARGS` | -10 | `enable` argument is not a boolean value. |

#### `pickup(target)`

_Action: changes game state; +0.2 CPU added to its natural cost when it returns OK._

```javascript
const target = creep.pos.findClosestByRange(FIND_DROPPED_RESOURCES);
if(target) {
    if(creep.pickup(target) == ERR_NOT_IN_RANGE) {
        creep.moveTo(target);
    }
}

```

Pick up an item (a dropped piece of energy). Requires the <code>CARRY</code> body part. The target has to be at adjacent square to the creep or at the same square.

| parameter | type | description |
|---|---|---|
| `target` | Resource | The target object to be picked up. |

**Return value**

One of the following codes:

| code | value | description |
|---|---|---|
| `OK` | 0 | The operation has been scheduled successfully. |
| `ERR_NOT_OWNER` | -1 | You are not the owner of this creep. |
| `ERR_BUSY` | -4 | The creep is still being spawned. |
| `ERR_INVALID_TARGET` | -7 | The target is not a valid object to pick up. |
| `ERR_FULL` | -8 | The creep cannot receive any more resource. |
| `ERR_NOT_IN_RANGE` | -9 | The target is too far away. |

#### `pull(target)`

_CPU cost: insignificant._

```javascript
creep1.move(TOP);
creep1.pull(creep2);
creep2.move(creep1);
```

```javascript
const target = creep.pos.findClosestByRange(FIND_MY_CREEPS, {
    filter: function(object) {
        return (object.getActiveBodyparts(MOVE) == 0) && 
            object.memory.destinationId &&
            !object.pos.isNearTo(Game.getObjectById(object.memory.destinationId));
    }
});
if(target) {
    if(creep.pull(target) == ERR_NOT_IN_RANGE) {
        creep.moveTo(target);
    } else {
        target.move(creep);
        if(creep.pos.isNearTo(Game.getObjectById(target.memory.destinationId))) {
            creep.move(creep.pos.getDirectionTo(target));
        } else {
            creep.moveTo(Game.getObjectById(target.memory.destinationId));
        }
    }
}
```

Help another creep to follow this creep. The fatigue generated for the target's move will be added to the creep instead of the target. Requires the <code>MOVE</code> body part. The target has to be at adjacent square to the creep. The creep must <a href="#Creep.move">move</a> elsewhere, and the target must <a href="#Creep.move">move</a> towards the creep.

| parameter | type | description |
|---|---|---|
| `target` | Creep | The target creep. |

**Return value**

One of the following codes:

| code | value | description |
|---|---|---|
| `OK` | 0 | The operation has been scheduled successfully. |
| `ERR_NOT_OWNER` | -1 | You are not the owner of this creep. |
| `ERR_BUSY` | -4 | The creep is still being spawned. |
| `ERR_INVALID_TARGET` | -7 | The target provided is invalid. |
| `ERR_NOT_IN_RANGE` | -9 | The target is too far away. |

#### `rangedAttack(target)`

_Action: changes game state; +0.2 CPU added to its natural cost when it returns OK._

```javascript
const targets = creep.pos.findInRange(FIND_HOSTILE_CREEPS, 3);
if(targets.length > 0) {
    creep.rangedAttack(targets[0]);
}

```

A ranged attack against another creep or structure. Requires the <code>RANGED_ATTACK</code> body part. If the target is inside a rampart, the rampart is attacked instead. The target has to be within 3 squares range of the creep.

| parameter | type | description |
|---|---|---|
| `target` | Creep, PowerCreep, Structure | The target object to be attacked. |

**Return value**

One of the following codes:

| code | value | description |
|---|---|---|
| `OK` | 0 | The operation has been scheduled successfully. |
| `ERR_NOT_OWNER` | -1 | You are not the owner of this creep. |
| `ERR_BUSY` | -4 | The creep is still being spawned. |
| `ERR_INVALID_TARGET` | -7 | The target is not a valid attackable object. |
| `ERR_NOT_IN_RANGE` | -9 | The target is too far away. |
| `ERR_NO_BODYPART` | -12 | There are no `RANGED_ATTACK` body parts in this creep’s body. |

#### `rangedHeal(target)`

_Action: changes game state; +0.2 CPU added to its natural cost when it returns OK._

```javascript
const target = creep.pos.findClosestByRange(FIND_MY_CREEPS, {
    filter: function(object) {
        return object.hits < object.hitsMax;
    }
});
if(target) {
    creep.moveTo(target);
    if(creep.pos.isNearTo(target)) {
        creep.heal(target);
    }
    else {
        creep.rangedHeal(target);
    }
}
```

Heal another creep at a distance. It will restore the target creep’s damaged body parts function and increase the hits counter. Requires the <code>HEAL</code> body part. The target has to be within 3 squares range of the creep.

| parameter | type | description |
|---|---|---|
| `target` | Creep, PowerCreep | The target creep object. |

**Return value**

One of the following codes:

| code | value | description |
|---|---|---|
| `OK` | 0 | The operation has been scheduled successfully. |
| `ERR_NOT_OWNER` | -1 | You are not the owner of this creep. |
| `ERR_BUSY` | -4 | The creep is still being spawned. |
| `ERR_INVALID_TARGET` | -7 | The target is not a valid creep object. |
| `ERR_NOT_IN_RANGE` | -9 | The target is too far away. |
| `ERR_NO_BODYPART` | -12 | There are no `HEAL` body parts in this creep’s body. |

#### `rangedMassAttack()`

_Action: changes game state; +0.2 CPU added to its natural cost when it returns OK._

```javascript
const targets = creep.pos.findInRange(FIND_HOSTILE_CREEPS, 3);
if(targets.length > 0) {
    creep.rangedMassAttack();
}
```

A ranged attack against all hostile creeps or structures within 3 squares range. Requires the <code>RANGED_ATTACK</code> body part. The attack power depends on the range to each target. Friendly units are not affected.

**Return value**

One of the following codes:

| code | value | description |
|---|---|---|
| `OK` | 0 | The operation has been scheduled successfully. |
| `ERR_NOT_OWNER` | -1 | You are not the owner of this creep. |
| `ERR_BUSY` | -4 | The creep is still being spawned. |
| `ERR_NO_BODYPART` | -12 | There are no `RANGED_ATTACK` body parts in this creep’s body. |

#### `repair(target)`

_Action: changes game state; +0.2 CPU added to its natural cost when it returns OK._

```javascript
const targets = creep.room.find(FIND_STRUCTURES, {
    filter: object => object.hits < object.hitsMax
});

targets.sort((a,b) => a.hits - b.hits);

if(targets.length > 0) {
    if(creep.repair(targets[0]) == ERR_NOT_IN_RANGE) {
        creep.moveTo(targets[0]);
    }
}
```

Repair a damaged structure using carried energy. Requires the <code>WORK</code> and <code>CARRY</code> body parts. The target has to be within 3 squares range of the creep.

| parameter | type | description |
|---|---|---|
| `target` | Structure | The target structure to be repaired. |

**Return value**

One of the following codes:

| code | value | description |
|---|---|---|
| `OK` | 0 | The operation has been scheduled successfully. |
| `ERR_NOT_OWNER` | -1 | You are not the owner of this creep. |
| `ERR_BUSY` | -4 | The creep is still being spawned. |
| `ERR_NOT_ENOUGH_RESOURCES` | -6 | The creep does not carry any energy. |
| `ERR_INVALID_TARGET` | -7 | The target is not a valid structure object. |
| `ERR_NOT_IN_RANGE` | -9 | The target is too far away. |
| `ERR_NO_BODYPART` | -12 | There are no `WORK` body parts in this creep’s body. |

#### `reserveController(target)`

_Action: changes game state; +0.2 CPU added to its natural cost when it returns OK._

```javascript
if(creep.room.controller) {
    if(creep.reserveController(creep.room.controller) == ERR_NOT_IN_RANGE) {
        creep.moveTo(creep.room.controller);
    }
}

```

Temporarily block a neutral controller from claiming by other players and restore energy sources to their full capacity. Each tick, this command increases the counter of the period during which the controller is unavailable by 1 tick per each <code>CLAIM</code> body part. The maximum reservation period to maintain is 5,000 ticks. The target has to be at adjacent square to the creep.

| parameter | type | description |
|---|---|---|
| `target` | StructureController | The target controller object to be reserved. |

**Return value**

One of the following codes:

| code | value | description |
|---|---|---|
| `OK` | 0 | The operation has been scheduled successfully. |
| `ERR_NOT_OWNER` | -1 | You are not the owner of this creep. |
| `ERR_BUSY` | -4 | The creep is still being spawned. |
| `ERR_INVALID_TARGET` | -7 | The target is not a valid neutral controller object. |
| `ERR_NOT_IN_RANGE` | -9 | The target is too far away. |
| `ERR_NO_BODYPART` | -12 | There are no `CLAIM` body parts in this creep’s body. |
| `ERR_ACCESS_DENIED` | -16 | You do not have access to this restricted shard. Use [`Game.shard.activateAccess`](#Game.shard.activateAccess) to activate access. |

#### `say(message, [public])`

_CPU cost: insignificant._

```javascript
const hostiles = creep.pos.findInRange(FIND_HOSTILE_CREEPS, 10);
if(hostiles.length > 0) {
    creep.say('OMG!😨');
    creep.moveTo(Game.spawns['Spawn1']);
}
else {
    doWork(creep);
}
```

Display a visual speech balloon above the creep with the specified message. The message will be available for one tick. You can read the last message using the <code>saying</code> property. Any valid Unicode characters are allowed, including <a href="http://unicode.org/emoji/charts/emoji-style.txt" target="_blank">emoji</a>.

| parameter | type | description |
|---|---|---|
| `message` | string | The message to be displayed. Maximum length is 10 characters. |
| `public` _(optional)_ | boolean | Set to true to allow other players to see this message. Default is false. |

**Return value**

One of the following codes:

| code | value | description |
|---|---|---|
| `OK` | 0 | The operation has been scheduled successfully. |
| `ERR_NOT_OWNER` | -1 | You are not the owner of this creep. |
| `ERR_BUSY` | -4 | The creep is still being spawned. |

#### `signController(target, text)`

_Action: changes game state; +0.2 CPU added to its natural cost when it returns OK._

```javascript
if(creep.room.controller) {
    if(creep.signController(creep.room.controller, "I'm going to claim this room in a few days. I warned ya!") == ERR_NOT_IN_RANGE) {
        creep.moveTo(creep.room.controller);
    }
}

```

Sign a controller with an arbitrary text visible to all players. This text will appear in the room UI, in the world map, and can be accessed via the API. You can sign unowned and hostile controllers. The target has to be at adjacent square to the creep. Pass an empty string to remove the sign.

| parameter | type | description |
|---|---|---|
| `target` | StructureController | The target controller object to be signed. |
| `text` | string | The sign text. The string is cut off after 100 characters. |

**Return value**

One of the following codes:

| code | value | description |
|---|---|---|
| `OK` | 0 | The operation has been scheduled successfully. |
| `ERR_BUSY` | -4 | The creep is still being spawned. |
| `ERR_INVALID_TARGET` | -7 | The target is not a valid controller object. |
| `ERR_NOT_IN_RANGE` | -9 | The target is too far away. |

#### `suicide()`

_Action: changes game state; +0.2 CPU added to its natural cost when it returns OK._

Kill the creep immediately.

**Return value**

One of the following codes:

| code | value | description |
|---|---|---|
| `OK` | 0 | The operation has been scheduled successfully. |
| `ERR_NOT_OWNER` | -1 | You are not the owner of this creep. |
| `ERR_BUSY` | -4 | The creep is still being spawned. |

#### `transfer(target, resourceType, [amount])`

_Action: changes game state; +0.2 CPU added to its natural cost when it returns OK._

```javascript
if(creep.transfer(storage, RESOURCE_ENERGY) == ERR_NOT_IN_RANGE) {
	creep.moveTo(storage);
}
```

```javascript
// transfer all resources
for(const resourceType in creep.carry) {
	creep.transfer(storage, resourceType);
}
```

Transfer resource from the creep to another object. The target has to be at adjacent square to the creep.

| parameter | type | description |
|---|---|---|
| `target` | Creep, PowerCreep, Structure | The target object. |
| `resourceType` | string | One of the `RESOURCE_*` constants. |
| `amount` _(optional)_ | number | The amount of resources to be transferred. If omitted, all the available carried amount is used. |

**Return value**

One of the following codes:

| code | value | description |
|---|---|---|
| `OK` | 0 | The operation has been scheduled successfully. |
| `ERR_NOT_OWNER` | -1 | You are not the owner of this creep. |
| `ERR_BUSY` | -4 | The creep is still being spawned. |
| `ERR_NOT_ENOUGH_RESOURCES` | -6 | The creep does not have the given amount of resources. |
| `ERR_INVALID_TARGET` | -7 | The target is not a valid object which can contain the specified resource. |
| `ERR_FULL` | -8 | The target cannot receive any more resources. |
| `ERR_NOT_IN_RANGE` | -9 | The target is too far away. |
| `ERR_INVALID_ARGS` | -10 | The resourceType is not one of the `RESOURCE_*` constants, or the amount is incorrect. |

#### `upgradeController(target)`

_Action: changes game state; +0.2 CPU added to its natural cost when it returns OK._

```javascript
if(creep.room.controller) {
    if(creep.upgradeController(creep.room.controller) == ERR_NOT_IN_RANGE) {
        creep.moveTo(creep.room.controller);
    }
}

```

Upgrade your controller to the next level using carried energy. Upgrading controllers raises your Global Control Level in parallel. Requires <code>WORK</code> and <code>CARRY</code> body parts. The target has to be within 3 squares range of the creep. 

A fully upgraded level 8 controller can't be upgraded over 15 energy units per tick regardless of creeps abilities. The cumulative effect of all the creeps performing <code>upgradeController</code> in the current tick is taken into account. This limit can be increased by using <a href="/resources.html">ghodium mineral boost</a>.

Upgrading the controller raises its `ticksToDowngrade` timer by 100. The timer must be full in order for controller to be levelled up.

| parameter | type | description |
|---|---|---|
| `target` | StructureController | The target controller object to be upgraded. |

**Return value**

One of the following codes:

| code | value | description |
|---|---|---|
| `OK` | 0 | The operation has been scheduled successfully. |
| `ERR_NOT_OWNER` | -1 | You are not the owner of this creep or the target controller. |
| `ERR_BUSY` | -4 | The creep is still being spawned. |
| `ERR_NOT_ENOUGH_RESOURCES` | -6 | The creep does not have any carried energy. |
| `ERR_INVALID_TARGET` | -7 | The target is not a valid controller object, or the controller upgrading is blocked. |
| `ERR_NOT_IN_RANGE` | -9 | The target is too far away. |
| `ERR_NO_BODYPART` | -12 | There are no `WORK` body parts in this creep’s body. |
| `ERR_ACCESS_DENIED` | -16 | You do not have access to this restricted shard. Use [`Game.shard.activateAccess`](#Game.shard.activateAccess) to activate access. |

#### `withdraw(target, resourceType, [amount])`

_Action: changes game state; +0.2 CPU added to its natural cost when it returns OK._

```javascript
if(creep.withdraw(storage, RESOURCE_ENERGY) == ERR_NOT_IN_RANGE) {
	creep.moveTo(storage);
}
```

Withdraw resources from a structure or tombstone. The target has to be at adjacent square to the creep. Multiple creeps can withdraw from the same object in the same tick. Your creeps can withdraw resources from hostile structures/tombstones as well, in case if there is no hostile rampart on top of it.

This method should not be used to transfer resources between creeps. To transfer between creeps, use the [`transfer`](#Creep.transfer) method on the original creep.

| parameter | type | description |
|---|---|---|
| `target` | Structure, Tombstone, Ruin | The target object. |
| `resourceType` | string | One of the `RESOURCE_*` constants. |
| `amount` _(optional)_ | number | The amount of resources to be transferred. If omitted, all the available amount is used. |

**Return value**

One of the following codes:

| code | value | description |
|---|---|---|
| `OK` | 0 | The operation has been scheduled successfully. |
| `ERR_NOT_OWNER` | -1 | You are not the owner of this creep, or there is a hostile rampart on top of the target. |
| `ERR_BUSY` | -4 | The creep is still being spawned. |
| `ERR_NOT_ENOUGH_RESOURCES` | -6 | The target does not have the given amount of resources. |
| `ERR_INVALID_TARGET` | -7 | The target is not a valid object which can contain the specified resource. |
| `ERR_FULL` | -8 | The creep's carry is full. |
| `ERR_NOT_IN_RANGE` | -9 | The target is too far away. |
| `ERR_INVALID_ARGS` | -10 | The resourceType is not one of the `RESOURCE_*` constants, or the amount is incorrect. |

---

### Deposit

<img src="img/deposit.png" alt="" align="right" />

A rare resource deposit needed for producing commodities. Can be harvested by creeps with a `WORK` body part. 
Each harvest operation triggers a cooldown period, which becomes longer and longer over time.

Learn more about deposits from [this article](/resources.html). 

<table class="table gameplay-info">
    <tbody>
    <tr>
        <td><strong>Cooldown</strong></td> 
        <td>`0.001 * totalHarvested ^ 1.2`<td>
    </tr>
    <tr>
        <td><strong>Decay</strong></td>
        <td>50,000 ticks after appearing or last harvest operation</td>
    </tr>
    </tbody>
</table>

#### `effects` : array  _(inherited from RoomObject)_

Applied effects, an array of objects with the following properties:

| parameter | type | description |
|---|---|---|
| `effect` | number | Effect ID of the applied effect. Can be either natural effect ID or Power ID. |
| `level` _(optional)_ | number | Power level of the applied effect. Absent if the effect is not a Power effect. |
| `ticksRemaining` | number | How many ticks will the effect last. |

#### `pos` : RoomPosition  _(inherited from RoomObject)_

An object representing the position of this object in the room.

#### `room` : Room  _(inherited from RoomObject)_

The link to the Room object. May be undefined in case if an object is a flag or a construction site and is placed in a room that is not visible to you.

#### `cooldown` : number

The amount of game ticks until the next harvest action is possible.

#### `depositType` : string

The deposit type, one of the following constants:

```javascript-content
RESOURCE_MIST
RESOURCE_BIOMASS
RESOURCE_METAL
RESOURCE_SILICON
```

#### `id` : string

A unique object identificator. You can use <a href="#Game.getObjectById"><code>Game.getObjectById</code></a> method to retrieve an object instance by its <code>id</code>.

#### `lastCooldown` : number

The cooldown of the last harvest operation on this deposit.

#### `ticksToDecay` : number

The amount of game ticks when this deposit will disappear.

---

### Flag

A flag. Flags can be used to mark particular spots in a room. Flags are visible to their owners only. You cannot have more than 10,000 flags.

#### `effects` : array  _(inherited from RoomObject)_

Applied effects, an array of objects with the following properties:

| parameter | type | description |
|---|---|---|
| `effect` | number | Effect ID of the applied effect. Can be either natural effect ID or Power ID. |
| `level` _(optional)_ | number | Power level of the applied effect. Absent if the effect is not a Power effect. |
| `ticksRemaining` | number | How many ticks will the effect last. |

#### `pos` : RoomPosition  _(inherited from RoomObject)_

An object representing the position of this object in the room.

#### `room` : Room  _(inherited from RoomObject)_

The link to the Room object. May be undefined in case if an object is a flag or a construction site and is placed in a room that is not visible to you.

 

#### `color` : number

Flag primary color. One of the <code>COLOR_*</code> constants.

#### `memory` : any

A shorthand to <code>Memory.flags[flag.name]</code>. You can use it for quick access the flag's specific memory data object.

#### `name` : string

 

Flag’s name. You can choose the name while creating a new flag, and it cannot be changed later. This name is a hash key to access the flag via the <a href="#Game.flags">Game.flags</a> object. The maximum name length is 100 charactes.

#### `secondaryColor` : number

Flag secondary color. One of the <code>COLOR_*</code> constants.

#### `remove()`

_Action: changes game state; +0.2 CPU added to its natural cost when it returns OK._

Remove the flag.

**Return value**

Always returns
OK
.

#### `setColor(color, [secondaryColor])`

_Action: changes game state; +0.2 CPU added to its natural cost when it returns OK._

```javascript
Game.flags.Flag1.setColor(COLOR_GREEN, COLOR_WHITE);
```

Set new color of the flag.

| parameter | type | description |
|---|---|---|
| `color` | number | Primary color of the flag. One of the `COLOR_*` constants. |
| `secondaryColor` _(optional)_ | number | Secondary color of the flag. One of the `COLOR_*` constants. |

**Return value**

One of the following codes:

| code | value | description |
|---|---|---|
| `OK` | 0 | The operation has been scheduled successfully. |
| `ERR_INVALID_ARGS` | -10 | `color` or `secondaryColor` is not a valid color constant. |

#### `setPosition(x,y) / setPosition(pos)`

_Action: changes game state; +0.2 CPU added to its natural cost when it returns OK._

```javascript
Game.flags.Flag1.setPosition(10,20);
```

```javascript
Game.flags.Flag1.setPosition( new RoomPosition(10, 20, 'W3S5') );
```

Set new position of the flag.

| parameter | type | description |
|---|---|---|
| `x` | number | The X position in the room. |
| `y` | number | The Y position in the room. |
| `pos` | object | Can be a RoomPosition object or any object containing RoomPosition. |

**Return value**

One of the following codes:

| code | value | description |
|---|---|---|
| `OK` | 0 | The operation has been scheduled successfully. |
| `ERR_INVALID_TARGET` | -7 | The target provided is invalid. |

---

### Mineral

A mineral deposit. Can be harvested by creeps with a `WORK` body part using the extractor structure. 
Learn more about minerals from [this article](/resources.html).

<table class="table gameplay-info">
    <tbody>
    <tr>
        <td><strong>Regeneration amount</strong></td>
        <td><code>DENSITY_LOW</code>: 15,000 <br /> <code>DENSITY_MODERATE</code>: 35,000<br /> <code>DENSITY_HIGH</code>: 70,000 <br /> <code>DENSITY_ULTRA</code>: 100,000</td>
    </tr>
    <tr>
        <td><strong>Regeneration time</strong></td>
        <td>50,000 ticks</td>
    </tr>
    <tr>
        <td><strong>Density change probability</strong></td>
        <td><code>DENSITY_LOW</code>: 100% chance <br /> <code>DENSITY_MODERATE</code>: 5% chance<br /> <code>DENSITY_HIGH</code>: 5% chance <br /> <code>DENSITY_ULTRA</code>: 100% chance</td>
    </tr>
    </tbody>
</table>

#### `effects` : array  _(inherited from RoomObject)_

Applied effects, an array of objects with the following properties:

| parameter | type | description |
|---|---|---|
| `effect` | number | Effect ID of the applied effect. Can be either natural effect ID or Power ID. |
| `level` _(optional)_ | number | Power level of the applied effect. Absent if the effect is not a Power effect. |
| `ticksRemaining` | number | How many ticks will the effect last. |

#### `pos` : RoomPosition  _(inherited from RoomObject)_

An object representing the position of this object in the room.

#### `room` : Room  _(inherited from RoomObject)_

The link to the Room object. May be undefined in case if an object is a flag or a construction site and is placed in a room that is not visible to you.

#### `density` : number

The density that this mineral deposit will be refilled to once <code>ticksToRegeneration</code> reaches 0. This is one of the <code>DENSITY_*</code> constants.

#### `mineralAmount` : number

The remaining amount of resources.

#### `mineralType` : string

The resource type, one of the <code>RESOURCE_*</code> constants.

#### `id` : string

A unique object identificator. You can use <a href="#Game.getObjectById"><code>Game.getObjectById</code></a> method to retrieve an object instance by its <code>id</code>.

#### `ticksToRegeneration` : number

The remaining time after which the deposit will be refilled.

---

### Nuke

A nuke landing position. This object cannot be removed or modified. You can find incoming nukes in the room using the `FIND_NUKES` constant.

<table class="table gameplay-info">
    <tbody>
    <tr>
        <td><strong>Landing time</strong></td>
        <td>50,000 ticks</td>
    </tr>
    <tr>
        <td><strong>Effect</strong></td>
        <td>All creeps, construction sites and dropped resources in the room are removed immediately, even inside ramparts. Damage to structures:
            <ul>
                <li>10,000,000 hits at the landing position;</li>
                <li>5,000,000 hits to all structures in 5x5 area.</li>
            </ul>
            <p>Note that you can stack multiple nukes from different rooms at the same target position to increase damage.</p>
            <p>Nuke landing does not generate tombstones and ruins, and destroys all existing tombstones and ruins in the room</p>
            <p>If the room is in safe mode, then the safe mode is cancelled immediately, and the safe mode cooldown is reset to 0.</p>
            <p>The room controller is hit by triggering <code>upgradeBlocked</code> period, which means it is unavailable to activate safe mode again within the next 200 ticks.</p>
        </td>
    </tr>
    </tbody>
</table>

#### `effects` : array  _(inherited from RoomObject)_

Applied effects, an array of objects with the following properties:

| parameter | type | description |
|---|---|---|
| `effect` | number | Effect ID of the applied effect. Can be either natural effect ID or Power ID. |
| `level` _(optional)_ | number | Power level of the applied effect. Absent if the effect is not a Power effect. |
| `ticksRemaining` | number | How many ticks will the effect last. |

#### `pos` : RoomPosition  _(inherited from RoomObject)_

An object representing the position of this object in the room.

#### `room` : Room  _(inherited from RoomObject)_

The link to the Room object. May be undefined in case if an object is a flag or a construction site and is placed in a room that is not visible to you.

#### `id` : string

A unique object identificator. You can use <a href="#Game.getObjectById"><code>Game.getObjectById</code></a> method to retrieve an object instance by its <code>id</code>.

#### `launchRoomName` : string

The name of the room where this nuke has been launched from.

#### `timeToLand` : number

The remaining landing time.

---

### OwnedStructure

The base prototype for a structure that has an owner. 
Such structures can be found using `FIND_MY_STRUCTURES` and `FIND_HOSTILE_STRUCTURES` constants.

#### `effects` : array  _(inherited from RoomObject)_

Applied effects, an array of objects with the following properties:

| parameter | type | description |
|---|---|---|
| `effect` | number | Effect ID of the applied effect. Can be either natural effect ID or Power ID. |
| `level` _(optional)_ | number | Power level of the applied effect. Absent if the effect is not a Power effect. |
| `ticksRemaining` | number | How many ticks will the effect last. |

#### `pos` : RoomPosition  _(inherited from RoomObject)_

An object representing the position of this object in the room.

#### `room` : Room  _(inherited from RoomObject)_

The link to the Room object. May be undefined in case if an object is a flag or a construction site and is placed in a room that is not visible to you.

#### `hits` : number  _(inherited from Structure)_

The current amount of hit points of the structure.

#### `hitsMax` : number  _(inherited from Structure)_

The total amount of hit points of the structure.

#### `id` : string  _(inherited from Structure)_

A unique object identificator. You can use <a href="#Game.getObjectById"><code>Game.getObjectById</code></a> method to retrieve an object instance by its <code>id</code>.

#### `structureType` : string  _(inherited from Structure)_

One of the <code>STRUCTURE_*</code> constants.

#### `destroy()`  _(inherited from Structure)_

_Action: changes game state; +0.2 CPU added to its natural cost when it returns OK._

Destroy this structure immediately.

**Return value**

One of the following codes:

| code | value | description |
|---|---|---|
| `OK` | 0 | The operation has been scheduled successfully. |
| `ERR_NOT_OWNER` | -1 | You are not the owner of this structure. |
| `ERR_BUSY` | -4 | Hostile creeps are in the room. |

#### `isActive()`  _(inherited from Structure)_

_CPU cost: medium._

Check whether this structure can be used. If room controller level is insufficient, then this method will return false, and the structure will be highlighted with red in the game.

**Return value**

A boolean value.

#### `notifyWhenAttacked(enabled)`  _(inherited from Structure)_

_Action: changes game state; +0.2 CPU added to its natural cost when it returns OK._

Toggle auto notification when the structure is under attack. The notification will be sent to your account email. Turned on by default.

| parameter | type | description |
|---|---|---|
| `enabled` | boolean | Whether to enable notification or disable. |

**Return value**

One of the following codes:

| code | value | description |
|---|---|---|
| `OK` | 0 | The operation has been scheduled successfully. |
| `ERR_NOT_OWNER` | -1 | You are not the owner of this structure. |
| `ERR_INVALID_ARGS` | -10 | `enable` argument is not a boolean value. |

#### `my` : boolean

Whether this is your own structure.

#### `owner` : object

An object with the structure’s owner info containing the following properties:

| parameter | type | description |
|---|---|---|
| `username` | string | The name of the owner user. |

---

### PathFinder.CostMatrix

Container for custom navigation cost data. By default `PathFinder` will only consider 
terrain data (plain, swamp, wall) — if you need to route around obstacles such as buildings 
or creeps you must put them into a `CostMatrix`. Generally you will create your `CostMatrix`
 from within `roomCallback`. If a non-0 value is found in a room's CostMatrix then that value 
 will be used instead of the default terrain cost. You should avoid using large values in your 
 CostMatrix and terrain cost flags. For example, running `PathFinder.search` with 
 `{ plainCost: 1, swampCost: 5 }` is faster than running it with `{plainCost: 2, swampCost: 10 }` 
 even though your paths will be the same.

#### `constructor()`

```javascript
let costs = new PathFinder.CostMatrix;
``` 

Creates a new CostMatrix containing 0's for all positions. 
 
  

#### `set(x, y, cost)`

_CPU cost: insignificant._

```javascript
let costs = new PathFinder.CostMatrix;
let pos = Game.spawns['Spawn1'].pos;
costs.set(pos.x, pos.y, 255); // Can't walk over a building
```

Set the cost of a position in this CostMatrix.

| parameter | type | description |
|---|---|---|
| `x` | number | X position in the room. |
| `y` | number | Y position in the room. |
| `cost` | number | Cost of this position. Must be a whole number. A cost of 0 will use the terrain cost for that tile. A cost greater than or equal to 255 will be treated as unwalkable. |

#### `get(x, y)`

_CPU cost: insignificant._

Get the cost of a position in this CostMatrix.

| parameter | type | description |
|---|---|---|
| `x` | number | X position in the room. |
| `y` | number | Y position in the room. |

#### `clone()`

_CPU cost: low._

Copy this CostMatrix into a new CostMatrix with the same data.

**Return value**

A new CostMatrix instance.

#### `serialize()`

_CPU cost: low._

```javascript
let costs = new PathFinder.CostMatrix;
Memory.savedMatrix = costs.serialize();
```

Returns a compact representation of this CostMatrix which can be stored via <code>JSON.stringify</code>.

**Return value**

An array of numbers. There's not much you can do with the numbers besides store them for later.

#### `PathFinder.CostMatrix.deserialize(val)`

_CPU cost: low._

```javascript
let costs = PathFinder.CostMatrix.deserialize(Memory.savedMatrix)
```

Static method which deserializes a new CostMatrix using the return value of <code>serialize</code>.

| parameter | type | description |
|---|---|---|
| `val` | object | Whatever `serialize` returned |

**Return value**

Returns new
<code>CostMatrix</code>
instance.

---

### PowerCreep

Power Creeps are immortal "heroes" that are tied to your account and can be respawned in any `PowerSpawn` after death.
You can upgrade their abilities ("powers") up to your account Global Power Level (see [`Game.gpl`](#Game.gpl)).

<table class="table gameplay-info">
    <tbody>
    <tr>
        <td><strong>Time to live</strong></td>
        <td>5,000</td>
    </tr>
    <tr>
        <td><strong>Hits</strong></td>
        <td>1,000 per level</td>
    </tr>
    <tr>
        <td><strong>Capacity</strong></td>
        <td>100 per level</td>
    </tr>    
    </tbody>
</table>

[Full list of available powers](/power.html#Powers)

#### `PowerCreep.create(name, className)`

_CPU cost: low._

```javascript
PowerCreep.create('PowerCreep1', POWER_CLASS.OPERATOR);
```

A static method to create new Power Creep instance in your account. It will be added in an unspawned state, 
use [`spawn`](#PowerCreep.spawn) method to spawn it in the world.

You need one free Power Level in your account to perform this action.

| parameter | type | description |
|---|---|---|
| `name` | string | The name of the new power creep. The name length limit is 100 characters. |
| `className` | string | The class of the new power creep, one of the `POWER_CLASS` constants. |

**Return value**

One of the following codes:

| code | value | description |
|---|---|---|
| `OK` | 0 | The operation has been scheduled successfully. |
| `ERR_NOT_ENOUGH_RESOURCES` | -6 | You don't have free Power Levels in your account. |
| `ERR_INVALID_ARGS` | -10 | The provided power creep name is exceeds the limit, or the power creep class is invalid. |
| `ERR_NAME_EXISTS` | -3 | A power creep with the specified name already exists. |

#### `effects` : array  _(inherited from RoomObject)_

Applied effects, an array of objects with the following properties:

| parameter | type | description |
|---|---|---|
| `effect` | number | Effect ID of the applied effect. Can be either natural effect ID or Power ID. |
| `level` _(optional)_ | number | Power level of the applied effect. Absent if the effect is not a Power effect. |
| `ticksRemaining` | number | How many ticks will the effect last. |

#### `pos` : RoomPosition  _(inherited from RoomObject)_

An object representing the position of this object in the room.

#### `room` : Room  _(inherited from RoomObject)_

The link to the Room object. May be undefined in case if an object is a flag or a construction site and is placed in a room that is not visible to you.

#### `carry` : object

> **Deprecated property — will be removed.**

An alias for [`PowerCreep.store`](#PowerCreep.store). 

#### `carryCapacity` : number

> **Deprecated property — will be removed.**

An alias for [`PowerCreep.store.getCapacity()`](#Store.getCapacity).

#### `className` : string

The power creep's class, one of the `POWER_CLASS` constants.

#### `deleteTime` : number

A timestamp when this creep is marked to be permanently deleted from the account, or undefined otherwise.

#### `hits` : number

The current amount of hit points of the creep.

#### `hitsMax` : number

The maximum amount of hit points of the creep.

#### `id` : string

A unique object identificator. You can use <a href="#Game.getObjectById"><code>Game.getObjectById</code></a> method to retrieve an object instance by its <code>id</code>.

#### `level` : number

The power creep's level.

#### `memory` : any

```javascript
creep.memory.task = 'building';
```

A shorthand to <code>Memory.powerCreeps[creep.name]</code>. You can use it for quick access the creep’s specific memory data object. <a href="/global-objects.html#Memory-object">Learn more about memory</a>

#### `my` : boolean

Whether it is your creep or foe.

#### `name` : string

Power creep’s name. You can choose the name while creating a new power creep, and it cannot be changed later. This name is a hash key to access the creep via the <a href="#Game.powerCreeps">Game.powerCreeps</a> object.

#### `owner` : object

An object with the creep’s owner info containing the following properties:

#### `store` : Store

```javascript
if(creep.store[RESOURCE_ENERGY] < creep.store.getCapacity()) {
    goHarvest(creep);
}
```

A [`Store`](#Store) object that contains cargo of this creep.

#### `powers` : object

Available powers, an object with power ID as a key, and the following properties:

| parameter | type | description |
|---|---|---|
| `level` | number | Current level of the power. |
| `cooldown` | number | Cooldown ticks remaining, or undefined if the power creep is not spawned in the world. |

#### `saying` : string

The text message that the creep was saying at the last tick.

#### `shard` : string

The name of the shard where the power creep is spawned, or undefined.

#### `spawnCooldownTime` : number

```javascript
if(!(Game.powerCreeps['PowerCreep1'].spawnCooldownTime > Date.now())) {
    Game.powerCreeps['PowerCreep1'].spawn(powerSpawn);
}
```
The timestamp when spawning or deleting this creep will become available. 
Undefined if the power creep is spawned in the world.

#### `ticksToLive` : number

The remaining amount of game ticks after which the creep will die and become unspawned. Undefined if the creep
is not spawned in the world. 

#### `cancelOrder(methodName)`

_CPU cost: insignificant._

```javascript
creep.move(LEFT);
creep.cancelOrder('move');
//The creep will not move in this game tick
```

Cancel the order given during the current game tick.

| parameter | type | description |
|---|---|---|
| `methodName` | string | The name of a creep's method to be cancelled. |

**Return value**

One of the following codes:

| code | value | description |
|---|---|---|
| `OK` | 0 | The operation has been cancelled successfully. |
| `ERR_NOT_OWNER` | -1 | You are not the owner of the creep. |
| `ERR_BUSY` | -4 | The power creep is not spawned in the world. |
| `ERR_NOT_FOUND` | -5 | The order with the specified name is not found. |

#### `delete([cancel])`

_Action: changes game state; +0.2 CPU added to its natural cost when it returns OK._

```javascript
Game.powerCreeps['PowerCreep1'].delete();
```

Delete the power creep permanently from your account. It should NOT be spawned in the world. The creep is not deleted
immediately, but a 24-hours delete timer is started instead (see [`deleteTime`](#PowerCreep.deleteTime)). You can cancel deletion by calling `delete(true)`.

| parameter | type | description |
|---|---|---|
| `cancel` | boolean | Set this to true to cancel previously scheduled deletion. |

**Return value**

One of the following codes:

| code | value | description |
|---|---|---|
| `OK` | 0 | The operation has been scheduled successfully. |
| `ERR_NOT_OWNER` | -1 | You are not the owner of the creep. |
| `ERR_BUSY` | -4 | The power creep is spawned in the world. |

#### `drop(resourceType, [amount])`

_Action: changes game state; +0.2 CPU added to its natural cost when it returns OK._

```javascript
creep.drop(RESOURCE_ENERGY);
```

```javascript
// drop all resources
for(const resourceType in creep.carry) {
	creep.drop(resourceType);
}
```

Drop this resource on the ground.

| parameter | type | description |
|---|---|---|
| `resourceType` | string | One of the `RESOURCE_*` constants. |
| `amount` _(optional)_ | number | The amount of resource units to be dropped. If omitted, all the available carried amount is used. |

**Return value**

One of the following codes:

| code | value | description |
|---|---|---|
| `OK` | 0 | The operation has been scheduled successfully. |
| `ERR_NOT_OWNER` | -1 | You are not the owner of this creep. |
| `ERR_BUSY` | -4 | The power creep is not spawned in the world. |
| `ERR_INVALID_ARGS` | -10 | The resourceType is not a valid `RESOURCE_*` constants. |
| `ERR_NOT_ENOUGH_RESOURCES` | -6 | The creep does not have the given amount of energy. |

```javascript
Game.powerCreeps['PowerCreep1'].usePower(PWR_GENERATE_OPS);
```

#### `enableRoom(controller)`

_Action: changes game state; +0.2 CPU added to its natural cost when it returns OK._

```javascript
powerCreep.enableRoom(powerCreep.room.controller);
```

Enable powers usage in this room. The room controller should be at adjacent tile.

| parameter | type | description |
|---|---|---|
| `controller` | StructureController | The room controller. |

**Return value**

One of the following codes:

| code | value | description |
|---|---|---|
| `OK` | 0 | The operation has been scheduled successfully. |
| `ERR_NOT_OWNER` | -1 | You are not the owner of this creep. |
| `ERR_INVALID_TARGET` | -7 | The target is not a controller structure. |
| `ERR_NOT_IN_RANGE` | -9 | The target is too far away. |

#### `move(direction)`

_Action: changes game state; +0.2 CPU added to its natural cost when it returns OK._

```javascript
creep.move(RIGHT);
```

```javascript
const path = creep.pos.findPathTo(Game.flags.Flag1);
if(path.length > 0) {
	creep.move(path[0].direction);
}
```

```javascript
creep1.move(TOP);
creep1.pull(creep2);
creep2.move(creep1);
```

Move the creep one square in the specified direction.  

| parameter | type | description |
|---|---|---|
| `direction` | Creep\|number | A creep nearby, or one of the following constants: `TOP` `TOP_RIGHT` `RIGHT` `BOTTOM_RIGHT` `BOTTOM` `BOTTOM_LEFT` `LEFT` `TOP_LEFT` |

**Return value**

One of the following codes:

| code | value | description |
|---|---|---|
| `OK` | 0 | The operation has been scheduled successfully. |
| `ERR_NOT_OWNER` | -1 | You are not the owner of this creep. |
| `ERR_BUSY` | -4 | The power creep is not spawned in the world. |
| `ERR_TIRED` | -11 | The fatigue indicator of the creep is non-zero. |
| `ERR_INVALID_ARGS` | -10 | The provided direction is incorrect. |
| `ERR_NOT_IN_RANGE` | -9 | The target creep is too far away |

#### `moveByPath(path)`

_Action: changes game state; +0.2 CPU added to its natural cost when it returns OK._

```javascript
const path = spawn.room.findPath(spawn, source);
creep.moveByPath(path);
```

```javascript
if(!creep.memory.path) {
    creep.memory.path = creep.pos.findPathTo(target);
}
creep.moveByPath(creep.memory.path);
```

Move the creep using the specified predefined path. 

| parameter | type | description |
|---|---|---|
| `path` | array\|string | A path value as returned from `Room.findPath`, `RoomPosition.findPathTo`, or `PathFinder.search` methods. Both array form and serialized string form are accepted. |

**Return value**

One of the following codes:

| code | value | description |
|---|---|---|
| `OK` | 0 | The operation has been scheduled successfully. |
| `ERR_NOT_OWNER` | -1 | You are not the owner of this creep. |
| `ERR_BUSY` | -4 | The power creep is not spawned in the world. |
| `ERR_NOT_FOUND` | -5 | The specified path doesn't match the creep's location. |
| `ERR_INVALID_ARGS` | -10 | `path` is not a valid path array. |
| `ERR_TIRED` | -11 | The fatigue indicator of the creep is non-zero. |

#### `moveTo(x, y, [opts]) / moveTo(target, [opts])`

_CPU cost: high._

```javascript
creep.moveTo(10, 20);
```

```javascript
creep.moveTo(Game.flags.Flag1);
```

```javascript
creep.moveTo(new RoomPosition(25, 20, 'W10N5'));
```

```javascript
creep.moveTo(pos, {reusePath: 50});
```

```javascript
// Execute moves by cached paths at first
for(const name in Game.creeps) {
    Game.creeps[name].moveTo(target, {noPathFinding: true});
}

// Perform pathfinding only if we have enough CPU
if(Game.cpu.tickLimit - Game.cpu.getUsed() > 20) {
    for(const name in Game.creeps) {
        Game.creeps[name].moveTo(target);
    }
}
```

Find the optimal path to the target within the same room and move to it. A shorthand to consequent calls of <a href="#RoomPosition.findPathTo">pos.findPathTo()</a> and <a href="#Creep.move">move()</a> methods. If the target is in another room, then the corresponding exit will be used as a target. 

| parameter | type | description |
|---|---|---|
| `x` | number | X position of the target in the same room. |
| `y` | number | Y position of the target in the same room. |
| `target` | object | Can be a RoomPosition object or any object containing RoomPosition. The position doesn't have to be in the same room with the creep. |
| `opts` _(optional)_ | object | An object containing additional options: reusePath number This option enables reusing the path found along multiple game ticks. It allows to save CPU time, but can result in a slightly slower creep reaction behavior. The path is stored into the creep's memory to the `_move` property. The `reusePath` value defines the amount of ticks which the path should be reused for. The default value is 5. Increase the amount to save more CPU, decrease to make the movement more consistent. Set to 0 if you want to disable path reusing. serializeMemory boolean If `reusePath` is enabled and this option is set to true, the path will be stored in memory in the short serialized form using `Room.serializePath`. The default value is true. noPathFinding boolean If this option is set to true, `moveTo` method will return `ERR_NOT_FOUND` if there is no memorized path to reuse. This can significantly save CPU time in some cases. The default value is false. visualizePathStyle object Draw a line along the creep’s path using `RoomVisual.poly`. You can provide either an empty object or custom style parameters. The default style is equivalent to: `{ fill: 'transparent', stroke: '#fff', lineStyle: 'dashed', strokeWidth: .15, opacity: .1 }` Any options supported by `Room.findPath` method. |

**Return value**

One of the following codes:

| code | value | description |
|---|---|---|
| `OK` | 0 | The operation has been scheduled successfully. |
| `ERR_NOT_OWNER` | -1 | You are not the owner of this creep. |
| `ERR_BUSY` | -4 | The power creep is not spawned in the world. |
| `ERR_TIRED` | -11 | The fatigue indicator of the creep is non-zero. |
| `ERR_INVALID_TARGET` | -7 | The target provided is invalid. |
| `ERR_NO_PATH` | -2 | No path to the target could be found. |
| `ERR_NOT_FOUND` | -5 | The creep has no memorized path to reuse. |

#### `notifyWhenAttacked(enabled)`

_Action: changes game state; +0.2 CPU added to its natural cost when it returns OK._

```javascript
Game.powerCreeps['PC1'].notifyWhenAttacked(true);
```

Toggle auto notification when the creep is under attack. The notification will be sent to your account email. Turned on by default.

| parameter | type | description |
|---|---|---|
| `enabled` | boolean | Whether to enable notification or disable. |

**Return value**

One of the following codes:

| code | value | description |
|---|---|---|
| `OK` | 0 | The operation has been scheduled successfully. |
| `ERR_NOT_OWNER` | -1 | You are not the owner of this creep. |
| `ERR_BUSY` | -4 | The power creep is not spawned in the world. |
| `ERR_INVALID_ARGS` | -10 | `enable` argument is not a boolean value. |

#### `pickup(target)`

_Action: changes game state; +0.2 CPU added to its natural cost when it returns OK._

```javascript
const target = creep.pos.findClosestByRange(FIND_DROPPED_RESOURCES);
if(target) {
    if(creep.pickup(target) == ERR_NOT_IN_RANGE) {
        creep.moveTo(target);
    }
}

```

Pick up an item (a dropped piece of energy). The target has to be at adjacent square to the creep or at the same square.

| parameter | type | description |
|---|---|---|
| `target` | Resource | The target object to be picked up. |

**Return value**

One of the following codes:

| code | value | description |
|---|---|---|
| `OK` | 0 | The operation has been scheduled successfully. |
| `ERR_NOT_OWNER` | -1 | You are not the owner of this creep. |
| `ERR_BUSY` | -4 | The power creep is not spawned in the world. |
| `ERR_INVALID_TARGET` | -7 | The target is not a valid object to pick up. |
| `ERR_FULL` | -8 | The creep cannot receive any more resource. |
| `ERR_NOT_IN_RANGE` | -9 | The target is too far away. |

#### `rename(name)`

_CPU cost: insignificant._

```javascript
Game.powerCreeps['PC1'].rename('PC1X');
```

Rename the power creep. It must not be spawned in the world.

| parameter | type | description |
|---|---|---|
| `name` | string | The new name of the power creep. |

**Return value**

One of the following codes:

| code | value | description |
|---|---|---|
| `OK` | 0 | The operation has been scheduled successfully. |
| `ERR_NOT_OWNER` | -1 | You are not the owner of the creep. |
| `ERR_BUSY` | -4 | The power creep is spawned in the world. |
| `ERR_NAME_EXISTS` | -3 | A power creep with the specified name already exists. |

#### `renew(target)`

_Action: changes game state; +0.2 CPU added to its natural cost when it returns OK._

```javascript
let powerBank = Game.getObjectById('XXX');
Game.powerCreeps['PowerCreep1'].renew(powerBank);

```

Instantly restore time to live to the maximum using a Power Spawn or a Power Bank nearby. It has to be at adjacent tile. 

| parameter | type | description |
|---|---|---|
| `target` | StructurePowerBank \| StructurePowerSpawn | The target structure. |

**Return value**

One of the following codes:

| code | value | description |
|---|---|---|
| `OK` | 0 | The operation has been scheduled successfully. |
| `ERR_NOT_OWNER` | -1 | You are not the owner of this creep. |
| `ERR_BUSY` | -4 | The power creep is not spawned in the world. |
| `ERR_INVALID_TARGET` | -7 | The target is not a valid power bank object. |
| `ERR_NOT_IN_RANGE` | -9 | The target is too far away. |

#### `say(message, [public])`

_CPU cost: insignificant._

```javascript
const hostiles = creep.pos.findInRange(FIND_HOSTILE_CREEPS, 10);
if(hostiles.length > 0) {
    creep.say('OMG!😨');
    creep.moveTo(Game.spawns['Spawn1']);
}
else {
    doWork(creep);
}
```

Display a visual speech balloon above the creep with the specified message. The message will be available for one tick. You can read the last message using the <code>saying</code> property. Any valid Unicode characters are allowed, including <a href="http://unicode.org/emoji/charts/emoji-style.txt" target="_blank">emoji</a>.

| parameter | type | description |
|---|---|---|
| `message` | string | The message to be displayed. Maximum length is 10 characters. |
| `public` _(optional)_ | boolean | Set to true to allow other players to see this message. Default is false. |

**Return value**

One of the following codes:

| code | value | description |
|---|---|---|
| `OK` | 0 | The operation has been scheduled successfully. |
| `ERR_NOT_OWNER` | -1 | You are not the owner of this creep. |
| `ERR_BUSY` | -4 | The power creep is not spawned in the world. |

#### `spawn(powerSpawn)`

_Action: changes game state; +0.2 CPU added to its natural cost when it returns OK._

```javascript
Game.powerCreeps['PowerCreep1'].spawn(Game.getObjectById('XXX'));
```

Spawn this power creep in the specified Power Spawn.

| parameter | type | description |
|---|---|---|
| `powerSpawn` | StructurePowerSpawn | Your Power Spawn structure. |

**Return value**

One of the following codes:

| code | value | description |
|---|---|---|
| `OK` | 0 | The operation has been scheduled successfully. |
| `ERR_NOT_OWNER` | -1 | You are not the owner of the creep or the spawn. |
| `ERR_BUSY` | -4 | The power creep is already spawned in the world. |
| `ERR_RCL_NOT_ENOUGH` | -14 | Room Controller Level insufficient to use the spawn. |
| `ERR_INVALID_TARGET` | -7 | The specified object is not a Power Spawn. |
| `ERR_TIRED` | -11 | The power creep cannot be spawned because of the cooldown. |

#### `suicide()`

_Action: changes game state; +0.2 CPU added to its natural cost when it returns OK._

Kill the power creep immediately. It will not be destroyed permanently, but will become unspawned,
so that you can [`spawn`](#PowerCreep.spawn) it again.

**Return value**

One of the following codes:

| code | value | description |
|---|---|---|
| `OK` | 0 | The operation has been scheduled successfully. |
| `ERR_NOT_OWNER` | -1 | You are not the owner of this creep. |
| `ERR_BUSY` | -4 | The power creep is not spawned in the world. |

#### `transfer(target, resourceType, [amount])`

_Action: changes game state; +0.2 CPU added to its natural cost when it returns OK._

```javascript
if(creep.transfer(storage, RESOURCE_ENERGY) == ERR_NOT_IN_RANGE) {
	creep.moveTo(storage);
}
```

```javascript
// transfer all resources
for(const resourceType in creep.carry) {
	creep.transfer(storage, resourceType);
}
```

Transfer resource from the creep to another object. The target has to be at adjacent square to the creep.

| parameter | type | description |
|---|---|---|
| `target` | Creep, PowerCreep, Structure | The target object. |
| `resourceType` | string | One of the `RESOURCE_*` constants. |
| `amount` _(optional)_ | number | The amount of resources to be transferred. If omitted, all the available carried amount is used. |

**Return value**

One of the following codes:

| code | value | description |
|---|---|---|
| `OK` | 0 | The operation has been scheduled successfully. |
| `ERR_NOT_OWNER` | -1 | You are not the owner of this creep. |
| `ERR_BUSY` | -4 | The power creep is not spawned in the world. |
| `ERR_NOT_ENOUGH_RESOURCES` | -6 | The creep does not have the given amount of resources. |
| `ERR_INVALID_TARGET` | -7 | The target is not a valid object which can contain the specified resource. |
| `ERR_FULL` | -8 | The target cannot receive any more resources. |
| `ERR_NOT_IN_RANGE` | -9 | The target is too far away. |
| `ERR_INVALID_ARGS` | -10 | The resourceType is not one of the `RESOURCE_*` constants, or the amount is incorrect. |

#### `upgrade(power)`

_Action: changes game state; +0.2 CPU added to its natural cost when it returns OK._

```javascript
Game.powerCreeps['PowerCreep1'].upgrade(PWR_GENERATE_OPS);
```

Upgrade the creep, adding a new power ability to it or increasing level of the existing power. 
You need one free Power Level in your account to perform this action. 

| parameter | type | description |
|---|---|---|
| `power` | number | The power ability to upgrade, one of the `PWR_*` constants. |

**Return value**

One of the following codes:

| code | value | description |
|---|---|---|
| `OK` | 0 | The operation has been scheduled successfully. |
| `ERR_NOT_OWNER` | -1 | You are not the owner of the creep. |
| `ERR_NOT_ENOUGH_RESOURCES` | -6 | You account Power Level is not enough. |
| `ERR_FULL` | -8 | The specified power cannot be upgraded on this creep's level, or the creep reached the maximum level. |
| `ERR_INVALID_ARGS` | -10 | The specified power ID is not valid. |

#### `usePower(power, [target])`

_Action: changes game state; +0.2 CPU added to its natural cost when it returns OK._

```javascript
Game.powerCreeps['PowerCreep1'].usePower(PWR_GENERATE_OPS);
```

```javascript
Game.powerCreeps['PowerCreep1'].usePower(PWR_OPERATE_SPAWN, Game.spawns['Spawn1']);
```

Apply one the creep's powers on the specified target. 
You can only use powers in rooms either without a controller, or with a [power-enabled](#PowerCreep.enableRoom) controller.
Only one power can be used during the same tick, each `usePower` call will override the previous one.
If the target has the same effect of a lower or equal level, it is overridden. If the existing effect level is higher, an error is returned.

[Full list of available powers](/power.html#Powers)   

| parameter | type | description |
|---|---|---|
| `power` | number | The power ability to use, one of the `PWR_*` constants. |
| `target` _(optional)_ | RoomObject | A target object in the room. |

**Return value**

One of the following codes:

| code | value | description |
|---|---|---|
| `OK` | 0 | The operation has been scheduled successfully. |
| `ERR_NOT_OWNER` | -1 | You are not the owner of the creep. |
| `ERR_BUSY` | -4 | The creep is not spawned in the world. |
| `ERR_NO_BODYPART` | -12 | The creep doesn't have the specified power ability. |
| `ERR_TIRED` | -11 | The power ability is still on cooldown. |
| `ERR_NOT_ENOUGH_RESOURCES` | -6 | The creep doesn't have enough resources to use the power. |
| `ERR_INVALID_TARGET` | -7 | The specified target is not valid. |
| `ERR_NOT_IN_RANGE` | -9 | The specified target is too far away. |
| `ERR_INVALID_ARGS` | -10 | Using powers is not enabled on the Room Controller. |
| `ERR_FULL` | -8 | The target has the same active effect of a higher level. |

#### `withdraw(target, resourceType, [amount])`

_Action: changes game state; +0.2 CPU added to its natural cost when it returns OK._

```javascript
if(creep.withdraw(storage, RESOURCE_ENERGY) == ERR_NOT_IN_RANGE) {
	creep.moveTo(storage);
}
```

Withdraw resources from a structure or tombstone. The target has to be at adjacent square to the creep. Multiple creeps can withdraw from the same object in the same tick. Your creeps can withdraw resources from hostile structures/tombstones as well, in case if there is no hostile rampart on top of it.

This method should not be used to transfer resources between creeps. To transfer between creeps, use the [`transfer`](#Creep.transfer) method on the original creep.

| parameter | type | description |
|---|---|---|
| `target` | Structure, Tombstone, Ruin | The target object. |
| `resourceType` | string | One of the `RESOURCE_*` constants. |
| `amount` _(optional)_ | number | The amount of resources to be transferred. If omitted, all the available amount is used. |

**Return value**

One of the following codes:

| code | value | description |
|---|---|---|
| `OK` | 0 | The operation has been scheduled successfully. |
| `ERR_NOT_OWNER` | -1 | You are not the owner of this creep, or there is a hostile rampart on top of the target. |
| `ERR_BUSY` | -4 | The power creep is not spawned in the world. |
| `ERR_NOT_ENOUGH_RESOURCES` | -6 | The target does not have the given amount of resources. |
| `ERR_INVALID_TARGET` | -7 | The target is not a valid object which can contain the specified resource. |
| `ERR_FULL` | -8 | The creep's carry is full. |
| `ERR_NOT_IN_RANGE` | -9 | The target is too far away. |
| `ERR_INVALID_ARGS` | -10 | The resourceType is not one of the `RESOURCE_*` constants, or the amount is incorrect. |

---

### Resource

A dropped piece of resource. It will decay after a while if not picked up. 
Dropped resource pile decays for `ceil(amount/1000)` units per tick. 

#### `effects` : array  _(inherited from RoomObject)_

Applied effects, an array of objects with the following properties:

| parameter | type | description |
|---|---|---|
| `effect` | number | Effect ID of the applied effect. Can be either natural effect ID or Power ID. |
| `level` _(optional)_ | number | Power level of the applied effect. Absent if the effect is not a Power effect. |
| `ticksRemaining` | number | How many ticks will the effect last. |

#### `pos` : RoomPosition  _(inherited from RoomObject)_

An object representing the position of this object in the room.

#### `room` : Room  _(inherited from RoomObject)_

The link to the Room object. May be undefined in case if an object is a flag or a construction site and is placed in a room that is not visible to you.

#### `amount` : number

The amount of resource units containing.

#### `id` : string

A unique object identificator. You can use <a href="#Game.getObjectById"><code>Game.getObjectById</code></a> method to retrieve an object instance by its <code>id</code>.

#### `resourceType` : string

One of the <code>RESOURCE_*</code> constants.

---

### Room

An object representing the room in which your units and structures are in.
It can be used to look around, find paths, etc. Every `RoomObject` in the room contains
its linked `Room` instance in the `room` property.

#### `controller` : StructureController

The Controller structure of this room, if present, otherwise undefined.

#### `energyAvailable` : number

Total amount of energy available in all spawns and extensions in the room.

#### `energyCapacityAvailable` : number

Total amount of <code>energyCapacity</code> of all spawns and extensions in the room.

#### `memory` : any

```javascript
room.memory.stage = 2;
```

A shorthand to <code>Memory.rooms[room.name]</code>. You can use it for quick access the room’s specific memory data object. <a href="/global-objects.html#Memory-object">Learn more about memory</a>

#### `name` : string

The name of the room.

#### `storage` : StructureStorage

The Storage structure of this room, if present, otherwise undefined.

#### `terminal` : StructureTerminal

The Terminal structure of this room, if present, otherwise undefined.

#### `visual` : RoomVisual

A <a href="#RoomVisual">RoomVisual</a> object for this room. You can use this object to draw simple shapes (lines, circles, text labels) in the room.

#### `Room.serializePath(path)`

_CPU cost: low._

```javascript
const path = spawn.pos.findPathTo(source);
Memory.path = Room.serializePath(path);
creep.moveByPath(Memory.path);
```

Serialize a path array into a short string representation, which is suitable to store in memory.

| parameter | type | description |
|---|---|---|
| `path` | array | A path array retrieved from `Room.findPath`. |

**Return value**

A serialized string form of the given path.

#### `Room.deserializePath(path)`

_CPU cost: low._

```javascript
const path = Room.deserializePath(Memory.path);
creep.moveByPath(path);
```

Deserialize a short string path representation into an array form.

| parameter | type | description |
|---|---|---|
| `path` | string | A serialized path string. |

**Return value**

A path array.

#### `createConstructionSite(x, y, structureType, [name]) / createConstructionSite(pos, structureType, [name])`

_Action: changes game state; +0.2 CPU added to its natural cost when it returns OK._

```javascript
Game.rooms.sim.createConstructionSite(10, 15, STRUCTURE_ROAD);
```

```javascript
Game.rooms.sim.createConstructionSite(10, 15, STRUCTURE_SPAWN, 
    'MySpawn2');
```

Create new <a href="#ConstructionSite">ConstructionSite</a> at the specified location.

| parameter | type | description |
|---|---|---|
| `x` | number | The X position. |
| `y` | number | The Y position. |
| `pos` | object | Can be a RoomPosition object or any object containing RoomPosition. |
| `structureType` | string | One of the `STRUCTURE_*` constants. |
| `name` _(optional)_ | string | The name of the structure, for structures that support it (currently only spawns). The name length limit is 100 characters. |

**Return value**

One of the following codes:

| code | value | description |
|---|---|---|
| `OK` | 0 | The operation has been scheduled successfully. |
| `ERR_INVALID_TARGET` | -7 | The structure cannot be placed at the specified location. |
| `ERR_FULL` | -8 | You have too many construction sites. The maximum number of construction sites per player is 100. |
| `ERR_INVALID_ARGS` | -10 | The location is incorrect. |
| `ERR_NOT_OWNER` | -1 | The room is claimed or reserved by a hostile player. |
| `ERR_RCL_NOT_ENOUGH` | -14 | Room Controller Level insufficient. Learn more |

#### `createFlag(x, y, [name], [color], [secondaryColor]) / createFlag(pos, [name], [color], [secondaryColor])`

_Action: changes game state; +0.2 CPU added to its natural cost when it returns OK._

```javascript
Game.rooms.sim.createFlag(5, 12, 'Flag1');
```

Create new <a href="#Flag">Flag</a> at the specified location.

| parameter | type | description |
|---|---|---|
| `x` | number | The X position. |
| `y` | number | The Y position. |
| `pos` | object | Can be a RoomPosition object or any object containing RoomPosition. |
| `name` _(optional)_ | string | The name of a new flag. It should be unique, i.e. the `Game.flags` object should not contain another flag with the same name (hash key). If not defined, a random name will be generated. The maximum length is 100 characters. |
| `color` _(optional)_ | number | The color of a new flag. Should be one of the `COLOR_*` constants. The default value is `COLOR_WHITE`. |
| `secondaryColor` _(optional)_ | string | The secondary color of a new flag. Should be one of the `COLOR_*` constants. The default value is equal to `color`. |

**Return value**

The name of a new flag, or one of the following error codes:

| code | value | description |
|---|---|---|
| `ERR_NAME_EXISTS` | -3 | There is a flag with the same name already. |
| `ERR_INVALID_ARGS` | -10 | The location or the name or the color constant is incorrect. |
| `ERR_FULL` | -8 | You have too many flags. The maximum number of flags per player is 10000. |

#### `find(type, [opts])`

_CPU cost: medium._

```javascript
const targets = creep.room.find(FIND_DROPPED_RESOURCES);
if(targets.length) {
    creep.moveTo(targets[0]);
    creep.pickup(targets[0]);
}
```

```javascript
const extensions = Game.spawns['Spawn1'].room.find(FIND_MY_STRUCTURES, {
    filter: { structureType: STRUCTURE_EXTENSION }
});
console.log('Spawn has '+extensions.length+' extensions available');
```

```javascript
const targets = creep.room.find(FIND_HOSTILE_CREEPS, {
    filter: function(object) {
        return object.getActiveBodyparts(ATTACK) == 0;
    }
});
```

Find all objects of the specified type in the room. Results are cached automatically for the specified room and type before applying any custom filters. This automatic cache lasts until the end of the tick.

| parameter | type | description |
|---|---|---|
| `type` | number | One of the `FIND_*` constants. |
| `opts` _(optional)_ | object | An object with additional options: filter object, function, string The result list will be filtered using the Lodash.filter method. |

**Return value**

An array with the objects found.

constant|type|description
---|---|---
`FIND_EXIT_TOP` | RoomPosition | Only exit positions located at the top of the room.
`FIND_EXIT_RIGHT` | RoomPosition | Only exit positions located on the right side of the room.
`FIND_EXIT_BOTTOM` | RoomPosition | Only exit positions located at the bottom of the room.
`FIND_EXIT_LEFT` | RoomPosition | Only exit positions located on the left side of the room.
`FIND_EXIT` | RoomPosition | All exit positions.
`FIND_CREEPS` | Creep | All creeps.
`FIND_MY_CREEPS` | Creep | Only creeps owned by you.
`FIND_HOSTILE_CREEPS` | Creep | Only creeps not owned by you.
`FIND_POWER_CREEPS` | PowerCreep | All power creeps.
`FIND_MY_POWER_CREEPS` | PowerCreep | Only power creeps owned by you.
`FIND_HOSTILE_POWER_CREEPS` | PowerCreep | Only power creeps not owned by you.
`FIND_SOURCES_ACTIVE` | Source | Only sources that have energy.
`FIND_SOURCES` | Source | All sources.
`FIND_DROPPED_RESOURCES` | Resource | All dropped resources.
`FIND_STRUCTURES` | Structure | All structures.
`FIND_MY_STRUCTURES` | Structure | Only structures owned by you. Does not include neutral structures.
`FIND_HOSTILE_STRUCTURES` | Structure | Only structures not owned by you. Does not include neutral structures.
`FIND_FLAGS` | Flag | All flags
`FIND_MY_SPAWNS` | StructureSpawn | Only spawns owned by you.
`FIND_HOSTILE_SPAWNS` | StructureSpawn | Spawns not owned by you.
`FIND_CONSTRUCTION_SITES` | ConstructionSite | All construction sites.
`FIND_MY_CONSTRUCTION_SITES` | ConstructionSite | Only construction sites owned by you.
`FIND_HOSTILE_CONSTRUCTION_SITES` | ConstructionSite | Only construction sites not owned by you.
`FIND_MINERALS` | Mineral | All mineral deposits.
`FIND_NUKES` | Nuke | All launched nukes.
`FIND_TOMBSTONES` | Tombstone | All tombstones.
`FIND_RUINS` | Ruin | All ruins

#### `findExitTo(room)`

_CPU cost: high._

```javascript
const exitDir = creep.room.findExitTo(anotherCreep.room);
const exit = creep.pos.findClosestByRange(exitDir);
creep.moveTo(exit);

// or simply:
creep.moveTo(anotherCreep);
creep.moveTo(new RoomPosition(25,25, anotherCreep.pos.roomName));
```

Find the exit direction en route to another room. Please note that this method is not required for inter-room movement, you can simply pass the target in another room into <a href="#Creep.moveTo"><code>Creep.moveTo</code></a> method.

| parameter | type | description |
|---|---|---|
| `room` | string, Room | Another room name or room object. |

**Return value**

The room direction constant, one of the following:

* `FIND_EXIT_TOP`
* `FIND_EXIT_RIGHT`
* `FIND_EXIT_BOTTOM`
* `FIND_EXIT_LEFT`

Or one of the following error codes:

| code | value | description |
|---|---|---|
| `ERR_NO_PATH` | -2 | Path can not be found. |
| `ERR_INVALID_ARGS` | -10 | The location is incorrect. |

#### `findPath(fromPos, toPos, [opts])`

_CPU cost: high._

```javascript
const path = creep.room.findPath(creep.pos, targetPos);
creep.move(path[0].direction);
```

```javascript
PathFinder.use(true);
const path = creep.room.findPath(creep.pos, targetPos, {
    costCallback: function(roomName, costMatrix) {
	    if(roomName == 'W1N5') {
		    // set anotherCreep's location as walkable
			costMatrix.set(anotherCreep.pos.x, anotherCreep.pos.y, 0);
			// set flag location as an obstacle
			costMatrix.set(flag.pos.x, flag.pos.y, 255);
			// increase cost for (25,20) location to 50
			costMatrix.set(25, 20, 50);
		}
	}
});

```

```javascript
let path = creep.room.findPath(creep.pos, targetPos, {maxOps: 200});
if( !path.length || !targetPos.isEqualTo(path[path.length - 1]) ) {
    path = creep.room.findPath(creep.pos, targetPos, {
		maxOps: 1000, ignoreDestructibleStructures: true
	});
}
if( path.length ) {
    creep.move(path[0].direction);
}
```

Find an optimal path inside the room between fromPos and toPos using <a href="http://en.wikipedia.org/wiki/Jump_point_search" target="_blank">Jump Point Search algorithm</a>.

| parameter | type | description |
|---|---|---|
| `fromPos` | RoomPosition | The start position. |
| `toPos` | RoomPosition | The end position. |
| `opts` _(optional)_ | object | An object containing additonal pathfinding flags: ignoreCreeps boolean Treat squares with creeps as walkable. Can be useful with too many moving creeps around or in some other cases. The default value is false. ignoreDestructibleStructures boolean Treat squares with destructible structures (constructed walls, ramparts, spawns, extensions) as walkable. The default value is false. ignoreRoads boolean Ignore road structures. Enabling this option can speed up the search. The default value is false. This is only used when the new `PathFinder` is enabled. costCallback function(string, CostMatrix) You can use this callback to modify a `CostMatrix` for any room during the search. The callback accepts two arguments, `roomName` and `costMatrix`. Use the `costMatrix` instance to make changes to the positions costs. If you return a new matrix from this callback, it will be used instead of the built-in cached one. This option is only used when the new `PathFinder` is enabled. ignore array An array of the room's objects or RoomPosition objects which should be treated as walkable tiles during the search. This option cannot be used when the new `PathFinder` is enabled (use `costCallback` option instead). avoid array An array of the room's objects or RoomPosition objects which should be treated as obstacles during the search. This option cannot be used when the new `PathFinder` is enabled (use `costCallback` option instead). maxOps number The maximum limit of possible pathfinding operations. You can limit CPU time used for the search based on ratio 1 op ~ 0.001 CPU. The default value is 2000. heuristicWeight number Weight to apply to the heuristic in the A* formula `F = G + weight * H`. Use this option only if you understand the underlying A* algorithm mechanics! The default value is 1.2. serialize boolean If true, the result path will be serialized using `Room.serializePath`. The default is false. maxRooms number The maximum allowed rooms to search. The default (and maximum) is 16. This is only used when the new `PathFinder` is enabled. range number Find a path to a position in specified linear range of target. The default is 0. plainCost number Cost for walking on plain positions. The default is 1. swampCost number Cost for walking on swamp positions. The default is 5. |

**Return value**

An array with path steps in the following format:

```javascript-content
[
    { x: 10, y: 5, dx: 1,  dy: 0, direction: RIGHT },
    { x: 10, y: 6, dx: 0,  dy: 1, direction: BOTTOM },
    { x: 9,  y: 7, dx: -1, dy: 1, direction: BOTTOM_LEFT },
    ...
]
```

#### `getEventLog([raw])`

_CPU cost: low._

```javascript
// track events performed by a particular creep
_.filter(creep.room.getEventLog(), {objectId: creep.id});
```

```javascript
// Find all hostile actions against your creeps and structures
_.forEach(Game.rooms, room => {
    let eventLog = room.getEventLog();
    let attackEvents = _.filter(eventLog, {event: EVENT_ATTACK});
    attackEvents.forEach(event => {
        let target = Game.getObjectById(event.data.targetId);
        if(target && target.my) {
            console.log(event);
        }
    });
});
```

Returns an array of events happened on the previous tick in this room.  

| parameter | type | description |
|---|---|---|
| `raw` _(optional)_ | boolean | If this parameter is false or undefined, the method returns an object parsed using `JSON.parse` which incurs some CPU cost on the first access (the return value is cached on subsequent calls). If `raw` is truthy, then raw JSON in string format is returned. |

**Return value**

An array of events. Each event represents some game action in the following format:
 
```javascript-content
{
    event: EVENT_ATTACK,
    objectId: '54bff72ab32a10f73a57d017',
    data: { /* ... */ }
}
```

The `data` property is different for each event type according to the following table:
<table>
    <tr>
        <th>event</th><th>description</th>
    </tr>
    <tr>
        <td>`EVENT_ATTACK`</td>
        <td>
            A creep or a structure performed an attack to another object.
            <ul>
                <li>`targetId` - the target object ID</li>
                <li>`damage` - the amount of hits damaged</li>
                <li>`attackType` - one of the following constants:
                    <ul>
                        <li>`EVENT_ATTACK_TYPE_MELEE` - a creep attacked with [attack](#Creep.attack)</li>
                        <li>`EVENT_ATTACK_TYPE_RANGED` - a creep attacked with [rangedAttack](#Creep.rangedAttack), or a tower attacked with [attack](#StructureTower.attack)</li> 
                        <li>`EVENT_ATTACK_TYPE_RANGED_MASS` - a creep attacked with [rangedMassAttack](#Creep.rangedMassAttack)</li>
                        <li>`EVENT_ATTACK_TYPE_DISMANTLE` - a creep attacked with [dismantle](#Creep.dismantle)</li>
                        <li>`EVENT_ATTACK_TYPE_HIT_BACK` - a creep hit back on another creep's [attack](#Creep.attack)</li>
                        <li>`EVENT_ATTACK_TYPE_NUKE` - a nuke landed</li>
                    </ul>
                </li>
            </ul>
        </td>
    </tr>
    <tr>
        <td>`EVENT_OBJECT_DESTROYED`</td>
        <td>
            A game object is destroyed or killed.
            <ul><li>`type` - the type of the destroyed object</li></ul>
        </td>
    </tr>
    <tr>
        <td>`EVENT_ATTACK_CONTROLLER`</td>
        <td>A creep performed [`attackController`](#Creep.attackController) in the room.</td>
    </tr>
    <tr>
        <td>`EVENT_BUILD`</td>
        <td>
            A creep performed [`build`](#Creep.build) in the room.
            <ul>
                <li>`targetId` - the target object ID</li>
                <li>`amount` - the amount of build progress gained</li>
                <li>`structureType` - one of the STRUCTURE_* constants</li>
                <li>`x` - the X position of the target construction site</li>
                <li>`y` - the Y position of the target construction site</li>
                <li>`incomplete` - status of build progress</li>
	        </ul>
        </td>
    </tr>
    <tr>
        <td>`EVENT_HARVEST`</td>
        <td>
            A creep performed [`harvest`](#Creep.harvest) in the room.
            <ul>
                <li>`targetId` - the target object ID</li>
                <li>`amount` - the amount of resource harvested</li>
            </ul>
        </td>
    </tr>
    <tr>
        <td>`EVENT_HEAL`</td>
        <td>
            A creep or a tower healed a creep.
            <ul>
                <li>`targetId` - the target object ID</li>
                <li>`amount` - the amount of hits healed</li>
                <li>`healType` - one of the following constants:
                    <ul>
                        <li>`EVENT_HEAL_TYPE_MELEE` - a creep healed with [heal](#Creep.heal)</li>
                        <li>`EVENT_HEAL_TYPE_RANGED` - a creep healed with [rangedHeal](#Creep.rangedHeal), or a tower healed with [heal](#StructureTower.heal)</li>
                    </ul>
                </li>
            </ul>
        </td>
    </tr>
    <tr>
        <td>`EVENT_REPAIR`</td>
        <td>
            A creep or a tower repaired a structure.
            <ul>
                <li>`targetId` - the target object ID</li>
                <li>`amount` - the amount of hits repaired</li> 
                <li>`energySpent` - the energy amount spent on the operation</li>
            </ul>
        </td>
    </tr>        
    <tr>
        <td>`EVENT_RESERVE_CONTROLLER`</td>
        <td>
            A creep performed [`reserveController`](#Creep.reserveController) in the room.
            <ul>
                <li>`amount` - the amount of reservation time gained</li>
            </ul>
        </td>
    </tr> 
    <tr>
        <td>`EVENT_UPGRADE_CONTROLLER`</td>
        <td>
            A creep performed [`upgradeController`](#Creep.upgradeController) in the room.
            <ul>
                <li>`amount` - the amount of control points gained</li> 
                <li>`energySpent` - the energy amount spent on the operation</li>
            </ul>
        </td>
    </tr>    
    <tr>
        <td>`EVENT_EXIT`</td>
        <td>
            A creep moved to another room.
            <ul>
                <li>`room` - the name of the target room</li> 
                <li>`x`, `y` - the coordinates in another room where the creep has appeared</li>
            </ul>
        </td>
    </tr>           
    <tr>
        <td>`EVENT_TRANSFER`</td>
        <td>
            A link performed [`transferEnergy`](https://docs.screeps.com/api/#StructureLink.transferEnergy) or a creep performed [`transfer`](#Creep.transfer) or [`withdraw`](#Creep.withdraw).
            <ul>
                <li>`targetId` - the target object ID</li>
                <li>`resourceType` - the type of resource transferred</li>
                <li>`amount` - the amount of resource transferred</li>
            </ul>
        </td>
    </tr>
    <tr>
        <td>`EVENT_POWER`</td>
        <td>
            Apply one the creep's powers on the specified target.
            <ul>
                <li>`targetId` - the target object ID</li>
                <li>`power` - the power ability to use, one of the PWR_* constants</li>
            </ul>
        </td>
    </tr>
</table>

#### `getPositionAt(x, y)`

_CPU cost: low._

```javascript
const pos = Game.rooms.sim.getPositionAt(5,12);
const source = pos.findClosestByRange(FIND_SOURCES_ACTIVE);
```

Creates a <a href="#RoomPosition">RoomPosition</a> object at the specified location.

| parameter | type | description |
|---|---|---|
| `x` | number | The X position. |
| `y` | number | The Y position. |

**Return value**

A
<a href="#RoomPosition">RoomPosition</a>
object or null if it cannot be obtained.

#### `getTerrain()`

_CPU cost: insignificant._

```javascript
const terrain = Game.rooms['W1N1'].getTerrain();
switch(terrain.get(10,15)) {
    case TERRAIN_MASK_WALL:
        break;
    case TERRAIN_MASK_SWAMP:
        break;
    case 0:
        break;
}
```

Get a <a href="#Room-Terrain">`Room.Terrain`</a> object which provides fast access to static terrain data. This method works for any room in the world even if you have no access to it.

**Return value**

Returns new <a href="#Room-Terrain">`Room.Terrain`</a> object.

#### `lookAt(x, y) / lookAt(target)`

_CPU cost: medium._

```javascript
const look = creep.room.lookAt(target);
look.forEach(function(lookObject) {
    if(lookObject.type == LOOK_CREEPS &&
       lookObject[LOOK_CREEPS].getActiveBodyparts(ATTACK) == 0) {
        creep.moveTo(lookObject.creep);
    }
});
```

Get the list of objects at the specified room position.

| parameter | type | description |
|---|---|---|
| `x` | number | X position in the room. |
| `y` | number | Y position in the room. |
| `target` | object | Can be a RoomPosition object or any object containing RoomPosition. |

**Return value**

An array with objects at the specified position in the following format:

```javascript-content
[
    { type: 'creep', creep: {...} },
    { type: 'structure', structure: {...} },
    ...
    { type: 'terrain', terrain: 'swamp' }
]
```

#### `lookAtArea(top, left, bottom, right, [asArray])`

_CPU cost: medium._

```javascript
const look = creep.room.lookAtArea(10,5,11,7);
```

Get the list of objects at the specified room area.

| parameter | type | description |
|---|---|---|
| `top` | number | The top Y boundary of the area. |
| `left` | number | The left X boundary of the area. |
| `bottom` | number | The bottom Y boundary of the area. |
| `right` | number | The right X boundary of the area. |
| `asArray` _(optional)_ | boolean | Set to true if you want to get the result as a plain array. |

**Return value**

If `asArray` is set to false or undefined, the method returns
an object with all the objects in the specified area in the following format:

```javascript-content
// 10,5,11,7

{
    10: {
        5: [{ type: 'creep', creep: {...} },
            { type: 'terrain', terrain: 'swamp' }],
        6: [{ type: 'terrain', terrain: 'swamp' }],
        7: [{ type: 'terrain', terrain: 'swamp' }]
    },
    11: {
        5: [{ type: 'terrain', terrain: 'plain' }],
        6: [{ type: 'structure', structure: {...} },
            { type: 'terrain', terrain: 'swamp' }],
        7: [{ type: 'terrain', terrain: 'wall' }]
    }
}
```

If `asArray` is set to true, the method returns an array in the following format:

```javascript-content
[
    {x: 5, y: 10, type: 'creep', creep: {...}},
    {x: 5, y: 10, type: 'terrain', terrain: 'swamp'},
    {x: 6, y: 10, type: 'terrain', terrain: 'swamp'},
    {x: 7, y: 10, type: 'terrain', terrain: 'swamp'},
    {x: 5, y: 11, type: 'terrain', terrain: 'plain'},
    {x: 6, y: 11, type: 'structure', structure: {...}},
    {x: 6, y: 11, type: 'terrain', terrain: 'swamp'},
    {x: 7, y: 11, type: 'terrain', terrain: 'wall'}
]
```

#### `lookForAt(type, x, y) / lookForAt(type, target)`

_CPU cost: low._

```javascript
const found = creep.room.lookForAt(LOOK_CREEPS, target);
if(found.length && found[0].getActiveBodyparts(ATTACK) == 0) {
    creep.moveTo(found[0]);
}
```

Get an object with the given type at the specified room position.

| parameter | type | description |
|---|---|---|
| `type` | string | One of the `LOOK_*` constants. |
| `x` | number | X position in the room. |
| `y` | number | Y position in the room. |
| `target` | object | Can be a RoomPosition object or any object containing RoomPosition. |

**Return value**

An array of objects of the given type at the specified position if found.

#### `lookForAtArea(type, top, left, bottom, right, [asArray])`

_CPU cost: low._

```javascript
const look = creep.room.lookForAtArea(LOOK_STRUCTURES,10,5,11,7);
```

Get the list of objects with the given type at the specified room area.

| parameter | type | description |
|---|---|---|
| `type` | string | One of the `LOOK_*` constants. |
| `top` | number | The top Y boundary of the area. |
| `left` | number | The left X boundary of the area. |
| `bottom` | number | The bottom Y boundary of the area. |
| `right` | number | The right X boundary of the area. |
| `asArray` _(optional)_ | boolean | Set to true if you want to get the result as a plain array. |

**Return value**

If `asArray` is set to false or undefined, the method returns an object
with all the objects of the given type in the specified area in the following format:

```javascript-content
// 10,5,11,7

{
    10: {
        5: [{...}],
        6: undefined,
        7: undefined
    },
    11: {
        5: undefined,
        6: [{...}, {...}],
        7: undefined
    }
}
```

If `asArray` is set to true, the method returns an array in the following format:

```javascript-content
[
	{x: 5, y: 10, structure: {...}},
	{x: 6, y: 11, structure: {...}},
	{x: 6, y: 11, structure: {...}}
]
```

---

### Room.Terrain

An object which provides fast access to room terrain data. These objects can be constructed for any room in the world even if you have no access to it.

Technically every `Room.Terrain` object is a very lightweight adapter to underlying static terrain buffers with corresponding minimal accessors.

#### `constructor(roomName)`

_CPU cost: insignificant._

```javascript
const terrain = new Room.Terrain("E2S7");
```

```javascript
const terrain = new Room.Terrain(Game.creeps.John.room.name);
```

Creates a new `Terrain` of room by its name. `Terrain` objects can be constructed for any room in the world even if you have no access to it.

| parameter | type | description |
|---|---|---|
| `roomName` | string | The room name. |

#### `get(x, y)`

_CPU cost: insignificant._

```javascript
switch(terrain.get(10,15)) {
    case TERRAIN_MASK_WALL:
        break;
    case TERRAIN_MASK_SWAMP:
        break;
    case 0:
        break;
}
```

```javascript
const roomName = "E2S7";
const terrain = new Room.Terrain(roomName);
const matrix = new PathFinder.CostMatrix;
const visual = new RoomVisual(roomName);

// Fill CostMatrix with default terrain costs for future analysis:
for(let y = 0; y < 50; y++) {
    for(let x = 0; x < 50; x++) {
        const tile = terrain.get(x, y);
        const weight =
            tile === TERRAIN_MASK_WALL  ? 255 : // wall  => unwalkable
            tile === TERRAIN_MASK_SWAMP ?   5 : // swamp => weight:  5
                                            1 ; // plain => weight:  1
        matrix.set(x, y, weight);
        visual.text(weight, x, y);
    }
}
```

```javascript
// bound to WASM module heap
const heapView = new Uint8Array(wasmModule.HEAPU8.buffer, ...); 
const terrain = new Room.Terrain("E2S7");

// Copy terrain data to binary WASM module heap:
for(let y = 0; y < 50; y++) {
    for(let x = 0; x < 50; x++) {
        heapView[y * 50 + x] = terrain.get(x, y);
    }    
}
```

Get terrain type at the specified room position by `(x,y)` coordinates. Unlike the <a href="#Game.map.getTerrainAt">`Game.map.getTerrainAt(...)`</a> method, this one doesn't perform any string operations and returns integer terrain type values (see below).

| parameter | type | description |
|---|---|---|
| `x` | number | X position in the room. |
| `y` | number | Y position in the room. |

**Return value**

One of the following integer values:

| value | <a href="#Constants">constant</a> (*if exists*) | description |
|-|-|-|
| 0 | *doesn't exist* | terrain is `plain` |
| 1 | `TERRAIN_MASK_WALL` | terrain is `wall`|
| 2 | `TERRAIN_MASK_SWAMP` | terrain is `swamp`|

#### `getRawBuffer([destinationArray])`

_CPU cost: low._

```javascript
function myPrintRawTerain(raw) {
    const visual = new RoomVisual();
    for(let y = 0; y < 50; y++) {
        for(let x = 0; x < 50; x++) {
            const code = raw[y * 50 + x];
            const color =
                (code & TERRAIN_MASK_WALL ) ? "gray"  :
                (code & TERRAIN_MASK_SWAMP) ? "green" : "white" ;
            visual.circle(x, y, {fill: color, radius: 0.5});
        }
    }
}

const raw = (new Room.Terrain("E2S7")).getRawBuffer();
myPrintRawTerain(raw);
```

```javascript
// bound to WASM module heap
const heapView = new Uint8Array(wasmModule.HEAPU8.buffer, ...); 
const terrain = new Room.Terrain("E2S7");

// Fast direct copy terrain data to binary WASM module heap:
const t = Game.cpu.getUsed();
const result = terrain.getRawBuffer(heapView);
if(result !== ERR_INVALID_ARGS) {
    // Copy succeeded, call WASM functions here:
    // wasmModule.myFunc(...); // modifies raw memory of "heapView"
    console.log("Distance transform done in", Game.cpu.getUsed() - t);
    myPrintRawTerain(heapView);
}
```

```cpp
// Somewhere inside binary module source code...
void myFunc(void* ptr) {
    auto u8ptr = static_cast<uint8_t*>(ptr);
    // computations here...
}
```

Get copy of underlying static terrain buffer. **Current underlying representation is `Uint8Array`**.

| parameter | type | description |
|---|---|---|
| `destinationArray` _(optional)_ | Uint8Array | A typed array view in which terrain will be copied to. |

***WARNING:*** *this method relies on underlying representation of terrain data. This is the fastest way to obtain terrain data of the whole room (2500 tiles), but users should keep in mind that it can be marked as deprecated anytime in the future, or return value type can be changed due to underlying data representation changing.*

See usage examples. Learn more about <a href="/modules.html#Binary-modules">_binary modules_</a>.

**Return value**

Copy of underlying room terrain representations as a new `Uint8Array` [typed array](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/TypedArray) of size 2500.

Each element is an integer number, terrain type can be obtained by applying bitwise AND (`&`) operator with appropriate `TERRAIN_MASK_*` constant. Room tiles are stored **row by row**.

If `destinationArray` is specified, function returns reference to this filled `destinationArray` if coping succeeded, or error code otherwise:

| code | value | description |
|---|---|---|
| `ERR_INVALID_ARGS` | -10 | `destinationArray` type is incompatible. |

---

### RoomObject

Any object with a position in a room. Almost all game objects prototypes are derived from `RoomObject`.

#### `effects` : array

Applied effects, an array of objects with the following properties:

| parameter | type | description |
|---|---|---|
| `effect` | number | Effect ID of the applied effect. Can be either natural effect ID or Power ID. |
| `level` _(optional)_ | number | Power level of the applied effect. Absent if the effect is not a Power effect. |
| `ticksRemaining` | number | How many ticks will the effect last. |

#### `pos` : RoomPosition

 

An object representing the position of this object in the room.

#### `room` : Room

The link to the Room object. May be undefined in case if an object is a flag or a construction site and is placed in a room that is not visible to you.

---

### RoomPosition

An object representing the specified position in the room. Every `RoomObject` in the room
contains `RoomPosition` as the `pos` property. The position object of a custom location
can be obtained using the [`Room.getPositionAt`](#Room.getPositionAt) method or using the constructor.

#### `constructor(x, y, roomName)`

_CPU cost: insignificant._

```javascript
const pos = new RoomPosition(10, 25, 'sim');

```

You can create new <code>RoomPosition</code> object using its constructor.

| parameter | type | description |
|---|---|---|
| `x` | number | X position in the room. |
| `y` | number | Y position in the room. |
| `roomName` | string | The room name. |

#### `roomName` : string

The name of the room.

#### `x` : number

X position in the room.

#### `y` : number

Y position in the room.

#### `createConstructionSite(structureType, [name])`

_Action: changes game state; +0.2 CPU added to its natural cost when it returns OK._

```javascript
Game.flags['Flag1'].pos.createConstructionSite(STRUCTURE_ROAD);
```
```javascript
Game.flags['Flag1'].pos.createConstructionSite(STRUCTURE_SPAWN, 'MySpawn2');
```

Create new <a href="#ConstructionSite">ConstructionSite</a> at the specified location.

| parameter | type | description |
|---|---|---|
| `structureType` | string | One of the `STRUCTURE_*` constants. |
| `name` _(optional)_ | string | The name of the structure, for structures that support it (currently only spawns). |

**Return value**

One of the following codes:

| code | value | description |
|---|---|---|
| `OK` | 0 | The operation has been scheduled successfully. |
| `ERR_INVALID_TARGET` | -7 | The structure cannot be placed at the specified location. |
| `ERR_FULL` | -8 | You have too many construction sites. The maximum number of construction sites per player is 100. |
| `ERR_INVALID_ARGS` | -10 | The location is incorrect. |
| `ERR_RCL_NOT_ENOUGH` | -14 | Room Controller Level insufficient. Learn more |

#### `createFlag([name], [color], [secondaryColor])`

_Action: changes game state; +0.2 CPU added to its natural cost when it returns OK._

```javascript
creep.pos.createFlag('Flag1');
```

Create new <a href="#Flag">Flag</a> at the specified location.

| parameter | type | description |
|---|---|---|
| `name` _(optional)_ | string | The name of a new flag. It should be unique, i.e. the `Game.flags` object should not contain another flag with the same name (hash key). If not defined, a random name will be generated. |
| `color` _(optional)_ | string | The color of a new flag. Should be one of the `COLOR_*` constants. The default value is `COLOR_WHITE`. |
| `secondaryColor` _(optional)_ | string | The secondary color of a new flag. Should be one of the `COLOR_*` constants. The default value is equal to `color`. |

**Return value**

The name of a new flag, or one of the following error codes:
<br>

| code | value | description |
|---|---|---|
| `ERR_NAME_EXISTS` | -3 | There is a flag with the same name already. |
| `ERR_INVALID_ARGS` | -10 | The location or the color constant is incorrect. |

#### `findClosestByPath(type, [opts]) / findClosestByPath(objects, [opts])`

_CPU cost: high._

```javascript
const target = creep.pos.findClosestByPath(FIND_MY_SPAWNS);
creep.moveTo(target);
```

```javascript
const target = creep.pos.findClosestByPath(FIND_MY_SPAWNS, {maxOps: 500});
creep.moveTo(target);
```

```javascript
const target = creep.pos.findClosestByPath(FIND_HOSTILE_CREEPS, {
    filter: function(object) {
        return object.getActiveBodyparts(ATTACK) == 0;
    }
});
```

```javascript
const target = creep.pos.findClosestByPath(FIND_HOSTILE_CREEPS, {
    filter: { owner: { username: 'Invader' } }
});
```

```javascript
const targets = [
    Game.creeps.John,
    Game.creeps.Mike,
    room.getPositionAt(10,10)
];
const closest = creep.pos.findClosestByPath(targets);
```

Find an object with the shortest path from the given position. Uses <a href="http://en.wikipedia.org/wiki/Jump_point_search" target="_blank">Jump Point Search algorithm</a> and <a href="http://en.wikipedia.org/wiki/Dijkstra">Dijkstra's algorithm</a>.

| parameter | type | description |
|---|---|---|
| `type` | number | See Room.find. |
| `objects` | array | An array of room's objects or RoomPosition objects that the search should be executed against. |
| `opts` _(optional)_ | object | An object containing pathfinding options (see Room.findPath), or one of the following: filter object, function, string Only the objects which pass the filter using the Lodash.filter method will be used. algorithm string One of the following constants: `astar` is faster when there are relatively few possible targets; `dijkstra` is faster when there are a lot of possible targets or when the closest target is nearby. The default value is determined automatically using heuristics. |

**Return value**

The closest object if found, null otherwise.

#### `findClosestByRange(type, [opts]) / findClosestByRange(objects, [opts])`

_CPU cost: medium._

```javascript
const target = creep.pos.findClosestByRange(FIND_MY_SPAWNS);
creep.moveTo(target);
```

```javascript
const target = creep.pos.findClosestByRange(FIND_HOSTILE_CREEPS, {
    filter: function(object) {
        return object.getActiveBodyparts(ATTACK) == 0;
    }
});
```

```javascript
const target = creep.pos.findClosestByRange(FIND_HOSTILE_CREEPS, {
    filter: { owner: { username: 'Invader' } }
});
```

```javascript
const targets = [
    Game.creeps.John,
    Game.creeps.Mike,
    room.getPositionAt(10,10)
];
const closest = creep.pos.findClosestByRange(targets);
```

Find an object with the shortest linear distance from the given position.

| parameter | type | description |
|---|---|---|
| `type` | number | See Room.find. |
| `objects` | array | An array of room's objects or RoomPosition objects that the search should be executed against. |
| `opts` _(optional)_ | object | An object containing one of the following options: filter object, function, string Only the objects which pass the filter using the Lodash.filter method will be used. |

**Return value**

The closest object if found, null otherwise.

#### `findInRange(type, range, [opts]) / findInRange(objects, range, [opts])`

_CPU cost: medium._

```javascript
const targets = creep.pos.findInRange(FIND_HOSTILE_CREEPS, 3);
if(targets.length > 0) {
    creep.rangedAttack(targets[0]);
}
```

```javascript
const targets = [
    Game.creeps.John,
    Game.creeps.Mike,
    room.getPositionAt(10,10)
];
const inRangeTargets = creep.pos.findInRange(targets, 3);
```

Find all objects in the specified linear range.

| parameter | type | description |
|---|---|---|
| `type` | number | See Room.find. |
| `objects` | array | An array of room's objects or RoomPosition objects that the search should be executed against. |
| `range` | number | The range distance. |
| `opts` _(optional)_ | object | See Room.find. |

**Return value**

An array with the objects found.

#### `findPathTo(x, y, [opts]) / findPathTo(target, [opts])`

_CPU cost: high._

```javascript
const path = creep.pos.findPathTo(target);
creep.move(path[0].direction);
```

```javascript
let path = creep.pos.findPathTo(target, {maxOps: 200});
if( !path.length || !target.equalsTo(path[path.length - 1]) ) {
    path = creep.pos.findPathTo(target,
        {maxOps: 1000, ignoreDestructibleStructures: true});
}
if( path.length ) {
    creep.move(path[0].direction);
}
```

Find an optimal path to the specified position using <a href="http://en.wikipedia.org/wiki/Jump_point_search" target="_blank">Jump Point Search algorithm</a>. This method is a shorthand for <a href="#Room.findPath">Room.findPath</a>. If the target is in another room, then the corresponding exit will be used as a target.

| parameter | type | description |
|---|---|---|
| `x` | number | X position in the room. |
| `y` | number | Y position in the room. |
| `target` | object | Can be a RoomPosition object or any object containing RoomPosition. |
| `opts` _(optional)_ | object | An object containing pathfinding options flags (see Room.findPath for more details). |

**Return value**

An array with path steps in the following format:
```javascript-content
[
    { x: 10, y: 5, dx: 1,  dy: 0, direction: RIGHT },
    { x: 10, y: 6, dx: 0,  dy: 1, direction: BOTTOM },
    { x: 9,  y: 7, dx: -1, dy: 1, direction: BOTTOM_LEFT },
    ...
]    
```

#### `getDirectionTo(x,y) / getDirectionTo(target)`

_CPU cost: low._

```javascript
const direction = creep.pos.getDirectionTo(target);
creep.move(direction);
```

Get linear direction to the specified position.

| parameter | type | description |
|---|---|---|
| `x` | number | X position in the room. |
| `y` | number | Y position in the room. |
| `target` | object | Can be a RoomPosition object or any object containing RoomPosition. |

**Return value**

A number representing one of the direction constants.

#### `getRangeTo(x,y) / getRangeTo(target)`

_CPU cost: low._

```javascript
const range = creep.pos.getRangeTo(target);
if(range <= 3) {
    creep.rangedAttack(target);
}
```

Get linear range to the specified position.

| parameter | type | description |
|---|---|---|
| `x` | number | X position in the room. |
| `y` | number | Y position in the room. |
| `target` | object | Can be a RoomPosition object or any object containing RoomPosition. |

**Return value**

A number of squares to the given position.

#### `inRangeTo(x, y, range) / inRangeTo(target, range)`

_CPU cost: low._

```javascript
if(creep.pos.inRangeTo(target, 3)) {
    creep.rangedAttack(target);
}
```

Check whether this position is in the given range of another position.

| parameter | type | description |
|---|---|---|
| `x` | number | X position in the same room. |
| `y` | number | Y position in the same room. |
| `target` | RoomPosition | The target position. |
| `range` | number | The range distance. |

**Return value**

A boolean value.

#### `isEqualTo(x,y) / isEqualTo(target)`

_CPU cost: low._

```javascript
if(creep.pos.isEqualTo(10,25)) {
    creep.move(RIGHT);
}
```

```javascript
if(creep.pos.isEqualTo(Game.flags.Flag1)) {
    creep.move(RIGHT);
}
```

Check whether this position is the same as the specified position.

| parameter | type | description |
|---|---|---|
| `x` | number | X position in the room. |
| `y` | number | Y position in the room. |
| `target` | object | Can be a RoomPosition object or any object containing RoomPosition. |

**Return value**

A boolean value.

#### `isNearTo(x,y) / isNearTo(target)`

_CPU cost: low._

```javascript
if(creep.pos.isNearTo(target)) {
    creep.transfer(target, RESOURCE_ENERGY);
}
```

Check whether this position is on the adjacent square to the specified position. The same as <code>inRangeTo(target, 1)</code>.

| parameter | type | description |
|---|---|---|
| `x` | number | X position in the room. |
| `y` | number | Y position in the room. |
| `target` | object | Can be a RoomPosition object or any object containing RoomPosition. |

**Return value**

A boolean value.

#### `look()`

_CPU cost: medium._

```javascript
const look = Game.flags.Flag1.pos.look();
look.forEach(function(lookObject) {
    if(lookObject.type == LOOK_CREEPS &&
       lookObject[LOOK_CREEPS].getActiveBodyparts(ATTACK) == 0) {
        creep.moveTo(lookObject.creep);
    }
});
```

Get the list of objects at the specified room position.

**Return value**

An array with objects at the specified position in the following format:

```javascript-content
[
    { type: 'creep', creep: {...} },
    { type: 'structure', structure: {...} },
    ...
    { type: 'terrain', terrain: 'swamp' }
]
```

#### `lookFor(type)`

_CPU cost: low._

```javascript
const found = Game.flags.Flag1.pos.lookFor(LOOK_CREEPS);
if(found.length && found[0].getActiveBodyparts(ATTACK) == 0) {
    creep.moveTo(found[0]);
}
```

Get an object with the given type at the specified room position.

| parameter | type | description |
|---|---|---|
| `type` | string | One of the `LOOK_*` constants. |

**Return value**

An array of objects of the given type at the specified position if found.

---

### RoomVisual

<img align="right" src="img/visual.png">

Room visuals provide a way to show various visual debug info in game rooms. 
You can use the `RoomVisual` object to draw simple shapes that are visible only to you. 
Every existing `Room` object already contains the 
[`visual`](#Room.visual) property, 
but you also can create new `RoomVisual` objects for any room (even without visibility) 
using the [constructor](#RoomVisual.constructor).

Room visuals are not stored in the database, their only purpose is to display something in 
your browser. All drawings will persist for one tick and will disappear if not updated. All 
`RoomVisual` API calls have no added CPU cost (their cost is natural and mostly related to simple
 `JSON.serialize` calls). However, there is a usage limit: you cannot post more than 500 KB 
 of serialized data per one room (see [`getSize`](#RoomVisual.getSize) method).

All draw coordinates are measured in game coordinates and centered to tile centers, i.e. (10,10) 
will point to the center of the creep at `x:10; y:10` position. Fractional coordinates are allowed.

#### `constructor([roomName])`

_CPU cost: insignificant._

```javascript
Game.rooms['W10N10'].visual.circle(10,20).line(0,0,10,20);
// the same as:
new RoomVisual('W10N10').circle(10,20).line(0,0,10,20);
```

```javascript
// this text will be displayed in all rooms
new RoomVisual().text('Some text', 1, 1, {align: 'left'}); 
```

You can directly create new <code>RoomVisual</code> object in any room, even if it's invisible to your script.

| parameter | type | description |
|---|---|---|
| `roomName` _(optional)_ | string | The room name. If undefined, visuals will be posted to all rooms simultaneously. |

#### `roomName` : string

The name of the room.

#### `line(x1, y1, x2, y2, [style]) / line(pos1, pos2, [style])`

_CPU cost: insignificant._

```javascript
new RoomVisual('W1N1').line(10,15, 20,20);
```

```javascript
creep.room.visual.line(creep.pos, target.pos,
    {color: 'red', lineStyle: 'dashed'});
```

Draw a line.

| parameter | type | description |
|---|---|---|
| `x1` | number | The start X coordinate. |
| `y1` | number | The start Y coordinate. |
| `x2` | number | The finish X coordinate. |
| `y2` | number | The finish Y coordinate. |
| `pos1` | RoomPosition | The start position object. |
| `pos2` | RoomPosition | The finish position object. |
| `style` _(optional)_ | object | An object with the following properties: width number Line width, default is 0.1. color string Line color in any web format, default is `#ffffff` (white). opacity number Opacity value, default is 0.5. lineStyle string Either `undefined` (solid line), `dashed`, or `dotted`. Default is undefined. |

**Return value**

The
<code>RoomVisual</code>
object itself, so that you can chain calls.

#### `circle(x, y, [style]) / circle(pos, [style])`

_CPU cost: insignificant._

```javascript
new RoomVisual('W1N1').circle(10,15);
```

```javascript
creep.room.visual.circle(creep.pos,
    {fill: 'transparent', radius: 0.55, stroke: 'red'});
```

Draw a circle.

| parameter | type | description |
|---|---|---|
| `x` | number | The X coordinate of the center. |
| `y` | number | The Y coordinate of the center. |
| `pos` | RoomPosition | The position object of the center. |
| `style` _(optional)_ | object | An object with the following properties: radius number Circle radius, default is 0.15. fill string Fill color in any web format, default is `#ffffff` (white). opacity number Opacity value, default is 0.5. stroke string Stroke color in any web format, default is undefined (no stroke). strokeWidth number Stroke line width, default is 0.1. lineStyle string Either `undefined` (solid line), `dashed`, or `dotted`. Default is undefined. |

**Return value**

The
<code>RoomVisual</code>
object itself, so that you can chain calls.

#### `rect(x, y, width, height, [style]) / rect(topLeftPos, width, height, [style])`

_CPU cost: insignificant._

```javascript
// 9x9 area from (2,2) to (10,10)
new RoomVisual('W1N1').rect(1.5, 1.5, 9, 9); 
```

```javascript
// a rectangle border on creep
creep.room.visual.rect(creep.pos.x - 0.6, creep.pos.y - 0.6, 
    1.2, 1.2,
    {fill: 'transparent', stroke: '#f00'});
```

Draw a rectangle.

| parameter | type | description |
|---|---|---|
| `x` | number | The X coordinate of the top-left corner. |
| `y` | number | The Y coordinate of the top-left corner. |
| `topLeftPos` | RoomPosition | The position object of the top-left corner. |
| `width` | number | The width of the rectangle. |
| `height` | number | The height of the rectangle. |
| `style` _(optional)_ | object | An object with the following properties: fill string Fill color in any web format, default is `#ffffff` (white). opacity number Opacity value, default is 0.5. stroke string Stroke color in any web format, default is undefined (no stroke). strokeWidth number Stroke line width, default is 0.1. lineStyle string Either `undefined` (solid line), `dashed`, or `dotted`. Default is undefined. |

**Return value**

The
<code>RoomVisual</code>
object itself, so that you can chain calls.

#### `poly(points, [style])`

_CPU cost: insignificant._

```javascript
const points = [];
points.push(creep1.pos);
points.push([10,15]);
points.push(new RoomPosition(20,21,'W1N1'));
new RoomVisual('W1N1').poly(points, {fill: 'aqua'}); 
```

```javascript
// visualize the path
const path = Game.rooms['W1N1'].findPath(from, to);
new RoomVisual('W1N1').poly(path, {stroke: '#fff', strokeWidth: .15,
	opacity: .2, lineStyle: 'dashed'}); 
```

Draw a polyline.

| parameter | type | description |
|---|---|---|
| `points` | array | An array of points. Every item should be either an array with 2 numbers (i.e. `[10,15]`), or a `RoomPosition` object. |
| `style` _(optional)_ | object | An object with the following properties: fill string Fill color in any web format, default is `undefined` (no fill). opacity number Opacity value, default is 0.5. stroke string Stroke color in any web format, default is `#ffffff` (white). strokeWidth number Stroke line width, default is 0.1. lineStyle string Either `undefined` (solid line), `dashed`, or `dotted`. Default is undefined. |

**Return value**

The
<code>RoomVisual</code>
object itself, so that you can chain calls.

#### `text(text, x, y, [style]) / text(text, pos, [style])`

_CPU cost: insignificant._

```javascript
new RoomVisual('W1N1').text("Target💥", 10, 15, {color: 'green', font: 0.8}); 
```

Draw a text label. You can use any valid Unicode characters, including <a href="http://unicode.org/emoji/charts/emoji-style.txt" target="_blank">emoji</a>.

| parameter | type | description |
|---|---|---|
| `text` | string | The text message. |
| `x` | number | The X coordinate of the label baseline point. |
| `y` | number | The Y coordinate of the label baseline point. |
| `pos` | RoomPosition | The position object of the label baseline. |
| `style` _(optional)_ | object | An object with the following properties: color string Font color in any web format, default is `#ffffff` (white). font number, string Either a number or a string in one of the following forms: `0.7` - relative size in game coordinates `20px` - absolute size in pixels `0.7 serif` `bold italic 1.5 Times New Roman` stroke string Stroke color in any web format, default is undefined (no stroke). strokeWidth number Stroke width, default is 0.15. backgroundColor string Background color in any web format, default is undefined (no background). When background is enabled, text vertical align is set to middle (default is baseline). backgroundPadding number Background rectangle padding, default is 0.3. align string Text align, either `center`, `left`, or `right`. Default is `center`. opacity number Opacity value, default is 1.0. |

**Return value**

The
<code>RoomVisual</code>
object itself, so that you can chain calls.

#### `clear()`

_CPU cost: insignificant._

```javascript
new RoomVisual('W1N1').clear();
```

Remove all visuals from the room.

**Return value**

The
<code>RoomVisual</code>
object itself, so that you can chain calls.

#### `getSize()`

_CPU cost: insignificant._

```javascript
if(creep.room.visual.getSize() >= 512000) {
    // cannot add more visuals in this tick
}
```

Get the stored size of all visuals added in the room in the current tick. It must not exceed 512,000 (500 KB).

**Return value**

The size of the visuals in bytes.

#### `export()`

_CPU cost: insignificant._

```javascript
Memory.RoomVisualData['E2S7'] = Game.rooms.E2S7.visual.export();
```

Returns a compact representation of all visuals added in the room in the current tick.

**Return value**

A string with visuals data. There's not much you can do with the string besides store them for later.

#### `import(val)`

_CPU cost: insignificant._

```javascript
if(Memory.RoomVisualData['E2S7']) {
    Game.rooms.E2S7.visual.import(Memory.RoomVisualData['E2S7']);
}
```

Add previously exported (with <a href="#RoomVisual.export">RoomVisual.export</a>) room visuals to the room visual data of the current tick. 

| parameter | type | description |
|---|---|---|
| `val` | string | The string returned from RoomVisual.export. |

**Return value**

The <code>RoomVisual</code> object itself, so that you can chain calls.

---

### Ruin

<img src="img/ruin.png" alt="" align="right" />

A destroyed structure. This is a walkable object. 

<table class="table gameplay-info">
    <tbody>
    <tr>
        <td><strong>Decay</strong></td>
        <td>500 ticks except some special cases</td>
    </tr>
    </tbody>
</table>

#### `effects` : array  _(inherited from RoomObject)_

Applied effects, an array of objects with the following properties:

| parameter | type | description |
|---|---|---|
| `effect` | number | Effect ID of the applied effect. Can be either natural effect ID or Power ID. |
| `level` _(optional)_ | number | Power level of the applied effect. Absent if the effect is not a Power effect. |
| `ticksRemaining` | number | How many ticks will the effect last. |

#### `pos` : RoomPosition  _(inherited from RoomObject)_

An object representing the position of this object in the room.

#### `room` : Room  _(inherited from RoomObject)_

The link to the Room object. May be undefined in case if an object is a flag or a construction site and is placed in a room that is not visible to you.

#### `destroyTime` : number

The time when the structure has been destroyed. 

#### `id` : string

A unique object identificator. You can use <a href="#Game.getObjectById"><code>Game.getObjectById</code></a> method to retrieve an object instance by its <code>id</code>.

#### `store` : Store

A [`Store`](#Store) object that contains resources of this structure.

#### `structure` : Structure | OwnedStructure

An object containing basic data of the destroyed structure.

#### `ticksToDecay` : number

The amount of game ticks before this ruin decays.

---

### Source
 
An energy source object. Can be harvested by creeps with a `WORK` body part.

<table class="table gameplay-info">
    <tbody>
    <tr>
        <td><strong>Energy amount</strong></td>
        <td>4000 in center rooms<br />3000 in an owned or reserved room<br />1500 in an unreserved room</td>
    </tr>
    <tr>
        <td><strong>Energy regeneration</strong></td>
        <td>Every 300 game ticks</td>
    </tr>
    </tbody>
</table>

#### `effects` : array  _(inherited from RoomObject)_

Applied effects, an array of objects with the following properties:

| parameter | type | description |
|---|---|---|
| `effect` | number | Effect ID of the applied effect. Can be either natural effect ID or Power ID. |
| `level` _(optional)_ | number | Power level of the applied effect. Absent if the effect is not a Power effect. |
| `ticksRemaining` | number | How many ticks will the effect last. |

#### `pos` : RoomPosition  _(inherited from RoomObject)_

An object representing the position of this object in the room.

#### `room` : Room  _(inherited from RoomObject)_

The link to the Room object. May be undefined in case if an object is a flag or a construction site and is placed in a room that is not visible to you.

#### `energy` : number

The remaining amount of energy.

#### `energyCapacity` : number

The total amount of energy in the source.

#### `id` : string

A unique object identificator. You can use <a href="#Game.getObjectById"><code>Game.getObjectById</code></a> method to retrieve an object instance by its <code>id</code>.

#### `ticksToRegeneration` : number

The remaining time after which the source will be refilled.

---

### Store

An object that can contain resources in its cargo.

There are two types of stores in the game: general purpose stores and limited stores.

* General purpose stores can contain any resource within its capacity (e.g. creeps, containers, storages, terminals).

* Limited stores can contain only a few types of resources needed for that particular object (e.g. spawns, extensions, labs, nukers).

The `Store` prototype is the same for both types of stores, but they have different behavior depending on the `resource` argument in its methods.

You can get specific resources from the store by addressing them as object properties:

```javascript-content
console.log(creep.store[RESOURCE_ENERGY]);
```   

#### `getCapacity([resource])`

_CPU cost: insignificant._

```javascript
if(creep.store[RESOURCE_ENERGY] < creep.store.getCapacity()) {
    goHarvest(creep);
}
```

Returns capacity of this store for the specified resource. For a general purpose store, it returns total capacity if `resource` is undefined.

| parameter | type | description |
|---|---|---|
| `resource` _(optional)_ | string | The type of the resource. |

**Return value**

Returns capacity number, or `null` in case of an invalid `resource` for this store type.

#### `getFreeCapacity([resource])`

_CPU cost: insignificant._

```javascript
if(structure.store.getFreeCapacity(RESOURCE_ENERGY) > 0) {
    creep.transfer(structure, RESOURCE_ENERGY);
}
```
Returns free capacity for the store. For a limited store, it returns the capacity available for the specified resource if `resource` is defined and valid for this store. 

| parameter | type | description |
|---|---|---|
| `resource` _(optional)_ | string | The type of the resource. |

**Return value**

Returns available capacity number, or `null` in case of an invalid `resource` for this store type.

#### `getUsedCapacity([resource])`

_CPU cost: insignificant._

```javascript
if(Game.rooms['W1N1'].terminal.store.getUsedCapacity() == 0) {
    // terminal is empty
}
```

Returns the capacity used by the specified resource. For a general purpose store, it returns total used capacity if `resource` is undefined. 

| parameter | type | description |
|---|---|---|
| `resource` _(optional)_ | string | The type of the resource. |

**Return value**

Returns used capacity number, or `null` in case of a not valid `resource` for this store type.

---

### Structure

The base prototype object of all structures.

#### `effects` : array  _(inherited from RoomObject)_

Applied effects, an array of objects with the following properties:

| parameter | type | description |
|---|---|---|
| `effect` | number | Effect ID of the applied effect. Can be either natural effect ID or Power ID. |
| `level` _(optional)_ | number | Power level of the applied effect. Absent if the effect is not a Power effect. |
| `ticksRemaining` | number | How many ticks will the effect last. |

#### `pos` : RoomPosition  _(inherited from RoomObject)_

An object representing the position of this object in the room.

#### `room` : Room  _(inherited from RoomObject)_

The link to the Room object. May be undefined in case if an object is a flag or a construction site and is placed in a room that is not visible to you.

#### `hits` : number

The current amount of hit points of the structure.

#### `hitsMax` : number

The total amount of hit points of the structure.

#### `id` : string

A unique object identificator. You can use <a href="#Game.getObjectById"><code>Game.getObjectById</code></a> method to retrieve an object instance by its <code>id</code>.

#### `structureType` : string

One of the <code>STRUCTURE_*</code> constants.

#### `destroy()`

_Action: changes game state; +0.2 CPU added to its natural cost when it returns OK._

Destroy this structure immediately.

**Return value**

One of the following codes:

| code | value | description |
|---|---|---|
| `OK` | 0 | The operation has been scheduled successfully. |
| `ERR_NOT_OWNER` | -1 | You are not the owner of this structure, and it's not in your room. |
| `ERR_BUSY` | -4 | Hostile creeps are in the room. |

#### `isActive()`

_CPU cost: medium._

Check whether this structure can be used. If room controller level is insufficient, then this method will return false, and the structure will be highlighted with red in the game.

**Return value**

A boolean value.

#### `notifyWhenAttacked(enabled)`

_Action: changes game state; +0.2 CPU added to its natural cost when it returns OK._

Toggle auto notification when the structure is under attack. The notification will be sent to your account email. Turned on by default.

| parameter | type | description |
|---|---|---|
| `enabled` | boolean | Whether to enable notification or disable. |

**Return value**

One of the following codes:

| code | value | description |
|---|---|---|
| `OK` | 0 | The operation has been scheduled successfully. |
| `ERR_NOT_OWNER` | -1 | You are not the owner of this structure. |
| `ERR_INVALID_ARGS` | -10 | `enable` argument is not a boolean value. |

---

### StructureContainer

<img src="img/container.png" alt="" align="right" />

A small container that can be used to store resources. This is a walkable structure. All dropped resources automatically goes to the container at the same tile.

<table class="table gameplay-info">
    <tbody>
    <tr>
        <td><strong>Controller level</strong></td>
        <td>Any (including neutral rooms)</td>
    </tr>
    <tr>
        <td><strong>Available per room</strong></td>
        <td>5</td>
    </tr>
    <tr>
        <td><strong>Capacity</strong></td>
        <td>2,000</td>
    </tr>
    <tr>
        <td><strong>Cost</strong></td>
        <td>5,000</td>
    </tr>
    <tr>
        <td><strong>Hits</strong></td>
        <td>250,000</td>
    </tr>
    <tr>
        <td><strong>Decay</strong></td>
        <td>Loses 5,000 hits every 500 ticks in an owned room, and every 100 ticks in an unowned room.</td>
    </tr>
    </tbody>
</table>

#### `effects` : array  _(inherited from RoomObject)_

Applied effects, an array of objects with the following properties:

| parameter | type | description |
|---|---|---|
| `effect` | number | Effect ID of the applied effect. Can be either natural effect ID or Power ID. |
| `level` _(optional)_ | number | Power level of the applied effect. Absent if the effect is not a Power effect. |
| `ticksRemaining` | number | How many ticks will the effect last. |

#### `pos` : RoomPosition  _(inherited from RoomObject)_

An object representing the position of this object in the room.

#### `room` : Room  _(inherited from RoomObject)_

The link to the Room object. May be undefined in case if an object is a flag or a construction site and is placed in a room that is not visible to you.

#### `hits` : number  _(inherited from Structure)_

The current amount of hit points of the structure.

#### `hitsMax` : number  _(inherited from Structure)_

The total amount of hit points of the structure.

#### `id` : string  _(inherited from Structure)_

A unique object identificator. You can use <a href="#Game.getObjectById"><code>Game.getObjectById</code></a> method to retrieve an object instance by its <code>id</code>.

#### `structureType` : string  _(inherited from Structure)_

One of the <code>STRUCTURE_*</code> constants.

#### `destroy()`  _(inherited from Structure)_

_Action: changes game state; +0.2 CPU added to its natural cost when it returns OK._

Destroy this structure immediately.

**Return value**

One of the following codes:

| code | value | description |
|---|---|---|
| `OK` | 0 | The operation has been scheduled successfully. |
| `ERR_NOT_OWNER` | -1 | You are not the owner of this structure. |
| `ERR_BUSY` | -4 | Hostile creeps are in the room. |

#### `isActive()`  _(inherited from Structure)_

_CPU cost: medium._

Check whether this structure can be used. If room controller level is insufficient, then this method will return false, and the structure will be highlighted with red in the game.

**Return value**

A boolean value.

#### `notifyWhenAttacked(enabled)`  _(inherited from Structure)_

_Action: changes game state; +0.2 CPU added to its natural cost when it returns OK._

Toggle auto notification when the structure is under attack. The notification will be sent to your account email. Turned on by default.

| parameter | type | description |
|---|---|---|
| `enabled` | boolean | Whether to enable notification or disable. |

**Return value**

One of the following codes:

| code | value | description |
|---|---|---|
| `OK` | 0 | The operation has been scheduled successfully. |
| `ERR_NOT_OWNER` | -1 | You are not the owner of this structure. |
| `ERR_INVALID_ARGS` | -10 | `enable` argument is not a boolean value. |

#### `store` : Store

```javascript
const containersWithEnergy = room.find(FIND_STRUCTURES, {
    filter: (i) => i.structureType == STRUCTURE_CONTAINER &&
                   i.store[RESOURCE_ENERGY] > 0
});
```

A [`Store`](#Store) object that contains cargo of this structure.

#### `storeCapacity` : number

> **Deprecated property — will be removed.**

                                       
An alias for [`.store.getCapacity()`](#Store.getCapacity).

#### `ticksToDecay` : number

The amount of game ticks when this container will lose some hit points.

---

### StructureController

<img src="img/controller.png" alt="" align="right" />

Claim this structure to take control over the room. The controller structure cannot be damaged or destroyed. 

It can be addressed by [`Room.controller`](#Room.controller) property.

<table class="table gameplay-info">
    <tbody>
    <tr>
        <th><strong>Level</strong></th>
        <th>Upgrade to next level</th>
        <th>Downgrade timer</th>
    </tr>
    <tr>
        <td>1</td>
        <td>200 energy</td>
        <td>20,000 ticks</td>
    </tr>
    <tr>
        <td>2</td>
        <td>45,000 energy</td>
        <td>10,000 ticks</td>
    </tr>
    <tr>
        <td>3</td>
        <td>135,000 energy</td>
        <td>20,000 ticks</td>
    </tr>
    <tr>
        <td>4</td>
        <td>405,000 energy</td>
        <td>40,000 ticks</td>
    </tr>
    <tr>
        <td>5</td>
        <td>1,215,000 energy</td>
        <td>80,000 ticks</td>
    </tr>
    <tr>
        <td>6</td>
        <td>3,645,000 energy</td>
        <td>120,000 ticks</td>
    </tr>
    <tr>
        <td>7</td>
        <td>10,935,000 energy</td>
        <td>150,000 ticks</td>
    </tr>
    <tr>
        <td>8</td>
        <td>—</td>
        <td>200,000 ticks</td>
    </tr>
    </tbody>
</table>
	
**Safe mode**
	
<table class=gameplay-info>
    <tbody>
    <tr>
        <td><strong>Effect</strong></td>
        <td>Blocks <code>attack</code>, <code>rangedAttack</code>, <code>rangedMassAttack</code>, <code>dismantle</code>, <code>heal</code>, <code>rangedHeal</code>, <code>attackController</code>, and <code>withdraw</code> methods of all hostile creeps in the room, plus <code>enableRoom</code> and <code>usePower</code> methods of hostile Power Creeps. Only one room can be in safe mode at the same time.<br/>
	When safe mode is active, all hostile creeps become visually transparent and passable - your creeps can move through them freely (but not vice versa).</td>
    </tr>
    <tr>
        <td><strong>Duration</strong></td>
        <td>20,000 ticks</td>
    </tr>
    <tr>
        <td><strong>Cooldown</strong></td>
        <td>50,000 ticks (no cooldown in Novice Areas, also no cooldown for initial Safe Mode in your first room)</td>
    </tr>
    <tr>
        <td><strong>Generation</strong></td>
        <td>
            <ul>
                <li>Each new controller level generates one available activation</li>
                <li>Can be generated by creeps using 1,000 ghodium</li>
                <li>All available activations are reset if the controller is downgraded</li>
            </ul>
        </td>
    </tr>
    </tbody>
</table>

#### `effects` : array  _(inherited from RoomObject)_

Applied effects, an array of objects with the following properties:

| parameter | type | description |
|---|---|---|
| `effect` | number | Effect ID of the applied effect. Can be either natural effect ID or Power ID. |
| `level` _(optional)_ | number | Power level of the applied effect. Absent if the effect is not a Power effect. |
| `ticksRemaining` | number | How many ticks will the effect last. |

#### `pos` : RoomPosition  _(inherited from RoomObject)_

An object representing the position of this object in the room.

#### `room` : Room  _(inherited from RoomObject)_

The link to the Room object. May be undefined in case if an object is a flag or a construction site and is placed in a room that is not visible to you.

#### `hits` : number  _(inherited from Structure)_

The current amount of hit points of the structure.

#### `hitsMax` : number  _(inherited from Structure)_

The total amount of hit points of the structure.

#### `id` : string  _(inherited from Structure)_

A unique object identificator. You can use <a href="#Game.getObjectById"><code>Game.getObjectById</code></a> method to retrieve an object instance by its <code>id</code>.

#### `structureType` : string  _(inherited from Structure)_

One of the <code>STRUCTURE_*</code> constants.

#### `destroy()`  _(inherited from Structure)_

_Action: changes game state; +0.2 CPU added to its natural cost when it returns OK._

Destroy this structure immediately.

**Return value**

One of the following codes:

| code | value | description |
|---|---|---|
| `OK` | 0 | The operation has been scheduled successfully. |
| `ERR_NOT_OWNER` | -1 | You are not the owner of this structure. |
| `ERR_BUSY` | -4 | Hostile creeps are in the room. |

#### `isActive()`  _(inherited from Structure)_

_CPU cost: medium._

Check whether this structure can be used. If room controller level is insufficient, then this method will return false, and the structure will be highlighted with red in the game.

**Return value**

A boolean value.

#### `notifyWhenAttacked(enabled)`  _(inherited from Structure)_

_Action: changes game state; +0.2 CPU added to its natural cost when it returns OK._

Toggle auto notification when the structure is under attack. The notification will be sent to your account email. Turned on by default.

| parameter | type | description |
|---|---|---|
| `enabled` | boolean | Whether to enable notification or disable. |

**Return value**

One of the following codes:

| code | value | description |
|---|---|---|
| `OK` | 0 | The operation has been scheduled successfully. |
| `ERR_NOT_OWNER` | -1 | You are not the owner of this structure. |
| `ERR_INVALID_ARGS` | -10 | `enable` argument is not a boolean value. |

#### `my` : boolean  _(inherited from OwnedStructure)_

Whether this is your own structure.

#### `owner` : object  _(inherited from OwnedStructure)_

An object with the structure’s owner info containing the following properties:

| parameter | type | description |
|---|---|---|
| `username` | string | The name of the owner user. |

#### `isPowerEnabled` : boolean

Whether using power is enabled in this room. Use [`PowerCreep.enableRoom`](#PowerCreep.enableRoom) to turn powers on.

#### `level` : number

Current controller level, from 0 to 8.

#### `progress` : number

The current progress of upgrading the controller to the next level.

#### `progressTotal` : number

The progress needed to reach the next level.

#### `reservation` : object

An object with the controller reservation info if present:

| parameter | type | description |
|---|---|---|
| `username` | string | The name of a player who reserved this controller. |
| `ticksToEnd` | number | The amount of game ticks when the reservation will end. |

#### `safeMode` : number

How many ticks of safe mode remaining, or undefined.

#### `safeModeAvailable` : number

Safe mode activations available to use.

#### `safeModeCooldown` : number

During this period in ticks new safe mode activations will be blocked, undefined if cooldown is inactive.

#### `sign` : object

An object with the controller sign info if present:

| parameter | type | description |
|---|---|---|
| `username` | string | The name of a player who signed this controller. |
| `text` | string | The sign text. |
| `time` | number | The sign time in game ticks. |
| `datetime` | Date | The sign real date. |

#### `ticksToDowngrade` : number

The amount of game ticks when this controller will lose one level. This timer is set to 50% on level upgrade or downgrade, and it can be increased by using <code><a href="#Creep.upgradeController">Creep.upgradeController</a></code>. Must be full to upgrade the controller to the next level.

#### `upgradeBlocked` : number

The amount of game ticks while this controller cannot be upgraded due to attack. Safe mode is also unavailable during this period.

#### `activateSafeMode()`

_Action: changes game state; +0.2 CPU added to its natural cost when it returns OK._

```javascript
room.controller.activateSafeMode();
```

Activate safe mode if available.

**Return value**

One of the following codes:

| code | value | description |
|---|---|---|
| `OK` | 0 | The operation has been scheduled successfully. |
| `ERR_NOT_OWNER` | -1 | You are not the owner of this controller. |
| `ERR_BUSY` | -4 | There is another room in safe mode already. |
| `ERR_NOT_ENOUGH_RESOURCES` | -6 | There is no safe mode activations available. |
| `ERR_TIRED` | -11 | The previous safe mode is still cooling down, or the controller is `upgradeBlocked`, or the controller is downgraded for 50% plus 5000 ticks or more. |

#### `unclaim()`

_Action: changes game state; +0.2 CPU added to its natural cost when it returns OK._

```javascript
room.controller.unclaim();
```

Make your claimed controller neutral again.

**Return value**

One of the following codes:

| code | value | description |
|---|---|---|
| `OK` | 0 | The operation has been scheduled successfully. |
| `ERR_NOT_OWNER` | -1 | You are not the owner of this controller. |

---

### StructureExtension

<img src="img/spawn.png" alt="" align="right" />

Contains energy which can be spent on spawning bigger creeps. Extensions can be placed anywhere in the room, any spawns will be able to use them regardless of distance.

<table class="table gameplay-info">
    <tbody>
    <tr>
        <td colspan="2"><strong>Controller level</strong></td>
    </tr>
    <tr>
        <td>1</td>
        <td>—</td>
    </tr>
    <tr>
        <td>2</td>
        <td>5 extensions (50 capacity)</td>
    </tr>
    <tr>
        <td>3</td>
        <td>10 extensions (50 capacity)</td>
    </tr>
    <tr>
        <td>4</td>
        <td>20 extensions (50 capacity)</td>
    </tr>
    <tr>
        <td>5</td>
        <td>30 extensions (50 capacity)</td>
    </tr>
    <tr>
        <td>6</td>
        <td>40 extensions (50 capacity)</td>
    </tr>
    <tr>
        <td>7</td>
        <td>50 extensions (100 capacity)</td>
    </tr>
    <tr>
        <td>8</td>
        <td>60 extensions (200 capacity)</td>
    </tr>
    <tr>
        <td><strong>Cost</strong></td>
        <td>3,000</td>
    </tr>
    <tr>
        <td><strong>Hits</strong></td>
        <td>1,000</td>
    </tr>
    </tbody>
</table>

#### `effects` : array  _(inherited from RoomObject)_

Applied effects, an array of objects with the following properties:

| parameter | type | description |
|---|---|---|
| `effect` | number | Effect ID of the applied effect. Can be either natural effect ID or Power ID. |
| `level` _(optional)_ | number | Power level of the applied effect. Absent if the effect is not a Power effect. |
| `ticksRemaining` | number | How many ticks will the effect last. |

#### `pos` : RoomPosition  _(inherited from RoomObject)_

An object representing the position of this object in the room.

#### `room` : Room  _(inherited from RoomObject)_

The link to the Room object. May be undefined in case if an object is a flag or a construction site and is placed in a room that is not visible to you.

#### `hits` : number  _(inherited from Structure)_

The current amount of hit points of the structure.

#### `hitsMax` : number  _(inherited from Structure)_

The total amount of hit points of the structure.

#### `id` : string  _(inherited from Structure)_

A unique object identificator. You can use <a href="#Game.getObjectById"><code>Game.getObjectById</code></a> method to retrieve an object instance by its <code>id</code>.

#### `structureType` : string  _(inherited from Structure)_

One of the <code>STRUCTURE_*</code> constants.

#### `destroy()`  _(inherited from Structure)_

_Action: changes game state; +0.2 CPU added to its natural cost when it returns OK._

Destroy this structure immediately.

**Return value**

One of the following codes:

| code | value | description |
|---|---|---|
| `OK` | 0 | The operation has been scheduled successfully. |
| `ERR_NOT_OWNER` | -1 | You are not the owner of this structure. |
| `ERR_BUSY` | -4 | Hostile creeps are in the room. |

#### `isActive()`  _(inherited from Structure)_

_CPU cost: medium._

Check whether this structure can be used. If room controller level is insufficient, then this method will return false, and the structure will be highlighted with red in the game.

**Return value**

A boolean value.

#### `notifyWhenAttacked(enabled)`  _(inherited from Structure)_

_Action: changes game state; +0.2 CPU added to its natural cost when it returns OK._

Toggle auto notification when the structure is under attack. The notification will be sent to your account email. Turned on by default.

| parameter | type | description |
|---|---|---|
| `enabled` | boolean | Whether to enable notification or disable. |

**Return value**

One of the following codes:

| code | value | description |
|---|---|---|
| `OK` | 0 | The operation has been scheduled successfully. |
| `ERR_NOT_OWNER` | -1 | You are not the owner of this structure. |
| `ERR_INVALID_ARGS` | -10 | `enable` argument is not a boolean value. |

#### `my` : boolean  _(inherited from OwnedStructure)_

Whether this is your own structure.

#### `owner` : object  _(inherited from OwnedStructure)_

An object with the structure’s owner info containing the following properties:

| parameter | type | description |
|---|---|---|
| `username` | string | The name of the owner user. |

#### `energy` : number

> **Deprecated property — will be removed.**

                                
An alias for [`.store[RESOURCE_ENERGY]`](#StructureExtension.store).

#### `energyCapacity` : number

> **Deprecated property — will be removed.**

                                                                        
An alias for [`.store.getCapacity(RESOURCE_ENERGY)`](#Store.getCapacity).

The total amount of energy the extension can contain.

#### `store` : Store

```javascript
if(structure.store.getFreeCapacity(RESOURCE_ENERGY) > 0) {
    creep.transfer(structure, RESOURCE_ENERGY);
}
```

A [`Store`](#Store) object that contains cargo of this structure.

---

### StructureExtractor

<img src="img/extractor.png" alt="" align="right" />

Allows to harvest a mineral deposit. Learn more about minerals from [this article](/resources.html).</p>

<table class="table gameplay-info">
    <tbody>
    <tr>
        <td><strong>Controller level</strong></td>
        <td>6</td>
    </tr>
    <tr>
        <td><strong>Cost</strong></td>
        <td>5,000</td>
    </tr>
    <tr>
        <td><strong>Hits</strong></td>
        <td>500</td>
    </tr>
    <tr>
        <td><strong>Cooldown</strong></td>
        <td>5 ticks on each <code>harvest</code> action</td>
    </tr>
    </tbody>
</table>

#### `effects` : array  _(inherited from RoomObject)_

Applied effects, an array of objects with the following properties:

| parameter | type | description |
|---|---|---|
| `effect` | number | Effect ID of the applied effect. Can be either natural effect ID or Power ID. |
| `level` _(optional)_ | number | Power level of the applied effect. Absent if the effect is not a Power effect. |
| `ticksRemaining` | number | How many ticks will the effect last. |

#### `pos` : RoomPosition  _(inherited from RoomObject)_

An object representing the position of this object in the room.

#### `room` : Room  _(inherited from RoomObject)_

The link to the Room object. May be undefined in case if an object is a flag or a construction site and is placed in a room that is not visible to you.

#### `hits` : number  _(inherited from Structure)_

The current amount of hit points of the structure.

#### `hitsMax` : number  _(inherited from Structure)_

The total amount of hit points of the structure.

#### `id` : string  _(inherited from Structure)_

A unique object identificator. You can use <a href="#Game.getObjectById"><code>Game.getObjectById</code></a> method to retrieve an object instance by its <code>id</code>.

#### `structureType` : string  _(inherited from Structure)_

One of the <code>STRUCTURE_*</code> constants.

#### `destroy()`  _(inherited from Structure)_

_Action: changes game state; +0.2 CPU added to its natural cost when it returns OK._

Destroy this structure immediately.

**Return value**

One of the following codes:

| code | value | description |
|---|---|---|
| `OK` | 0 | The operation has been scheduled successfully. |
| `ERR_NOT_OWNER` | -1 | You are not the owner of this structure. |
| `ERR_BUSY` | -4 | Hostile creeps are in the room. |

#### `isActive()`  _(inherited from Structure)_

_CPU cost: medium._

Check whether this structure can be used. If room controller level is insufficient, then this method will return false, and the structure will be highlighted with red in the game.

**Return value**

A boolean value.

#### `notifyWhenAttacked(enabled)`  _(inherited from Structure)_

_Action: changes game state; +0.2 CPU added to its natural cost when it returns OK._

Toggle auto notification when the structure is under attack. The notification will be sent to your account email. Turned on by default.

| parameter | type | description |
|---|---|---|
| `enabled` | boolean | Whether to enable notification or disable. |

**Return value**

One of the following codes:

| code | value | description |
|---|---|---|
| `OK` | 0 | The operation has been scheduled successfully. |
| `ERR_NOT_OWNER` | -1 | You are not the owner of this structure. |
| `ERR_INVALID_ARGS` | -10 | `enable` argument is not a boolean value. |

#### `my` : boolean  _(inherited from OwnedStructure)_

Whether this is your own structure.

#### `owner` : object  _(inherited from OwnedStructure)_

An object with the structure’s owner info containing the following properties:

| parameter | type | description |
|---|---|---|
| `username` | string | The name of the owner user. |

#### `cooldown` : number

The amount of game ticks until the next harvest action is possible.

---

### StructureFactory

<img src="img/factory.png" alt="" align="right" />

Produces trade commodities from base minerals and other commodities. Learn more about commodities from [this article](/resources.html#Commodities). 

<table class="table gameplay-info">
    <tbody>
    <tr>
        <td colspan="2"><strong>Controller level</strong></td>
    </tr>
    <tr>
        <td>1-6</td>
        <td>—</td>
    </tr>
    <tr>
        <td>7-8</td>
        <td>1 factory</td>
    </tr>
    <tr>
        <td><strong>Cost</strong></td>
        <td>100,000</td>
    </tr>
    <tr>
        <td><strong>Hits</strong></td>
        <td>1000</td>
    </tr>
    <tr>
        <td><strong>Capacity</strong></td>
        <td>50,000</td>
    </tr>
    <tr>
        <td><strong>Production cooldown</strong></td>
        <td>Depends on the resource</td>
    </tr>
    </tbody>
</table>

#### `effects` : array  _(inherited from RoomObject)_

Applied effects, an array of objects with the following properties:

| parameter | type | description |
|---|---|---|
| `effect` | number | Effect ID of the applied effect. Can be either natural effect ID or Power ID. |
| `level` _(optional)_ | number | Power level of the applied effect. Absent if the effect is not a Power effect. |
| `ticksRemaining` | number | How many ticks will the effect last. |

#### `pos` : RoomPosition  _(inherited from RoomObject)_

An object representing the position of this object in the room.

#### `room` : Room  _(inherited from RoomObject)_

The link to the Room object. May be undefined in case if an object is a flag or a construction site and is placed in a room that is not visible to you.

#### `hits` : number  _(inherited from Structure)_

The current amount of hit points of the structure.

#### `hitsMax` : number  _(inherited from Structure)_

The total amount of hit points of the structure.

#### `id` : string  _(inherited from Structure)_

A unique object identificator. You can use <a href="#Game.getObjectById"><code>Game.getObjectById</code></a> method to retrieve an object instance by its <code>id</code>.

#### `structureType` : string  _(inherited from Structure)_

One of the <code>STRUCTURE_*</code> constants.

#### `destroy()`  _(inherited from Structure)_

_Action: changes game state; +0.2 CPU added to its natural cost when it returns OK._

Destroy this structure immediately.

**Return value**

One of the following codes:

| code | value | description |
|---|---|---|
| `OK` | 0 | The operation has been scheduled successfully. |
| `ERR_NOT_OWNER` | -1 | You are not the owner of this structure. |
| `ERR_BUSY` | -4 | Hostile creeps are in the room. |

#### `isActive()`  _(inherited from Structure)_

_CPU cost: medium._

Check whether this structure can be used. If room controller level is insufficient, then this method will return false, and the structure will be highlighted with red in the game.

**Return value**

A boolean value.

#### `notifyWhenAttacked(enabled)`  _(inherited from Structure)_

_Action: changes game state; +0.2 CPU added to its natural cost when it returns OK._

Toggle auto notification when the structure is under attack. The notification will be sent to your account email. Turned on by default.

| parameter | type | description |
|---|---|---|
| `enabled` | boolean | Whether to enable notification or disable. |

**Return value**

One of the following codes:

| code | value | description |
|---|---|---|
| `OK` | 0 | The operation has been scheduled successfully. |
| `ERR_NOT_OWNER` | -1 | You are not the owner of this structure. |
| `ERR_INVALID_ARGS` | -10 | `enable` argument is not a boolean value. |

#### `my` : boolean  _(inherited from OwnedStructure)_

Whether this is your own structure.

#### `owner` : object  _(inherited from OwnedStructure)_

An object with the structure’s owner info containing the following properties:

| parameter | type | description |
|---|---|---|
| `username` | string | The name of the owner user. |

#### `cooldown` : number

The amount of game ticks the factory has to wait until the next production is possible.

#### `level` : number

```javascript
if(!factory.level) {
    Game.powerCreeps['MyOperator1'].usePower(PWR_OPERATE_FACTORY, factory);
}
```

The factory's level. Can be set by applying the `PWR_OPERATE_FACTORY` power to a newly built factory. 
Once set, the level cannot be changed. 

#### `store` : Store

A [`Store`](#Store) object that contains cargo of this structure.

#### `storeCapacity` : number

> **Deprecated property — will be removed.**

                                                                                                               
An alias for [`.store.getCapacity()`](#Store.getCapacity).

#### `produce(resourceType)`

_Action: changes game state; +0.2 CPU added to its natural cost when it returns OK._

```javascript
factory.produce(RESOURCE_UTRIUM_BAR);
```

Produces the specified commodity. All ingredients should be available in the factory store.

| parameter | type | description |
|---|---|---|
| `resourceType` | string | One of the `RESOURCE_*` constants. |

**Return value**

One of the following codes:

| code | value | description |
|---|---|---|
| `OK` | 0 | The operation has been scheduled successfully. |
| `ERR_NOT_OWNER` | -1 | You are not the owner of this structure. |
| `ERR_RCL_NOT_ENOUGH` | -14 | Your Room Controller level is insufficient to use the factory. |
| `ERR_NOT_ENOUGH_RESOURCES` | -6 | The structure does not have the required amount of resources. |
| `ERR_INVALID_ARGS` | -10 | The arguments provided are incorrect. |
| `ERR_INVALID_TARGET` | -7 | The factory cannot produce the commodity of this level. |
| `ERR_TIRED` | -11 | The factory is still cooling down. |
| `ERR_BUSY` | -4 | The factory is not operated by the `PWR_OPERATE_FACTORY` power. |
| `ERR_FULL` | -8 | The factory cannot contain the produce. |

---

### StructureInvaderCore

<img src="img/invaderCore.png" alt="" align="right" />

This NPC structure is a control center of NPC Strongholds, and also rules all invaders in the sector. It spawns NPC defenders of the stronghold, refill towers, repairs structures. 
While it's alive, it will spawn invaders in all rooms in the same sector. It also contains some valuable resources inside, which you can loot from its ruin if you destroy the structure.

An Invader Core has two lifetime stages: deploy stage and active stage. When it appears in a random room in the sector, it has `ticksToDeploy` property,
public ramparts around it, and doesn't perform any actions. While in this stage it's invulnerable to attacks (has `EFFECT_INVULNERABILITY` enabled). When the `ticksToDeploy` timer is over, it spawns structures around it and starts
spawning creeps, becomes vulnerable, and receives `EFFECT_COLLAPSE_TIMER` which will remove the stronghold when this timer is over.  

An active Invader Core spawns level-0 Invader Cores in neutral neighbor rooms inside the sector. These lesser Invader Cores are spawned
near the room controller and don't perform any activity except reserving/attacking the controller. One Invader Core can spawn up to 42 lesser Cores
during its lifetime. 

<table class="table gameplay-info">
    <tbody>
    <tr>
        <td><strong>Hits</strong></td>
        <td>100,000</td>
    </tr>
    <tr>
        <td><strong>Deploy time</strong></td>
        <td>5,000 ticks</td>
    </tr>
    <tr>
        <td><strong>Active time</strong></td>
        <td>75,000 ticks with 10% random variation</td>
    </tr>
    <tr>
        <td><strong>Lesser cores spawn interval</strong></td>
        <td>
            <b>Stronghold level 1</b>: 4000 ticks<br>
            <b>Stronghold level 2</b>: 3500 ticks<br>
            <b>Stronghold level 3</b>: 3000 ticks<br>
            <b>Stronghold level 4</b>: 2500 ticks<br>
            <b>Stronghold level 5</b>: 2000 ticks<br>
        </td>
    </tr>
    
    
    </tbody>
</table>

#### `effects` : array  _(inherited from RoomObject)_

Applied effects, an array of objects with the following properties:

| parameter | type | description |
|---|---|---|
| `effect` | number | Effect ID of the applied effect. Can be either natural effect ID or Power ID. |
| `level` _(optional)_ | number | Power level of the applied effect. Absent if the effect is not a Power effect. |
| `ticksRemaining` | number | How many ticks will the effect last. |

#### `pos` : RoomPosition  _(inherited from RoomObject)_

An object representing the position of this object in the room.

#### `room` : Room  _(inherited from RoomObject)_

The link to the Room object. May be undefined in case if an object is a flag or a construction site and is placed in a room that is not visible to you.

#### `hits` : number  _(inherited from Structure)_

The current amount of hit points of the structure.

#### `hitsMax` : number  _(inherited from Structure)_

The total amount of hit points of the structure.

#### `id` : string  _(inherited from Structure)_

A unique object identificator. You can use <a href="#Game.getObjectById"><code>Game.getObjectById</code></a> method to retrieve an object instance by its <code>id</code>.

#### `structureType` : string  _(inherited from Structure)_

One of the <code>STRUCTURE_*</code> constants.

#### `destroy()`  _(inherited from Structure)_

_Action: changes game state; +0.2 CPU added to its natural cost when it returns OK._

Destroy this structure immediately.

**Return value**

One of the following codes:

| code | value | description |
|---|---|---|
| `OK` | 0 | The operation has been scheduled successfully. |
| `ERR_NOT_OWNER` | -1 | You are not the owner of this structure. |
| `ERR_BUSY` | -4 | Hostile creeps are in the room. |

#### `isActive()`  _(inherited from Structure)_

_CPU cost: medium._

Check whether this structure can be used. If room controller level is insufficient, then this method will return false, and the structure will be highlighted with red in the game.

**Return value**

A boolean value.

#### `notifyWhenAttacked(enabled)`  _(inherited from Structure)_

_Action: changes game state; +0.2 CPU added to its natural cost when it returns OK._

Toggle auto notification when the structure is under attack. The notification will be sent to your account email. Turned on by default.

| parameter | type | description |
|---|---|---|
| `enabled` | boolean | Whether to enable notification or disable. |

**Return value**

One of the following codes:

| code | value | description |
|---|---|---|
| `OK` | 0 | The operation has been scheduled successfully. |
| `ERR_NOT_OWNER` | -1 | You are not the owner of this structure. |
| `ERR_INVALID_ARGS` | -10 | `enable` argument is not a boolean value. |

#### `my` : boolean  _(inherited from OwnedStructure)_

Whether this is your own structure.

#### `owner` : object  _(inherited from OwnedStructure)_

An object with the structure’s owner info containing the following properties:

| parameter | type | description |
|---|---|---|
| `username` | string | The name of the owner user. |

#### `level` : number

                                                                
The level of the stronghold. The amount and quality of the loot depends on the level.

#### `ticksToDeploy` : number

                                                                                                                
Shows the timer for a not yet deployed stronghold, undefined otherwise. 

#### `spawning` : StructureSpawn.Spawning

If the core is in process of spawning a new creep, this object will contain a [`StructureSpawn.Spawning`](#StructureSpawn-Spawning) object, or null otherwise.

---

### StructureKeeperLair

<img src="img/keeperLair.png" alt="" align="right" />

Non-player structure. Spawns NPC Source Keepers that guards energy sources and minerals in some rooms. This structure cannot be destroyed.

<table class="table gameplay-info">
    <tbody>
    <tr>
        <td><strong>Spawning time</strong></td>
        <td>300</td>
    </tr>
    </tbody>
</table>

#### `effects` : array  _(inherited from RoomObject)_

Applied effects, an array of objects with the following properties:

| parameter | type | description |
|---|---|---|
| `effect` | number | Effect ID of the applied effect. Can be either natural effect ID or Power ID. |
| `level` _(optional)_ | number | Power level of the applied effect. Absent if the effect is not a Power effect. |
| `ticksRemaining` | number | How many ticks will the effect last. |

#### `pos` : RoomPosition  _(inherited from RoomObject)_

An object representing the position of this object in the room.

#### `room` : Room  _(inherited from RoomObject)_

The link to the Room object. May be undefined in case if an object is a flag or a construction site and is placed in a room that is not visible to you.

#### `hits` : number  _(inherited from Structure)_

The current amount of hit points of the structure.

#### `hitsMax` : number  _(inherited from Structure)_

The total amount of hit points of the structure.

#### `id` : string  _(inherited from Structure)_

A unique object identificator. You can use <a href="#Game.getObjectById"><code>Game.getObjectById</code></a> method to retrieve an object instance by its <code>id</code>.

#### `structureType` : string  _(inherited from Structure)_

One of the <code>STRUCTURE_*</code> constants.

#### `destroy()`  _(inherited from Structure)_

_Action: changes game state; +0.2 CPU added to its natural cost when it returns OK._

Destroy this structure immediately.

**Return value**

One of the following codes:

| code | value | description |
|---|---|---|
| `OK` | 0 | The operation has been scheduled successfully. |
| `ERR_NOT_OWNER` | -1 | You are not the owner of this structure. |
| `ERR_BUSY` | -4 | Hostile creeps are in the room. |

#### `isActive()`  _(inherited from Structure)_

_CPU cost: medium._

Check whether this structure can be used. If room controller level is insufficient, then this method will return false, and the structure will be highlighted with red in the game.

**Return value**

A boolean value.

#### `notifyWhenAttacked(enabled)`  _(inherited from Structure)_

_Action: changes game state; +0.2 CPU added to its natural cost when it returns OK._

Toggle auto notification when the structure is under attack. The notification will be sent to your account email. Turned on by default.

| parameter | type | description |
|---|---|---|
| `enabled` | boolean | Whether to enable notification or disable. |

**Return value**

One of the following codes:

| code | value | description |
|---|---|---|
| `OK` | 0 | The operation has been scheduled successfully. |
| `ERR_NOT_OWNER` | -1 | You are not the owner of this structure. |
| `ERR_INVALID_ARGS` | -10 | `enable` argument is not a boolean value. |

#### `my` : boolean  _(inherited from OwnedStructure)_

Whether this is your own structure.

#### `owner` : object  _(inherited from OwnedStructure)_

An object with the structure’s owner info containing the following properties:

| parameter | type | description |
|---|---|---|
| `username` | string | The name of the owner user. |

#### `ticksToSpawn` : number

Time to spawning of the next Source Keeper.

---

### StructureLab

<img src="img/lab.png" alt="" align="right" />

Produces mineral compounds from base minerals, boosts and unboosts creeps. 
Learn more about minerals from [this article](/resources.html).

<table class="table gameplay-info">
    <tbody>
    <tr>
        <td colspan="2"><strong>Controller level</strong></td>
    </tr>
    <tr>
        <td>1-5</td>
        <td>—</td>
    </tr>
    <tr>
        <td>6</td>
        <td>3 labs</td>
    </tr>
    <tr>
        <td>7</td>
        <td>6 labs</td>
    </tr>
    <tr>
        <td>8</td>
        <td>10 labs</td>
    </tr>
    <tr>
        <td><strong>Cost</strong></td>
        <td>50,000</td>
    </tr>
    <tr>
        <td><strong>Hits</strong></td>
        <td>500</td>
    </tr>
    <tr>
        <td><strong>Capacity</strong></td>
        <td>3000 mineral units, 2000 energy units</td>
    </tr>
    <tr>
        <td><strong>Produce</strong></td>
        <td>5 mineral compound units per reaction</td>
    </tr>
    <tr>
        <td><strong>Reaction cooldown</strong></td>
        <td>Depends on the reaction (see [this article](/resources.html))</td>
    </tr>
    <tr>
        <td><strong>Distance to input labs</strong></td>
        <td>2 squares</td>
    </tr>
    <tr>
        <td><strong>Boost cost</strong></td>
        <td>30 mineral units, 20 energy units per body part</td>
    </tr>
    </tbody>
</table>

#### `effects` : array  _(inherited from RoomObject)_

Applied effects, an array of objects with the following properties:

| parameter | type | description |
|---|---|---|
| `effect` | number | Effect ID of the applied effect. Can be either natural effect ID or Power ID. |
| `level` _(optional)_ | number | Power level of the applied effect. Absent if the effect is not a Power effect. |
| `ticksRemaining` | number | How many ticks will the effect last. |

#### `pos` : RoomPosition  _(inherited from RoomObject)_

An object representing the position of this object in the room.

#### `room` : Room  _(inherited from RoomObject)_

The link to the Room object. May be undefined in case if an object is a flag or a construction site and is placed in a room that is not visible to you.

#### `hits` : number  _(inherited from Structure)_

The current amount of hit points of the structure.

#### `hitsMax` : number  _(inherited from Structure)_

The total amount of hit points of the structure.

#### `id` : string  _(inherited from Structure)_

A unique object identificator. You can use <a href="#Game.getObjectById"><code>Game.getObjectById</code></a> method to retrieve an object instance by its <code>id</code>.

#### `structureType` : string  _(inherited from Structure)_

One of the <code>STRUCTURE_*</code> constants.

#### `destroy()`  _(inherited from Structure)_

_Action: changes game state; +0.2 CPU added to its natural cost when it returns OK._

Destroy this structure immediately.

**Return value**

One of the following codes:

| code | value | description |
|---|---|---|
| `OK` | 0 | The operation has been scheduled successfully. |
| `ERR_NOT_OWNER` | -1 | You are not the owner of this structure. |
| `ERR_BUSY` | -4 | Hostile creeps are in the room. |

#### `isActive()`  _(inherited from Structure)_

_CPU cost: medium._

Check whether this structure can be used. If room controller level is insufficient, then this method will return false, and the structure will be highlighted with red in the game.

**Return value**

A boolean value.

#### `notifyWhenAttacked(enabled)`  _(inherited from Structure)_

_Action: changes game state; +0.2 CPU added to its natural cost when it returns OK._

Toggle auto notification when the structure is under attack. The notification will be sent to your account email. Turned on by default.

| parameter | type | description |
|---|---|---|
| `enabled` | boolean | Whether to enable notification or disable. |

**Return value**

One of the following codes:

| code | value | description |
|---|---|---|
| `OK` | 0 | The operation has been scheduled successfully. |
| `ERR_NOT_OWNER` | -1 | You are not the owner of this structure. |
| `ERR_INVALID_ARGS` | -10 | `enable` argument is not a boolean value. |

#### `my` : boolean  _(inherited from OwnedStructure)_

Whether this is your own structure.

#### `owner` : object  _(inherited from OwnedStructure)_

An object with the structure’s owner info containing the following properties:

| parameter | type | description |
|---|---|---|
| `username` | string | The name of the owner user. |

#### `cooldown` : number

The amount of game ticks the lab has to wait until the next reaction or unboost operation is possible.

#### `energy` : number

> **Deprecated property — will be removed.**

                                                                
An alias for [`.store[RESOURCE_ENERGY]`](#StructureExtension.store).

#### `energyCapacity` : number

> **Deprecated property — will be removed.**

                                                                                                                
An alias for [`.store.getCapacity(RESOURCE_ENERGY)`](#Store.getCapacity).

#### `mineralAmount` : number

> **Deprecated property — will be removed.**

                                                                       
An alias for [`lab.store[lab.mineralType]`](#StructureExtension.store).

#### `mineralType` : string

The type of minerals containing in the lab. Labs can contain only one mineral type at the same time.

#### `mineralCapacity` : number

> **Deprecated property — will be removed.**

                                                                                                                 
An alias for [`lab.store.getCapacity(lab.mineralType || yourMineral)`](#Store.getCapacity).

#### `store` : Store

```javascript
if(structure.store.getFreeCapacity(RESOURCE_ENERGY) > 0) {
    creep.transfer(structure, RESOURCE_ENERGY);
}
```

A [`Store`](#Store) object that contains cargo of this structure.

#### `boostCreep(creep, [bodyPartsCount])`

_Action: changes game state; +0.2 CPU added to its natural cost when it returns OK._

Boosts creep body parts using the containing mineral compound. The creep has to be at adjacent square to the lab. 

| parameter | type | description |
|---|---|---|
| `creep` | Creep | The target creep. |
| `bodyPartsCount` _(optional)_ | number | The number of body parts of the corresponding type to be boosted. Body parts are always counted left-to-right for `TOUGH`, and right-to-left for other types. If undefined, all the eligible body parts are boosted. |

**Return value**

One of the following codes:

| code | value | description |
|---|---|---|
| `OK` | 0 | The operation has been scheduled successfully. |
| `ERR_NOT_OWNER` | -1 | You are not the owner of this lab. |
| `ERR_NOT_FOUND` | -5 | The mineral containing in the lab cannot boost any of the creep's body parts. |
| `ERR_NOT_ENOUGH_RESOURCES` | -6 | The lab does not have enough energy or minerals. |
| `ERR_INVALID_TARGET` | -7 | The targets is not valid creep object. |
| `ERR_NOT_IN_RANGE` | -9 | The targets are too far away. |
| `ERR_RCL_NOT_ENOUGH` | -14 | Room Controller Level insufficient to use this structure. |

#### `reverseReaction(lab1, lab2)`

_Action: changes game state; +0.2 CPU added to its natural cost when it returns OK._

Breaks mineral compounds back into reagents. The same output labs can be used by many source labs.

| parameter | type | description |
|---|---|---|
| `lab1` | StructureLab | The first result lab. |
| `lab2` | StructureLab | The second result lab. |

**Return value**

One of the following codes:

| code | value | description |
|---|---|---|
| `OK` | 0 | The operation has been scheduled successfully. |
| `ERR_NOT_OWNER` | -1 | You are not the owner of this lab. |
| `ERR_NOT_ENOUGH_RESOURCES` | -6 | The source lab do not have enough resources. |
| `ERR_INVALID_TARGET` | -7 | The targets are not valid lab objects. |
| `ERR_FULL` | -8 | One of targets cannot receive any more resource. |
| `ERR_NOT_IN_RANGE` | -9 | The targets are too far away. |
| `ERR_INVALID_ARGS` | -10 | The reaction cannot be reversed into this resources. |
| `ERR_TIRED` | -11 | The lab is still cooling down. |
| `ERR_RCL_NOT_ENOUGH` | -14 | Room Controller Level insufficient to use this structure. |

#### `runReaction(lab1, lab2)`

_Action: changes game state; +0.2 CPU added to its natural cost when it returns OK._

Produce mineral compounds using reagents from two other labs. The same input labs can be used by many output labs.

| parameter | type | description |
|---|---|---|
| `lab1` | StructureLab (lab) | The first source lab. |
| `lab2` | StructureLab (lab) | The second source lab. |

**Return value**

One of the following codes:

| code | value | description |
|---|---|---|
| `OK` | 0 | The operation has been scheduled successfully. |
| `ERR_NOT_OWNER` | -1 | You are not the owner of this lab. |
| `ERR_NOT_ENOUGH_RESOURCES` | -6 | The source lab do not have enough resources. |
| `ERR_INVALID_TARGET` | -7 | The targets are not valid lab objects. |
| `ERR_FULL` | -8 | The target cannot receive any more resource. |
| `ERR_NOT_IN_RANGE` | -9 | The targets are too far away. |
| `ERR_INVALID_ARGS` | -10 | The reaction cannot be run using this resources. |
| `ERR_TIRED` | -11 | The lab is still cooling down. |
| `ERR_RCL_NOT_ENOUGH` | -14 | Room Controller Level insufficient to use this structure. |

#### `unboostCreep(creep)`

_Action: changes game state; +0.2 CPU added to its natural cost when it returns OK._

Immediately remove boosts from the creep and drop 50% of the mineral compounds used to boost it onto the ground regardless of the creep's remaining time to live. The creep has to be at adjacent square to the lab. Unboosting requires cooldown time equal to the total sum of the reactions needed to produce all the compounds applied to the creep.

| parameter | type | description |
|---|---|---|
| `creep` | Creep | The target creep. |

**Return value**

One of the following codes:

| code | value | description |
|---|---|---|
| `OK` | 0 | The operation has been scheduled successfully. |
| `ERR_NOT_OWNER` | -1 | You are not the owner of this lab, or the target creep. |
| `ERR_INVALID_TARGET` | -7 | The target is not a valid Creep object. |
| `ERR_TIRED` | -11 | The lab is still cooling down. |
| `ERR_NOT_IN_RANGE` | -9 | The target is too far away. |
| `ERR_NOT_FOUND` | -5 | The target has no boosted parts. |
| `ERR_RCL_NOT_ENOUGH` | -14 | Room Controller Level insufficient to use this structure. |

---

### StructureLink

<img src="img/link.png" alt="" align="right" /> 

Remotely transfers energy to another Link in the same room.

<table class="table gameplay-info">
    <tbody>
    <tr>
        <td colspan="2"><strong>Controller level</strong></td>
    </tr>
    <tr>
        <td>1-4</td>
        <td>—</td>
    </tr>
    <tr>
        <td>5</td>
        <td>2 links</td>
    </tr>
    <tr>
        <td>6</td>
        <td>3 links</td>
    </tr>
    <tr>
        <td>7</td>
        <td>4 links</td>
    </tr>
    <tr>
        <td>8</td>
        <td>6 links</td>
    </tr>
    <tr>
        <td><strong>Cost</strong></td>
        <td>5,000</td>
    </tr>
    <tr>
        <td><strong>Hits</strong></td>
        <td>1,000</td>
    </tr>
    <tr>
        <td><strong>Capacity</strong></td>
        <td>800</td>
    </tr>
    <tr>
        <td><strong>Cooldown time</strong></td>
        <td>1 tick per tile of the linear distance to the target</td>
    </tr>
    <tr>
        <td><strong>Energy loss</strong></td>
        <td>3%</td>
    </tr>
    </tbody>
</table>

#### `effects` : array  _(inherited from RoomObject)_

Applied effects, an array of objects with the following properties:

| parameter | type | description |
|---|---|---|
| `effect` | number | Effect ID of the applied effect. Can be either natural effect ID or Power ID. |
| `level` _(optional)_ | number | Power level of the applied effect. Absent if the effect is not a Power effect. |
| `ticksRemaining` | number | How many ticks will the effect last. |

#### `pos` : RoomPosition  _(inherited from RoomObject)_

An object representing the position of this object in the room.

#### `room` : Room  _(inherited from RoomObject)_

The link to the Room object. May be undefined in case if an object is a flag or a construction site and is placed in a room that is not visible to you.

#### `hits` : number  _(inherited from Structure)_

The current amount of hit points of the structure.

#### `hitsMax` : number  _(inherited from Structure)_

The total amount of hit points of the structure.

#### `id` : string  _(inherited from Structure)_

A unique object identificator. You can use <a href="#Game.getObjectById"><code>Game.getObjectById</code></a> method to retrieve an object instance by its <code>id</code>.

#### `structureType` : string  _(inherited from Structure)_

One of the <code>STRUCTURE_*</code> constants.

#### `destroy()`  _(inherited from Structure)_

_Action: changes game state; +0.2 CPU added to its natural cost when it returns OK._

Destroy this structure immediately.

**Return value**

One of the following codes:

| code | value | description |
|---|---|---|
| `OK` | 0 | The operation has been scheduled successfully. |
| `ERR_NOT_OWNER` | -1 | You are not the owner of this structure. |
| `ERR_BUSY` | -4 | Hostile creeps are in the room. |

#### `isActive()`  _(inherited from Structure)_

_CPU cost: medium._

Check whether this structure can be used. If room controller level is insufficient, then this method will return false, and the structure will be highlighted with red in the game.

**Return value**

A boolean value.

#### `notifyWhenAttacked(enabled)`  _(inherited from Structure)_

_Action: changes game state; +0.2 CPU added to its natural cost when it returns OK._

Toggle auto notification when the structure is under attack. The notification will be sent to your account email. Turned on by default.

| parameter | type | description |
|---|---|---|
| `enabled` | boolean | Whether to enable notification or disable. |

**Return value**

One of the following codes:

| code | value | description |
|---|---|---|
| `OK` | 0 | The operation has been scheduled successfully. |
| `ERR_NOT_OWNER` | -1 | You are not the owner of this structure. |
| `ERR_INVALID_ARGS` | -10 | `enable` argument is not a boolean value. |

#### `my` : boolean  _(inherited from OwnedStructure)_

Whether this is your own structure.

#### `owner` : object  _(inherited from OwnedStructure)_

An object with the structure’s owner info containing the following properties:

| parameter | type | description |
|---|---|---|
| `username` | string | The name of the owner user. |

#### `cooldown` : number

The amount of game ticks the link has to wait until the next transfer is possible.

#### `energy` : number

> **Deprecated property — will be removed.**

                                                                
An alias for [`.store[RESOURCE_ENERGY]`](#StructureExtension.store).

#### `energyCapacity` : number

> **Deprecated property — will be removed.**

                                                                                                                
An alias for [`.store.getCapacity(RESOURCE_ENERGY)`](#Store.getCapacity).

#### `store` : Store

```javascript
if(structure.store.getFreeCapacity(RESOURCE_ENERGY) > 0) {
    creep.transfer(structure, RESOURCE_ENERGY);
}
```

A [`Store`](#Store) object that contains cargo of this structure.

#### `transferEnergy(target, [amount])`

_Action: changes game state; +0.2 CPU added to its natural cost when it returns OK._

```javascript
const linkFrom = Game.rooms['W1N1'].lookForAt('structure', 10, 25)[0];

const linkTo = linkFrom.pos.findInRange(FIND_MY_STRUCTURES, 2,
    {filter: {structureType: STRUCTURE_LINK}})[0];

linkFrom.transferEnergy(linkTo);
```

Remotely transfer energy to another link at any location in the same room.

| parameter | type | description |
|---|---|---|
| `target` | StructureLink | The target object. |
| `amount` _(optional)_ | number | The amount of energy to be transferred. If omitted, all the available energy is used. |

**Return value**

One of the following codes:

| code | value | description |
|---|---|---|
| `OK` | 0 | The operation has been scheduled successfully. |
| `ERR_NOT_OWNER` | -1 | You are not the owner of this link. |
| `ERR_NOT_ENOUGH_RESOURCES` | -6 | The structure does not have the given amount of energy. |
| `ERR_INVALID_TARGET` | -7 | The target is not a valid StructureLink object. |
| `ERR_FULL` | -8 | The target cannot receive any more energy. |
| `ERR_INVALID_ARGS` | -10 | The energy amount is incorrect. |
| `ERR_TIRED` | -11 | The link is still cooling down. |
| `ERR_RCL_NOT_ENOUGH` | -14 | Room Controller Level insufficient to use this link. |
| `ERR_NOT_IN_RANGE` | -9 | The target is too far away. |

---

### StructureNuker

<img src="img/nuke.png" alt="" align="right" />

Launches a nuke to another room dealing huge damage to the landing area. Each launch has a 
cooldown and requires energy and ghodium resources. Launching creates a 
[Nuke](#Nuke) object at the target room position which is visible to any player until it is landed. 
Incoming nuke cannot be moved or cancelled. Nukes cannot be launched from or to novice rooms. Resources placed into a StructureNuker cannot be withdrawn.

<table class="table gameplay-info">
    <tbody>
    <tr>
        <td colspan="2"><strong>Controller level</strong></td>
    </tr>
    <tr>
        <td>1-7</td>
        <td>—</td>
    </tr>
    <tr>
        <td>8</td>
        <td>1 nuke</td>
    </tr>
    <tr>
        <td><strong>Cost</strong></td>
        <td>100,000</td>
    </tr>
    <tr>
        <td><strong>Hits</strong></td>
        <td>1,000</td>
    </tr>
    <tr>
        <td><strong>Range</strong></td>
        <td>10 rooms</td>
    </tr>
    <tr>
        <td><strong>Launch cost</strong></td>
        <td>300,000 energy<br /> 5,000 ghodium</td>
    </tr>
    <tr>
        <td><strong>Launch cooldown</strong></td>
        <td>100,000 ticks</td>
    </tr>
    <tr>
        <td><strong>Landing time</strong></td>
        <td>50,000 ticks</td>
    </tr>
    <tr>
        <td><strong>Effect</strong></td>
        <td>All creeps, construction sites and dropped resources in the room are removed immediately, even inside ramparts. Damage to structures:
            <ul>
                <li>10,000,000 hits at the landing position;</li>
                <li>5,000,000 hits to all structures in 5x5 area.</li>
            </ul>
            <p>Note that you can stack multiple nukes from different rooms at the same target position to increase damage.</p>
            <p>Nuke landing does not generate tombstones and ruins, and destroys all existing tombstones and ruins in the room</p>
            <p>If the room is in safe mode, then the safe mode is cancelled immediately, and the safe mode cooldown is reset to 0.</p>
            <p>The room controller is hit by triggering <code>upgradeBlocked</code> period, which means it is unavailable to activate safe mode again within the next 200 ticks.</p>
        </td>
    </tr>
    </tbody>
</table>

#### `effects` : array  _(inherited from RoomObject)_

Applied effects, an array of objects with the following properties:

| parameter | type | description |
|---|---|---|
| `effect` | number | Effect ID of the applied effect. Can be either natural effect ID or Power ID. |
| `level` _(optional)_ | number | Power level of the applied effect. Absent if the effect is not a Power effect. |
| `ticksRemaining` | number | How many ticks will the effect last. |

#### `pos` : RoomPosition  _(inherited from RoomObject)_

An object representing the position of this object in the room.

#### `room` : Room  _(inherited from RoomObject)_

The link to the Room object. May be undefined in case if an object is a flag or a construction site and is placed in a room that is not visible to you.

#### `hits` : number  _(inherited from Structure)_

The current amount of hit points of the structure.

#### `hitsMax` : number  _(inherited from Structure)_

The total amount of hit points of the structure.

#### `id` : string  _(inherited from Structure)_

A unique object identificator. You can use <a href="#Game.getObjectById"><code>Game.getObjectById</code></a> method to retrieve an object instance by its <code>id</code>.

#### `structureType` : string  _(inherited from Structure)_

One of the <code>STRUCTURE_*</code> constants.

#### `destroy()`  _(inherited from Structure)_

_Action: changes game state; +0.2 CPU added to its natural cost when it returns OK._

Destroy this structure immediately.

**Return value**

One of the following codes:

| code | value | description |
|---|---|---|
| `OK` | 0 | The operation has been scheduled successfully. |
| `ERR_NOT_OWNER` | -1 | You are not the owner of this structure. |
| `ERR_BUSY` | -4 | Hostile creeps are in the room. |

#### `isActive()`  _(inherited from Structure)_

_CPU cost: medium._

Check whether this structure can be used. If room controller level is insufficient, then this method will return false, and the structure will be highlighted with red in the game.

**Return value**

A boolean value.

#### `notifyWhenAttacked(enabled)`  _(inherited from Structure)_

_Action: changes game state; +0.2 CPU added to its natural cost when it returns OK._

Toggle auto notification when the structure is under attack. The notification will be sent to your account email. Turned on by default.

| parameter | type | description |
|---|---|---|
| `enabled` | boolean | Whether to enable notification or disable. |

**Return value**

One of the following codes:

| code | value | description |
|---|---|---|
| `OK` | 0 | The operation has been scheduled successfully. |
| `ERR_NOT_OWNER` | -1 | You are not the owner of this structure. |
| `ERR_INVALID_ARGS` | -10 | `enable` argument is not a boolean value. |

#### `my` : boolean  _(inherited from OwnedStructure)_

Whether this is your own structure.

#### `owner` : object  _(inherited from OwnedStructure)_

An object with the structure’s owner info containing the following properties:

| parameter | type | description |
|---|---|---|
| `username` | string | The name of the owner user. |

#### `energy` : number

> **Deprecated property — will be removed.**

                                                                
An alias for [`.store[RESOURCE_ENERGY]`](#StructureExtension.store).

#### `energyCapacity` : number

> **Deprecated property — will be removed.**

                                                                                                                
An alias for [`.store.getCapacity(RESOURCE_ENERGY)`](#Store.getCapacity).

#### `ghodium` : number

> **Deprecated property — will be removed.**

                                                                 
An alias for [`.store[RESOURCE_GHODIUM]`](#StructureExtension.store).

#### `ghodiumCapacity` : number

> **Deprecated property — will be removed.**

                                                                                                                 
An alias for [`.store.getCapacity(RESOURCE_GHODIUM)`](#Store.getCapacity).

#### `cooldown` : number

The amount of game ticks until the next launch is possible.

#### `store` : Store

```javascript
if(structure.store.getFreeCapacity(RESOURCE_ENERGY) > 0) {
    creep.transfer(structure, RESOURCE_ENERGY);
}
```

A [`Store`](#Store) object that contains cargo of this structure.

#### `launchNuke(pos)`

_Action: changes game state; +0.2 CPU added to its natural cost when it returns OK._

```javascript
nuker.launchNuke(new RoomPosition(20,30, 'W1N1'));
```

Launch a nuke to the specified position.

| parameter | type | description |
|---|---|---|
| `pos` | RoomPosition | The target room position. |

**Return value**

One of the following codes:

| code | value | description |
|---|---|---|
| `OK` | 0 | The operation has been scheduled successfully. |
| `ERR_NOT_OWNER` | -1 | You are not the owner of this structure. |
| `ERR_NOT_ENOUGH_RESOURCES` | -6 | The structure does not have enough energy and/or ghodium. |
| `ERR_INVALID_ARGS` | -10 | The target is not a valid RoomPosition. |
| `ERR_INVALID_TARGET` | -7 | The nuke can't be launched to the specified RoomPosition (see [Start Areas](/start-areas.html)). |
| `ERR_NOT_IN_RANGE` | -9 | The target room is out of range. |
| `ERR_TIRED` | -11 | This structure is still cooling down. |
| `ERR_RCL_NOT_ENOUGH` | -14 | Room Controller Level insufficient to use this structure. |

---

### StructureObserver

<img src="img/observer.png" alt="" align="right" /> 

Provides visibility into a distant room from your script.

<table class="table gameplay-info">
    <tbody>
    <tr>
        <td colspan="2"><strong>Controller level</strong></td>
    </tr>
    <tr>
        <td>1-7</td>
        <td>—</td>
    </tr>
    <tr>
        <td>8</td>
        <td>1 observer</td>
    </tr>
    <tr>
        <td><strong>Cost</strong></td>
        <td>8,000</td>
    </tr>
    <tr>
        <td><strong>Hits</strong></td>
        <td>500</td>
    </tr>
    <tr>
        <td><strong>Range</strong></td>
        <td>10 rooms</td>
    </tr>
    </tbody>
</table>

#### `effects` : array  _(inherited from RoomObject)_

Applied effects, an array of objects with the following properties:

| parameter | type | description |
|---|---|---|
| `effect` | number | Effect ID of the applied effect. Can be either natural effect ID or Power ID. |
| `level` _(optional)_ | number | Power level of the applied effect. Absent if the effect is not a Power effect. |
| `ticksRemaining` | number | How many ticks will the effect last. |

#### `pos` : RoomPosition  _(inherited from RoomObject)_

An object representing the position of this object in the room.

#### `room` : Room  _(inherited from RoomObject)_

The link to the Room object. May be undefined in case if an object is a flag or a construction site and is placed in a room that is not visible to you.

#### `hits` : number  _(inherited from Structure)_

The current amount of hit points of the structure.

#### `hitsMax` : number  _(inherited from Structure)_

The total amount of hit points of the structure.

#### `id` : string  _(inherited from Structure)_

A unique object identificator. You can use <a href="#Game.getObjectById"><code>Game.getObjectById</code></a> method to retrieve an object instance by its <code>id</code>.

#### `structureType` : string  _(inherited from Structure)_

One of the <code>STRUCTURE_*</code> constants.

#### `destroy()`  _(inherited from Structure)_

_Action: changes game state; +0.2 CPU added to its natural cost when it returns OK._

Destroy this structure immediately.

**Return value**

One of the following codes:

| code | value | description |
|---|---|---|
| `OK` | 0 | The operation has been scheduled successfully. |
| `ERR_NOT_OWNER` | -1 | You are not the owner of this structure. |
| `ERR_BUSY` | -4 | Hostile creeps are in the room. |

#### `isActive()`  _(inherited from Structure)_

_CPU cost: medium._

Check whether this structure can be used. If room controller level is insufficient, then this method will return false, and the structure will be highlighted with red in the game.

**Return value**

A boolean value.

#### `notifyWhenAttacked(enabled)`  _(inherited from Structure)_

_Action: changes game state; +0.2 CPU added to its natural cost when it returns OK._

Toggle auto notification when the structure is under attack. The notification will be sent to your account email. Turned on by default.

| parameter | type | description |
|---|---|---|
| `enabled` | boolean | Whether to enable notification or disable. |

**Return value**

One of the following codes:

| code | value | description |
|---|---|---|
| `OK` | 0 | The operation has been scheduled successfully. |
| `ERR_NOT_OWNER` | -1 | You are not the owner of this structure. |
| `ERR_INVALID_ARGS` | -10 | `enable` argument is not a boolean value. |

#### `my` : boolean  _(inherited from OwnedStructure)_

Whether this is your own structure.

#### `owner` : object  _(inherited from OwnedStructure)_

An object with the structure’s owner info containing the following properties:

| parameter | type | description |
|---|---|---|
| `username` | string | The name of the owner user. |

#### `observeRoom(roomName)`

_Action: changes game state; +0.2 CPU added to its natural cost when it returns OK._

Provide visibility into a distant room from your script. The target room object will be available on the next tick.

| parameter | type | description |
|---|---|---|
| `roomName` | string | The name of the target room. |

**Return value**

One of the following codes:

| code | value | description |
|---|---|---|
| `OK` | 0 | The operation has been scheduled successfully. |
| `ERR_NOT_OWNER` | -1 | You are not the owner of this structure. |
| `ERR_INVALID_ARGS` | -10 | `roomName` argument is not a valid room name value. |
| `ERR_NOT_IN_RANGE` | -9 | Room `roomName` is not in observing range. |
| `ERR_RCL_NOT_ENOUGH` | -14 | Room Controller Level insufficient to use this structure. |

---

### StructurePowerBank

<img src="img/powerBank.png" alt="" align="right" />

Non-player structure. Contains power resource which can be obtained by destroying the structure.
Hits the attacker creep back on each attack. Learn more about power
from [this article](/power.html).

<table class="table gameplay-info">
    <tbody>
    <tr>
        <td><strong>Hits</strong></td>
        <td>2,000,000</td>
    </tr>
    <tr>
        <td><strong>Return damage</strong></td>
        <td>50%</td>
    </tr>
    <tr>
        <td><strong>Capacity</strong></td>
        <td>500 — 10,000</td>
    </tr>
    <tr>
        <td><strong>Decay</strong></td>
        <td>5,000 ticks</td>
    </tr>
    </tbody>
</table>

#### `effects` : array  _(inherited from RoomObject)_

Applied effects, an array of objects with the following properties:

| parameter | type | description |
|---|---|---|
| `effect` | number | Effect ID of the applied effect. Can be either natural effect ID or Power ID. |
| `level` _(optional)_ | number | Power level of the applied effect. Absent if the effect is not a Power effect. |
| `ticksRemaining` | number | How many ticks will the effect last. |

#### `pos` : RoomPosition  _(inherited from RoomObject)_

An object representing the position of this object in the room.

#### `room` : Room  _(inherited from RoomObject)_

The link to the Room object. May be undefined in case if an object is a flag or a construction site and is placed in a room that is not visible to you.

#### `hits` : number  _(inherited from Structure)_

The current amount of hit points of the structure.

#### `hitsMax` : number  _(inherited from Structure)_

The total amount of hit points of the structure.

#### `id` : string  _(inherited from Structure)_

A unique object identificator. You can use <a href="#Game.getObjectById"><code>Game.getObjectById</code></a> method to retrieve an object instance by its <code>id</code>.

#### `structureType` : string  _(inherited from Structure)_

One of the <code>STRUCTURE_*</code> constants.

#### `destroy()`  _(inherited from Structure)_

_Action: changes game state; +0.2 CPU added to its natural cost when it returns OK._

Destroy this structure immediately.

**Return value**

One of the following codes:

| code | value | description |
|---|---|---|
| `OK` | 0 | The operation has been scheduled successfully. |
| `ERR_NOT_OWNER` | -1 | You are not the owner of this structure. |
| `ERR_BUSY` | -4 | Hostile creeps are in the room. |

#### `isActive()`  _(inherited from Structure)_

_CPU cost: medium._

Check whether this structure can be used. If room controller level is insufficient, then this method will return false, and the structure will be highlighted with red in the game.

**Return value**

A boolean value.

#### `notifyWhenAttacked(enabled)`  _(inherited from Structure)_

_Action: changes game state; +0.2 CPU added to its natural cost when it returns OK._

Toggle auto notification when the structure is under attack. The notification will be sent to your account email. Turned on by default.

| parameter | type | description |
|---|---|---|
| `enabled` | boolean | Whether to enable notification or disable. |

**Return value**

One of the following codes:

| code | value | description |
|---|---|---|
| `OK` | 0 | The operation has been scheduled successfully. |
| `ERR_NOT_OWNER` | -1 | You are not the owner of this structure. |
| `ERR_INVALID_ARGS` | -10 | `enable` argument is not a boolean value. |

#### `my` : boolean  _(inherited from OwnedStructure)_

Whether this is your own structure.

#### `owner` : object  _(inherited from OwnedStructure)_

An object with the structure’s owner info containing the following properties:

| parameter | type | description |
|---|---|---|
| `username` | string | The name of the owner user. |

#### `power` : number

The amount of power containing.

#### `ticksToDecay` : number

The amount of game ticks when this structure will disappear.

---

### StructurePowerSpawn

<img src="img/powerSpawn.png" alt="" align="right" />

Processes power into your account, and spawns power creeps with special unique powers (in development).
Learn more about power from [this article](/power.html).

<table class="table gameplay-info">
    <tbody>
    <tr>
        <td colspan="2"><strong>Controller level</strong></td>
    </tr>
    <tr>
        <td>1-7</td>
        <td>—</td>
    </tr>
    <tr>
        <td>8</td>
        <td>1 power spawn</td>
    </tr>
    <tr>
        <td><strong>Cost</strong></td>
        <td>100,000</td>
    </tr>
    <tr>
        <td><strong>Hits</strong></td>
        <td>5,000</td>
    </tr>
    <tr>
        <td><strong>Capacity</strong></td>
        <td>5,000 energy units, 100 power units</td>
    </tr>
    <tr>
        <td><strong>Processing cost</strong></td>
        <td>50 energy units per 1 power unit</td>
    </tr>
    <tr>
        <td><strong>Processing speed</strong></td>
        <td>1 power unit per tick</td>
    </tr>
    </tbody>
</table>

#### `effects` : array  _(inherited from RoomObject)_

Applied effects, an array of objects with the following properties:

| parameter | type | description |
|---|---|---|
| `effect` | number | Effect ID of the applied effect. Can be either natural effect ID or Power ID. |
| `level` _(optional)_ | number | Power level of the applied effect. Absent if the effect is not a Power effect. |
| `ticksRemaining` | number | How many ticks will the effect last. |

#### `pos` : RoomPosition  _(inherited from RoomObject)_

An object representing the position of this object in the room.

#### `room` : Room  _(inherited from RoomObject)_

The link to the Room object. May be undefined in case if an object is a flag or a construction site and is placed in a room that is not visible to you.

#### `hits` : number  _(inherited from Structure)_

The current amount of hit points of the structure.

#### `hitsMax` : number  _(inherited from Structure)_

The total amount of hit points of the structure.

#### `id` : string  _(inherited from Structure)_

A unique object identificator. You can use <a href="#Game.getObjectById"><code>Game.getObjectById</code></a> method to retrieve an object instance by its <code>id</code>.

#### `structureType` : string  _(inherited from Structure)_

One of the <code>STRUCTURE_*</code> constants.

#### `destroy()`  _(inherited from Structure)_

_Action: changes game state; +0.2 CPU added to its natural cost when it returns OK._

Destroy this structure immediately.

**Return value**

One of the following codes:

| code | value | description |
|---|---|---|
| `OK` | 0 | The operation has been scheduled successfully. |
| `ERR_NOT_OWNER` | -1 | You are not the owner of this structure. |
| `ERR_BUSY` | -4 | Hostile creeps are in the room. |

#### `isActive()`  _(inherited from Structure)_

_CPU cost: medium._

Check whether this structure can be used. If room controller level is insufficient, then this method will return false, and the structure will be highlighted with red in the game.

**Return value**

A boolean value.

#### `notifyWhenAttacked(enabled)`  _(inherited from Structure)_

_Action: changes game state; +0.2 CPU added to its natural cost when it returns OK._

Toggle auto notification when the structure is under attack. The notification will be sent to your account email. Turned on by default.

| parameter | type | description |
|---|---|---|
| `enabled` | boolean | Whether to enable notification or disable. |

**Return value**

One of the following codes:

| code | value | description |
|---|---|---|
| `OK` | 0 | The operation has been scheduled successfully. |
| `ERR_NOT_OWNER` | -1 | You are not the owner of this structure. |
| `ERR_INVALID_ARGS` | -10 | `enable` argument is not a boolean value. |

#### `my` : boolean  _(inherited from OwnedStructure)_

Whether this is your own structure.

#### `owner` : object  _(inherited from OwnedStructure)_

An object with the structure’s owner info containing the following properties:

| parameter | type | description |
|---|---|---|
| `username` | string | The name of the owner user. |

#### `energy` : number

> **Deprecated property — will be removed.**

                                                                
An alias for [`.store[RESOURCE_ENERGY]`](#StructureExtension.store).

#### `energyCapacity` : number

> **Deprecated property — will be removed.**

                                                                                                                
An alias for [`.store.getCapacity(RESOURCE_ENERGY)`](#Store.getCapacity).

#### `power` : number

> **Deprecated property — will be removed.**

                                                               
An alias for [`.store[RESOURCE_POWER]`](#StructureExtension.store).

#### `powerCapacity` : number

> **Deprecated property — will be removed.**

                                                                                                               
An alias for [`.store.getCapacity(RESOURCE_POWER)`](#Store.getCapacity).

#### `store` : Store

```javascript
if(structure.store.getFreeCapacity(RESOURCE_ENERGY) > 0) {
    creep.transfer(structure, RESOURCE_ENERGY);
}
```

A [`Store`](#Store) object that contains cargo of this structure.

#### `processPower()`

_Action: changes game state; +0.2 CPU added to its natural cost when it returns OK._

Register power resource units into your account. Registered power allows to develop power creeps skills. 

**Return value**

One of the following codes:

| code | value | description |
|---|---|---|
| `OK` | 0 | The operation has been scheduled successfully. |
| `ERR_NOT_OWNER` | -1 | You are not the owner of this structure. |
| `ERR_NOT_ENOUGH_RESOURCES` | -6 | The structure does not have enough energy or power resource units. |
| `ERR_RCL_NOT_ENOUGH` | -14 | Room Controller Level insufficient to use this structure. |

---

### StructurePortal

<img src="img/portal.png" alt="" align="right" />

A non-player structure. Instantly teleports your creeps to a distant room acting as a room exit tile. 
Portals appear randomly in the central room of each sector.</p>

<table class="table gameplay-info">
    <tbody>
    <tr>
        <td><strong>Stable time</strong></td>
        <td>10 days</td>
    </tr>
    <tr>
        <td><strong>Decay time</strong></td>
        <td>30,000 ticks</td>
    </tr>
    </tbody>
</table>

#### `effects` : array  _(inherited from RoomObject)_

Applied effects, an array of objects with the following properties:

| parameter | type | description |
|---|---|---|
| `effect` | number | Effect ID of the applied effect. Can be either natural effect ID or Power ID. |
| `level` _(optional)_ | number | Power level of the applied effect. Absent if the effect is not a Power effect. |
| `ticksRemaining` | number | How many ticks will the effect last. |

#### `pos` : RoomPosition  _(inherited from RoomObject)_

An object representing the position of this object in the room.

#### `room` : Room  _(inherited from RoomObject)_

The link to the Room object. May be undefined in case if an object is a flag or a construction site and is placed in a room that is not visible to you.

#### `hits` : number  _(inherited from Structure)_

The current amount of hit points of the structure.

#### `hitsMax` : number  _(inherited from Structure)_

The total amount of hit points of the structure.

#### `id` : string  _(inherited from Structure)_

A unique object identificator. You can use <a href="#Game.getObjectById"><code>Game.getObjectById</code></a> method to retrieve an object instance by its <code>id</code>.

#### `structureType` : string  _(inherited from Structure)_

One of the <code>STRUCTURE_*</code> constants.

#### `destroy()`  _(inherited from Structure)_

_Action: changes game state; +0.2 CPU added to its natural cost when it returns OK._

Destroy this structure immediately.

**Return value**

One of the following codes:

| code | value | description |
|---|---|---|
| `OK` | 0 | The operation has been scheduled successfully. |
| `ERR_NOT_OWNER` | -1 | You are not the owner of this structure. |
| `ERR_BUSY` | -4 | Hostile creeps are in the room. |

#### `isActive()`  _(inherited from Structure)_

_CPU cost: medium._

Check whether this structure can be used. If room controller level is insufficient, then this method will return false, and the structure will be highlighted with red in the game.

**Return value**

A boolean value.

#### `notifyWhenAttacked(enabled)`  _(inherited from Structure)_

_Action: changes game state; +0.2 CPU added to its natural cost when it returns OK._

Toggle auto notification when the structure is under attack. The notification will be sent to your account email. Turned on by default.

| parameter | type | description |
|---|---|---|
| `enabled` | boolean | Whether to enable notification or disable. |

**Return value**

One of the following codes:

| code | value | description |
|---|---|---|
| `OK` | 0 | The operation has been scheduled successfully. |
| `ERR_NOT_OWNER` | -1 | You are not the owner of this structure. |
| `ERR_INVALID_ARGS` | -10 | `enable` argument is not a boolean value. |

#### `destination` : RoomPosition | object

If this is an **inter-room** portal, then this property contains a `RoomPosition` object 
leading to the point in the destination room.

If this is an **inter-shard** portal, then this property contains an object with `shard` and `room` string properties.
Exact coordinates are undetermined, the creep will appear at any free spot in the destination room.

#### `ticksToDecay` : number

The amount of game ticks when the portal disappears, or undefined when the portal is stable.

---

### StructureRampart

<img src="img/rampart.png" alt="" align="right" />

Blocks movement of hostile creeps, and defends your creeps and structures on the same tile. 
Can be used as a controllable gate.

<table class="table gameplay-info">
    <tbody>
    <tr>
        <td colspan=2><strong>Controller level</strong></td>
    </tr>
    <tr>
        <td>1</td>
        <td>—</td>
    </tr>
    <tr>
        <td>2</td>
        <td>300,000 max hits</td>
    </tr>
    <tr>
        <td>3</td>
        <td>1,000,000 max hits</td>
    </tr>
    <tr>
        <td>4</td>
        <td>3,000,000 max hits</td>
    </tr>
    <tr>
        <td>5</td>
        <td>10,000,000 max hits</td>
    </tr>
    <tr>
        <td>6</td>
        <td>30,000,000 max hits</td>
    </tr>
    <tr>
        <td>7</td>
        <td>100,000,000 max hits</td>
    </tr>
    <tr>
        <td>8</td>
        <td>300,000,000 max hits</td>
    </tr>
    <tr>
        <td><strong>Cost</strong></td>
        <td>1</td>
    </tr>
    <tr>
        <td><strong>Hits when constructed</strong></td>
        <td>1</td>
    </tr>
    <tr>
        <td><strong>Decay</strong></td>
        <td>Loses 300 hits every 100 ticks</td>
    </tr>
    </tbody>
</table>

#### `effects` : array  _(inherited from RoomObject)_

Applied effects, an array of objects with the following properties:

| parameter | type | description |
|---|---|---|
| `effect` | number | Effect ID of the applied effect. Can be either natural effect ID or Power ID. |
| `level` _(optional)_ | number | Power level of the applied effect. Absent if the effect is not a Power effect. |
| `ticksRemaining` | number | How many ticks will the effect last. |

#### `pos` : RoomPosition  _(inherited from RoomObject)_

An object representing the position of this object in the room.

#### `room` : Room  _(inherited from RoomObject)_

The link to the Room object. May be undefined in case if an object is a flag or a construction site and is placed in a room that is not visible to you.

#### `hits` : number  _(inherited from Structure)_

The current amount of hit points of the structure.

#### `hitsMax` : number  _(inherited from Structure)_

The total amount of hit points of the structure.

#### `id` : string  _(inherited from Structure)_

A unique object identificator. You can use <a href="#Game.getObjectById"><code>Game.getObjectById</code></a> method to retrieve an object instance by its <code>id</code>.

#### `structureType` : string  _(inherited from Structure)_

One of the <code>STRUCTURE_*</code> constants.

#### `destroy()`  _(inherited from Structure)_

_Action: changes game state; +0.2 CPU added to its natural cost when it returns OK._

Destroy this structure immediately.

**Return value**

One of the following codes:

| code | value | description |
|---|---|---|
| `OK` | 0 | The operation has been scheduled successfully. |
| `ERR_NOT_OWNER` | -1 | You are not the owner of this structure. |
| `ERR_BUSY` | -4 | Hostile creeps are in the room. |

#### `isActive()`  _(inherited from Structure)_

_CPU cost: medium._

Check whether this structure can be used. If room controller level is insufficient, then this method will return false, and the structure will be highlighted with red in the game.

**Return value**

A boolean value.

#### `notifyWhenAttacked(enabled)`  _(inherited from Structure)_

_Action: changes game state; +0.2 CPU added to its natural cost when it returns OK._

Toggle auto notification when the structure is under attack. The notification will be sent to your account email. Turned on by default.

| parameter | type | description |
|---|---|---|
| `enabled` | boolean | Whether to enable notification or disable. |

**Return value**

One of the following codes:

| code | value | description |
|---|---|---|
| `OK` | 0 | The operation has been scheduled successfully. |
| `ERR_NOT_OWNER` | -1 | You are not the owner of this structure. |
| `ERR_INVALID_ARGS` | -10 | `enable` argument is not a boolean value. |

#### `my` : boolean  _(inherited from OwnedStructure)_

Whether this is your own structure.

#### `owner` : object  _(inherited from OwnedStructure)_

An object with the structure’s owner info containing the following properties:

| parameter | type | description |
|---|---|---|
| `username` | string | The name of the owner user. |

#### `isPublic` : boolean

If false (default), only your creeps can step on the same square. If true, any hostile creeps can pass through.

#### `ticksToDecay` : number

The amount of game ticks when this rampart will lose some hit points.

#### `setPublic(isPublic)`

_Action: changes game state; +0.2 CPU added to its natural cost when it returns OK._

Make this rampart public to allow other players' creeps to pass through.

| parameter | type | description |
|---|---|---|
| `isPublic` | boolean | Whether this rampart should be public or non-public. |

**Return value**

One of the following codes:

| code | value | description |
|---|---|---|
| `OK` | 0 | The operation has been scheduled successfully. |
| `ERR_NOT_OWNER` | -1 | You are not the owner of this structure. |

---

### StructureRoad

<img src="img/road_plain.png" alt="" align="right" />

Decreases movement cost to 1. Using roads allows creating creeps with less `MOVE` body parts. You can also build roads on top of natural terrain walls which are otherwise impassable.

<table class="table gameplay-info">
    <tbody>
    <tr>
        <td><strong>Controller level</strong></td>
        <td>Any (including neutral rooms)</td>
    </tr>
    <tr>
        <td><strong>Cost</strong></td>
        <td>
            <ul>
                <li>300 on plain land</li>
                <li>1,500 on swamp</li>
                <li>45,000 on walls</li>
            </ul>
        </td>
    </tr>
    <tr>
        <td><strong>Hits</strong></td>
        <td>
            <ul>
                <li>5,000 on plain land</li>
                <li>25,000 on swamp</li>
                <li>750,000 on walls</li>
            </ul>
        </td>
    </tr>
    <tr>
        <td><strong>Decay</strong></td>
        <td>
            <ul>
                <li>Loses 100 hits every 1,000 ticks on plain land</li>
                <li>Loses 500 hits every 1,000 ticks on swamp</li>
                <li>Loses 15,000 hits every 1,000 ticks on walls</li>
            </ul>
            Note: every creep step decreases the decay timer for 1 tick per each creep body part</td>
    </tr>
    </tbody>
</table> 

#### `effects` : array  _(inherited from RoomObject)_

Applied effects, an array of objects with the following properties:

| parameter | type | description |
|---|---|---|
| `effect` | number | Effect ID of the applied effect. Can be either natural effect ID or Power ID. |
| `level` _(optional)_ | number | Power level of the applied effect. Absent if the effect is not a Power effect. |
| `ticksRemaining` | number | How many ticks will the effect last. |

#### `pos` : RoomPosition  _(inherited from RoomObject)_

An object representing the position of this object in the room.

#### `room` : Room  _(inherited from RoomObject)_

The link to the Room object. May be undefined in case if an object is a flag or a construction site and is placed in a room that is not visible to you.

#### `hits` : number  _(inherited from Structure)_

The current amount of hit points of the structure.

#### `hitsMax` : number  _(inherited from Structure)_

The total amount of hit points of the structure.

#### `id` : string  _(inherited from Structure)_

A unique object identificator. You can use <a href="#Game.getObjectById"><code>Game.getObjectById</code></a> method to retrieve an object instance by its <code>id</code>.

#### `structureType` : string  _(inherited from Structure)_

One of the <code>STRUCTURE_*</code> constants.

#### `destroy()`  _(inherited from Structure)_

_Action: changes game state; +0.2 CPU added to its natural cost when it returns OK._

Destroy this structure immediately.

**Return value**

One of the following codes:

| code | value | description |
|---|---|---|
| `OK` | 0 | The operation has been scheduled successfully. |
| `ERR_NOT_OWNER` | -1 | You are not the owner of this structure. |
| `ERR_BUSY` | -4 | Hostile creeps are in the room. |

#### `isActive()`  _(inherited from Structure)_

_CPU cost: medium._

Check whether this structure can be used. If room controller level is insufficient, then this method will return false, and the structure will be highlighted with red in the game.

**Return value**

A boolean value.

#### `notifyWhenAttacked(enabled)`  _(inherited from Structure)_

_Action: changes game state; +0.2 CPU added to its natural cost when it returns OK._

Toggle auto notification when the structure is under attack. The notification will be sent to your account email. Turned on by default.

| parameter | type | description |
|---|---|---|
| `enabled` | boolean | Whether to enable notification or disable. |

**Return value**

One of the following codes:

| code | value | description |
|---|---|---|
| `OK` | 0 | The operation has been scheduled successfully. |
| `ERR_NOT_OWNER` | -1 | You are not the owner of this structure. |
| `ERR_INVALID_ARGS` | -10 | `enable` argument is not a boolean value. |

#### `ticksToDecay` : number

The amount of game ticks when this road will lose some hit points.

---

### StructureSpawn

<img src="img/spawn.png" alt="" align="right" /> 

Spawn is your colony center. This structure can create, renew, and recycle creeps. 
All your spawns are accessible through [`Game.spawns`](#Game.spawns) hash list. 
Spawns auto-regenerate a little amount of energy each tick, so that you can easily 
recover even if all your creeps died.

<table class="table gameplay-info">
    <tbody>
    <tr>
        <td colspan="2"><strong>Controller level</strong></td>
    </tr>
    <tr>
        <td>1-6</td>
        <td>1 spawn</td>
    </tr>
    <tr>
        <td>7</td>
        <td>2 spawns</td>
    </tr>
    <tr>
        <td>8</td>
        <td>3 spawns</td>
    </tr>
    <tr>
        <td><strong>Cost</strong></td>
        <td>15,000</td>
    </tr>
    <tr>
        <td><strong>Hits</strong></td>
        <td>5,000</td>
    </tr>
    <tr>
        <td><strong>Capacity</strong></td>
        <td>300</td>
    </tr>
    <tr>
        <td><strong>Spawn time</strong></td>
        <td>3 ticks per each body part</td>
    </tr>
    <tr>
        <td><strong>Energy auto-regeneration</strong></td>
        <td>1 energy unit per tick while energy available in the room (in all spawns and extensions) is less than 300</td>
    </tr>
    </tbody>
</table>

#### `effects` : array  _(inherited from RoomObject)_

Applied effects, an array of objects with the following properties:

| parameter | type | description |
|---|---|---|
| `effect` | number | Effect ID of the applied effect. Can be either natural effect ID or Power ID. |
| `level` _(optional)_ | number | Power level of the applied effect. Absent if the effect is not a Power effect. |
| `ticksRemaining` | number | How many ticks will the effect last. |

#### `pos` : RoomPosition  _(inherited from RoomObject)_

An object representing the position of this object in the room.

#### `room` : Room  _(inherited from RoomObject)_

The link to the Room object. May be undefined in case if an object is a flag or a construction site and is placed in a room that is not visible to you.

#### `hits` : number  _(inherited from Structure)_

The current amount of hit points of the structure.

#### `hitsMax` : number  _(inherited from Structure)_

The total amount of hit points of the structure.

#### `id` : string  _(inherited from Structure)_

A unique object identificator. You can use <a href="#Game.getObjectById"><code>Game.getObjectById</code></a> method to retrieve an object instance by its <code>id</code>.

#### `structureType` : string  _(inherited from Structure)_

One of the <code>STRUCTURE_*</code> constants.

#### `destroy()`  _(inherited from Structure)_

_Action: changes game state; +0.2 CPU added to its natural cost when it returns OK._

Destroy this structure immediately.

**Return value**

One of the following codes:

| code | value | description |
|---|---|---|
| `OK` | 0 | The operation has been scheduled successfully. |
| `ERR_NOT_OWNER` | -1 | You are not the owner of this structure. |
| `ERR_BUSY` | -4 | Hostile creeps are in the room. |

#### `isActive()`  _(inherited from Structure)_

_CPU cost: medium._

Check whether this structure can be used. If room controller level is insufficient, then this method will return false, and the structure will be highlighted with red in the game.

**Return value**

A boolean value.

#### `notifyWhenAttacked(enabled)`  _(inherited from Structure)_

_Action: changes game state; +0.2 CPU added to its natural cost when it returns OK._

Toggle auto notification when the structure is under attack. The notification will be sent to your account email. Turned on by default.

| parameter | type | description |
|---|---|---|
| `enabled` | boolean | Whether to enable notification or disable. |

**Return value**

One of the following codes:

| code | value | description |
|---|---|---|
| `OK` | 0 | The operation has been scheduled successfully. |
| `ERR_NOT_OWNER` | -1 | You are not the owner of this structure. |
| `ERR_INVALID_ARGS` | -10 | `enable` argument is not a boolean value. |

#### `my` : boolean  _(inherited from OwnedStructure)_

Whether this is your own structure.

#### `owner` : object  _(inherited from OwnedStructure)_

An object with the structure’s owner info containing the following properties:

| parameter | type | description |
|---|---|---|
| `username` | string | The name of the owner user. |

#### `energy` : number

> **Deprecated property — will be removed.**

                                                                
An alias for [`.store[RESOURCE_ENERGY]`](#StructureExtension.store).

#### `energyCapacity` : number

> **Deprecated property — will be removed.**

                                                                                                                
An alias for [`.store.getCapacity(RESOURCE_ENERGY)`](#Store.getCapacity).

#### `memory` : any

```javascript
spawn.memory.queue = [];
```

A shorthand to <code>Memory.spawns[spawn.name]</code>. You can use it for quick access the spawn’s specific memory data object. <a href="/global-objects.html#Memory-object">Learn more about memory</a>

#### `name` : string

Spawn’s name. You choose the name upon creating a new spawn, and it cannot be changed later. This name is a hash key to access the spawn via the <a href="#Game.spawns">Game.spawns</a> object.

#### `spawning` : StructureSpawn.Spawning

If the spawn is in process of spawning a new creep, this object will contain a [`StructureSpawn.Spawning`](#StructureSpawn-Spawning) object, or null otherwise.

#### `store` : Store

```javascript
if(structure.store.getFreeCapacity(RESOURCE_ENERGY) > 0) {
    creep.transfer(structure, RESOURCE_ENERGY);
}
```

A [`Store`](#Store) object that contains cargo of this structure.

#### `canCreateCreep(body, [name])`

_CPU cost: low._

> **Deprecated method — will be removed.** Please use [`StructureSpawn.spawnCreep`](#StructureSpawn.spawnCreep) with `dryRun` flag instead.

```javascript
if(spawn.canCreateCreep(body, name) == OK) {
    spawn.createCreep(body, name);
}
```

Check if a creep can be created.

| parameter | type | description |
|---|---|---|
| `body` | array<string> | An array describing the new creep’s body. Should contain 1 to 50 elements with one of these constants: * `WORK` * `MOVE` * `CARRY` * `ATTACK` * `RANGED_ATTACK` * `HEAL` * `TOUGH` * `CLAIM` |
| `name` _(optional)_ | string | The name of a new creep. The name length limit is 100 characters. It should be unique creep name, i.e. the `Game.creeps` object should not contain another creep with the same name (hash key). If not defined, a random name will be generated. |

**Return value**

One of the following codes:

| code | value | description |
|---|---|---|
| `OK` | 0 | A creep with the given body and name can be created. |
| `ERR_NOT_OWNER` | -1 | You are not the owner of this spawn. |
| `ERR_NAME_EXISTS` | -3 | There is a creep with the same name already. |
| `ERR_BUSY` | -4 | The spawn is already in process of spawning another creep. |
| `ERR_NOT_ENOUGH_ENERGY` | -6 | The spawn and its extensions contain not enough energy to create a creep with the given body. |
| `ERR_INVALID_ARGS` | -10 | Body is not properly described. |
| `ERR_RCL_NOT_ENOUGH` | -14 | Your Room Controller level is insufficient to use this spawn. |

#### `createCreep(body, [name], [memory])`

_Action: changes game state; +0.2 CPU added to its natural cost when it returns OK._

> **Deprecated method — will be removed.** Please use [`StructureSpawn.spawnCreep`](#StructureSpawn.spawnCreep) instead.

```javascript
Game.spawns['Spawn1'].createCreep([WORK, CARRY, MOVE], 'Worker1');
```

```javascript
Game.spawns['Spawn1'].createCreep([WORK, CARRY, MOVE], null, 
    {role: 'harvester'});
```

```javascript
const result = Game.spawns['Spawn1'].createCreep([WORK, CARRY, MOVE]);

if(_.isString(result)) {
    console.log('The name is: '+result);
}
else {
    console.log('Spawn error: '+result);
}
```

Start the creep spawning process. The required energy amount can be withdrawn from all spawns and extensions in the room.

| parameter | type | description |
|---|---|---|
| `body` | array<string> | An array describing the new creep’s body. Should contain 1 to 50 elements with one of these constants: * `WORK` * `MOVE` * `CARRY` * `ATTACK` * `RANGED_ATTACK` * `HEAL` * `TOUGH` * `CLAIM` |
| `name` _(optional)_ | string | The name of a new creep. The name length limit is 100 characters. It should be unique creep name, i.e. the `Game.creeps` object should not contain another creep with the same name (hash key). If not defined, a random name will be generated. |
| `memory` _(optional)_ | any | The memory of a new creep. If provided, it will be immediately stored into `Memory.creeps[name]`. |

**Return value**

The name of a new creep or one of these error codes:

| code | value | description |
|---|---|---|
| `ERR_NOT_OWNER` | -1 | You are not the owner of this spawn. |
| `ERR_NAME_EXISTS` | -3 | There is a creep with the same name already. |
| `ERR_BUSY` | -4 | The spawn is already in process of spawning another creep. |
| `ERR_NOT_ENOUGH_ENERGY` | -6 | The spawn and its extensions contain not enough energy to create a creep with the given body. |
| `ERR_INVALID_ARGS` | -10 | Body is not properly described. |
| `ERR_RCL_NOT_ENOUGH` | -14 | Your Room Controller level is insufficient to use this spawn. |

#### `spawnCreep(body, name, [opts])`

_Action: changes game state; +0.2 CPU added to its natural cost when it returns OK._

```javascript
Game.spawns['Spawn1'].spawnCreep([WORK, CARRY, MOVE], 'Worker1');
```

```javascript
Game.spawns['Spawn1'].spawnCreep([WORK, CARRY, MOVE], 'Worker1', {
    memory: {role: 'harvester'}
});
```

```javascript
Game.spawns['Spawn1'].spawnCreep([WORK, CARRY, MOVE], 'Worker1', { 
    energyStructures: [
        Game.spawns['Spawn1'], 
        Game.getObjectById('anExtensionId')
    ]
});
```

```javascript
var testIfCanSpawn = Game.spawns['Spawn1'].spawnCreep([WORK, CARRY, MOVE], 
    'Worker1', { dryRun: true });
```

Start the creep spawning process. The required energy amount can be withdrawn from all spawns and extensions in the room.

| parameter | type | description |
|---|---|---|
| `body` | array<string> | An array describing the new creep’s body. Should contain 1 to 50 elements with one of these constants: * `WORK` * `MOVE` * `CARRY` * `ATTACK` * `RANGED_ATTACK` * `HEAL` * `TOUGH` * `CLAIM` |
| `name` | string | The name of a new creep. The name length limit is 100 characters. It must be a unique creep name, i.e. the `Game.creeps` object should not contain another creep with the same name (hash key). |
| `opts` _(optional)_ | object | An object with additional options for the spawning process. memory any Memory of the new creep. If provided, it will be immediately stored into `Memory.creeps[name]`. energyStructures array Array of spawns/extensions from which to draw energy for the spawning process. Structures will be used according to the array order. dryRun boolean If `dryRun` is true, the operation will only check if it is possible to create a creep. directions array Set desired directions where the creep should move when spawned. An array with the direction constants: `TOP` `TOP_RIGHT` `RIGHT` `BOTTOM_RIGHT` `BOTTOM` `BOTTOM_LEFT` `LEFT` `TOP_LEFT` |

**Return value**

One of the following codes:

| code | value | description |
|---|---|---|
| `OK` | 0 | The operation has been scheduled successfully. |
| `ERR_NOT_OWNER` | -1 | You are not the owner of this spawn. |
| `ERR_NAME_EXISTS` | -3 | There is a creep with the same name already. |
| `ERR_BUSY` | -4 | The spawn is already in process of spawning another creep. |
| `ERR_NOT_ENOUGH_ENERGY` | -6 | The spawn and its extensions contain not enough energy to create a creep with the given body. |
| `ERR_INVALID_ARGS` | -10 | Body is not properly described or name was not provided. |
| `ERR_RCL_NOT_ENOUGH` | -14 | Your Room Controller level is insufficient to use this spawn. |

#### `recycleCreep(target)`

_Action: changes game state; +0.2 CPU added to its natural cost when it returns OK._

Kill the creep and drop up to 100% of resources spent on its spawning and boosting depending on remaining life time. The target should be at adjacent square. Energy return is limited to 125 units per body part.

| parameter | type | description |
|---|---|---|
| `target` | Creep | The target creep object. |

**Return value**

One of the following codes:

| code | value | description |
|---|---|---|
| `OK` | 0 | The operation has been scheduled successfully. |
| `ERR_NOT_OWNER` | -1 | You are not the owner of this spawn or the target creep. |
| `ERR_INVALID_TARGET` | -7 | The specified target object is not a creep. |
| `ERR_NOT_IN_RANGE` | -9 | The target creep is too far away. |
| `ERR_RCL_NOT_ENOUGH` | -14 | Your Room Controller level is insufficient to use this spawn. |

#### `renewCreep(target)`

_Action: changes game state; +0.2 CPU added to its natural cost when it returns OK._

Increase the remaining time to live of the target creep. The target should be at adjacent square. 
The target should not have CLAIM body parts.
The spawn should not be busy with the spawning process. Each execution increases the creep's timer 
by amount of ticks according to this formula: 

```javascript-content
floor(600/body_size)
```

Energy required for each execution is determined using this formula: 

```javascript-content
ceil(creep_cost/2.5/body_size)
```

Renewing a creep removes all of its boosts.

| parameter | type | description |
|---|---|---|
| `target` | Creep | The target creep object. |

**Return value**

One of the following codes:

| code | value | description |
|---|---|---|
| `OK` | 0 | The operation has been scheduled successfully. |
| `ERR_NOT_OWNER` | -1 | You are not the owner of the spawn, or the creep. |
| `ERR_BUSY` | -4 | The spawn is spawning another creep. |
| `ERR_NOT_ENOUGH_ENERGY` | -6 | The spawn does not have enough energy. |
| `ERR_INVALID_TARGET` | -7 | The specified target object is not a creep, or the creep has CLAIM body part. |
| `ERR_FULL` | -8 | The target creep's time to live timer is full. |
| `ERR_NOT_IN_RANGE` | -9 | The target creep is too far away. |
| `ERR_RCL_NOT_ENOUGH` | -14 | Your Room Controller level is insufficient to use this spawn. |

---

### StructureSpawn.Spawning

Details of the creep being spawned currently that can be addressed by the [`StructureSpawn.spawning`](#StructureSpawn.spawning) property.

#### `directions` : array

An array with the spawn directions, see [`StructureSpawn.Spawning.setDirections`](#StructureSpawn.Spawning.setDirections).

#### `name` : string

The name of a new creep.

#### `needTime` : number

Time needed in total to complete the spawning.

#### `remainingTime` : number

Remaining time to go.

#### `spawn` : StructureSpawn

A link to the spawn.

#### `cancel()`

_Action: changes game state; +0.2 CPU added to its natural cost when it returns OK._

```javascript
Game.spawns['Spawn1'].spawning.cancel();
```

Cancel spawning immediately. Energy spent on spawning is not returned. 

**Return value**

One of the following codes:

| code | value | description |
|---|---|---|
| `OK` | 0 | The operation has been scheduled successfully. |
| `ERR_NOT_OWNER` | -1 | You are not the owner of this spawn. |

#### `setDirections(directions)`

_Action: changes game state; +0.2 CPU added to its natural cost when it returns OK._

```javascript
Game.spawns['Spawn1'].spawning.setDirections([RIGHT, TOP_RIGHT]);
```

Set desired directions where the creep should move when spawned.

| parameter | type | description |
|---|---|---|
| `directions` | array<number> | An array with the direction constants: `TOP` `TOP_RIGHT` `RIGHT` `BOTTOM_RIGHT` `BOTTOM` `BOTTOM_LEFT` `LEFT` `TOP_LEFT` |

**Return value**

One of the following codes:

| code | value | description |
|---|---|---|
| `OK` | 0 | The operation has been scheduled successfully. |
| `ERR_NOT_OWNER` | -1 | You are not the owner of this spawn. |
| `ERR_INVALID_ARGS` | -10 | The directions is array is invalid. |

---

### StructureStorage

<img src="img/storage.png" alt="" align="right" />

A structure that can store huge amount of resource units. Only one structure per room is allowed 
that can be addressed by [`Room.storage`](#Room.storage) property.</p>

<table class="table gameplay-info">
    <tbody>
    <tr>
        <td colspan="2"><strong>Controller level</strong></td>
    </tr>
    <tr>
        <td>1-3</td>
        <td>—</td>
    </tr>
    <tr>
        <td>4-8</td>
        <td>1 storage</td>
    </tr>
    <tr>
        <td><strong>Cost</strong></td>
        <td>30,000</td>
    </tr>
    <tr>
        <td><strong>Hits</strong></td>
        <td>10,000</td>
    </tr>
    <tr>
        <td><strong>Capacity</strong></td>
        <td>1,000,000</td>
    </tr>
    </tbody>
</table>

#### `effects` : array  _(inherited from RoomObject)_

Applied effects, an array of objects with the following properties:

| parameter | type | description |
|---|---|---|
| `effect` | number | Effect ID of the applied effect. Can be either natural effect ID or Power ID. |
| `level` _(optional)_ | number | Power level of the applied effect. Absent if the effect is not a Power effect. |
| `ticksRemaining` | number | How many ticks will the effect last. |

#### `pos` : RoomPosition  _(inherited from RoomObject)_

An object representing the position of this object in the room.

#### `room` : Room  _(inherited from RoomObject)_

The link to the Room object. May be undefined in case if an object is a flag or a construction site and is placed in a room that is not visible to you.

#### `hits` : number  _(inherited from Structure)_

The current amount of hit points of the structure.

#### `hitsMax` : number  _(inherited from Structure)_

The total amount of hit points of the structure.

#### `id` : string  _(inherited from Structure)_

A unique object identificator. You can use <a href="#Game.getObjectById"><code>Game.getObjectById</code></a> method to retrieve an object instance by its <code>id</code>.

#### `structureType` : string  _(inherited from Structure)_

One of the <code>STRUCTURE_*</code> constants.

#### `destroy()`  _(inherited from Structure)_

_Action: changes game state; +0.2 CPU added to its natural cost when it returns OK._

Destroy this structure immediately.

**Return value**

One of the following codes:

| code | value | description |
|---|---|---|
| `OK` | 0 | The operation has been scheduled successfully. |
| `ERR_NOT_OWNER` | -1 | You are not the owner of this structure. |
| `ERR_BUSY` | -4 | Hostile creeps are in the room. |

#### `isActive()`  _(inherited from Structure)_

_CPU cost: medium._

Check whether this structure can be used. If room controller level is insufficient, then this method will return false, and the structure will be highlighted with red in the game.

**Return value**

A boolean value.

#### `notifyWhenAttacked(enabled)`  _(inherited from Structure)_

_Action: changes game state; +0.2 CPU added to its natural cost when it returns OK._

Toggle auto notification when the structure is under attack. The notification will be sent to your account email. Turned on by default.

| parameter | type | description |
|---|---|---|
| `enabled` | boolean | Whether to enable notification or disable. |

**Return value**

One of the following codes:

| code | value | description |
|---|---|---|
| `OK` | 0 | The operation has been scheduled successfully. |
| `ERR_NOT_OWNER` | -1 | You are not the owner of this structure. |
| `ERR_INVALID_ARGS` | -10 | `enable` argument is not a boolean value. |

#### `my` : boolean  _(inherited from OwnedStructure)_

Whether this is your own structure.

#### `owner` : object  _(inherited from OwnedStructure)_

An object with the structure’s owner info containing the following properties:

| parameter | type | description |
|---|---|---|
| `username` | string | The name of the owner user. |

#### `store` : Store

A [`Store`](#Store) object that contains cargo of this structure.

#### `storeCapacity` : number

> **Deprecated property — will be removed.**

                                                                              
An alias for [`.store.getCapacity()`](#Store.getCapacity).

---

### StructureTerminal

<img src="img/terminal.png" alt="" align="right" />

Sends any resources to a Terminal in another room. The destination Terminal can belong to any player. 
Each transaction requires additional energy (regardless of the transfer resource type) that can be 
calculated using [`Game.market.calcTransactionCost`](#Game.market.calcTransactionCost) method. 
For example, sending 1000 mineral units from W0N0 to W10N5 will consume 742 energy units. 
You can track your incoming and outgoing transactions using the [`Game.market`](#Game.market) object. 
Only one Terminal per room is allowed that can be addressed by [`Room.terminal`](#Room.terminal) property.

Terminals are used in the [Market system](/market.html).

<table class="table gameplay-info">
    <tbody>
    <tr>
        <td colspan="2"><strong>Controller level</strong></td>
    </tr>
    <tr>
        <td>1-5</td>
        <td>—</td>
    </tr>
    <tr>
        <td>6-8</td>
        <td>1 terminal</td>
    </tr>
    <tr>
        <td><strong>Cost</strong></td>
        <td>100,000</td>
    </tr>
    <tr>
        <td><strong>Hits</strong></td>
        <td>3,000</td>
    </tr>
    <tr>
        <td><strong>Capacity</strong></td>
        <td>300,000</td>
    </tr>
    <tr>
        <td><strong>Cooldown on send</strong></td>
        <td>10 ticks</td>
    </tr>
    </tbody>
</table> 

#### `effects` : array  _(inherited from RoomObject)_

Applied effects, an array of objects with the following properties:

| parameter | type | description |
|---|---|---|
| `effect` | number | Effect ID of the applied effect. Can be either natural effect ID or Power ID. |
| `level` _(optional)_ | number | Power level of the applied effect. Absent if the effect is not a Power effect. |
| `ticksRemaining` | number | How many ticks will the effect last. |

#### `pos` : RoomPosition  _(inherited from RoomObject)_

An object representing the position of this object in the room.

#### `room` : Room  _(inherited from RoomObject)_

The link to the Room object. May be undefined in case if an object is a flag or a construction site and is placed in a room that is not visible to you.

#### `hits` : number  _(inherited from Structure)_

The current amount of hit points of the structure.

#### `hitsMax` : number  _(inherited from Structure)_

The total amount of hit points of the structure.

#### `id` : string  _(inherited from Structure)_

A unique object identificator. You can use <a href="#Game.getObjectById"><code>Game.getObjectById</code></a> method to retrieve an object instance by its <code>id</code>.

#### `structureType` : string  _(inherited from Structure)_

One of the <code>STRUCTURE_*</code> constants.

#### `destroy()`  _(inherited from Structure)_

_Action: changes game state; +0.2 CPU added to its natural cost when it returns OK._

Destroy this structure immediately.

**Return value**

One of the following codes:

| code | value | description |
|---|---|---|
| `OK` | 0 | The operation has been scheduled successfully. |
| `ERR_NOT_OWNER` | -1 | You are not the owner of this structure. |
| `ERR_BUSY` | -4 | Hostile creeps are in the room. |

#### `isActive()`  _(inherited from Structure)_

_CPU cost: medium._

Check whether this structure can be used. If room controller level is insufficient, then this method will return false, and the structure will be highlighted with red in the game.

**Return value**

A boolean value.

#### `notifyWhenAttacked(enabled)`  _(inherited from Structure)_

_Action: changes game state; +0.2 CPU added to its natural cost when it returns OK._

Toggle auto notification when the structure is under attack. The notification will be sent to your account email. Turned on by default.

| parameter | type | description |
|---|---|---|
| `enabled` | boolean | Whether to enable notification or disable. |

**Return value**

One of the following codes:

| code | value | description |
|---|---|---|
| `OK` | 0 | The operation has been scheduled successfully. |
| `ERR_NOT_OWNER` | -1 | You are not the owner of this structure. |
| `ERR_INVALID_ARGS` | -10 | `enable` argument is not a boolean value. |

#### `my` : boolean  _(inherited from OwnedStructure)_

Whether this is your own structure.

#### `owner` : object  _(inherited from OwnedStructure)_

An object with the structure’s owner info containing the following properties:

| parameter | type | description |
|---|---|---|
| `username` | string | The name of the owner user. |

#### `cooldown` : number

The remaining amount of ticks while this terminal cannot be used to make [`StructureTerminal.send`](#StructureTerminal.send) or [`Game.market.deal`](#Game.market.deal) calls.

#### `store` : Store

A [`Store`](#Store) object that contains cargo of this structure.

#### `storeCapacity` : number

> **Deprecated property — will be removed.**

                                                                              
An alias for [`.store.getCapacity()`](#Store.getCapacity).

#### `send(resourceType, amount, destination, [description])`

_Action: changes game state; +0.2 CPU added to its natural cost when it returns OK._

```javascript
Game.rooms['W1N1'].terminal.send(RESOURCE_UTRIUM, 100, 'W2N3',
	'trade contract #1');
```

Sends resource to a Terminal in another room with the specified name.

| parameter | type | description |
|---|---|---|
| `resourceType` | string | One of the `RESOURCE_*` constants. |
| `amount` | number | The amount of resources to be sent. |
| `destination` | string | The name of the target room. You don't have to gain visibility in this room. |
| `description` _(optional)_ | string | The description of the transaction. It is visible to the recipient. The maximum length is 100 characters. |

**Return value**

One of the following codes:

| code | value | description |
|---|---|---|
| `OK` | 0 | The operation has been scheduled successfully. |
| `ERR_NOT_OWNER` | -1 | You are not the owner of this structure. |
| `ERR_NOT_ENOUGH_RESOURCES` | -6 | The structure does not have the required amount of resources. |
| `ERR_INVALID_ARGS` | -10 | The arguments provided are incorrect. |
| `ERR_TIRED` | -11 | The terminal is still cooling down. |

---

### StructureTower
	
<img src="img/tower.png" alt="" align="right" />

Remotely attacks or heals creeps, or repairs structures. Can be targeted to any object in 
the room. However, its effectiveness linearly depends on the distance. Each action consumes energy.

<table class="table gameplay-info">
    <tbody>
    <tr>
        <td colspan="2"><strong>Controller level</strong></td>
    </tr>
    <tr>
        <td>1-2</td>
        <td>—</td>
    </tr>
    <tr>
        <td>3-4</td>
        <td>1 tower</td>
    </tr>
    <tr>
        <td>5-6</td>
        <td>2 towers</td>
    </tr>
    <tr>
        <td>7</td>
        <td>3 towers</td>
    </tr>
    <tr>
        <td>8</td>
        <td>6 towers</td>
    </tr>
    <tr>
        <td><strong>Cost</strong></td>
        <td>5,000</td>
    </tr>
    <tr>
        <td><strong>Hits</strong></td>
        <td>3,000</td>
    </tr>
    <tr>
        <td><strong>Capacity</strong></td>
        <td>1,000</td>
    </tr>
    <tr>
        <td><strong>Energy per action</strong></td>
        <td>10</td>
    </tr>
    <tr>
        <td><strong>Attack effectiveness</strong></td>
        <td>600 hits at range ≤5 to 150 hits at range ≥20</td>
    </tr>
    <tr>
        <td><strong>Heal effectiveness</strong></td>
        <td>400 hits at range ≤5 to 100 hits at range ≥20</td>
    </tr>
    <tr>
        <td><strong>Repair effectiveness</strong></td>
        <td>800 hits at range ≤5 to 200 hits at range ≥20</td>
    </tr>
    </tbody>
</table>

#### `effects` : array  _(inherited from RoomObject)_

Applied effects, an array of objects with the following properties:

| parameter | type | description |
|---|---|---|
| `effect` | number | Effect ID of the applied effect. Can be either natural effect ID or Power ID. |
| `level` _(optional)_ | number | Power level of the applied effect. Absent if the effect is not a Power effect. |
| `ticksRemaining` | number | How many ticks will the effect last. |

#### `pos` : RoomPosition  _(inherited from RoomObject)_

An object representing the position of this object in the room.

#### `room` : Room  _(inherited from RoomObject)_

The link to the Room object. May be undefined in case if an object is a flag or a construction site and is placed in a room that is not visible to you.

#### `hits` : number  _(inherited from Structure)_

The current amount of hit points of the structure.

#### `hitsMax` : number  _(inherited from Structure)_

The total amount of hit points of the structure.

#### `id` : string  _(inherited from Structure)_

A unique object identificator. You can use <a href="#Game.getObjectById"><code>Game.getObjectById</code></a> method to retrieve an object instance by its <code>id</code>.

#### `structureType` : string  _(inherited from Structure)_

One of the <code>STRUCTURE_*</code> constants.

#### `destroy()`  _(inherited from Structure)_

_Action: changes game state; +0.2 CPU added to its natural cost when it returns OK._

Destroy this structure immediately.

**Return value**

One of the following codes:

| code | value | description |
|---|---|---|
| `OK` | 0 | The operation has been scheduled successfully. |
| `ERR_NOT_OWNER` | -1 | You are not the owner of this structure. |
| `ERR_BUSY` | -4 | Hostile creeps are in the room. |

#### `isActive()`  _(inherited from Structure)_

_CPU cost: medium._

Check whether this structure can be used. If room controller level is insufficient, then this method will return false, and the structure will be highlighted with red in the game.

**Return value**

A boolean value.

#### `notifyWhenAttacked(enabled)`  _(inherited from Structure)_

_Action: changes game state; +0.2 CPU added to its natural cost when it returns OK._

Toggle auto notification when the structure is under attack. The notification will be sent to your account email. Turned on by default.

| parameter | type | description |
|---|---|---|
| `enabled` | boolean | Whether to enable notification or disable. |

**Return value**

One of the following codes:

| code | value | description |
|---|---|---|
| `OK` | 0 | The operation has been scheduled successfully. |
| `ERR_NOT_OWNER` | -1 | You are not the owner of this structure. |
| `ERR_INVALID_ARGS` | -10 | `enable` argument is not a boolean value. |

#### `my` : boolean  _(inherited from OwnedStructure)_

Whether this is your own structure.

#### `owner` : object  _(inherited from OwnedStructure)_

An object with the structure’s owner info containing the following properties:

| parameter | type | description |
|---|---|---|
| `username` | string | The name of the owner user. |

#### `energy` : number

> **Deprecated property — will be removed.**

                                                                
An alias for [`.store[RESOURCE_ENERGY]`](#StructureExtension.store).

#### `energyCapacity` : number

> **Deprecated property — will be removed.**

                                                                                                                
An alias for [`.store.getCapacity(RESOURCE_ENERGY)`](#Store.getCapacity).

#### `store` : Store

```javascript
if(structure.store.getFreeCapacity(RESOURCE_ENERGY) > 0) {
    creep.transfer(structure, RESOURCE_ENERGY);
}
```

A [`Store`](#Store) object that contains cargo of this structure.

#### `attack(target)`

_Action: changes game state; +0.2 CPU added to its natural cost when it returns OK._

Remotely attack any creep, power creep or structure in the room.

| parameter | type | description |
|---|---|---|
| `target` | Creep, PowerCreep, Structure | The target object. |

**Return value**

One of the following codes:

| code | value | description |
|---|---|---|
| `OK` | 0 | The operation has been scheduled successfully. |
| `ERR_NOT_OWNER` | -1 | You are not the owner of this structure. |
| `ERR_NOT_ENOUGH_ENERGY` | -6 | The tower does not have enough energy. |
| `ERR_INVALID_TARGET` | -7 | The target is not a valid attackable object. |
| `ERR_RCL_NOT_ENOUGH` | -14 | Room Controller Level insufficient to use this structure. |

#### `heal(target)`

_Action: changes game state; +0.2 CPU added to its natural cost when it returns OK._

Remotely heal any creep or power creep in the room.

| parameter | type | description |
|---|---|---|
| `target` | Creep, PowerCreep | The target object. |

**Return value**

One of the following codes:

| code | value | description |
|---|---|---|
| `OK` | 0 | The operation has been scheduled successfully. |
| `ERR_NOT_OWNER` | -1 | You are not the owner of this structure. |
| `ERR_NOT_ENOUGH_ENERGY` | -6 | The tower does not have enough energy. |
| `ERR_INVALID_TARGET` | -7 | The target is not a valid creep object. |
| `ERR_RCL_NOT_ENOUGH` | -14 | Room Controller Level insufficient to use this structure. |

#### `repair(target)`

_Action: changes game state; +0.2 CPU added to its natural cost when it returns OK._

Remotely repair any structure in the room.

| parameter | type | description |
|---|---|---|
| `target` | Structure | The target structure. |

**Return value**

One of the following codes:

| code | value | description |
|---|---|---|
| `OK` | 0 | The operation has been scheduled successfully. |
| `ERR_NOT_OWNER` | -1 | You are not the owner of this structure. |
| `ERR_NOT_ENOUGH_ENERGY` | -6 | The tower does not have enough energy. |
| `ERR_INVALID_TARGET` | -7 | The target is not a valid repairable object. |
| `ERR_RCL_NOT_ENOUGH` | -14 | Room Controller Level insufficient to use this structure. |

---

### StructureWall

<img src="img/wall.png" alt="" align="right" />

Blocks movement of all creeps.
Players can build destructible walls in controlled rooms.
Some rooms also contain indestructible walls separating novice and respawn areas from the rest of the world or dividing novice / respawn areas into smaller sections. Indestructible walls have no `hits` property.
	
<table class="table gameplay-info">
    <tbody>
    <tr>
        <td><strong>Controller level</strong></td>
        <td>2</td>
    </tr>
    <tr>
        <td><strong>Cost</strong></td>
        <td>1</td>
    </tr>
    <tr>
        <td><strong>Hits when constructed</strong></td>
        <td>1</td>
    </tr>
    <tr>
        <td><strong>Max hits</strong></td>
        <td>300,000,000</td>
    </tr>
    </tbody>
</table>

#### `effects` : array  _(inherited from RoomObject)_

Applied effects, an array of objects with the following properties:

| parameter | type | description |
|---|---|---|
| `effect` | number | Effect ID of the applied effect. Can be either natural effect ID or Power ID. |
| `level` _(optional)_ | number | Power level of the applied effect. Absent if the effect is not a Power effect. |
| `ticksRemaining` | number | How many ticks will the effect last. |

#### `pos` : RoomPosition  _(inherited from RoomObject)_

An object representing the position of this object in the room.

#### `room` : Room  _(inherited from RoomObject)_

The link to the Room object. May be undefined in case if an object is a flag or a construction site and is placed in a room that is not visible to you.

#### `hits` : number  _(inherited from Structure)_

The current amount of hit points of the structure.

#### `hitsMax` : number  _(inherited from Structure)_

The total amount of hit points of the structure.

#### `id` : string  _(inherited from Structure)_

A unique object identificator. You can use <a href="#Game.getObjectById"><code>Game.getObjectById</code></a> method to retrieve an object instance by its <code>id</code>.

#### `structureType` : string  _(inherited from Structure)_

One of the <code>STRUCTURE_*</code> constants.

#### `destroy()`  _(inherited from Structure)_

_Action: changes game state; +0.2 CPU added to its natural cost when it returns OK._

Destroy this structure immediately.

**Return value**

One of the following codes:

| code | value | description |
|---|---|---|
| `OK` | 0 | The operation has been scheduled successfully. |
| `ERR_NOT_OWNER` | -1 | You are not the owner of this structure. |
| `ERR_BUSY` | -4 | Hostile creeps are in the room. |

#### `isActive()`  _(inherited from Structure)_

_CPU cost: medium._

Check whether this structure can be used. If room controller level is insufficient, then this method will return false, and the structure will be highlighted with red in the game.

**Return value**

A boolean value.

#### `notifyWhenAttacked(enabled)`  _(inherited from Structure)_

_Action: changes game state; +0.2 CPU added to its natural cost when it returns OK._

Toggle auto notification when the structure is under attack. The notification will be sent to your account email. Turned on by default.

| parameter | type | description |
|---|---|---|
| `enabled` | boolean | Whether to enable notification or disable. |

**Return value**

One of the following codes:

| code | value | description |
|---|---|---|
| `OK` | 0 | The operation has been scheduled successfully. |
| `ERR_NOT_OWNER` | -1 | You are not the owner of this structure. |
| `ERR_INVALID_ARGS` | -10 | `enable` argument is not a boolean value. |

---

### Tombstone

<img src="img/tombstone.gif" alt="" align="right" />

A remnant of dead creeps. This is a walkable object. 

<table class="table gameplay-info">
    <tbody>
    <tr>
        <td><strong>Decay</strong></td>
        <td>5 ticks per body part of the deceased creep</td>
    </tr>
    </tbody>
</table>

#### `effects` : array  _(inherited from RoomObject)_

Applied effects, an array of objects with the following properties:

| parameter | type | description |
|---|---|---|
| `effect` | number | Effect ID of the applied effect. Can be either natural effect ID or Power ID. |
| `level` _(optional)_ | number | Power level of the applied effect. Absent if the effect is not a Power effect. |
| `ticksRemaining` | number | How many ticks will the effect last. |

#### `pos` : RoomPosition  _(inherited from RoomObject)_

An object representing the position of this object in the room.

#### `room` : Room  _(inherited from RoomObject)_

The link to the Room object. May be undefined in case if an object is a flag or a construction site and is placed in a room that is not visible to you.

#### `creep` : Creep | PowerCreep

```javascript
room.find(FIND_TOMBSTONES).forEach(tombstone => {
    if(tombstone.creep.my) {
        console.log(`My creep died with ID=${tombstone.creep.id} ` +
             `and role=${Memory.creeps[tombstone.creep.name].role}`);   
    }    
});
```
```javascript
room.find(FIND_TOMBSTONES).forEach(tombstone => {
    if(tombstone.creep instanceof PowerCreep) {
        console.log(`Power creep died here`);   
    }    
});
````

An object containing the deceased creep or power creep.

#### `deathTime` : number

Time of death. 

#### `id` : string

A unique object identificator. You can use <a href="#Game.getObjectById"><code>Game.getObjectById</code></a> method to retrieve an object instance by its <code>id</code>.

#### `store` : Store

A [`Store`](#Store) object that contains cargo of this structure.

#### `ticksToDecay` : number

The amount of game ticks before this tombstone decays.

---
