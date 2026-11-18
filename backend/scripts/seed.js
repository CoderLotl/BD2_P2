//const config = require('../src/config');
const DataAccessManager = require('../src/data/DataAccessManager');
const ItemTypesManager = require('../src/managers/ItemTypesManager');
const OwnersManager = require('../src/managers/OwnersManager');
const ItemsManager = require('../src/managers/ItemsManager');

const ITEM_TYPE_NAMES = [
    'Sword', 'Axe', 'Bow', 'Dagger', 'Spear', 'Shield', 'Helmet', 'Armor',
    'Boots', 'Gloves', 'Ring', 'Amulet', 'Potion', 'Scroll', 'Wand', 'Staff',
    'Gem', 'Ingot', 'Herb', 'Food', 'Drink', 'Tool', 'Key', 'Lantern', 'Rope', 'Tent'
];

const CONTAINER_TYPE_NAMES = ['Chest', 'Barrel', 'Crate', 'Sack'];

const OWNER_NAMES = [
    'Thrain', 'Elowen', 'Garrick', 'Mira', 'Dorian', 'Sable', 'Fenwick', 'Branwen',
    'Oswin', 'Lyra', 'Caspian', 'Isolde', 'Magnus', 'Wren', 'Alaric', 'Freya',
    'Percival', 'Nerys', 'Baldwin', 'Thessaly', 'Edwyn', 'Rosalind', 'Tobias', 'Maren',
    'Corwin', 'Ingrid', 'Soren', 'Branna', 'Aldric', 'Wilhelmina'
];

const CONTAINER_DEFINITIONS = [
    { typeName: 'Chest', volume: 50 },
    { typeName: 'Barrel', volume: 60 },
    { typeName: 'Crate', volume: 40 },
    { typeName: 'Sack', volume: 20 },
    { typeName: 'Chest', volume: 70 },
    { typeName: 'Barrel', volume: 30 },
    { typeName: 'Crate', volume: 80 },
    { typeName: 'Sack', volume: 25 },
    { typeName: 'Chest', volume: 45 },
    { typeName: 'Barrel', volume: 55 }
];

const REGULAR_ITEM_COUNT = 50;

/**
 * Picks a random element of an array.
 * @param {Array} array
 * @returns {*}
 */
function PickRandom(array)
{
    const randomIndex = Math.floor(Math.random() * array.length);
    return array[randomIndex];
}

/**
 * Picks a random integer between min and max, both included.
 * @param {number} min
 * @param {number} max
 * @returns {number}
 */
function RandomInteger(min, max)
{
    const range = max - min + 1;
    const value = min + Math.floor(Math.random() * range);
    return value;
}

/**
 * Empties the three collections, so the script can be run more than
 * once without piling up duplicate data.
 * @returns {Promise<void>}
 */
async function ClearCollections()
{
    await DataAccessManager.DeleteMany(ItemsManager.COLLECTION_NAME, {});
    await DataAccessManager.DeleteMany(ItemTypesManager.COLLECTION_NAME, {});
    await DataAccessManager.DeleteMany(OwnersManager.COLLECTION_NAME, {});
}

/**
 * Inserts every item type (regular types plus the container-shaped ones).
 * @returns {Promise<Object<string, import('mongodb').ObjectId>>} The inserted _id, keyed by type name.
 */
async function SeedItemTypes()
{
    const typeIdByName = {};
    const allTypeNames = ITEM_TYPE_NAMES.concat(CONTAINER_TYPE_NAMES);

    for (const typeName of allTypeNames)
    {
        const itemType = { name: typeName, icon: null };
        const insertedItemType = await DataAccessManager.InsertOne(ItemTypesManager.COLLECTION_NAME, itemType);
        typeIdByName[typeName] = insertedItemType._id;
    }

    return typeIdByName;
}

/**
 * Inserts every owner.
 * @returns {Promise<import('mongodb').ObjectId[]>} The inserted _ids.
 */
async function SeedOwners()
{
    const ownerIds = [];

    for (const ownerName of OWNER_NAMES)
    {
        const owner = { name: ownerName, kind: 'character' };
        const insertedOwner = await DataAccessManager.InsertOne(OwnersManager.COLLECTION_NAME, owner);
        ownerIds.push(insertedOwner._id);
    }

    return ownerIds;
}

/**
 * Inserts every container item. Capacity is always set to exactly 90%
 * of its own volume, the maximum the business rule allows.
 * @param {Object<string, import('mongodb').ObjectId>} typeIdByName
 * @param {import('mongodb').ObjectId[]} ownerIds
 * @returns {Promise<{_id: import('mongodb').ObjectId, capacity: number, usedVolume: number}[]>}
 */
async function SeedContainers(typeIdByName, ownerIds)
{
    const containers = [];

    for (const definition of CONTAINER_DEFINITIONS)
    {
        const typeId = typeIdByName[definition.typeName];
        const ownerId = PickRandom(ownerIds);
        const capacity = Math.floor(definition.volume * 0.9);

        const containerItem = {
            name: `${definition.typeName} #${containers.length + 1}`,
            type_id: typeId,
            owner_id: ownerId,
            container_id: null,
            volume: definition.volume,
            is_container: true,
            capacity: capacity
        };

        const insertedContainer = await DataAccessManager.InsertOne(ItemsManager.COLLECTION_NAME, containerItem);
        containers.push({ _id: insertedContainer._id, capacity: capacity, usedVolume: 0 });
    }

    return containers;
}

/**
 * Inserts the regular (non-container) items. Some of them are placed
 * inside a random container, but only when there is still enough free
 * space left in it, tracked locally while this loop runs.
 * @param {Object<string, import('mongodb').ObjectId>} typeIdByName
 * @param {import('mongodb').ObjectId[]} ownerIds
 * @param {{_id: import('mongodb').ObjectId, capacity: number, usedVolume: number}[]} containers
 * @returns {Promise<void>}
 */
async function SeedRegularItems(typeIdByName, ownerIds, containers)
{
    for (let i = 1; i <= REGULAR_ITEM_COUNT; i++)
    {
        const typeName = PickRandom(ITEM_TYPE_NAMES);
        const typeId = typeIdByName[typeName];
        const ownerId = PickRandom(ownerIds);
        const volume = RandomInteger(1, 15);

        const chosenContainer = PickRandom(containers);
        const freeSpace = chosenContainer.capacity - chosenContainer.usedVolume;
        const fitsInContainer = volume <= freeSpace;
        const shouldTryToStore = Math.random() < 0.4;

        let containerId = null;
        if (shouldTryToStore === true && fitsInContainer === true)
        {
            containerId = chosenContainer._id;
            chosenContainer.usedVolume = chosenContainer.usedVolume + volume;
        }

        const regularItem = {
            name: `${typeName} #${i}`,
            type_id: typeId,
            owner_id: ownerId,
            container_id: containerId,
            volume: volume,
            is_container: false,
            capacity: null
        };

        await DataAccessManager.InsertOne(ItemsManager.COLLECTION_NAME, regularItem);
    }
}

/**
 * Runs the whole seeding sequence, in order: clears the collections,
 * then fills item_types, owners, containers, and regular items.
 * @returns {Promise<void>}
 */
async function Run(req, res)
{
    console.log('Clearing existing data...');
    await ClearCollections();

    console.log('Seeding item types...');
    const typeIdByName = await SeedItemTypes();

    console.log('Seeding owners...');
    const ownerIds = await SeedOwners();

    console.log('Seeding container items...');
    const containers = await SeedContainers(typeIdByName, ownerIds);

    console.log('Seeding regular items...');
    await SeedRegularItems(typeIdByName, ownerIds, containers);

    console.log('Seed finished.');
    res.status(200).json({});
}

module.exports = { Run };
