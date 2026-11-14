const DataAccessManager = require('../data/DataAccessManager');

const COLLECTION_NAME = 'owners';

/**
 * GET /owners
 * Returns every owner.
 */
async function GetAll(req, res)
{
    try
    {
        const owners = await DataAccessManager.FindAll(COLLECTION_NAME);
        res.status(200).json(owners);
    }
    catch(error)
    {
        console.error(error);
        res.status(500).json({ error: 'Could not fetch the owners.' });
    }
}

/**
 * GET /owners/:id
 * Returns an owner by its id.
 */
async function GetById(req, res)
{
    try
    {
        const id = req.params.id;
        const owner = await DataAccessManager.FindOneById(COLLECTION_NAME, id);

        if(owner === null)
        {
            res.status(404).json({ error: 'Owner not found.' });
            return;
        }

        res.status(200).json(owner);
    }
    catch(error)
    {
        console.error(error);
        res.status(500).json({ error: 'Could not fetch the owner.' });
    }
}

/**
 * POST /owners
 * Creates a new owner.
 * Expected body: { name: string, kind?: string }
 */
async function Create(req, res)
{
    try
    {
        const name = req.body.name;
        const kind = req.body.kind || 'character';

        const isNameValid = typeof name === 'string' && name.trim().length > 0;
        if(isNameValid === false)
        {
            res.status(400).json({ error: 'The "name" field is required.' });
            return;
        }

        const newOwner = {
            name: name.trim(),
            kind: kind
        };

        const createdOwner = await DataAccessManager.InsertOne(COLLECTION_NAME, newOwner);
        res.status(201).json(createdOwner);
    }
    catch(error)
    {
        console.error(error);
        res.status(500).json({ error: 'Could not create the owner.' });
    }
}

/**
 * PUT /owners/:id
 * Updates an existing owner.
 * Expected body: { name?: string, kind?: string }
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

        if(typeof req.body.kind === 'string' && req.body.kind.trim().length > 0)
        {
            changes.kind = req.body.kind.trim();
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
            res.status(404).json({ error: 'Owner not found.' });
            return;
        }

        const updatedOwner = await DataAccessManager.FindOneById(COLLECTION_NAME, id);
        res.status(200).json(updatedOwner);
    }
    catch(error)
    {
        console.error(error);
        res.status(500).json({ error: 'Could not update the owner.' });
    }
}

/**
 * DELETE /owners/:id
 * Deletes an owner, as long as it has no items under its name.
 * Mongo has no foreign key constraints: this check is done by hand,
 * querying the "items" collection before deleting.
 */
async function Delete(req, res)
{
    try
    {
        const id = req.params.id;
        const ownerObjectId = DataAccessManager.ToObjectId(id);

        if(ownerObjectId === null)
        {
            res.status(404).json({ error: 'Owner not found.' });
            return;
        }

        const itemOwnedByThisOwner = await DataAccessManager.FindOne('items', { owner_id: ownerObjectId });
        if(itemOwnedByThisOwner !== null)
        {
            res.status(409).json({ error: 'Cannot delete: there are items that belong to this owner.' });
            return;
        }

        const wasDeleted = await DataAccessManager.DeleteOneById(COLLECTION_NAME, id);
        if(wasDeleted === false)
        {
            res.status(404).json({ error: 'Owner not found.' });
            return;
        }

        res.status(204).send();
    }
    catch(error)
    {
        console.error(error);
        res.status(500).json({ error: 'Could not delete the owner.' });
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
