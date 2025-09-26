// backend/routes/resourceRoutes.js
const express = require('express');
const router = express.Router();
const cloudinary = require('../cloudinaryConfig'); // Import cloudinary config
const connectDB = require('../db/connect'); // MongoDB connection function
const auth = require('../middleware/auth'); // authentication middleware
const { ObjectId } = require('mongodb');

// Import the configured 'upload' middleware directly from the separate file
const upload = require('../multerConfig'); 


router.post('/upload', auth, upload.single('file'), async (req, res) => {
    try {
        const { title, subject, resourceType, link, scope } = req.body;
        const userId = req.user.id;

        if (!title || !subject || !resourceType || !scope) {
            return res.status(400).json({ msg: 'Please enter all required fields for the resource.' });
        }

        const db = await connectDB();
        const resourcesCollection = db.collection('resources');

        if (resourceType === 'file') {
            if (!req.file) {
                return res.status(400).json({ msg: 'No file uploaded.' });
            }

            // ✅ CORRECTED: Convert the file buffer to a Base64 string and use the standard upload method.
            const b64 = Buffer.from(req.file.buffer).toString("base64");
            const dataURI = "data:" + req.file.mimetype + ";base64," + b64;
            
            const result = await cloudinary.uploader.upload(dataURI, {
                folder: 'resources',
                resource_type: 'auto'
            });

            const downloadURL = result.secure_url;

            const newResource = {
                title,
                subject,
                resourceType: 'file',
                fileURL: downloadURL,
                uploadedBy: new ObjectId(userId),
                scope,
                createdAt: new Date(),
                cloudinaryPublicId: result.public_id,
            };

            await resourcesCollection.insertOne(newResource);
            res.status(201).json({ msg: 'File resource uploaded successfully', resource: newResource });

        } else if (resourceType === 'link') {
            if (!link) {
                return res.status(400).json({ msg: 'Link URL is required for link resources.' });
            }

            const newResource = {
                title,
                subject,
                resourceType: 'link',
                linkURL: link,
                uploadedBy: new ObjectId(userId),
                scope,
                createdAt: new Date(),
            };

            await resourcesCollection.insertOne(newResource);
            res.status(201).json({ msg: 'Link resource uploaded successfully', resource: newResource });

        } else {
            return res.status(400).json({ msg: 'Invalid resource type.' });
        }

    } catch (err) {
        console.error('Error uploading to Cloudinary:', err);
        res.status(500).json({ msg: 'Server error' });
    }
});

router.post('/action', auth, async (req, res) => {
    try {
        const { resourceId, actionType } = req.body;
        const userId = req.user.id;

        if (!ObjectId.isValid(resourceId)) {
            return res.status(400).json({ msg: 'Invalid resource ID.' });
        }

        const db = await connectDB();
        const resourcesCollection = db.collection('resources');
        let updateQuery = {};

        switch (actionType) {
            case 'like':
                // For a 'like', we'll use a simple array of user IDs
                updateQuery = { $addToSet: { likes: new ObjectId(userId) } };
                break;
            case 'save':
                // For 'save', we'll use a simple array of user IDs as well
                updateQuery = { $addToSet: { savedBy: new ObjectId(userId) } };
                break;
            case 'comment':
                // Comments would require a separate modal and endpoint, but for now, we'll
                // just acknowledge the action.
                return res.status(200).json({ msg: 'Comment action received.' });
            default:
                return res.status(400).json({ msg: 'Invalid action type.' });
        }

        const result = await resourcesCollection.updateOne(
            { _id: new ObjectId(resourceId) },
            updateQuery
        );

        if (result.modifiedCount === 0) {
            return res.status(404).json({ msg: 'Resource not found or already has this action.' });
        }

        res.status(200).json({ msg: `${actionType} action successful.` });

    } catch (err) {
        console.error('Error performing resource action:', err.message);
        res.status(500).send('Server Error');
    }
});

router.post('/comment', auth, async (req, res) => {
    try {
        const { resourceId, comment } = req.body;
        const userId = req.user.id;
        const username = req.user.username; // Assuming your auth middleware adds username

        if (!ObjectId.isValid(resourceId) || !comment) {
            return res.status(400).json({ msg: 'Invalid resource ID or empty comment.' });
        }

        const db = await connectDB();
        const resourcesCollection = db.collection('resources');

        const newComment = {
            _id: new ObjectId(),
            userId: new ObjectId(userId),
            username,
            text: comment,
            createdAt: new Date()
        };

        const result = await resourcesCollection.updateOne(
            { _id: new ObjectId(resourceId) },
            { $push: { comments: newComment } }
        );

        if (result.modifiedCount === 0) {
            return res.status(404).json({ msg: 'Resource not found.' });
        }

        res.status(201).json({ msg: 'Comment added successfully.', newComment });

    } catch (err) {
        console.error('Error adding comment:', err.message);
        res.status(500).send('Server Error');
    }
});

/**
 * @route   GET /api/resources/:id/comments
 * @desc    Get comments for a specific resource
 * @access  Private
 */
router.get('/:id/comments', auth, async (req, res) => {
    try {
        const resourceId = req.params.id;
        if (!ObjectId.isValid(resourceId)) {
            return res.status(400).json({ msg: 'Invalid resource ID.' });
        }

        const db = await connectDB();
        const resourcesCollection = db.collection('resources');
        
        const resource = await resourcesCollection.findOne(
            { _id: new ObjectId(resourceId) },
            { projection: { comments: 1, _id: 0 } }
        );

        if (!resource) {
            return res.status(404).json({ msg: 'Resource not found.' });
        }

        res.status(200).json(resource);

    } catch (err) {
        console.error('Error fetching comments:', err.message);
        res.status(500).send('Server Error');
    }
});


// router.get('/', auth, async (req, res) => {
//     try {
//         const db = await connectDB();
//         const resourcesCollection = db.collection('resources');
//         const userId = req.user.id;

//         const resources = await resourcesCollection.find({
//             $or: [
//                 { scope: 'public' },
//                 { uploadedBy: new ObjectId(userId) }
//             ]
//         })
//         .sort({ createdAt: -1 })
//         .toArray();

//         res.json(resources);
//     } catch (err) {
//         console.error('Error fetching resources:', err.message);
//         res.status(500).send('Server Error');
//     }
// });

router.get('/', auth, async (req, res) => {
    try {
        const db = await connectDB();
        const resourcesCollection = db.collection('resources');
        const userId = req.user.id; // Get user ID from the authentication middleware

        const resources = await resourcesCollection.aggregate([
            // Match public resources or resources uploaded by the current user
            {
                $match: {
                    $or: [
                        { scope: 'public' },
                        { uploadedBy: new ObjectId(userId) }
                    ]
                }
            },
            // Left outer join with the 'users' collection
            {
                $lookup: {
                    from: 'users',
                    localField: 'uploadedBy',
                    foreignField: '_id',
                    as: 'uploaderDetails'
                }
            },
            // Deconstruct the array created by $lookup
            {
                $unwind: {
                    path: '$uploaderDetails',
                    preserveNullAndEmptyArrays: true
                }
            },
            // Add the username as a new field
            {
                $addFields: {
                    author: '$uploaderDetails.username'
                }
            },
            // Sort by most recent
            {
                $sort: { createdAt: -1 }
            },
            // Exclude the uploaderDetails field from the final result
            {
                $project: {
                    uploaderDetails: 0
                }
            }
        ]).toArray();

        res.json(resources);
    } catch (err) {
        console.error('Error fetching resources:', err.message);
        res.status(500).send('Server Error');
    }
});


/**
 * @route   GET /api/resources/mylibrary
 * @desc    Get all resources saved by the current user (using user's savedResources array)
 * @access  Private
 */
router.get('/mylibrary', auth, async (req, res) => {
    try {
        const db = await connectDB();
        const usersCollection = db.collection('users');
        const resourcesCollection = db.collection('resources');
        const userId = req.user.id;

        // 1. Get the list of saved resource IDs and liked resource IDs from the user's document
        const user = await usersCollection.findOne(
            { _id: new ObjectId(userId) },
            { projection: { savedResources: 1, likedResources: 1, _id: 0 } }
        );

        const savedResourceIds = user?.savedResources || [];
        const likedResourceIds = user?.likedResources || [];

        if (savedResourceIds.length === 0) {
            return res.json([]);
        }

        // 2. Aggregate the full resource data based on the saved IDs
        const savedResourcesData = await resourcesCollection.aggregate([
            // Match resources whose _id is in the savedResourceIds array
            {
                $match: {
                    _id: { $in: savedResourceIds }
                }
            },
            // Left outer join with the 'users' collection to get uploader details
            {
                $lookup: {
                    from: 'users',
                    localField: 'uploadedBy',
                    foreignField: '_id',
                    as: 'uploaderDetails'
                }
            },
            {
                $unwind: {
                    path: '$uploaderDetails',
                    preserveNullAndEmptyArrays: true
                }
            },
            {
                $addFields: {
                    author: '$uploaderDetails.username',
                    // ✅ NEW: Return true if the resource's _id is found in the user's likedResources array
                    isLiked: { $in: ['$_id', likedResourceIds] } 
                }
            },
            {
                $sort: { createdAt: -1 }
            },
            {
                $project: {
                    uploaderDetails: 0
                }
            }
        ]).toArray();

        res.json(savedResourcesData);
    } catch (err) {
        console.error('Error fetching user library:', err.message);
        res.status(500).send('Server Error');
    }
});

/**
 * @route   GET /api/resources/groups/me
 * @desc    Get all groups the current user is a member of
 * @access  Private
 */
router.get('/groups/me', auth, async (req, res) => {
    try {
        const db = await connectDB();
        const groupsCollection = db.collection('groups');
        const userId = req.user.id;

        const groups = await groupsCollection.find({
             members: new ObjectId(userId) // Assuming a members array on the group doc
        }).toArray();
        
        // Mock a list of groups if none found for demo purposes
        if (groups.length === 0) {
          return res.json([
             { _id: new ObjectId('60c72b2f9b1d2e3f4a567890'), name: 'Math Study Group', adminId: new ObjectId(userId), isMember: true },
             { _id: new ObjectId('60c72b2f9b1d2e3f4a567891'), name: 'Science Club', adminId: new ObjectId(userId), isMember: true }
          ]);
        }

        res.json(groups);

    } catch (err) {
        console.error('Error fetching user groups:', err.message);
        res.status(500).send('Server Error');
    }
});


/**
 * @route   GET /api/groups/:groupId/resources
 * @desc    Get resources for a specific group
 * @access  Private
 */
router.get('/groups/:groupId/resources', auth, async (req, res) => {
    try {
        const { groupId } = req.params;
        const userId = req.user.id;
        
        if (!ObjectId.isValid(groupId)) {
            return res.status(400).json({ msg: 'Invalid group ID.' });
        }
        
        const db = await connectDB();
        const resourcesCollection = db.collection('resources');
        const groupsCollection = db.collection('groups');

        // Check if the user is a member of the group
        const group = await groupsCollection.findOne({
            _id: new ObjectId(groupId),
            members: new ObjectId(userId) // Assuming 'members' array exists
        });

        if (!group) {
            return res.status(403).json({ msg: 'Access denied. You are not a member of this group.' });
        }
        
        const resources = await resourcesCollection.aggregate([
            {
                $match: {
                    groupId: new ObjectId(groupId), // Match resources by group ID
                }
            },
            {
                $lookup: {
                    from: 'users',
                    localField: 'uploadedBy',
                    foreignField: '_id',
                    as: 'uploaderDetails'
                }
            },
            {
                $unwind: {
                    path: '$uploaderDetails',
                    preserveNullAndEmptyArrays: true
                }
            },
            {
                $addFields: {
                    author: '$uploaderDetails.username',
                    // Check if the resource is liked by the current user
                    isLiked: { $in: [new ObjectId(userId), '$likes'] },
                    // Check if the resource is saved by the current user
                    isSaved: { $in: [new ObjectId(userId), '$savedBy'] }
                }
            },
            {
                $sort: { createdAt: -1 }
            },
            {
                $project: {
                    uploaderDetails: 0,
                    likes: 0, // Exclude these fields from the response for cleaner data
                    savedBy: 0,
                }
            }
        ]).toArray();
        
        res.json(resources);
        
    } catch (err) {
        console.error('Error fetching group resources:', err.message);
        res.status(500).send('Server Error');
    }
});

/**
 * @route   POST /api/resources/pin
 * @desc    Toggle a resource as pinned in a group
 * @access  Private (Group Admin)
 */
router.post('/pin', auth, async (req, res) => {
    try {
        const { resourceId, groupId, isPinned } = req.body;
        const userId = req.user.id;

        if (!ObjectId.isValid(resourceId) || !ObjectId.isValid(groupId)) {
            return res.status(400).json({ msg: 'Invalid resource or group ID.' });
        }
        
        const db = await connectDB();
        const resourcesCollection = db.collection('resources');
        const groupsCollection = db.collection('groups'); // Assuming a groups collection

        // Check if user is a group admin
        const group = await groupsCollection.findOne({ 
            _id: new ObjectId(groupId), 
            adminId: new ObjectId(userId) 
        });

        if (!group) {
            return res.status(403).json({ msg: 'Access denied. Only group admins can pin resources.' });
        }

        const result = await resourcesCollection.updateOne(
            { _id: new ObjectId(resourceId), groupId: new ObjectId(groupId) },
            { $set: { isPinned } }
        );

        if (result.modifiedCount === 0) {
            return res.status(404).json({ msg: 'Resource not found in this group or pin state unchanged.' });
        }

        res.status(200).json({ msg: `Resource pin state updated successfully.` });

    } catch (err) {
        console.error('Error toggling pin state:', err.message);
        res.status(500).send('Server Error');
    }
});


router.get('/:id', auth, async (req, res) => {
    try {
        const db = await connectDB();
        const resourcesCollection = db.collection('resources');
        const resourceId = req.params.id;
        const userId = req.user.id;

        if (!ObjectId.isValid(resourceId)) {
            return res.status(400).json({ msg: 'Invalid resource ID.' });
        }

        const resource = await resourcesCollection.findOne({
            _id: new ObjectId(resourceId)
        });

        if (!resource) {
            return res.status(404).json({ msg: 'Resource not found.' });
        }

        const isOwner = resource.uploadedBy.toString() === userId.toString();
        const isPublic = resource.scope === 'public';

        if (isOwner || isPublic) {
            if (resource.resourceType === 'file' && resource.cloudinaryPublicId) {
                const signedUrlResult = await cloudinary.uploader.explicit(resource.cloudinaryPublicId, {
                    type: 'authenticated',
                    resource_type: 'raw',
                    format: 'pdf',
                    sign_url: true,
                    expires_at: Math.round(new Date().getTime() / 1000) + 3600
                });
                resource.fileURL = signedUrlResult.secure_url;
            }

            res.json(resource);
        } else {
            return res.status(403).json({ msg: 'Access denied.' });
        }

    } catch (err) {
        console.error('Error fetching single resource:', err.message);
        res.status(500).send('Server Error');
    }
});


/**
 * @route   GET /api/resources
 * @desc    Get all public resources and resources uploaded by the current user
 * @access  Private
 */
router.get('/', auth, async (req, res) => {
    try {
        const db = await connectDB();
        const resourcesCollection = db.collection('resources');
        const userId = req.user.id; // Get user ID from the authentication middleware

        const resources = await resourcesCollection.find({
            $or: [
                { scope: 'public' },
                { uploadedBy: new ObjectId(userId) }
            ]
        })
        .sort({ createdAt: -1 })
        .toArray();

        res.json(resources);
    } catch (err) {
        console.error('Error fetching resources:', err.message);
        res.status(500).send('Server Error');
    }
});


/**
 * @route   GET /api/resources/:id
 * @desc    Get a single resource by its ID
 * @access  Private
 */
router.get('/:id', auth, async (req, res) => {
  try {
    const db = await connectDB();
    const resourcesCollection = db.collection('resources');
    const resourceId = req.params.id;
    const userId = req.user.id;

    // Check if the provided ID is a valid ObjectId
    if (!ObjectId.isValid(resourceId)) {
      return res.status(400).json({ msg: 'Invalid resource ID.' });
    }

    const resource = await resourcesCollection.findOne({
      _id: new ObjectId(resourceId)
    });

    if (!resource) {
      return res.status(404).json({ msg: 'Resource not found.' });
    }

    // Check if the user has access to the resource
    const isOwner = resource.uploadedBy.toString() === userId.toString();
    const isPublic = resource.scope === 'public';

    if (isOwner || isPublic) {
      if (resource.resourceType === 'file' && resource.fileURL) {
        // Return the original, direct URL
        // No signed URL generation is needed for direct access
      }
      
      res.json(resource);
    } else {
      return res.status(403).json({ msg: 'Access denied.' });
    }

  } catch (err) {
    console.error('Error fetching single resource:', err.message);
    res.status(500).send('Server Error');
  }
});


module.exports = router;
