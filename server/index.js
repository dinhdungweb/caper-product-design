const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const mongoose = require('mongoose');
const fs = require('fs');
const path = require('path');
const { S3Client, PutObjectCommand } = require('@aws-sdk/client-s3');

const app = express();
const PORT = process.env.PORT || 5000;

// AWS S3 Configuration
const s3Client = new S3Client({
  region: process.env.AWS_REGION || 'us-east-1',
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID || '',
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY || '',
  },
});

const S3_BUCKET = process.env.AWS_S3_BUCKET || 'caper-hat-designs';
const USE_S3 = process.env.USE_S3 === 'true' || false; // Toggle S3 usage

// Middleware
app.use(cors());
app.use(bodyParser.json({ limit: '200mb' }));
app.use(bodyParser.urlencoded({ limit: '200mb', extended: true }));

// Ensure uploads directory exists (fallback for local dev)
const uploadsDir = path.resolve(__dirname, 'uploads');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

// Mock MongoDB Design Schema
const MockDesign = {
  save: async function(data) {
    const id = Date.now().toString();
    // Simulate DB save operation
    return { ...data, _id: id };
  }
};

// Routes
app.post('/api/designs', async (req, res) => {
  try {
    const { views, viewPreviews, viewTechniques, totalPrice, options } = req.body;
    
    if (!viewPreviews || typeof viewPreviews !== 'object') {
        throw new Error('viewPreviews is missing or invalid');
    }

    const savedPreviews = {};
    const timestamp = Date.now();

    // Save each view's preview image to S3 or local storage
    for (const [viewId, previewData] of Object.entries(viewPreviews)) {
        if (previewData && typeof previewData === 'string' && previewData.includes('base64,')) {
            try {
                const fileName = `design_${viewId}_${timestamp}.png`;
                
                if (USE_S3) {
                    // Upload to AWS S3
                    const base64Data = previewData.split(',')[1];
                    if (!base64Data) throw new Error(`Invalid base64 data for ${viewId}`);
                    
                    const buffer = Buffer.from(base64Data, 'base64');
                    
                    const uploadParams = new PutObjectCommand({
                        Bucket: S3_BUCKET,
                        Key: `designs/${fileName}`,
                        Body: buffer,
                        ContentType: 'image/png',
                        ACL: 'public-read', // Make publicly accessible (adjust for production)
                    });
                    
                    await s3Client.send(uploadParams);
                    savedPreviews[viewId] = `https://${S3_BUCKET}.s3.${process.env.AWS_REGION || 'us-east-1'}.amazonaws.com/designs/${fileName}`;
                } else {
                    // Fallback to local storage
                    const filePath = path.join(uploadsDir, fileName);
                    const base64Data = previewData.split(',')[1];
                    if (!base64Data) throw new Error(`Invalid base64 data for ${viewId}`);
                    
                    fs.writeFileSync(filePath, base64Data, 'base64');
                    savedPreviews[viewId] = `/uploads/${fileName}`;
                }
            } catch (err) {
                console.error(`Error saving image for ${viewId}:`, err);
            }
        }
    }

    const newDesign = {
      views,
      previewUrls: savedPreviews,
      viewTechniques,
      totalPrice,
      options,
      createdAt: new Date()
    };

    const savedDesign = await MockDesign.save(newDesign);
    
    res.status(201).json({
      success: true,
      design_id: savedDesign._id,
      preview_urls: savedPreviews
    });
  } catch (error) {
    console.error('CRITICAL ERROR saving design:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Internal Server Error',
      error: error.message,
      stack: error.stack 
    });
  }
});

app.get('/api/designs/:id', (req, res) => {
    // In real app: find by ID
    res.json({ success: true, message: 'Design data retrieved' });
});

// Serve uploaded images
app.use('/uploads', express.static(uploadsDir));

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
