const DataAccessManager = require('../data/DataAccessManager');

const COLLECTION_NAME = 'item_types';

/**
 * GET /item-types
 * Returns every item type.
 */
async function GetAll(req, res)
{
    try
    {
        const itemTypes = await DataAccessManager.FindAll(COLLECTION_NAME);
        res.status(200).json(itemTypes);
    }
    catch(error)
    {
        console.error(error);
        res.status(500).json({ error: 'Could not fetch the item types.' });
    }
}

/**
 * GET /item-types/:id
 * Returns an item type by its id.
 */
async function GetById(req, res)
{
    try
    {
        const id = req.params.id;
        const itemType = await DataAccessManager.FindOneById(COLLECTION_NAME, id);

        if(itemType === null)
        {
            res.status(404).json({ error: 'Item type not found.' });
            return;
        }

        res.status(200).json(itemType);
    }
    catch(error)
    {
        console.error(error);
        res.status(500).json({ error: 'Could not fetch the item type.' });
    }
}

/**
 * POST /item-types
 * Creates a new item type.
 * Expected body: { name: string, icon?: string }
 */
async function Create(req, res)
{
    try
    {
        const name = req.body.name;
        const icon = req.body.icon || null;

        const isNameValid = typeof name === 'string' && name.trim().length > 0;
        if(isNameValid === false)
        {
            res.status(400).json({ error: 'The "name" field is required.' });
            return;
        }

        const newItemType = {
            name: name.trim(),
            icon: icon
        };

        const createdItemType = await DataAccessManager.InsertOne(COLLECTION_NAME, newItemType);
        res.status(201).json(createdItemType);
    }
    catch(error)
    {
        console.error(error);
        res.status(500).json({ error: 'Could not create the item type.' });
    }
}

/**
 * PUT /item-types/:id
 * Updates an existing item type.
 * Expected body: { name?: string, icon?: string }
 */
async function Update(req, res)
{
    try
    {
        const id = req.params.id;
        const changes = {};

        if(typeof req.body.name === 'string' && req.body.name.trim().length > 0)
        {
            changes.name = req.body.name.trim();
        }

        if(typeof req.body.icon === 'string')
        {
            changes.icon = req.body.icon;
        }

        const hasChanges = Object.keys(changes).length > 0;
        if(hasChanges === false)
        {
            res.status(400).json({ error: 'No field to update was received.' });
            return;
        }

        const wasUpdated = await DataAccessManager.UpdateOneById(COLLECTION_NAME, id, changes);
        if(wasUpdated === false)
        {
            res.status(404).json({ error: 'Item type not found.' });
            return;
        }

        const updatedItemType = await DataAccessManager.FindOneById(COLLECTION_NAME, id);
        res.status(200).json(updatedItemType);
    }
    catch(error)
    {
        console.error(error);
        res.status(500).json({ error: 'Could not update the item type.' });
    }
}

/**
 * DELETE /item-types/:id
 * Deletes an item type, as long as no item is already using it.
 * Mongo has no foreign key constraints: this check is done by hand,
 * querying the "items" collection before deleting.
 */
async function Delete(req, res)
{
    try
    {
        const id = req.params.id;
        const typeObjectId = DataAccessManager.ToObjectId(id);

        if(typeObjectId === null)
        {
            res.status(404).json({ error: 'Item type not found.' });
            return;
        }

        const itemUsingThisType = await DataAccessManager.FindOne('items', { type_id: typeObjectId });
        if(itemUsingThisType !== null)
        {
            res.status(409).json({ error: 'Cannot delete: there are items using this type.' });
            return;
        }

        const wasDeleted = await DataAccessManager.DeleteOneById(COLLECTION_NAME, id);
        if(wasDeleted === false)
        {
            res.status(404).json({ error: 'Item type not found.' });
            return;
        }

        res.status(204).send();
    }
    catch(error)
    {
        console.error(error);
        res.status(500).json({ error: 'Could not delete the item type.' });
    }
}

module.exports = {
    COLLECTION_NAME,
    GetAll,
    GetById,
    Create,
    Update,
    Delete
};
