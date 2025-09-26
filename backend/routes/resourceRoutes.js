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


router.get('/', auth, async (req, res) => {
    try {
        const db = await connectDB();
        const resourcesCollection = db.collection('resources');
        const userId = req.user.id;

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
