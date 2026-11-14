const DataAccessManager = require('../data/DataAccessManager');
const ItemTypesManager = require('./ItemTypesManager');
const OwnersManager = require('./OwnersManager');

const COLLECTION_NAME = 'items';

/**
 * Validates that the volume is a positive integer.
 * @param {*} volume
 * @returns {string | null} Error message, or null if valid.
 */
function ValidateVolume(volume)
{
    const isInteger = Number.isInteger(volume);
    if (isInteger === false)
    {
        return 'The "volume" field must be an integer.';
    }

    const isPositive = volume > 0;
    if (isPositive === false)
    {
        return 'The "volume" field must be greater than zero.';
    }

    return null;
}

/**
 * Validates that a container's capacity is a positive integer that
 * does not exceed 90% of its own volume.
 * @param {*} capacity
 * @param {number} volume Already validated volume of the same item.
 * @returns {string | null} Error message, or null if valid.
 */
function ValidateCapacity(capacity, volume)
{
    const isInteger = Number.isInteger(capacity);
    if (isInteger === false)
    {
        return 'The "capacity" field must be an integer.';
    }

    const isPositive = capacity > 0;
    if (isPositive === false)
    {
        return 'The "capacity" field must be greater than zero.';
    }

    const maxCapacity = Math.floor(volume * 0.9);
    const exceedsMaximum = capacity > maxCapacity;
    if (exceedsMaximum === true)
    {
        return `The "capacity" field cannot exceed 90% of the volume (maximum allowed: ${maxCapacity}).`;
    }

    return null;
}

/**
 * Validates that type_id points to an item_type that actually exists.
 * @param {string} typeId
 * @returns {Promise<string | null>} Error message, or null if valid.
 */
async function ValidateTypeReference(typeId)
{
    const itemType = await DataAccessManager.FindOneById(ItemTypesManager.COLLECTION_NAME, typeId);
    if (itemType === null)
    {
        return 'The given "type_id" does not match any item type.';
    }

    return null;
}

/**
 * Validates that owner_id points to an owner that actually exists.
 * @param {string} ownerId
 * @returns {Promise<string | null>} Error message, or null if valid.
 */
async function ValidateOwnerReference(ownerId)
{
    const owner = await DataAccessManager.FindOneById(OwnersManager.COLLECTION_NAME, ownerId);
    if (owner === null)
    {
        return 'The given "owner_id" does not match any owner.';
    }

    return null;
}

/**
 * Validates that container_id points to another item that exists, that
 * is a container, and that is not the item itself.
 * @param {string} containerId
 * @param {string | null} ownItemId The id of the item being saved (null if it is a new one).
 * @returns {Promise<string | null>} Error message, or null if valid.
 */
async function ValidateContainerReference(containerId, ownItemId)
{
    const isSameItem = containerId === ownItemId;
    if (isSameItem === true)
    {
        return 'An item cannot be its own container.';
    }

    const container = await DataAccessManager.FindOneById(COLLECTION_NAME, containerId);
    if (container === null)
    {
        return 'The given "container_id" does not match any item.';
    }

    if (container.is_container !== true)
    {
        return 'The given "container_id" does not match a container item.';
    }

    return null;
}

/**
 * Validates that storing an item of the given volume inside a container
 * does not exceed the free space currently available in that container.
 * @param {string} containerId
 * @param {number} itemVolume Volume of the item being stored.
 * @param {string | null} excludeItemId Id of the item being moved, so it is not counted twice if it is already inside this same container.
 * @returns {Promise<string | null>} Error message, or null if there is enough free space.
 */
async function ValidateContainerCapacity(containerId, itemVolume, excludeItemId)
{
    const container = await DataAccessManager.FindOneById(COLLECTION_NAME, containerId);
    const containerObjectId = DataAccessManager.ToObjectId(containerId);
    const itemsInside = await DataAccessManager.FindAll(COLLECTION_NAME, { container_id: containerObjectId });

    let usedVolume = 0;
    for (const itemInside of itemsInside)
    {
        const isTheItemBeingMoved = itemInside._id.toString() === excludeItemId;
        if (isTheItemBeingMoved === false)
        {
            usedVolume = usedVolume + itemInside.volume;
        }
    }

    const freeSpace = container.capacity - usedVolume;
    const wouldExceed = itemVolume > freeSpace;
    if (wouldExceed === true)
    {
        return `Cannot store: only ${freeSpace} of free capacity left in this container.`;
    }

    return null;
}

/**
 * GET /items
 * Returns every item.
 */
async function GetAll(req, res)
{
    try
    {
        const items = await DataAccessManager.FindAll(COLLECTION_NAME);
        res.status(200).json(items);
    }
    catch (error)
    {
        console.error(error);
        res.status(500).json({ error: 'Could not fetch the items.' });
    }
}

/**
 * GET /items/:id
 * Returns an item by its id.
 */
async function GetById(req, res)
{
    try
    {
        const id = req.params.id;
        const item = await DataAccessManager.FindOneById(COLLECTION_NAME, id);

        if (item === null)
        {
            res.status(404).json({ error: 'Item not found.' });
            return;
        }

        res.status(200).json(item);
    }
    catch (error)
    {
        console.error(error);
        res.status(500).json({ error: 'Could not fetch the item.' });
    }
}

/**
 * POST /items
 * Creates a new item. is_container, capacity and container_id are only
 * ever set here: once an item exists, is_container and capacity become
 * fixed, and container_id can only change through /store and /retrieve.
 * Expected body:
 * {
 *   name: string,
 *   type_id: string,
 *   volume: number (integer),
 *   owner_id?: string,
 *   container_id?: string,
 *   is_container?: boolean,
 *   capacity?: number (integer, required if is_container is true)
 * }
 */
async function Create(req, res)
{
    try
    {
        const name = req.body.name;
        const typeId = req.body.type_id;
        const ownerId = req.body.owner_id || null;
        const containerId = req.body.container_id || null;
        const volume = req.body.volume;
        const isContainer = req.body.is_container === true;
        const capacity = req.body.capacity;

        const isNameValid = typeof name === 'string' && name.trim().length > 0;
        if (isNameValid === false)
        {
            res.status(400).json({ error: 'The "name" field is required.' });
            return;
        }

        const volumeError = ValidateVolume(volume);
        if (volumeError !== null)
        {
            res.status(400).json({ error: volumeError });
            return;
        }

        if (isContainer === true)
        {
            const capacityError = ValidateCapacity(capacity, volume);
            if (capacityError !== null)
            {
                res.status(400).json({ error: capacityError });
                return;
            }
        }

        const isTypeIdValid = typeof typeId === 'string' && typeId.trim().length > 0;
        if (isTypeIdValid === false)
        {
            res.status(400).json({ error: 'The "type_id" field is required.' });
            return;
        }

        const typeError = await ValidateTypeReference(typeId);
        if (typeError !== null)
        {
            res.status(400).json({ error: typeError });
            return;
        }

        if (ownerId !== null)
        {
            const ownerError = await ValidateOwnerReference(ownerId);
            if (ownerError !== null)
            {
                res.status(400).json({ error: ownerError });
                return;
            }
        }

        if (containerId !== null)
        {
            const containerError = await ValidateContainerReference(containerId, null);
            if (containerError !== null)
            {
                res.status(400).json({ error: containerError });
                return;
            }

            const capacityError = await ValidateContainerCapacity(containerId, volume, null);
            if (capacityError !== null)
            {
                res.status(400).json({ error: capacityError });
                return;
            }
        }

        const newItem = {
            name: name.trim(),
            type_id: DataAccessManager.ToObjectId(typeId),
            owner_id: ownerId !== null ? DataAccessManager.ToObjectId(ownerId) : null,
            container_id: containerId !== null ? DataAccessManager.ToObjectId(containerId) : null,
            volume: volume,
            is_container: isContainer,
            capacity: isContainer === true ? capacity : null
        };

        const createdItem = await DataAccessManager.InsertOne(COLLECTION_NAME, newItem);
        res.status(201).json(createdItem);
    }
    catch (error)
    {
        console.error(error);
        res.status(500).json({ error: 'Could not create the item.' });
    }
}

/**
 * PUT /items/:id
 * Updates name, volume, type_id and/or owner_id of an existing item.
 * is_container and capacity are fixed at creation and can never be
 * changed here. volume is also fixed for container items, since their
 * capacity was computed from it and must stay valid. container_id can
 * only change through /store and /retrieve, never through this route.
 */
async function Update(req, res)
{
    try
    {
        const id = req.params.id;
        const currentItem = await DataAccessManager.FindOneById(COLLECTION_NAME, id);

        if (currentItem === null)
        {
            res.status(404).json({ error: 'Item not found.' });
            return;
        }

        if (req.body.is_container !== undefined)
        {
            res.status(400).json({ error: 'The "is_container" field cannot be changed after creation.' });
            return;
        }

        if (req.body.capacity !== undefined)
        {
            res.status(400).json({ error: 'The "capacity" field cannot be changed after creation.' });
            return;
        }

        if (req.body.container_id !== undefined)
        {
            res.status(400).json({ error: 'Use POST /items/:id/store or POST /items/:id/retrieve to move an item in or out of a container.' });
            return;
        }

        const changes = {};

        if (typeof req.body.name === 'string' && req.body.name.trim().length > 0)
        {
            changes.name = req.body.name.trim();
        }

        if (req.body.volume !== undefined)
        {
            const isVolumeLocked = currentItem.is_container === true;
            if (isVolumeLocked === true)
            {
                res.status(400).json({ error: 'The "volume" field is fixed for container items.' });
                return;
            }

            const volumeError = ValidateVolume(req.body.volume);
            if (volumeError !== null)
            {
                res.status(400).json({ error: volumeError });
                return;
            }
            changes.volume = req.body.volume;
        }

        if (typeof req.body.type_id === 'string' && req.body.type_id.trim().length > 0)
        {
            const typeError = await ValidateTypeReference(req.body.type_id);
            if (typeError !== null)
            {
                res.status(400).json({ error: typeError });
                return;
            }
            changes.type_id = DataAccessManager.ToObjectId(req.body.type_id);
        }

        if (typeof req.body.owner_id === 'string' && req.body.owner_id.trim().length > 0)
        {
            const ownerError = await ValidateOwnerReference(req.body.owner_id);
            if (ownerError !== null)
            {
                res.status(400).json({ error: ownerError });
                return;
            }
            changes.owner_id = DataAccessManager.ToObjectId(req.body.owner_id);
        }

        const hasChanges = Object.keys(changes).length > 0;
        if (hasChanges === false)
        {
            res.status(400).json({ error: 'No field to update was received.' });
            return;
        }

        await DataAccessManager.UpdateOneById(COLLECTION_NAME, id, changes);

        const updatedItem = await DataAccessManager.FindOneById(COLLECTION_NAME, id);
        res.status(200).json(updatedItem);
    }
    catch (error)
    {
        console.error(error);
        res.status(500).json({ error: 'Could not update the item.' });
    }
}

/**
 * POST /items/:id/store
 * Moves an existing item inside a container item, as long as the
 * container has enough free space left for its volume.
 * Expected body: { container_id: string }
 */
async function Store(req, res)
{
    try
    {
        const id = req.params.id;
        const containerId = req.body.container_id;

        const item = await DataAccessManager.FindOneById(COLLECTION_NAME, id);
        if (item === null)
        {
            res.status(404).json({ error: 'Item not found.' });
            return;
        }

        const isContainerIdValid = typeof containerId === 'string' && containerId.trim().length > 0;
        if (isContainerIdValid === false)
        {
            res.status(400).json({ error: 'The "container_id" field is required.' });
            return;
        }

        const containerError = await ValidateContainerReference(containerId, id);
        if (containerError !== null)
        {
            res.status(400).json({ error: containerError });
            return;
        }

        const capacityError = await ValidateContainerCapacity(containerId, item.volume, id);
        if (capacityError !== null)
        {
            res.status(400).json({ error: capacityError });
            return;
        }

        const changes = { container_id: DataAccessManager.ToObjectId(containerId) };
        await DataAccessManager.UpdateOneById(COLLECTION_NAME, id, changes);

        const updatedItem = await DataAccessManager.FindOneById(COLLECTION_NAME, id);
        res.status(200).json(updatedItem);
    }
    catch (error)
    {
        console.error(error);
        res.status(500).json({ error: 'Could not store the item.' });
    }
}

/**
 * POST /items/:id/retrieve
 * Takes an item out of whatever container it is currently in.
 */
async function Retrieve(req, res)
{
    try
    {
        const id = req.params.id;
        const item = await DataAccessManager.FindOneById(COLLECTION_NAME, id);

        if (item === null)
        {
            res.status(404).json({ error: 'Item not found.' });
            return;
        }

        const changes = { container_id: null };
        await DataAccessManager.UpdateOneById(COLLECTION_NAME, id, changes);

        const updatedItem = await DataAccessManager.FindOneById(COLLECTION_NAME, id);
        res.status(200).json(updatedItem);
    }
    catch (error)
    {
        console.error(error);
        res.status(500).json({ error: 'Could not retrieve the item.' });
    }
}

/**
 * DELETE /items/:id
 * Deletes an item, as long as it is not a container that still has
 * other items inside (it must be emptied, or its contents moved, first).
 */
async function Delete(req, res)
{
    try
    {
        const id = req.params.id;
        const item = await DataAccessManager.FindOneById(COLLECTION_NAME, id);

        if (item === null)
        {
            res.status(404).json({ error: 'Item not found.' });
            return;
        }

        if (item.is_container === true)
        {
            const idAsObjectId = DataAccessManager.ToObjectId(id);
            const itemInside = await DataAccessManager.FindOne(COLLECTION_NAME, { container_id: idAsObjectId });

            if (itemInside !== null)
            {
                res.status(409).json({ error: 'Cannot delete: the container still has items inside.' });
                return;
            }
        }

        await DataAccessManager.DeleteOneById(COLLECTION_NAME, id);
        res.status(204).send();
    }
    catch (error)
    {
        console.error(error);
        res.status(500).json({ error: 'Could not delete the item.' });
    }
}

/**
 * GET /items/stats/enriched
 * Returns every item with its type name and owner name resolved,
 * instead of just their ids.
 */
async function GetEnriched(req, res)
{
    try
    {
        const lookupTypeStage = {
            $lookup: {
                from: ItemTypesManager.COLLECTION_NAME,
                localField: 'type_id',
                foreignField: '_id',
                as: 'type'
            }
        };

        const lookupOwnerStage = {
            $lookup: {
                from: OwnersManager.COLLECTION_NAME,
                localField: 'owner_id',
                foreignField: '_id',
                as: 'owner'
            }
        };

        const lookupContainerStage = {
            $lookup: {
                from: COLLECTION_NAME,
                localField: 'container_id',
                foreignField: '_id',
                as: 'container'
            }
        };

        const unwindTypeStage = {
            $unwind: { path: '$type', preserveNullAndEmptyArrays: true }
        };

        const unwindOwnerStage = {
            $unwind: { path: '$owner', preserveNullAndEmptyArrays: true }
        };

        const unwindContainerStage = {
            $unwind: { path: '$container', preserveNullAndEmptyArrays: true }
        };

        const projectStage = {
            $project: {
                name: 1,
                volume: 1,
                is_container: 1,
                capacity: 1,
                container_id: 1,
                type_name: '$type.name',
                owner_name: '$owner.name',
                container_name: '$container.name'
            }
        };

        const pipeline = [
            lookupTypeStage,
            lookupOwnerStage,
            lookupContainerStage,
            unwindTypeStage,
            unwindOwnerStage,
            unwindContainerStage,
            projectStage
        ];
        const results = await DataAccessManager.Aggregate(COLLECTION_NAME, pipeline);

        res.status(200).json(results);
    }
    catch (error)
    {
        console.error(error);
        res.status(500).json({ error: 'Could not build the enriched inventory.' });
    }
}

/**
 * GET /items/stats/by-type
 * Returns, for each item type, how many items exist and their total volume.
 */
async function GetStatsByType(req, res)
{
    try
    {
        const groupStage = {
            $group: {
                _id: '$type_id',
                itemCount: { $sum: 1 },
                totalVolume: { $sum: '$volume' }
            }
        };

        const sortStage = {
            $sort: { itemCount: -1 }
        };

        const lookupTypeStage = {
            $lookup: {
                from: ItemTypesManager.COLLECTION_NAME,
                localField: '_id',
                foreignField: '_id',
                as: 'type'
            }
        };

        const unwindTypeStage = {
            $unwind: '$type'
        };

        const projectStage = {
            $project: {
                _id: 0,
                type_id: '$_id',
                type_name: '$type.name',
                itemCount: 1,
                totalVolume: 1
            }
        };

        const pipeline = [groupStage, sortStage, lookupTypeStage, unwindTypeStage, projectStage];
        const results = await DataAccessManager.Aggregate(COLLECTION_NAME, pipeline);

        res.status(200).json(results);
    }
    catch (error)
    {
        console.error(error);
        res.status(500).json({ error: 'Could not build the stats by type.' });
    }
}

/**
 * GET /items/stats/by-owner
 * Returns, for each owner, how many items they hold and the total
 * volume of everything they are carrying.
 */
async function GetStatsByOwner(req, res)
{
    try
    {
        const matchStage = {
            $match: { owner_id: { $ne: null } }
        };

        const groupStage = {
            $group: {
                _id: '$owner_id',
                itemCount: { $sum: 1 },
                totalVolume: { $sum: '$volume' }
            }
        };

        const lookupOwnerStage = {
            $lookup: {
                from: OwnersManager.COLLECTION_NAME,
                localField: '_id',
                foreignField: '_id',
                as: 'owner'
            }
        };

        const unwindOwnerStage = {
            $unwind: '$owner'
        };

        const sortStage = {
            $sort: { totalVolume: -1 }
        };

        const projectStage = {
            $project: {
                _id: 0,
                owner_id: '$_id',
                owner_name: '$owner.name',
                itemCount: 1,
                totalVolume: 1
            }
        };

        const pipeline = [matchStage, groupStage, lookupOwnerStage, unwindOwnerStage, sortStage, projectStage];
        const results = await DataAccessManager.Aggregate(COLLECTION_NAME, pipeline);

        res.status(200).json(results);
    }
    catch (error)
    {
        console.error(error);
        res.status(500).json({ error: 'Could not build the stats by owner.' });
    }
}

/**
 * GET /items/stats/capacity
 * Returns, for each container, its own volume and capacity, how much
 * of that capacity is currently used, and how much is still free.
 */
async function GetCapacityReport(req, res)
{
    try
    {
        const matchContainersStage = {
            $match: { is_container: true }
        };

        const lookupContentsStage = {
            $lookup: {
                from: COLLECTION_NAME,
                localField: '_id',
                foreignField: 'container_id',
                as: 'contents'
            }
        };

        const unwindContentsStage = {
            $unwind: { path: '$contents', preserveNullAndEmptyArrays: true }
        };

        const groupStage = {
            $group: {
                _id: '$_id',
                name: { $first: '$name' },
                volume: { $first: '$volume' },
                capacity: { $first: '$capacity' },
                usedVolume: { $sum: { $ifNull: ['$contents.volume', 0] } },
                itemsInside: { $sum: { $cond: [{ $ifNull: ['$contents._id', false] }, 1, 0] } }
            }
        };

        const projectStage = {
            $project: {
                _id: 0,
                container_id: '$_id',
                name: 1,
                volume: 1,
                capacity: 1,
                usedVolume: 1,
                itemsInside: 1,
                freeSpace: { $subtract: ['$capacity', '$usedVolume'] }
            }
        };

        const sortStage = {
            $sort: { freeSpace: 1 }
        };

        const pipeline = [matchContainersStage, lookupContentsStage, unwindContentsStage, groupStage, projectStage, sortStage];
        const results = await DataAccessManager.Aggregate(COLLECTION_NAME, pipeline);

        res.status(200).json(results);
    }
    catch (error)
    {
        console.error(error);
        res.status(500).json({ error: 'Could not build the capacity report.' });
    }
}

module.exports = {
    COLLECTION_NAME,
    GetAll,
    GetById,
    Create,
    Update,
    Store,
    Retrieve,
    Delete,
    GetEnriched,
    GetStatsByType,
    GetStatsByOwner,
    GetCapacityReport
};
