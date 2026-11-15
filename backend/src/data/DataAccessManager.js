const { MongoClient, ObjectId } = require('mongodb');

let client = null;
let db = null;

/**
 * Opens the connection to MongoDB and stores the database reference
 * so the rest of the functions in this module can use it.
 * @param {string} uri Connection string, e.g. mongodb://localhost:27017
 * @param {string} dbName Name of the database to use.
 * @returns {Promise<void>}
 */
async function Connect(uri, dbName)
{
    client = new MongoClient(uri);
    await client.connect();
    db = client.db(dbName);

    console.log(`Connected to MongoDB (database: ${dbName})`);
}

/**
 * Closes the connection to MongoDB. Used when shutting down the server.
 * @returns {Promise<void>}
 */
async function Disconnect()
{
    if(client !== null)
    {
        await client.close();
    }
}

/**
 * Returns the handle of a collection, validating first that there is
 * an active connection.
 * @param {string} collectionName
 * @returns {import('mongodb').Collection}
 */
function GetCollection(collectionName)
{
    if(db === null)
    {
        throw new Error('There is no active MongoDB connection. Call Connect() before using the DataAccessManager.');
    }

    const collection = db.collection(collectionName);
    return collection;
}

/**
 * Converts a string id into a Mongo ObjectId.
 * Returns null instead of throwing when the string is not a valid
 * ObjectId, so the calling Manager can respond with a clean 400 error.
 * @param {string} idString
 * @returns {import('mongodb').ObjectId | null}
 */
function ToObjectId(idString)
{
    const isValid = ObjectId.isValid(idString);
    if(isValid === false)
    {
        return null;
    }

    const objectId = new ObjectId(idString);
    return objectId;
}

/**
 * Brings every document of a collection that matches the filter.
 * If no filter is given, brings every document of the collection.
 * @param {string} collectionName
 * @param {object} filter
 * @returns {Promise<object[]>}
 */
async function FindAll(collectionName, filter = {})
{
    const collection = GetCollection(collectionName);
    const cursor = collection.find(filter);
    const documents = await cursor.toArray();

    return documents;
}

/**
 * Brings the first document of a collection that matches the filter,
 * or null if there is none.
 * @param {string} collectionName
 * @param {object} filter
 * @returns {Promise<object | null>}
 */
async function FindOne(collectionName, filter)
{
    const collection = GetCollection(collectionName);
    const document = await collection.findOne(filter);

    return document;
}

/**
 * Brings a document by its _id.
 * @param {string} collectionName
 * @param {string} idString
 * @returns {Promise<object | null>}
 */
async function FindOneById(collectionName, idString)
{
    const objectId = ToObjectId(idString);
    if(objectId === null)
    {
        return null;
    }

    const filter = { _id: objectId };
    const document = await FindOne(collectionName, filter);

    return document;
}

/**
 * Inserts a new document into a collection.
 * @param {string} collectionName
 * @param {object} document
 * @returns {Promise<object>} The inserted document, with its _id already assigned.
 */
async function InsertOne(collectionName, document)
{
    const collection = GetCollection(collectionName);
    const result = await collection.insertOne(document);

    const insertedDocument = { _id: result.insertedId, ...document };
    return insertedDocument;
}

/**
 * Updates, by _id, the given fields of a document.
 * Fields that are not mentioned in "changes" are left untouched.
 * @param {string} collectionName
 * @param {string} idString
 * @param {object} changes Fields to modify.
 * @returns {Promise<boolean>} true if a document was found and modified.
 */
async function UpdateOneById(collectionName, idString, changes)
{
    const objectId = ToObjectId(idString);
    if(objectId === null)
    {
        return false;
    }

    const collection = GetCollection(collectionName);
    const filter = { _id: objectId };
    const update = { $set: changes };
    const result = await collection.updateOne(filter, update);

    const wasModified = result.matchedCount > 0;
    return wasModified;
}

/**
 * Deletes, by _id, a document from a collection.
 * @param {string} collectionName
 * @param {string} idString
 * @returns {Promise<boolean>} true if a document existed and was deleted.
 */
async function DeleteOneById(collectionName, idString)
{
    const objectId = ToObjectId(idString);
    if(objectId === null)
    {
        return false;
    }

    const collection = GetCollection(collectionName);
    const filter = { _id: objectId };
    const result = await collection.deleteOne(filter);

    const wasDeleted = result.deletedCount > 0;
    return wasDeleted;
}

/**
 * Deletes every document of a collection that matches the filter.
 * @param {string} collectionName
 * @param {object} filter
 * @returns {Promise<number>} Number of deleted documents.
 */
async function DeleteMany(collectionName, filter)
{
    const collection = GetCollection(collectionName);
    const result = await collection.deleteMany(filter);

    return result.deletedCount;
}

/**
 * Runs an aggregation pipeline on a collection.
 * @param {string} collectionName
 * @param {object[]} pipeline
 * @returns {Promise<object[]>}
 */
async function Aggregate(collectionName, pipeline)
{
    const collection = GetCollection(collectionName);
    const cursor = collection.aggregate(pipeline);
    const results = await cursor.toArray();

    return results;
}

/**
 * Escapes the characters that have special meaning in a regular
 * expression, so a piece of free text can be used inside a $regex
 * match without being interpreted as regex syntax.
 * @param {string} text
 * @returns {string}
 */
function EscapeRegexCharacters(text)
{
    const escapedText = text.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    return escapedText;
}

module.exports = {
    Connect,
    Disconnect,
    ToObjectId,
    FindAll,
    FindOne,
    FindOneById,
    InsertOne,
    UpdateOneById,
    DeleteOneById,
    DeleteMany,
    Aggregate,
    EscapeRegexCharacters
};
